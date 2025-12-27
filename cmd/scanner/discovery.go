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
		return h.Hostnames[0].Name
	}
	if len(h.Addresses) > 0 { // fallback et reverse lookup
		names, err := net.LookupAddr(h.Addresses[0].Addr)
		if err == nil && len(names) > 0 {
			return strings.TrimSuffix(names[0], ".")
		}
	}
	return ""
}