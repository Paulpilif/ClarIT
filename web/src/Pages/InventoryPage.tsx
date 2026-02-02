import { useEffect, useState } from "react";
import { useAppStore } from "../contexts/AppStore";
import DataSyncEmptyState from "../Components/DataSyncEmptyState";
import PaywallUpgrade from "../Components/PaywallUpgrade";

const GRAPH_JSON_URL = import.meta.env.VITE_GRAPH_JSON_URL || "";
const GRAPH_API_BASE_URL =
  import.meta.env.VITE_GRAPH_API_URL || "http://localhost:8080/api/v1";

type GraphService = {
  port: number;
  protocol: string;
  name: string;
  version?: string;
};

type GraphNode = {
  id: string;
  ip: string;
  hostname: string;
  type: string;
  services?: GraphService[];
  risk?: string;
  status?: string;
  created_at?: number;
  last_seen?: number;
};

type GraphLink = {
  source: string;
  target: string;
  type: string;
};

type NetworkGraph = {
  nodes: GraphNode[];
  links: GraphLink[];
};

type InventoryHost = {
  id: string;
  name: string;
  type: "firewall" | "router" | "switch" | "server" | "workstation";
  ip: string;
  firstSeen: string;
  lastSeen: string;
  status: "online" | "offline" | "missing";
  ports: number[];
  services: string[];
  created_at: string;
};

function toHostType(type?: string) {
  const normalized = type?.toLowerCase();
  if (normalized === "firewall" || normalized === "gateway") return "firewall";
  if (normalized === "router") return "router";
  if (normalized === "switch") return "switch";
  if (normalized === "workstation" || normalized === "pc") return "workstation";
  return "server";
}

function mapGraphToInventory(graph: NetworkGraph): InventoryHost[] {
  const toIsoFromTimestamp = (value?: number) => {
    if (!value) return new Date().toISOString();
    const millis = value > 1_000_000_000_000 ? value : value * 1000;
    return new Date(millis).toISOString();
  };

  return graph.nodes.map((node) => {
    const services = node.services ?? [];
    const mappedServices = services
      .map((s) => s.name)
      .filter((name) => name && name.trim().length > 0);
    const mappedPorts = Array.from(
      new Set(services.map((s) => s.port).filter((p) => Number.isFinite(p))),
    ) as number[];
    const statusValue = node.status?.toLowerCase() || node.risk?.toLowerCase();
    const status: InventoryHost["status"] =
      statusValue === "online" || statusValue === "up"
        ? "online"
        : statusValue === "missing"
          ? "missing"
          : "offline";
    const createdAtIso = toIsoFromTimestamp(node.created_at);
    const lastSeenIso = node.last_seen
      ? toIsoFromTimestamp(node.last_seen)
      : createdAtIso;

    return {
      id: node.id,
      name: node.hostname || node.ip,
      type: toHostType(node.type),
      ip: node.ip,
      firstSeen: createdAtIso,
      lastSeen: lastSeenIso,
      status,
      ports: mappedPorts,
      services: mappedServices,
      created_at: createdAtIso,
    };
  });
}

