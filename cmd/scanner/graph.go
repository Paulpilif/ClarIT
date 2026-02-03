package main

import (
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"strings"
)

// Un noeud égale une machine sur le réseau
type Node struct {
	ID       string    `json:"id"`
	IP       string    `json:"ip"`
	Hostname string    `json:"hostname"`
	Type     string    `json:"type"`
	OS       string    `json:"os,omitempty"`
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

	scannerIP := getLocalIP()
	scannerHostname, _ := os.Hostname()
	scannerID := generateID(scannerIP)

	graph.Nodes = append(graph.Nodes, Node{
		ID:       scannerID,
		IP:       scannerIP,
		Hostname: scannerHostname,
		OS: 	 "os",
		Type:     "pc",
		Risk:     "ok",
	})

	for _, fp := range fps {
		id := generateID(fp.IP)

		graph.Nodes = append(graph.Nodes, Node{
			ID:       id,
			IP:       fp.IP,
			Hostname: fp.Hostname,
			OS:       fp.OS,
			Type:     "server",
			Services: fp.Services,
			Risk:     "ok",
		})

		for _, s := range fp.Services {
			graph.Links = append(graph.Links, Link{
				Source: scannerID,
				Target: id,
				Type:   s.Name,
			})
		}
	}

	return graph
}

func normalizeHostname(n *Node) {
	h := strings.ToLower(n.Hostname)

	if h == "_gateway" || h == "gateway" {
		n.Hostname = "firewall"
		n.Type = "firewall"
	}
}


func EnrichGraph(g *NetworkGraph) {
	for i := range g.Nodes {
		n := &g.Nodes[i]

		normalizeHostname(n)

		if n.Type == "" || n.Type == "unknown" {
			n.Type = ClassifyNode(n)
		}

		// Risk
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



func ClassifyNode(n *Node) string {
	if n.Type == "firewall" {
		return "firewall"
	}

	if MayBeDomainController(n) {
		return "domain-controller"
	}

	if MayBeRouter(n) {
		return "router"
	
	}
	if MayBeWebServer(n) {
		return "web-server"
	}

	if MayBeWorkstation(n) {
		return "workstation"
	}

	if len(n.Services) > 0 {
		return "server"
	}

	return "unknown"
}


// Risk

// Petite base de donnée locale d'obsolescence / vulnérabilités
var vulnDB = map[string][]string{ 
	"Apache": {"2.2", "2.4.0", "2.4.1"},
	"OpenSSH": {"7.2", "7.4"},
	"MySQL": {"5.5", "5.6"},
}

func isVulnerable(name, version string) bool {
	for _, v := range vulnDB[name] {
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
	return strings.ReplaceAll(ip, ".", "-")
}

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

func GraphFilename(companyName string, cidr string) (string, error) {
	companySegment := sanitizePathSegment(companyName)
	if companySegment == "" {
		companySegment = "default"
	}

	cidrSegment := sanitizePathSegment(cidr)
	if cidrSegment == "" {
		cidrSegment = "unknown"
	}

	baseDir := getResultsBaseDir()
	dir := filepath.Join(baseDir, companySegment)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}

	filename := "scan_" + cidrSegment + ".json"
	return filepath.Join(dir, filename), nil
}

func getResultsBaseDir() string {
	if value := strings.TrimSpace(os.Getenv("SCANNER_RESULTS_DIR")); value != "" {
		return value
	}
	if value := strings.TrimSpace(os.Getenv("RESULTS_DIR")); value != "" {
		return value
	}
	return "results"
}

func sanitizePathSegment(input string) string {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return ""
	}

	var b strings.Builder
	for _, r := range trimmed {
		switch {
		case r >= 'a' && r <= 'z':
			b.WriteRune(r)
		case r >= 'A' && r <= 'Z':
			b.WriteRune(r)
		case r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '-' || r == '_' || r == '.':
			b.WriteRune(r)
		default:
			b.WriteRune('_')
		}
	}

	return b.String()
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

