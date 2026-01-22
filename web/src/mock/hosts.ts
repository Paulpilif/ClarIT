export const mockHosts = [
  // --- LAYER 1: SECURITY GATEWAY ---
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

  // --- LAYER 2: ROUTER ---
  {
    id: "r-a",
    ip: "192.168.1.254",
    hostname: "router-core",
    os: "Cisco IOS",
    type: "router",
    services: ["Routing", "ACL"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },

  // --- LAYER 3: SWITCH ---
  {
    id: "sw-1",
    ip: "192.168.1.2",
    hostname: "switch-core",
    os: "ArubaOS",
    type: "switch",
    services: ["L2 Switching", "VLAN"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },

  // --- LAYER 4: SERVERS (Maintenant 5 éléments) ---
  {
    id: "srv-1",
    ip: "192.168.1.10",
    hostname: "srv-web",
    os: "Ubuntu 22.04",
    type: "server",
    services: ["Nginx", "Reverse Proxy"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 80, protocol: "tcp", serviceName: "http", status: "open" }],
  },
  {
    id: "srv-2",
    ip: "192.168.1.20",
    hostname: "srv-db",
    os: "Debian 12",
    type: "server",
    services: ["PostgreSQL"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 5432, protocol: "tcp", serviceName: "postgres", status: "open" },
    ],
  },
  {
    id: "srv-3",
    ip: "192.168.1.30",
    hostname: "srv-cache",
    os: "Alpine Linux",
    type: "server",
    services: ["Redis"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 6379, protocol: "tcp", serviceName: "redis", status: "open" },
    ],
  },
  // NOUVEAU : Serveur de Monitoring
  {
    id: "srv-4",
    ip: "192.168.1.40",
    hostname: "srv-monitor",
    os: "CentOS Stream",
    type: "server",
    services: ["Grafana", "Prometheus"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 3000, protocol: "tcp", serviceName: "grafana", status: "open" },
    ],
  },
  // NOUVEAU : Serveur d'Authentification
  {
    id: "srv-5",
    ip: "192.168.1.50",
    hostname: "srv-auth",
    os: "RedHat",
    type: "server",
    services: ["LDAP", "Keycloak"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [
      { port: 389, protocol: "tcp", serviceName: "ldap", status: "open" },
    ],
  },

  // --- LAYER 5: WORKSTATIONS (Maintenant 4 éléments) ---
  {
    id: "pc-1",
    ip: "192.168.1.101",
    hostname: "bureau-rh",
    os: "Windows 11",
    type: "workstation",
    services: ["User Device"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [],
  },
  {
    id: "pc-2",
    ip: "192.168.1.102",
    hostname: "bureau-compta",
    os: "Windows 11",
    type: "workstation",
    services: ["User Device"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [],
  },
  // NOUVEAU : Laptop de Dev
  {
    id: "pc-3",
    ip: "192.168.1.103",
    hostname: "dev-laptop",
    os: "macOS Sonoma",
    type: "workstation",
    services: ["Dev Tools"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [],
  },
  // NOUVEAU : Imprimante Réseau (Classée comme workstation pour être en bas)
  {
    id: "prt-1",
    ip: "192.168.1.200",
    hostname: "printer-main",
    os: "Firmware v4",
    type: "workstation",
    services: ["IPP", "AirPrint"],
    lastSeen: "2026-01-15T00:00:00Z",
    ports: [{ port: 631, protocol: "tcp", serviceName: "ipp", status: "open" }],
  },
] as const;