export default function InventoryPage() {
  const {
    subscription_tier,
    scan_data_status,
    last_scan_target,
    is_subscription_loading,
  } = useAppStore();
  const [inventoryHosts, setInventoryHosts] = useState<InventoryHost[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [premiumGraphAvailable, setPremiumGraphAvailable] = useState(false);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  useEffect(() => {
    let cancelled = false;

    const sanitizeCidr = (cidr: string) => cidr.replace(/\//g, "_");

    const resolveGraphUrl = () => {
      if (GRAPH_JSON_URL) return GRAPH_JSON_URL;
      const companyName = localStorage.getItem("currentUser");
      const cidr = last_scan_target?.trim();

      if (subscription_tier === "navigateur" && companyName) {
        return `${GRAPH_API_BASE_URL}/graph/company/${encodeURIComponent(companyName)}`;
      }

      if (companyName && cidr) {
        const safeCidr = sanitizeCidr(cidr);
        return `/shared/${encodeURIComponent(companyName)}/scan_${encodeURIComponent(safeCidr)}.json`;
      }

      if (companyName) {
        return `${GRAPH_API_BASE_URL}/graph/company/${encodeURIComponent(companyName)}`;
      }

      return `${GRAPH_API_BASE_URL}/graph`;
    };

    const loadGraph = async () => {
      if (scan_data_status !== "valid" && subscription_tier !== "navigateur") {
        setInventoryHosts([]);
        setLoadError(null);
        setPremiumGraphAvailable(false);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch(resolveGraphUrl());
        if (!response.ok) {
          throw new Error(`Graph fetch failed: ${response.status}`);
        }
        const graphData = (await response.json()) as NetworkGraph;
        const mapped = mapGraphToInventory(graphData);
        if (!cancelled) {
          setInventoryHosts(mapped);
          setPremiumGraphAvailable(mapped.length > 0);
        }
      } catch (error) {
        console.error("Inventory load error:", error);
        if (!cancelled) {
          setLoadError(
            "Impossible de charger l'inventaire. Vérifiez que l'API est démarrée.",
          );
          setInventoryHosts([]);
          setPremiumGraphAvailable(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [scan_data_status, subscription_tier, last_scan_target]);

  const hasPremiumAccess = subscription_tier === "navigateur";
  const canShowInventory =
    scan_data_status === "valid" || premiumGraphAvailable;
  const shouldPromptScan = !canShowInventory && !is_subscription_loading;
  const shouldShowAccessLoading =
    subscription_tier === "eclaireur" && is_subscription_loading;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-[#2F2F2F] mb-2">
          Inventaire de la Flotte
        </h1>
        <p className="text-[#6E7681] text-lg">
          Vue détaillée de toutes les machines de votre parc
        </p>
      </header>

      {shouldShowAccessLoading ? (
        <div className="rounded-lg border border-[#2F2F2F]/10 bg-[#FAF0E6]/40 px-4 py-6 text-[#6E7681]">
          Vérification de votre accès premium...
        </div>
      ) : !hasPremiumAccess ? (
        <PaywallUpgrade
          title="Inventaire réservé au plan Navigateur"
          description="Passez au plan Navigateur pour accéder à l'inventaire détaillé."
        />
      ) : shouldPromptScan ? (
        <DataSyncEmptyState
          title="Données non synchronisées"
          description="Veuillez lancer un scan pour accéder à l'inventaire des machines."
        />
      ) : (
        <>
          {loadError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
              {loadError}
            </div>
          )}

          {isLoading && (
            <div className="mb-6 rounded-lg border border-[#2F2F2F]/10 bg-[#FAF0E6]/40 px-4 py-3 text-[#6E7681]">
              Chargement de l'inventaire...
            </div>
          )}

          {/* Inventory Table */}
          <div className="overflow-x-auto bg-white rounded-xl border-2 border-[#2F2F2F]">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-[#2F2F2F] bg-[#FAF0E6]">
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    Nom de la Machine
                  </th>
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    1ère Apparition
                  </th>
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    Dernière Observation
                  </th>
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    Ports Ouverts
                  </th>
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    Services
                  </th>
                  <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                    État
                  </th>
                </tr>
              </thead>
              <tbody>
                {inventoryHosts.map((host, idx) => (
                  <tr
                    key={host.id}
                    className={`border-b border-[#2F2F2F]/10 hover:bg-[#FAF0E6]/50 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-[#FAF0E6]/20"
                    }`}
                  >
                    <td className="px-6 py-4 text-[#2F2F2F] font-semibold">
                      <div>
                        <p>{host.name}</p>
                        <p className="text-xs text-[#6E7681] mt-1">{host.ip}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#6E7681] text-sm">
                      {formatDate(host.firstSeen)}
                    </td>
                    <td className="px-6 py-4 text-[#6E7681] text-sm">
                      {formatDate(host.lastSeen)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {host.ports.length > 0 ? (
                          host.ports.slice(0, 3).map((port) => (
                            <span
                              key={port}
                              className="inline-block bg-[#2F2F2F] text-white text-xs px-2 py-1 rounded"
                            >
                              {port}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#6E7681] text-sm">Aucun</span>
                        )}
                        {host.ports.length > 3 && (
                          <span className="text-[#6E7681] text-sm">
                            +{host.ports.length - 3} autres
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {host.services.length > 0 ? (
                          host.services.slice(0, 2).map((service) => (
                            <span
                              key={service}
                              className="inline-block bg-[#FAF0E6] text-[#2F2F2F] text-xs px-2 py-1 rounded border border-[#2F2F2F]/20"
                            >
                              {service}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#6E7681] text-sm">Aucun</span>
                        )}
                        {host.services.length > 2 && (
                          <span className="text-[#6E7681] text-sm">
                            +{host.services.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-medium text-sm ${
                          host.status === "online"
                            ? "bg-green-100 text-green-800"
                            : host.status === "missing"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                        }`}
                      >
                        {host.status === "online"
                          ? "✓ En ligne"
                          : host.status === "missing"
                            ? "⚠ Manquante"
                            : "✗ Hors ligne"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
              <p className="text-[#4A403A] text-sm font-semibold uppercase">
                Total des Machines
              </p>
              <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
                {inventoryHosts.length}
              </p>
            </div>

            <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
              <p className="text-[#4A403A] text-sm font-semibold uppercase">
                En Ligne
              </p>
              <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
                {inventoryHosts.filter((h) => h.status === "online").length}
              </p>
            </div>

            <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
              <p className="text-[#4A403A] text-sm font-semibold uppercase">
                Hors Ligne
              </p>
              <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
                {inventoryHosts.filter((h) => h.status === "offline").length}
              </p>
            </div>

            <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
              <p className="text-[#4A403A] text-sm font-semibold uppercase">
                Manquantes
              </p>
              <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
                {inventoryHosts.filter((h) => h.status === "missing").length}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
