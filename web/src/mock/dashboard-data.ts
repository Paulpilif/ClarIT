// Données enrichies pour le Dashboard et l'Inventaire
export interface HostData {
  id: string;
  name: string;
  type: 'firewall' | 'router' | 'switch' | 'server' | 'workstation';
  ip: string;
  firstSeen: string; // ISO date
  lastSeen: string; // ISO date
  status: 'online' | 'offline';
  ports: number[];
  services: string[];
  created_at: string; // ISO date
}

export const enrichedHosts: HostData[] = [
  {
    id: 'fw-001',
    name: 'Firewall-Principal',
    type: 'firewall',
    ip: '192.168.1.1',
    firstSeen: '2024-06-15T10:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [443, 22, 80],
    services: ['SSH', 'HTTPS', 'HTTP'],
    created_at: '2024-06-15T10:00:00Z',
  },
  {
    id: 'rt-001',
    name: 'Router-Core',
    type: 'router',
    ip: '192.168.1.2',
    firstSeen: '2024-06-15T11:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [22, 161],
    services: ['SSH', 'SNMP'],
    created_at: '2024-06-15T11:00:00Z',
  },
  {
    id: 'sw-001',
    name: 'Switch-Distribution',
    type: 'switch',
    ip: '192.168.1.3',
    firstSeen: '2024-06-15T12:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [22, 161],
    services: ['SSH', 'SNMP'],
    created_at: '2024-06-15T12:00:00Z',
  },
  {
    id: 'srv-001',
    name: 'WebServer-01',
    type: 'server',
    ip: '192.168.1.100',
    firstSeen: '2024-08-10T10:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [80, 443, 22, 3306],
    services: ['HTTP', 'HTTPS', 'SSH', 'MySQL'],
    created_at: '2024-08-10T10:00:00Z',
  },
  {
    id: 'srv-002',
    name: 'DatabaseServer-01',
    type: 'server',
    ip: '192.168.1.101',
    firstSeen: '2024-07-20T10:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [5432, 22],
    services: ['PostgreSQL', 'SSH'],
    created_at: '2024-07-20T10:00:00Z',
  },
  {
    id: 'ws-001',
    name: 'Workstation-Dev',
    type: 'workstation',
    ip: '192.168.1.150',
    firstSeen: '2024-09-01T10:00:00Z',
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [22, 3389],
    services: ['SSH', 'RDP'],
    created_at: '2024-09-01T10:00:00Z',
  },
  {
    id: 'srv-003',
    name: 'AppServer-New',
    type: 'server',
    ip: '192.168.1.102',
    firstSeen: '2025-12-15T14:00:00Z', // Machine créée ce mois-ci
    lastSeen: '2026-01-30T14:00:00Z',
    status: 'online',
    ports: [8080, 22],
    services: ['Node.js', 'SSH'],
    created_at: '2025-12-15T14:00:00Z',
  },
  {
    id: 'srv-004',
    name: 'LegacyServer',
    type: 'server',
    ip: '192.168.1.103',
    firstSeen: '2024-01-10T10:00:00Z',
    lastSeen: '2025-12-20T10:00:00Z', // Pas vu depuis plus d'un mois
    status: 'offline',
    ports: [80, 22],
    services: ['HTTP', 'SSH'],
    created_at: '2024-01-10T10:00:00Z',
  },
];

// Utilitaires pour les KPIs du Dashboard
export function getNewHorizonCount(): { current: number; previous: number } {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const currentCount = enrichedHosts.filter((h) => {
    const created = new Date(h.created_at);
    return created >= currentMonth;
  }).length;

  const previousCount = enrichedHosts.filter((h) => {
    const created = new Date(h.created_at);
    return created >= previousMonth && created < currentMonth;
  }).length;

  return { current: currentCount, previous: previousCount };
}

export function getGhostVesselsCount(): number {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  return enrichedHosts.filter((h) => {
    const lastSeen = new Date(h.lastSeen);
    return lastSeen < thirtyDaysAgo;
  }).length;
}

export function getTotalFleetCount(): number {
  return enrichedHosts.filter((h) => h.status === 'online').length;
}
