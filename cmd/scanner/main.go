package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/Ullaakut/nmap"
)

// Représente une machine sur le réseau
type Node struct {
	ID       string `json:"id"`
	IP       string `json:"ip"`
	Hostname string `json:"hostname"`
	Type     string `json:"type"` // "router", "server", "pc"
	// champs d'enrichissement
	Services []Service `json:"services,omitempty"`
	Risk     string    `json:"risk,omitempty"` // "ok", "obsolete", "vulnerable"
}

// Représente une connexion
type Link struct {
	Source string `json:"source"` // ID du noeud source
	Target string `json:"target"` // ID du noeud cible
	Type   string `json:"type"`   // "http", "ssh"
}

// Type échangé entre front et back
type NetworkGraph struct {
	Nodes []Node `json:"nodes"`
	Links []Link `json:"links"`
}

// Info de service détectée
type Service struct {
	Port     int    `json:"port"`
	Protocol string `json:"protocol"`
	Name     string `json:"name"`
	Version  string `json:"version,omitempty"`
}

// Petite base locale d'obsolescence / vulnérabilités (exemple)
var vulnDB = map[string][]string{
	"Apache": {"2.2", "2.4.0", "2.4.1"},
	"OpenSSH": {"7.2", "7.4"},
	"MySQL": {"5.5", "5.6"},
}

func main() {
	if len(os.Args) < 2 {
		fmt.Println("Usage: scan_squelette <target1[,target2,...]|cidr>")
		os.Exit(1)
	}

	targets := strings.Split(os.Args[1], ",")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
	defer cancel()

	scanResult, err := runNmapScan(ctx, targets)
	if err != nil {
		fmt.Fprintf(os.Stderr, "scan error: %v\n", err)
		os.Exit(2)
	}

	graph := parseNmapToGraph(scanResult)
	// Enrichir: classifier types, vérifier vulnérabilités
	enrichGraph(&graph)

	// Sauvegarde JSON
	if err := saveGraphJSON("network_graph.json", &graph); err != nil {
		fmt.Fprintf(os.Stderr, "save error: %v\n", err)
	}

	b, _ := json.MarshalIndent(graph, "", "  ")
	fmt.Println(string(b))
}

// Lancement d'un scan nmap simple : découverte d'hôtes, services et versions
func runNmapScan(ctx context.Context, targets []string) (*nmap.Run, error) {
	// Exemple : -sS -sV -O -p- (syn scan, version detection, os detection, all ports)
	// ATTENTION : certains flags demandent des privilèges et peuvent être intrusifs.
	scanner, err := nmap.NewScanner(
		nmap.WithTargets(targets...),
		nmap.WithServiceInfo(),
		nmap.WithOSDetection(),
		nmap.WithContext(ctx),
	)
	if err != nil {
		return nil, err
	}

	run, warnings, err := scanner.Run()
	if err != nil {
		return nil, err
	}
	if len(warnings) > 0 {
		fmt.Fprintf(os.Stderr, "nmap warnings: %v\n", warnings)
	}
	return run, nil
}

