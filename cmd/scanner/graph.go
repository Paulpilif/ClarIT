package main

import (
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Un noeud égale une machine sur le réseau
type Node struct {
	ID       string    `json:"id"`
	IP       string    `json:"ip"`
	Hostname string    `json:"hostname"`
	Type     string    `json:"type"`
	Services []Service `json:"services,omitempty"`
	Risk     string    `json:"risk,omitempty"`
}

// Représente les connexions entre noeuds source/cible 
type Link struct {
	Source string `json:"source"`
	Target string `json:"target"`
	Type   string `json:"type"`
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

func BuildGraph(fps []*HostFingerprint) NetworkGraph {
	graph := NetworkGraph{
		Nodes: []Node{},
		Links: []Link{},
	}

	linkSet := map[string]struct{}{}

	scannerIP := getLocalIP()
	scannerHostname, _ := os.Hostname()
	scannerID := generateID(scannerIP)

	graph.Nodes = append(graph.Nodes, Node{
		ID:       scannerID,
		IP:       scannerIP,
		Hostname: scannerHostname,
		Type:     "pc",
		Risk:     "ok",
	})

	for _, fp := range fps {
		id := generateID(fp.IP)

		graph.Nodes = append(graph.Nodes, Node{
			ID:       id,
			IP:       fp.IP,
			Hostname: fp.Hostname,
			Type:     "server",
			Services: fp.Services,
			Risk:     "ok",
		})

		for _, s := range fp.Services {
			linkKey := buildLinkKey(scannerID, id, s.Name)
			if _, exists := linkSet[linkKey]; exists {
				continue
			}
			linkSet[linkKey] = struct{}{}
			graph.Links = append(graph.Links, Link{
				Source: scannerID,
				Target: id,
				Type:   s.Name,
			})
		}
	}

	return graph
}

func EnrichGraph(g *NetworkGraph) {
	for i := range g.Nodes {
		n := &g.Nodes[i]
		risk := "ok"

		for _, s := range n.Services {
			if isVulnerable(s.Name, s.Version) {
				risk = "vulnerable"
				break
			}
			if isObsolete(s.Name, s.Version) {
				risk = "obsolete"
			}
		}
		n.Risk = risk
	}
}

// Risk

// Petite base de donnée locale d'obsolescence / vulnérabilités
var vulnDB = map[string][]string{ 
	"apache":  {"2.2", "2.4.0", "2.4.1"},
	"openssh": {"7.2", "7.4"},
	"mysql":   {"5.5", "5.6"},
}

func isVulnerable(name, version string) bool {
	key := normalizeServiceName(name)
	for _, v := range vulnDB[key] {
		if strings.HasPrefix(version, v) {
			return true
		}
	}
	return false
}

func isObsolete(_, version string) bool {
	return strings.HasPrefix(version, "1.")
}

// Utilitaires

// Génère un ID stable par IP
func generateID(ip string) string {
	return "ip:" + strings.NewReplacer(".", "-", ":", "-").Replace(ip)
}

func saveGraphJSON(path string, g *NetworkGraph) error {
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return err
	}

	f, err := os.Create(path)
	if err != nil {
		return err
	}
	defer f.Close()

	enc := json.NewEncoder(f)
	enc.SetIndent("", "  ")
	return enc.Encode(g)
}

func NextGraphFilename() string {
	files, _ := filepath.Glob("results/network_graph_*.json")
	max := 0

	for _, f := range files {
		base := filepath.Base(f)
		num := strings.TrimSuffix(strings.TrimPrefix(base, "network_graph_"), ".json")
		if n, err := strconv.Atoi(num); err == nil && n > max {
			max = n
		}
	}
	return "results/network_graph_" + strconv.Itoa(max+1) + ".json"
}

func getLocalIP() string {
    addrs, err := net.InterfaceAddrs()
    if err != nil {
        return "127.0.0.1"
    }

    for _, addr := range addrs {
        if ipnet, ok := addr.(*net.IPNet); ok &&
            !ipnet.IP.IsLoopback() &&
            ipnet.IP.To4() != nil {

            return ipnet.IP.String()
        }
    }
    return "127.0.0.1"
}

func normalizeServiceName(name string) string {
	return strings.ToLower(strings.TrimSpace(name))
}

func buildLinkKey(source, target, serviceName string) string {
	return source + "|" + target + "|" + normalizeServiceName(serviceName)
}

