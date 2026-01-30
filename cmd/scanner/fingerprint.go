package main

import (
	"context"

	"github.com/Ullaakut/nmap"
)

type HostFingerprint struct {
    IP       string
    Hostname string
    OS       string
    Services []Service
}

func FingerprintHost(ctx context.Context, host DiscoveredHost) (*HostFingerprint, error) {
	scanner, err := nmap.NewScanner(
		nmap.WithTargets(host.IP),
		// nmap.WithSYNScan(),      // -sS en local ça marche pas car askip les pings sont bloqués
		nmap.WithSkipHostDiscovery(), // -Pn ça ignore le ping 
		nmap.WithServiceInfo(),  // -sV
		nmap.WithOSDetection(),  // -O
		nmap.WithContext(ctx),
	)
	if err != nil {
		return nil, err
	}

	result, warnings, err := scanner.Run()
	for _, w := range warnings {
		println("nmap warning:", w)
	}
	if err != nil {
		return nil, err
	}

	fp := &HostFingerprint{
		IP:       host.IP,
		Hostname: host.Hostname,
		Services: []Service{},
	}

	if len(result.Hosts) == 0 {
		return fp, nil
	}

	h := result.Hosts[0]
	// OS
	if len(h.OS.Matches) > 0 {
		fp.OS = h.OS.Matches[0].Name
	}
	// Ports et services
	for _, p := range h.Ports {
		if p.State.State != "open" {
			continue
		}

		version := p.Service.Product
		if p.Service.Version != "" {
			version += " " + p.Service.Version
		}

		fp.Services = append(fp.Services, Service{
			Port:     int(p.ID),
			Protocol: string(p.Protocol),
			Name:     p.Service.Name,
			Version:  version,
		})
	}

	return fp, nil
}
