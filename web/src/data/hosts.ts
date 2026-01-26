import { useEffect, useState } from "react";

export type HostPort = {
  port: number;
  protocol: string;
  serviceName: string;
  status?: string;
};

export type Host = {
  id: string;
  ip: string;
  hostname: string;
  os?: string;
  type?: string;
  services?: string[];
  lastSeen?: string | null;
  ports?: HostPort[];
};

type GraphService = {
  port: number;
  protocol: string;
  name?: string;
  version?: string;
};

type GraphNode = {
  id: string;
  ip: string;
  hostname?: string;
  type?: string;
  services?: GraphService[];
};

type GraphFile = {
  nodes?: GraphNode[];
};

const GRAPH_URL =
  import.meta.env.VITE_NETWORK_GRAPH_URL ?? "/shared/network_graph_1.json";

const normalizeHostname = (hostname?: string, ip?: string) => {
  if (hostname && hostname.trim().length > 0) {
    return hostname;
  }
  return ip ?? "inconnu";
};

const mapNodeToHost = (node: GraphNode): Host => {
  const ports = (node.services ?? []).map((service) => ({
    port: service.port,
    protocol: service.protocol,
    serviceName: service.name ?? "service",
    status: "open",
  }));

  const serviceNames = (node.services ?? [])
    .map((service) => service.name)
    .filter((name): name is string => Boolean(name));

  return {
    id: node.id,
    ip: node.ip,
    hostname: normalizeHostname(node.hostname, node.ip),
    os: "Inconnu",
    type: node.type ?? "server",
    services: Array.from(new Set(serviceNames)),
    lastSeen: null,
    ports,
  };
};

export async function fetchHosts(): Promise<Host[]> {
  const response = await fetch(GRAPH_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Impossible de charger ${GRAPH_URL}`);
  }
  const graph = (await response.json()) as GraphFile;
  const nodes = graph.nodes ?? [];
  return nodes.map(mapNodeToHost);
}

export function useHosts() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchHosts();
        if (!cancelled) {
          setHosts(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Erreur de chargement");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { hosts, loading, error };
}
