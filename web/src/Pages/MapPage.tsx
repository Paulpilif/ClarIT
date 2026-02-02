import { useState, useEffect } from "react";
import ReactFlow, {
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  Controls,
} from "reactflow";
import "reactflow/dist/style.css";
import InfraNode from "../Components/InfraNode";
import NodeDetailCard from "../Components/NodeDetailsCard";
import MachineDetailPanel from "../Components/MachineDetailPanel";
import type { HostData } from "../mock/hosts";
import { Zap, CheckCircle, RotateCcw, X } from "lucide-react";
import { useAppStore } from "../contexts/AppStore";

const nodeTypes = { infra: InfraNode };

const GRAPH_JSON_URL = import.meta.env.VITE_GRAPH_JSON_URL || "";
const GRAPH_API_BASE_URL =
  import.meta.env.VITE_GRAPH_API_URL || "http://localhost:8080/api/v1";

type SketchRole =
  | "SECURITY_GATEWAY"
  | "ROUTER"
  | "SWITCH"
  | "SERVER"
  | "WORKSTATION";

const LAYERS_Y: Record<SketchRole, number> = {
  SECURITY_GATEWAY: 100,
  ROUTER: 250,
  SWITCH: 400,
  SERVER: 550,
  WORKSTATION: 700,
};

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

type InfraNodeData = HostData & { role: SketchRole };

function getRole(host: GraphNode): SketchRole {
  const type = host.type?.toLowerCase();
  if (type === "firewall" || type === "gateway") return "SECURITY_GATEWAY";
  if (type === "router") return "ROUTER";
  if (type === "switch") return "SWITCH";
  if (type === "workstation" || type === "pc") return "WORKSTATION";
  return "SERVER";
}

function toHostType(type?: string) {
  const normalized = type?.toLowerCase();
  if (normalized === "firewall" || normalized === "gateway") return "firewall";
  if (normalized === "router") return "router";
  if (normalized === "switch") return "switch";
  if (normalized === "workstation" || normalized === "pc") return "workstation";
  return "server";
}

function mapGraphToFlow(graph: NetworkGraph) {
  const roleBuckets: Record<SketchRole, GraphNode[]> = {
    SECURITY_GATEWAY: [],
    ROUTER: [],
    SWITCH: [],
    SERVER: [],
    WORKSTATION: [],
  };

  graph.nodes.forEach((node) => {
    roleBuckets[getRole(node)].push(node);
  });

  const rolePositions = new Map<string, { index: number; total: number }>();
  (Object.keys(roleBuckets) as SketchRole[]).forEach((role) => {
    roleBuckets[role].forEach((node, index) => {
      rolePositions.set(node.id, { index, total: roleBuckets[role].length });
    });
  });

  const centerX = 600;
  const horizontalGap = 200;

  const nodes: Node[] = graph.nodes.map((node) => {
    const role = getRole(node);
    const position = rolePositions.get(node.id) ?? { index: 0, total: 1 };
    const xPos =
      centerX + (position.index - (position.total - 1) / 2) * horizontalGap;

    const services = node.services ?? [];
    const mappedServices = services.map((s) => s.name);
    const mappedPorts = services.map((s) => ({
      port: s.port,
      protocol: s.protocol,
      serviceName: s.name,
      status: "open",
    }));

    const risk = node.risk?.toLowerCase();
    const status =
      risk === "vulnerable" || risk === "obsolete" ? "warning" : "online";

    const data = {
      id: node.id,
      ip: node.ip,
      hostname: node.hostname || node.ip,
      os: node.type ? node.type.toUpperCase() : "N/A",
      type: toHostType(node.type),
      status,
      uptime: "N/A",
      specs: { cpu: "N/A", ram: "N/A", disk: "N/A" },
      services: mappedServices,
      lastSeen: new Date().toISOString(),
      ports: mappedPorts,
      role,
    };

    return {
      id: node.id,
      type: "infra",
      position: { x: xPos, y: LAYERS_Y[role] ?? LAYERS_Y.SERVER },
      data,
    };
  });

  const edges: Edge[] = graph.links.map((link, index) => ({
    id: `e-${link.source}-${link.target}-${index}`,
    source: link.source,
    target: link.target,
    animated: true,
    style: { stroke: "#3b82f6", strokeWidth: 1.5 },
  }));

  return { nodes, edges };
}

