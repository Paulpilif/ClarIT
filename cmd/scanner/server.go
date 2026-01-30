package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type scanRequest struct {
	CIDR string `json:"cidr"`
	Save bool   `json:"save,omitempty"`
}

type scanResponse struct {
	Graph    NetworkGraph `json:"graph"`
	Filename string       `json:"filename,omitempty"`
}

func startServer(listenAddr string, timeout time.Duration) {
	mux := http.NewServeMux()
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		req := scanRequest{}
		if r.Body != nil {
			r.Body = http.MaxBytesReader(w, r.Body, maxScanBodyBytes)
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err != io.EOF {
				log.Printf("/scan: invalid JSON body: %v", err)
			}
		}

		if req.CIDR == "" {
			req.CIDR = r.URL.Query().Get("cidr")
		}

		save := req.Save
		if saveParam := r.URL.Query().Get("save"); saveParam != "" {
			save = strings.EqualFold(saveParam, "true") || saveParam == "1"
		}

		log.Printf("/scan request: method=%s url=%s cidr=%q save=%v", r.Method, r.URL.String(), req.CIDR, save)

		if req.CIDR == "" {
			http.Error(w, "missing cidr", http.StatusBadRequest)
			return
		}

		normalizedCIDR, err := normalizeCIDR(req.CIDR)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()

		graph, filename, err := runScan(ctx, normalizedCIDR, save)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		enc := json.NewEncoder(w)
		if err := enc.Encode(scanResponse{Graph: graph, Filename: filename}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	})

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	server := &http.Server{
		Addr:              listenAddr,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	log.Printf("Scanner API listening on %s", listenAddr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}

const (
	maxScanBodyBytes         = 1 << 20
	bulkFingerprintThreshold = 24
	fingerprintWorkers       = 6
	perHostTimeout           = 45 * time.Second
)

func runScan(ctx context.Context, cidr string, save bool) (NetworkGraph, string, error) {
	hosts, err := DiscoverHosts(ctx, cidr)
	if err != nil {
		return NetworkGraph{}, "", err
	}
	if len(hosts) == 0 {
		log.Println("Pas d'host decouverts")
		baseIP := getCIDRBaseIP(cidr)
		hosts = append(hosts, DiscoveredHost{
			IP:       baseIP,
			Hostname: "",
		})
	}

	enableOSDetection := shouldEnableOSDetection()

	fingerprints := []*HostFingerprint{}
	if len(hosts) >= bulkFingerprintThreshold {
		log.Printf("Bulk fingerprinting (%d hosts)", len(hosts))
		fps, err := FingerprintHosts(ctx, hosts, enableOSDetection)
		if err != nil {
			log.Printf("bulk fingerprint failed: %v", err)
		} else {
			fingerprints = fps
		}
	}

	if len(fingerprints) == 0 {
		fingerprints = fingerprintWithWorkerPool(ctx, hosts, enableOSDetection)
	}

	graph := BuildGraph(fingerprints)
	EnrichGraph(&graph)

	filename := ""
	if save {
		filename = NextGraphFilename()
		if err := saveGraphJSON(filename, &graph); err != nil {
			return NetworkGraph{}, "", err
		}
	}

	return graph, filename, nil
}

type fingerprintResult struct {
	fp   *HostFingerprint
	err  error
	host DiscoveredHost
}

func fingerprintWithWorkerPool(ctx context.Context, hosts []DiscoveredHost, enableOSDetection bool) []*HostFingerprint {
	if len(hosts) == 0 {
		return []*HostFingerprint{}
	}

	workers := fingerprintWorkers
	if len(hosts) < workers {
		workers = len(hosts)
	}

	jobs := make(chan DiscoveredHost)
	results := make(chan fingerprintResult, len(hosts))
	var wg sync.WaitGroup

	worker := func() {
		defer wg.Done()
		for h := range jobs {
			hostCtx, cancel := context.WithTimeout(ctx, perHostTimeout)
			fp, err := FingerprintHost(hostCtx, h, enableOSDetection)
			cancel()
			results <- fingerprintResult{fp: fp, err: err, host: h}
		}
	}

	for i := 0; i < workers; i++ {
		wg.Add(1)
		go worker()
	}

	for _, h := range hosts {
		jobs <- h
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	fingerprints := []*HostFingerprint{}
	for res := range results {
		if res.err != nil {
			log.Printf("scan failed for %s: %v", res.host.IP, res.err)
			continue
		}
		if res.fp != nil {
			fingerprints = append(fingerprints, res.fp)
		}
	}

	return fingerprints
}

func getCIDRBaseIP(cidr string) string {
	_, ipNet, err := net.ParseCIDR(cidr)
	if err != nil || ipNet == nil {
		return strings.Split(cidr, "/")[0]
	}
	return ipNet.IP.String()
}

func printGraphJSON(w *os.File, g *NetworkGraph) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(g)
}
