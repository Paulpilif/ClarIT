package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"
)

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: go run main.go <cidr>")
		os.Exit(1)
	}

	cidr := os.Args[1]

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	hosts, err := DiscoverHosts(ctx, cidr)
	if err != nil {
		log.Fatal(err)
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

	filename := NextGraphFilename()
	if err := saveGraphJSON(filename, &graph); err != nil {
		log.Fatal(err)
	}

	fmt.Println("Graphe sauvegardé dans", filename)
}