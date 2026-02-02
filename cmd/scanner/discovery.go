package main

import (
	"context"
	"errors"
	"net"
	"os/exec"
	"strings"

	"github.com/Ullaakut/nmap"
)

type DiscoveredHost struct {
    IP       string
    Hostname string
}

func DiscoverHosts(ctx context.Context, cidr string) ([]DiscoveredHost, error) {
	scanner, err := nmap.NewScanner(
		nmap.WithTargets(cidr),
		nmap.WithPingScan(), // -sn
		nmap.WithContext(ctx),
	)
	if err != nil {
		return nil, err
	}
	if cidr == "127.0.0.1/32" || cidr == "localhost" {
    return []DiscoveredHost{
        {IP: "127.0.0.1", Hostname: "localhost"},
    }, nil
}

	result, warnings, err := scanner.Run()
	for _, w := range warnings {
		println("nmap warning:", w)
	}
	if err != nil {
		return nil, err
	}

	hosts := []DiscoveredHost{}

	for _, host := range result.Hosts {
		if len(host.Addresses) == 0 {
			continue
		}

		ip := host.Addresses[0].Addr
		hostname := getHostname(host)

		hosts = append(hosts, DiscoveredHost{
			IP:       ip,
			Hostname: hostname,
		})
	}

	return hosts, nil
}


// Pour le Reverse DNS / hostname
func getHostname(h nmap.Host) string {
	if len(h.Hostnames) > 0 {
		for _, hn := range h.Hostnames {
			if hn.Name != "" {
				return strings.TrimSuffix(hn.Name, ".")
			}
		}
	}

	if len(h.Addresses) > 0 {
		ip := h.Addresses[0].Addr
		names, err := net.LookupAddr(ip)
		if err == nil && len(names) > 0 {
			return strings.TrimSuffix(names[0], ".")
		}
	}

	if len(h.Addresses) > 0 {
		return h.Addresses[0].Addr
	}

	return "unknown"
}

func MayBeDomainController(n *Node) bool {
	hasLDAP := false
	hasKerberos := false
	hasDNS := false
	hasSMB := false

	for _, s := range n.Services {
		switch s.Port {
		case 389, 636:
			hasLDAP = true
		case 88:
			hasKerberos = true
		case 53:
			hasDNS = true
		case 445:
			hasSMB = true
		}
	}

	score := 0
	if hasLDAP { score++ }
	if hasKerberos { score++ }
	if hasDNS { score++ }
	if hasSMB { score++ }

	// DC = AU MOINS 3 sur 4
	return score >= 3
}

func MayBeWorkstation(n *Node) bool {
	openPorts := map[int]bool{}
	serviceCount := len(n.Services)

	if strings.Contains(strings.ToLower(n.OS), "windows 10") ||
	   strings.Contains(strings.ToLower(n.OS), "windows 11") {
		return true
	}

	// Peu de services ouverts
	if len(n.Services) <= 2 {
		return true
	}

	if serviceCount > 5 {
		return false
	}

	if openPorts[3389] || openPorts[5900] || openPorts[5357] || openPorts[5358] {
		return true
	}

	hn := strings.ToLower(n.Hostname)
	if strings.HasPrefix(hn, "pc-") ||
		strings.HasPrefix(hn, "laptop-") ||
		strings.HasPrefix(hn, "desktop-") {
		return true
	}

	return false
}


func getDefaultGateway() (string, error) {
	cmd := exec.Command("ip", "route")
	out, err := cmd.Output()
	if err != nil {
		return "", err
	}

	lines := strings.Split(string(out), "\n")
	for _, l := range lines {
		if strings.HasPrefix(l, "default") {
			fields := strings.Fields(l)
			for i, f := range fields {
				if f == "via" && i+1 < len(fields) {
					return fields[i+1], nil
				}
			}
		}
	}
	return "", errors.New("gateway not found")
}

func AddInferredGateway(g *NetworkGraph, ip string) {
	id := generateID(ip)

	for _, n := range g.Nodes {
		if n.IP == ip {
			return
		}
	}

	g.Nodes = append(g.Nodes, Node{
		ID:       id,
		IP:       ip,
		Hostname: "_gateway",
		Type:     "router",
		Risk:     "unknown",
	})

	g.Links = append(g.Links, Link{
		Source: "scanner",
		Target: id,
		Type:   "gateway",
	})
}

func MayBeRouter(n *Node) bool {
	ports := map[int]bool{}
	for _, s := range n.Services {
		ports[s.Port] = true
	}

	// services typiques routeur / infra
	if ports[22] && ports[80] && ports[443] {
		return true
	}

	for _, s := range n.Services {
		switch strings.ToLower(s.Name) {
		case "snmp", "bgp", "ospf", "rip":
			return true
		case "http":
			if strings.Contains(strings.ToLower(s.Version), "router") {
				return true
			}
		}
	}

	if len(n.Services) <= 3 && (ports[22] || ports[23]) {
		return true
	}

	return false
}


func isWindowsServerOS(os string) bool {
	os = strings.ToLower(os)
	return strings.Contains(os, "windows server")
}


func MayBeWebServer(n *Node) bool {
	hasHTTP := false
	backendServices := 0

	for _, s := range n.Services {
		switch s.Port {
		case 80, 443, 8080:
			hasHTTP = true
		case 3306, 5432, 6379, 9200:
			backendServices++
		}
	}
	// serveur web avec des services backend
	if hasHTTP && backendServices > 0 {
		return true
	}

	// serveur web "pur" MAIS OS serveur
	if hasHTTP && isWindowsServerOS(n.OS) {
		return true
	}

	return false
}



