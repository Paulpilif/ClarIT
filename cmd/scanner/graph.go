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
			if isObsolete(s.Name, s.Version) && risk != "vulnerable" {
				risk = "obsolete"
			}
		}
		n.Risk = risk

		n.Type = ClassifyNode(n)
	}
}


func ClassifyNode(n *Node) string {
	ports := map[int]bool{}
	services := map[string]bool{}

	for _, s := range n.Services {
		ports[s.Port] = true
		services[strings.ToLower(s.Name)] = true
	}

	if ports[22] && ports[443] && len(n.Services) < 5 {
		return "firewall"
	}

	if services["vmware-auth"] || ports[902] || ports[903] {
		return "hypervisor"
	}

	if ports[53] && (ports[67] || ports[68]) {
		return "network-device"
	}

	if MayBeWorkstation(n) {
		return "workstation"
	}
	
	if MayBeDomainController(n.Services) ||
		(ports[389] && (ports[88] || ports[445])) {
		return "domain-controller"
	}

	if ports[3306] || ports[5432] || ports[27017] {
		return "database-server"
	}

	if ports[80] || ports[443] {
		return "web-server"
	}

	if ports[8080] || ports[8443] {
		return "application-server"
	}

	if ports[22] && len(ports) <= 3 {
		return "bastion"
	}

	if MayBeRouter(n) {
		return "router"
	}

	if len(n.Services) >= 3 {
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

