// src/mock/hosts.ts
export const mockHosts = [
  // --- CORE / SECURITY ---
  {
    id: "gw-1",
    ip: "192.168.1.1",
    hostname: "security-gateway",
    os: "pfSense 2.7",
    type: "firewall",
    services: ["Firewall", "NAT", "VPN"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 443, protocol: "tcp", serviceName: "https", status: "open" },
      { port: 1194, protocol: "udp", serviceName: "openvpn", status: "open" },
    ],
  },
  {
    id: "r-a",
    ip: "192.168.1.254",
    hostname: "router-a",
    os: "Cisco IOS",
    type: "router",
    services: ["Routing", "ACL"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },
  {
    id: "sw-1",
    ip: "192.168.1.2",
    hostname: "switch-1",
    os: "ArubaOS",
    type: "switch",
    services: ["L2 Switching", "VLAN"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },

  // --- SERVERS ---
  {
    id: "1",
    ip: "192.168.1.10",
    hostname: "srv-web",
    os: "Linux",
    type: "server",
    services: ["HTTP", "Reverse Proxy"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 22, protocol: "tcp", serviceName: "ssh", status: "open" },
      { port: 80, protocol: "tcp", serviceName: "http", status: "open" },
    ],
  },
  {
    id: "2",
    ip: "192.168.1.20",
    hostname: "srv-db",
    os: "Linux",
    type: "server",
    services: ["PostgreSQL"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 22, protocol: "tcp", serviceName: "ssh", status: "open" },
      { port: 5432, protocol: "tcp", serviceName: "postgres", status: "open" },
    ],
  },
  {
    id: "3",
    ip: "192.168.1.30",
    hostname: "srv-cache",
    os: "Linux",
    type: "server",
    services: ["Redis"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 6379, protocol: "tcp", serviceName: "redis", status: "open" }],
  },

  // --- WORKSTATIONS ---
  {
    id: "pc-1",
    ip: "192.168.1.101",
    hostname: "workstation-1",
    os: "Windows 11",
    type: "workstation",
    services: ["User Device"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [],
  },
  {
    id: "pc-2",
    ip: "192.168.1.102",
    hostname: "workstation-2",
    os: "Windows 11",
    type: "workstation",
    services: ["User Device"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [],
  },
] as const;
