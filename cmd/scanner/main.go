package main

import (
	"context"
	"flag"
	"fmt"
	"log"
	"net"
	"os"
	"strings"
	"time"
)

func main() {
	cidrFlag := flag.String("cidr", "", "CIDR à scanner (ex: 10.211.55.0/24)")
	serverFlag := flag.Bool("server", false, "Lancer le serveur HTTP")
	listenFlag := flag.String("listen", ":8090", "Adresse d'écoute du serveur HTTP")
	timeoutFlag := flag.Duration("timeout", 5*time.Minute, "Timeout du scan")
	saveFlag := flag.Bool("save", true, "Sauvegarder le JSON dans un fichier (mode CLI)")
	stdoutFlag := flag.Bool("stdout", false, "Afficher le graphe JSON sur stdout (mode CLI)")

	flag.Parse()

	if *serverFlag {
		startServer(*listenFlag, *timeoutFlag)
		return
	}

	cidr := *cidrFlag
	if cidr == "" && flag.NArg() > 0 {
		cidr = flag.Arg(0)
	}
	if cidr == "" {
		fmt.Println("Usage: go run . --cidr <cidr> [--save] [--stdout]")
		fmt.Println("   ou: go run . <cidr>")
		fmt.Println("   ou: go run . --server")
		os.Exit(1)
	}

	normalizedCIDR, err := normalizeCIDR(cidr)
	if err != nil {
		log.Fatal(err)
	}

	ctx, cancel := context.WithTimeout(context.Background(), *timeoutFlag)
	defer cancel()

	graph, filename, err := runScan(ctx, normalizedCIDR, *saveFlag)
	if err != nil {
		log.Fatal(err)
	}

	if *saveFlag {
		fmt.Println("Graphe sauvegardé dans", filename)
	}
	if *stdoutFlag {
		if err := printGraphJSON(os.Stdout, &graph); err != nil {
			log.Fatal(err)
		}
	}
}

func normalizeCIDR(input string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", fmt.Errorf("cidr vide")
	}
	if strings.EqualFold(trimmed, "localhost") {
		return "127.0.0.1/32", nil
	}
	if _, _, err := net.ParseCIDR(trimmed); err == nil {
		return trimmed, nil
	}
	if ip := net.ParseIP(trimmed); ip != nil {
		if ip.To4() != nil {
			return ip.String() + "/32", nil
		}
		return ip.String() + "/128", nil
	}
	return "", fmt.Errorf("cidr invalide: %q", input)
}