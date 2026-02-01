package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type scanRequest struct {
	CIDR     string `json:"cidr"`
	Save     bool   `json:"save,omitempty"`
	APIToken string `json:"api_token,omitempty"`
}

type scanResponse struct {
	Graph    NetworkGraph `json:"graph"`
	Filename string       `json:"filename,omitempty"`
}

func startServer(listenAddr string, timeout time.Duration) {
	mux := http.NewServeMux()
	mux.HandleFunc("/scan", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		if r.Method != http.MethodPost && r.Method != http.MethodGet {
			w.WriteHeader(http.StatusMethodNotAllowed)
			return
		}

		req := scanRequest{}
		if r.Body != nil {
			if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
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

		ctx, cancel := context.WithTimeout(r.Context(), timeout)
		defer cancel()

		graph, filename, err := runScan(ctx, req.CIDR, save)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if save && req.APIToken != "" {
			if err := ingestGraph(ctx, graph, req.APIToken); err != nil {
				log.Printf("ingest failed: %v", err)
			}
		}

		w.Header().Set("Content-Type", "application/json")
		enc := json.NewEncoder(w)
		if err := enc.Encode(scanResponse{Graph: graph, Filename: filename}); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	})

	mux.HandleFunc("/healthz", func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
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

func runScan(ctx context.Context, cidr string, save bool) (NetworkGraph, string, error) {
	hosts, err := DiscoverHosts(ctx, cidr)
	if err != nil {
		return NetworkGraph{}, "", err
	}
	if len(hosts) == 0 {
		log.Println("Pas d'host decouverts")
		hosts = append(hosts, DiscoveredHost{
			IP:       strings.Split(cidr, "/")[0],
			Hostname: "",
		})
	}

	fingerprints := []*HostFingerprint{}
	for _, h := range hosts {
		log.Printf("Fingerprinting %s", h.IP)
		fp, err := FingerprintHost(ctx, h)
		if err != nil {
			log.Printf("scan failed for %s: %v", h.IP, err)
			continue
		}
		fingerprints = append(fingerprints, fp)
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

func printGraphJSON(w *os.File, g *NetworkGraph) error {
	enc := json.NewEncoder(w)
	enc.SetIndent("", "  ")
	return enc.Encode(g)
}

func ingestGraph(ctx context.Context, graph NetworkGraph, apiToken string) error {
	ingestURL := getEnvOrDefault("GRAPH_INGEST_URL", "http://localhost:8080/api/v1/ingest")
	payload, err := json.Marshal(graph)
	if err != nil {
		return fmt.Errorf("marshal graph: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, ingestURL, bytes.NewReader(payload))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Token", apiToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("send request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ingest failed (%d): %s", resp.StatusCode, strings.TrimSpace(string(body)))
	}

	return nil
}

func getEnvOrDefault(key, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}