// Construit un NetworkGraph minimal à partir du résultat nmap
func parseNmapToGraph(res *nmap.Run) NetworkGraph {
	nodes := make([]Node, 0)
	links := make([]Link, 0)
	idByIP := map[string]string{}
	mutex := sync.Mutex{}

	// parcourir les hôtes détectés
	var wg sync.WaitGroup
	for _, host := range res.Hosts {
		if len(host.Addresses) == 0 {
			continue
		}
		ip := host.Addresses[0].Addr
		wg.Add(1)
		go func(h nmap.Host, ip string) {
			defer wg.Done()
			node := Node{
				ID:       generateID(ip),
				IP:       ip,
				Hostname: getHostname(h),
				Type:     "unknown",
			}

			// services
			svcs := make([]Service, 0)
			for _, p := range h.Ports {
				if p.State.State != "open" {
					continue
				}
				name := p.Service.Name
				version := strings.TrimSpace(p.Service.Product + " " + p.Service.Version)
				svcs = append(svcs, Service{Port: int(p.ID), Protocol: string(p.Protocol), Name: name, Version: version})
				// créer un link pour ce service depuis "internet" ou un "scanner" vers ce node
				links = appendSafeLink(&mutex, links, Link{Source: "scanner", Target: node.ID, Type: name})
			}
			node.Services = svcs

			// sauvegarder
			mutex.Lock()
			idByIP[ip] = node.ID
			nodes = append(nodes, node)
			mutex.Unlock()
		}(host, ip)
	}
	wg.Wait()

	// possibilité : déduire liens entre nodes si des ports indiquent des connexions
	// ex: si on détecte sur A un port 3306 et sur B le port 3306 ouvert, on peut inférer liaison applicative
	// ici implémentation naïve : pour chaque service de même port, lier les nodes
	portIndex := map[int][]string{} // port -> nodeIDs
	for _, n := range nodes {
		for _, s := range n.Services {
			portIndex[s.Port] = append(portIndex[s.Port], n.ID)
		}
	}
	for port, ids := range portIndex {
		if len(ids) < 2 {
			continue
		}
		sort.Strings(ids)
		for i := 0; i < len(ids)-1; i++ {
			links = append(links, Link{Source: ids[i], Target: ids[i+1], Type: fmt.Sprintf("port-%d", port)})
		}
	}

	// ajouter le scanner comme node si nécessaire
	scannerNode := Node{ID: "scanner", IP: "0.0.0.0", Hostname: "scanner", Type: "scanner"}
	nodes = append([]Node{scannerNode}, nodes...)

	return NetworkGraph{Nodes: nodes, Links: links}
}

// Enrichissement : classification des nodes et check vulnérabilités
func enrichGraph(g *NetworkGraph) {
	for i := range g.Nodes {
		n := &g.Nodes[i]
		// classifier
		n.Type = classifyNodeType(n)
		// vérifier services pour obsolescence
		risk := "ok"
		for _, s := range n.Services {
			if isVulnerable(s.Name, s.Version) {
				risk = "vulnerable"
				break
			}
			if isObsolete(s.Name, s.Version) {
				if risk != "vulnerable" {
					risk = "obsolete"
				}
			}
		}
		n.Risk = risk
	}
}

// Simple heuristique pour classifier le type de node
func classifyNodeType(n *Node) string {
	// si hostname contient "router" ou adresse privée particulière, heuristique simplifiée
	h := strings.ToLower(n.Hostname)
	if strings.Contains(h, "router") || strings.Contains(h, "fw") || strings.Contains(h, "switch") {
		return "router"
	}
	// si beaucoup de services -> server
	if len(n.Services) >= 3 {
		return "server"
	}
	// sinon PC
	return "pc"
}

// Check simple vuln DB
func isVulnerable(name, version string) bool {
	if version == "" || name == "" {
		return false
	}
	candidates, ok := vulnDB[name]
	if !ok {
		return false
	}
	for _, v := range candidates {
		if strings.HasPrefix(strings.TrimSpace(version), v) {
			return true
		}
	}
	return false
}

// Check obsolescence (exemple basique)
func isObsolete(name, version string) bool {
	// pour l'exemple on considère que si la version commence par 1. ou 2. elle est obsolète (FAUX en prod)
	if version == "" {
		return false
	}
	if strings.HasPrefix(version, "1.") {
		return true
	}
	return false
}

// tenter le reverse DNS et OS info simplifié
func getHostname(h nmap.Host) string {
	if h.Hostnames != nil && len(h.Hostnames) > 0 {
		return h.Hostnames[0].Name
	}
	// fallback: reverse lookup
	if len(h.Addresses) > 0 {
		ip := h.Addresses[0].Addr
		names, err := net.LookupAddr(ip)
		if err == nil && len(names) > 0 {
			return strings.TrimSuffix(names[0], ".")
		}
	}
	return ""
}

// Génère un ID stable par IP (ici on simplifie)
func generateID(ip string) string {
	return strings.ReplaceAll(ip, ".", "-")
}

// Ajoute un link en évitant les doublons (sécurité thread-safe)
func appendSafeLink(mu *sync.Mutex, links []Link, l Link) []Link {
	mu.Lock()
	defer mu.Unlock()
	for _, ex := range links {
		if ex.Source == l.Source && ex.Target == l.Target && ex.Type == l.Type {
			return links
		}
	}
	return append(links, l)
}

// Persiste le graphe en JSON
func saveGraphJSON(path string, g *NetworkGraph) error {
	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()
	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(g)
}
