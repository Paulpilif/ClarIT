// On définit un type pour être rigoureux (facultatif mais propre)
export interface HostData {
  id: string;
  ip: string;
  hostname: string;
  os: string;
  type: "firewall" | "router" | "switch" | "server" | "workstation";
  status: "online" | "warning" | "offline"; // <--- NOUVEAU
  uptime: string;                           // <--- NOUVEAU
  specs: { cpu: string; ram: string; disk: string }; // <--- NOUVEAU
  services: string[];
  lastSeen: string;
  ports: { port: number; protocol: string; serviceName: string; status: string }[];
}

export const mockHosts: HostData[] = [
  // --- LAYER 1: SECURITY GATEWAY ---
  {
    id: "gw-1",
    ip: "192.168.1.1",
    hostname: "security-gateway",
    os: "pfSense 2.7",
    type: "firewall",
    status: "online",
    uptime: "45j 12h 30m",
    specs: { cpu: "4 vCPU", ram: "8 GB", disk: "128 GB SSD" },
    services: ["Firewall", "NAT", "VPN", "DPI"],
    lastSeen: "2026-01-28T08:00:00Z",
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
    os: "Cisco IOS XE",
    type: "router",
    status: "online",
    uptime: "120j 04h 11m",
    specs: { cpu: "ASIC", ram: "4 GB", disk: "NVRAM" },
    services: ["BGP", "OSPF", "ACL"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },

  // --- LAYER 3: SWITCH ---
  {
    id: "sw-1",
    ip: "192.168.1.2",
    hostname: "switch-core",
    os: "ArubaOS-CX",
    type: "switch",
    status: "online",
    uptime: "200j 01h 05m",
    specs: { cpu: "ARM v8", ram: "2 GB", disk: "Flash" },
    services: ["L2 Switching", "VLAN", "LACP"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [{ port: 22, protocol: "tcp", serviceName: "ssh", status: "open" }],
  },

  // --- LAYER 4: SERVERS ---
  {
    id: "srv-1",
    ip: "192.168.1.10",
    hostname: "srv-web",
    os: "Ubuntu 22.04 LTS",
    type: "server",
    status: "online",
    uptime: "14j 03h 12m",
    specs: { cpu: "8 vCPU", ram: "16 GB", disk: "500 GB NVMe" },
    services: ["Nginx", "Reverse Proxy", "Certbot"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [{ port: 80, protocol: "tcp", serviceName: "http", status: "open" }],
  },
  {
    id: "srv-2",
    ip: "192.168.1.20",
    hostname: "srv-db",
    os: "Debian 12",
    type: "server",
    status: "warning", // <--- Petit avertissement pour l'exemple
    uptime: "88j 11h 00m",
    specs: { cpu: "16 vCPU", ram: "64 GB", disk: "2 TB RAID 10" },
    services: ["PostgreSQL", "PgPool"],
    lastSeen: "2026-01-28T08:00:00Z",
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
    status: "online",
    uptime: "5j 22h 10m",
    specs: { cpu: "4 vCPU", ram: "32 GB", disk: "100 GB" },
    services: ["Redis", "Sentinel"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [
      { port: 6379, protocol: "tcp", serviceName: "redis", status: "open" },
    ],
  },
  {
    id: "srv-4",
    ip: "192.168.1.40",
    hostname: "srv-monitor",
    os: "CentOS Stream 9",
    type: "server",
    status: "online",
    uptime: "30j 00h 45m",
    specs: { cpu: "8 vCPU", ram: "16 GB", disk: "1 TB HDD" },
    services: ["Grafana", "Prometheus", "Loki"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [
      { port: 3000, protocol: "tcp", serviceName: "grafana", status: "open" },
    ],
  },
  {
    id: "srv-5",
    ip: "192.168.1.50",
    hostname: "srv-auth",
    os: "RHEL 9",
    type: "server",
    status: "offline", // <--- Celui-ci est éteint pour l'exemple
    uptime: "0m",
    specs: { cpu: "2 vCPU", ram: "4 GB", disk: "80 GB" },
    services: ["LDAP", "Keycloak"],
    lastSeen: "2026-01-27T14:30:00Z",
    ports: [
      { port: 389, protocol: "tcp", serviceName: "ldap", status: "closed" },
    ],
  },

  // --- LAYER 5: WORKSTATIONS ---
  {
    id: "pc-1",
    ip: "192.168.1.101",
    hostname: "bureau-rh",
    os: "Windows 11 Pro",
    type: "workstation",
    status: "online",
    uptime: "3h 45m",
    specs: { cpu: "i5-12400", ram: "16 GB", disk: "512 GB SSD" },
    services: ["Defender", "Office 365"],
    lastSeen: "2026-01-28T09:00:00Z",
    ports: [],
  },
  {
    id: "pc-2",
    ip: "192.168.1.102",
    hostname: "bureau-compta",
    os: "Windows 11 Pro",
    type: "workstation",
    status: "online",
    uptime: "4h 10m",
    specs: { cpu: "i7-12700", ram: "32 GB", disk: "1 TB SSD" },
    services: ["Sage", "Defender"],
    lastSeen: "2026-01-28T08:30:00Z",
    ports: [],
  },
  {
    id: "pc-3",
    ip: "192.168.1.103",
    hostname: "dev-laptop",
    os: "macOS Sonoma",
    type: "workstation",
    status: "online",
    uptime: "12j 01h",
    specs: { cpu: "M3 Pro", ram: "36 GB", disk: "1 TB" },
    services: ["Docker", "Xcode"],
    lastSeen: "2026-01-28T10:00:00Z",
    ports: [],
  },
  {
    id: "prt-1",
    ip: "192.168.1.200",
    hostname: "printer-main",
    os: "Ricoh FW v4.2",
    type: "workstation",
    status: "warning", // <--- Plus de toner !
    uptime: "300j",
    specs: { cpu: "Embedded", ram: "512 MB", disk: "N/A" },
    services: ["IPP", "AirPrint"],
    lastSeen: "2026-01-28T08:00:00Z",
    ports: [{ port: 631, protocol: "tcp", serviceName: "ipp", status: "open" }],
  },
];