export default function MapPage() {
  const {
    scan_data_status,
    last_scan_target,
    scan_target_prompt_requested,
    set_scan_target_prompt_requested,
    launch_scan,
    is_scanning,
    subscription_tier,
    is_subscription_loading,
  } = useAppStore();

  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showIPModal, setShowIPModal] = useState(false);
  const [scanIP, setScanIP] = useState("");
  const [ipError, setIpError] = useState("");
  const [scanError, setScanError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<InfraNodeData>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [premiumGraphAvailable, setPremiumGraphAvailable] = useState(false);

  // AJOUT 2 : État pour gérer le clic (Sélection) vs le survol (Hover)
  const [selectedNode, setSelectedNode] = useState<InfraNodeData | null>(null);
  const [hoveredNode, setHoveredNode] = useState<InfraNodeData | null>(null);
  const shouldShowIPModal = showIPModal || scan_target_prompt_requested;

  // Effet pour masquer le message après 3 secondes
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

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
        setNodes([]);
        setEdges([]);
        setScanError(null);
        setPremiumGraphAvailable(false);
        return;
      }

      try {
        setScanError(null);
        const response = await fetch(resolveGraphUrl());
        if (!response.ok) {
          throw new Error(`Graph fetch failed: ${response.status}`);
        }
        const graphData = (await response.json()) as NetworkGraph;
        const flowData = mapGraphToFlow(graphData);
        if (cancelled) return;
        setNodes(flowData.nodes as Node<InfraNodeData>[]);
        setEdges(flowData.edges);
        setPremiumGraphAvailable(graphData.nodes.length > 0);
      } catch (error) {
        console.error("Graph load error:", error);
        if (!cancelled) {
          setScanError(
            "Impossible de charger la cartographie. Vérifiez que l'API est démarrée.",
          );
          setPremiumGraphAvailable(false);
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [
    scan_data_status,
    last_scan_target,
    showSuccessMessage,
    subscription_tier,
    setEdges,
    setNodes,
  ]);

  const handleStartScan = () => {
    setShowIPModal(true);
    setScanIP(last_scan_target ?? "");
    setIpError("");
    set_scan_target_prompt_requested(false);
  };

  const validateIP = (ip: string): boolean => {
    const ipv4 =
      /^(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
    const ipv6 = /^(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    const cidr = /\/(?:[0-9]|[1-2]\d|3[0-2])$/;
    const [address, mask] = ip.split("/");
    if (!address) return false;
    const isValidAddress = ipv4.test(address) || ipv6.test(address);
    if (!isValidAddress) return false;
    if (mask === undefined) return true;
    return cidr.test(`/${mask}`);
  };

  const handleConfirmScan = async () => {
    const target = scanIP.trim() || last_scan_target?.trim() || "";

    if (!target) {
      setIpError("Veuillez entrer une adresse IP");
      return;
    }

    if (!validateIP(target)) {
      setIpError(
        "Adresse IP invalide. Utilisez IPv4 (ex: 192.168.1.0) ou IPv6",
      );
      return;
    }

    setIpError("");
    setShowIPModal(false);
    set_scan_target_prompt_requested(false);

    const result = await launch_scan(target);
    if (result === "success") {
      setShowSuccessMessage(true);
    } else if (result === "error") {
      setScanError(
        "Impossible de lancer le scan. Vérifiez que le service est démarré sur :8090.",
      );
    }
  };

  const handleCancelScan = () => {
    setShowIPModal(false);
    setScanIP("");
    setIpError("");
    set_scan_target_prompt_requested(false);
  };

  const handleRestartScan = () => {
    setShowIPModal(true);
    setScanIP(last_scan_target ?? "");
    setIpError("");
    set_scan_target_prompt_requested(false);
  };

  const handleConfirmRestartScan = async () => {
    const target = scanIP.trim() || last_scan_target?.trim() || "";

    if (!target) {
      setIpError("Veuillez entrer une adresse IP");
      return;
    }

    if (!validateIP(target)) {
      setIpError(
        "Adresse IP invalide. Utilisez IPv4 (ex: 192.168.1.0) ou IPv6",
      );
      return;
    }

    setIpError("");
    setShowIPModal(false);
    setShowSuccessMessage(false);
    set_scan_target_prompt_requested(false);

    const result = await launch_scan(target);
    if (result === "success") {
      setShowSuccessMessage(true);
    } else if (result === "error") {
      setScanError(
        "Impossible de lancer le scan. Vérifiez que le service est démarré sur :8090.",
      );
    }
  };
  // AJOUT 3 : Gestionnaire de clic sur un nœud
  const onNodeClick = (_: React.MouseEvent, node: Node<InfraNodeData>) => {
    setSelectedNode(node.data); // Ouvre le panneau
    setHoveredNode(null); // Cache l'infobulle pour ne pas gêner
  };

  // AJOUT 4 : Gestionnaire de clic dans le vide (pour fermer le panneau)
  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const onNodeMouseEnter = (_: React.MouseEvent, node: Node<InfraNodeData>) => {
    // On affiche l'infobulle seulement si le panneau n'est pas ouvert
    if (!selectedNode) {
      setHoveredNode(node.data);
    }
  };

  const onNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  const canShowGraph = scan_data_status === "valid" || premiumGraphAvailable;
  const shouldShowScanPrompt = !canShowGraph && !is_subscription_loading;
  const shouldShowAccessLoading =
    is_subscription_loading && scan_data_status !== "valid";

  return (
    <div className="h-full w-full bg-[#FAF0E6] p-4 md:p-6 text-[#2F2F2F] flex flex-col">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        Architecture Réseau
      </h1>

      {shouldShowAccessLoading ? (
        <div className="flex items-center justify-center flex-1">
          <div className="bg-white p-8 md:p-12 rounded-xl border border-[#4A403A] text-center max-w-md shadow-lg text-[#6B6B6B]">
            Vérification de votre accès premium...
          </div>
        </div>
      ) : shouldShowScanPrompt ? (
        <div className="flex items-center justify-center flex-1">
          <div className="bg-white p-8 md:p-12 rounded-xl border border-[#4A403A] text-center max-w-md shadow-lg">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4 ring-1 ring-blue-300">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-3 text-[#2F2F2F]">
              Lancer un scan réseau
            </h2>
            <p className="text-[#6B6B6B] text-sm mb-6">
              Analysez votre infrastructure pour visualiser la cartographie
              complète de votre réseau.
            </p>
            <button
              onClick={handleStartScan}
              disabled={is_scanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              {is_scanning ? "Scan en cours..." : "Lancer le scan"}
            </button>
            {scanError && (
              <p className="mt-4 text-sm text-red-400">{scanError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-4">
          {showSuccessMessage && (
            <div className="p-3 bg-green-100 border border-green-300 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-in fade-in">
              <CheckCircle size={18} />
              Scan terminé - Architecture réseau cartographiée
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0">
            <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl overflow-hidden bg-white border border-[#4A403A] relative shadow-inner">
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                onNodeMouseEnter={onNodeMouseEnter}
                onNodeMouseLeave={onNodeMouseLeave}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                panOnScroll={window.innerWidth >= 1024}
              >
                <Background color="#E8E4DC" gap={30} size={1} />
                <Controls className="bg-[#FAF0E6] border-[#4A403A] fill-[#2F2F2F]" />
              </ReactFlow>

              {hoveredNode && !selectedNode && (
                <NodeDetailCard node={hoveredNode} />
              )}
            </div>

            <div className="w-full lg:w-52 p-4 bg-white rounded-xl border border-[#4A403A] h-fit shadow-lg">
              <h3 className="font-bold mb-4 text-[#2F2F2F]">Légende</h3>

              <div className="grid grid-cols-2 gap-3 text-sm text-[#6B6B6B] lg:flex lg:flex-col mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />{" "}
                  Gateway
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />{" "}
                  Router
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />{" "}
                  Switch
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />{" "}
                  Server
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#8B7355] shadow-[0_0_8px_rgba(139,115,85,0.6)]" />{" "}
                  Workstation
                </div>
              </div>

              <button
                onClick={handleRestartScan}
                disabled={is_scanning}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-500 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <RotateCcw size={16} />
                {is_scanning ? "Scan en cours..." : "Relancer un scan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour demander l'IP */}
      {shouldShowIPModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#2F2F2F]">
                Adresse IP du réseau
              </h2>
              <button
                onClick={handleCancelScan}
                className="text-[#6B6B6B] hover:text-[#2F2F2F]"
              >
                <X size={24} />
              </button>
            </div>

            <p className="text-[#6B6B6B] text-sm mb-4">
              Entrez l'adresse IP du réseau que vous souhaitez scanner
            </p>

            <div className="mb-4">
              <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">
                Adresse IP
              </label>
              <input
                type="text"
                value={scanIP || last_scan_target || ""}
                onChange={(e) => {
                  setScanIP(e.target.value);
                  setIpError("");
                }}
                placeholder="ex: 192.168.1.0 ou 2001:db8::1"
                className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none text-[#2F2F2F]"
              />
              {ipError && (
                <p className="text-red-600 text-sm mt-2">{ipError}</p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelScan}
                className="flex-1 px-4 py-2 border border-[#D0CACA] rounded-lg text-[#2F2F2F] font-medium hover:bg-[#FAF0E6] transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={
                  scan_data_status === "valid"
                    ? handleConfirmRestartScan
                    : handleConfirmScan
                }
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Lancer le scan
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedNode && (
        <MachineDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
