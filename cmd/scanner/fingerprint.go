package main

import (
	"context"
	"log"

	"github.com/Ullaakut/nmap"
)

type HostFingerprint struct {
    IP       string
    Hostname string
    OS       string
    Services []Service
}

func FingerprintHost(ctx context.Context, host DiscoveredHost, enableOSDetection bool) (*HostFingerprint, error) {
	options := fingerprintScannerOptions(ctx, []string{host.IP}, enableOSDetection)
	scanner, err := nmap.NewScanner(options...)
	if err != nil {
		return nil, err
	}

	result, warnings, err := scanner.Run()
	for _, w := range warnings {
		log.Printf("nmap warning: %s", w)
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
	applyHostFingerprint(fp, h)

	return fp, nil
}

func FingerprintHosts(ctx context.Context, hosts []DiscoveredHost, enableOSDetection bool) ([]*HostFingerprint, error) {
	if len(hosts) == 0 {
		return []*HostFingerprint{}, nil
	}

	ips := make([]string, 0, len(hosts))
	knownHostnames := map[string]string{}
	for _, h := range hosts {
		ips = append(ips, h.IP)
		if h.Hostname != "" {
			knownHostnames[h.IP] = h.Hostname
		}
	}

	options := fingerprintScannerOptions(ctx, ips, enableOSDetection)
	scanner, err := nmap.NewScanner(options...)
	if err != nil {
		return nil, err
	}

	result, warnings, err := scanner.Run()
	for _, w := range warnings {
		log.Printf("nmap warning: %s", w)
	}
	if err != nil {
		return nil, err
	}

	fps := []*HostFingerprint{}
	for _, h := range result.Hosts {
		if len(h.Addresses) == 0 {
			continue
		}
		ip := h.Addresses[0].Addr
		fp := &HostFingerprint{
			IP:       ip,
			Hostname: resolveHostname(h, knownHostnames),
			Services: []Service{},
		}
		applyHostFingerprint(fp, h)
		fps = append(fps, fp)
	}

	return fps, nil
}

func fingerprintScannerOptions(ctx context.Context, targets []string, enableOSDetection bool) []func(*nmap.Scanner) {
	options := []func(*nmap.Scanner){
		nmap.WithTargets(targets...),
		// nmap.WithSYNScan(),      // -sS en local ça marche pas car askip les pings sont bloqués
		nmap.WithSkipHostDiscovery(), // -Pn ça ignore le ping
		nmap.WithServiceInfo(),       // -sV
		nmap.WithContext(ctx),
	}
	if enableOSDetection && shouldEnableOSDetection() {
		options = append(options, nmap.WithOSDetection()) // -O
	}
	return options
}

func applyHostFingerprint(fp *HostFingerprint, h nmap.Host) {
	if len(h.OS.Matches) > 0 {
		fp.OS = h.OS.Matches[0].Name
	}
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
}

func resolveHostname(h nmap.Host, known map[string]string) string {
	if len(h.Hostnames) > 0 {
		return h.Hostnames[0].Name
	}
	if len(h.Addresses) > 0 {
		if name, ok := known[h.Addresses[0].Addr]; ok {
			return name
		}
	}
	return getHostname(h)
}

func shouldEnableOSDetection() bool {
	return isRoot()
}