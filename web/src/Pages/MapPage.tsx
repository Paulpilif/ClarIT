import { useEffect, useState } from "react";
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
import { Zap, CheckCircle } from "lucide-react";
import MachineDetailPanel from "../Components/MachineDetailPanel";

const nodeTypes = { infra: InfraNode };

const DEFAULT_CIDR = "10.211.55.0/24";
const SCANNER_BASE_URL =
  import.meta.env.VITE_SCANNER_BASE_URL || "http://localhost:8090";
const GRAPH_JSON_URL =
  import.meta.env.VITE_GRAPH_JSON_URL || "/shared/network_graph_1.json";

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
  const [scanStarted, setScanStarted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // AJOUT 2 : État pour gérer le clic (Sélection) vs le survol (Hover)
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadGraph = async () => {
      try {
        const response = await fetch(GRAPH_JSON_URL, { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Impossible de charger network_graph_1.json");
        }

        const graph = (await response.json()) as NetworkGraph;
        const { nodes: flowNodes, edges: flowEdges } = mapGraphToFlow(graph);

        if (isMounted) {
          setNodes(flowNodes);
          setEdges(flowEdges);
          setScanStarted(true);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Erreur lors du chargement";
        if (isMounted) {
          setScanError(message);
        }
      }
    };

    loadGraph();

    return () => {
      isMounted = false;
    };
  }, [setNodes, setEdges]);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch(`${SCANNER_BASE_URL}/scan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cidr: DEFAULT_CIDR, save: true }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Erreur lors du scan");
      }

      const data = (await response.json()) as { graph?: NetworkGraph };
      const graph = data.graph ?? (data as unknown as NetworkGraph);
      const { nodes: flowNodes, edges: flowEdges } = mapGraphToFlow(graph);
      setNodes(flowNodes);
      setEdges(flowEdges);
      setScanStarted(true);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du scan";
      setScanError(message);
    } finally {
      setIsScanning(false);
    }
  };
  // AJOUT 3 : Gestionnaire de clic sur un nœud
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data); // Ouvre le panneau
    setHoveredNode(null); // Cache l'infobulle pour ne pas gêner
  };

  // AJOUT 4 : Gestionnaire de clic dans le vide (pour fermer le panneau)
  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const onNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
    // On affiche l'infobulle seulement si le panneau n'est pas ouvert
    if (!selectedNode) {
      setHoveredNode(node.data);
    }
  };

  const onNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div className="h-full w-full bg-[#020617] p-4 md:p-6 text-white flex flex-col relative overflow-hidden">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">
        Architecture Réseau
      </h1>

      {!scanStarted ? (
        <div className="flex items-center justify-center flex-1">
          <div className="bg-[#0f172a] p-8 md:p-12 rounded-xl border border-slate-800 text-center max-w-md shadow-lg">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4 ring-1 ring-blue-500/30">
                <Zap className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            <h2 className="text-xl font-bold mb-3">Lancer un scan réseau</h2>
            <p className="text-slate-400 text-sm mb-6">
              Analysez votre infrastructure pour visualiser la cartographie
              complète de votre réseau.
            </p>
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              {isScanning ? "Scan en cours..." : "Lancer le scan"}
            </button>
            {scanError && (
              <p className="mt-4 text-sm text-red-400">{scanError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-4">
          <div className="p-3 bg-emerald-900/20 border border-emerald-900/30 rounded-lg flex items-center gap-2 text-emerald-400 text-sm">
            <CheckCircle size={18} />
            Scan terminé - Architecture réseau cartographiée
          </div>

          <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0">
            <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl overflow-hidden bg-[#0f172a] border border-slate-800 relative shadow-inner">
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
                <Background color="#334155" gap={30} size={1} />
                <Controls className="bg-slate-800 border-slate-700 fill-white" />
              </ReactFlow>

              {hoveredNode && !selectedNode && (
                <NodeDetailCard node={hoveredNode} />
              )}
            </div>

            <div className="w-full lg:w-52 p-4 bg-[#0f172a] rounded-xl border border-slate-800 h-fit shadow-lg">
              <h3 className="font-bold mb-4 text-slate-200">Légende</h3>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 lg:flex lg:flex-col">
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
                  <div className="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]" />{" "}
                  Workstation
                </div>
              </div>
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
