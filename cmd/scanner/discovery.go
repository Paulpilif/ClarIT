package main

import (
	"context"
	"net"
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

func MayBeDomainController(services []Service) bool {
	for _, s := range services {
		switch s.Name {
		case "ldap", "kerberos", "dns", "msrpc":
			return true
		}
	}
	return false
}

func MayBeWorkstation(n *Node) bool {
	openPorts := map[int]bool{}
	serviceCount := len(n.Services)

	for _, s := range n.Services {
		openPorts[s.Port] = true

		switch strings.ToLower(s.Name) {
		case "ldap", "kerberos", "mysql", "postgresql",
			"http", "https", "dns", "ntp", "msrpc":
			return false
		}
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