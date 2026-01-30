import { useState, useMemo } from "react";
import ReactFlow, { 
  Background, 
  useNodesState, 
  useEdgesState, 
  type Node, 
  type Edge, 
  Controls
} from "reactflow";
import "reactflow/dist/style.css";
import { mockHosts } from "../mock/hosts";
import InfraNode from "../Components/InfraNode";
import NodeDetailCard from "../Components/NodeDetailsCard";
import { Zap, CheckCircle } from "lucide-react";
import NodeDetailCard from "../Components/NodeDetailsCard"; 
// AJOUT 1 : Import du nouveau panneau latéral
import MachineDetailPanel from "../Components/MachineDetailPanel";

const nodeTypes = { infra: InfraNode };

type SketchRole = "SECURITY_GATEWAY" | "ROUTER" | "SWITCH" | "SERVER" | "WORKSTATION";

const LAYERS_Y: Record<SketchRole, number> = {
  SECURITY_GATEWAY: 100,
  ROUTER: 250,
  SWITCH: 400,
  SERVER: 550,
  WORKSTATION: 700,
};

function getRole(host: any): SketchRole {
  const type = host.type?.toLowerCase();
  if (type === "firewall") return "SECURITY_GATEWAY";
  if (type === "router") return "ROUTER";
  if (type === "switch") return "SWITCH";
  if (type === "workstation") return "WORKSTATION";
  return "SERVER";
}

const initialNodes: Node[] = mockHosts.map((h) => {
  const role = getRole(h);
  const centerX = 600;
  const horizontalGap = 200;
  const peers = mockHosts.filter(host => getRole(host) === role);
  const index = peers.findIndex(host => host.id === h.id);
  const total = peers.length;
  const xPos = centerX + (index - (total - 1) / 2) * horizontalGap;

  return {
    id: h.id,
    type: "infra",
    position: { x: xPos, y: LAYERS_Y[role] },
    data: { ...h, role: role },
  };
});

export default function MapPage() {
  const [scanStarted, setScanStarted] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  
  // AJOUT 2 : État pour gérer le clic (Sélection) vs le survol (Hover)
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [hoveredNode, setHoveredNode] = useState<any>(null);


  const handleStartScan = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setScanStarted(true);
    setIsScanning(false);
  };
  // AJOUT 3 : Gestionnaire de clic sur un nœud
  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data); // Ouvre le panneau
    setHoveredNode(null);       // Cache l'infobulle pour ne pas gêner
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

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const gateway = nodes.find(n => n.data.role === "SECURITY_GATEWAY");
    const router = nodes.find(n => n.data.role === "ROUTER");
    const sw = nodes.find(n => n.data.role === "SWITCH");

    const createLink = (source: string, target: string, color = '#3b82f6') => ({
      id: `e-${source}-${target}`,
      source,
      target,
      animated: true,
      style: { stroke: color, strokeWidth: 1.5 },
    });

    if (gateway && router) edges.push(createLink(gateway.id, router.id, '#ef4444'));
    if (router && sw) edges.push(createLink(router.id, sw.id, '#10b981'));

    nodes.forEach(node => {
      if (sw && (node.data.role === "SERVER" || node.data.role === "WORKSTATION")) {
        edges.push(createLink(sw.id, node.id, '#3b82f6'));
      }
    });

    return edges;
  }, [nodes]);

  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className="h-full w-full bg-[#020617] p-4 md:p-6 text-white flex flex-col">
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Architecture Réseau</h1>

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
              Analysez votre infrastructure pour visualiser la cartographie complète de votre réseau.
            </p>
            <button
              onClick={handleStartScan}
              disabled={isScanning}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
            >
              <Zap size={18} />
              {isScanning ? 'Scan en cours...' : 'Lancer le scan'}
            </button>
          </div>

    <div className="h-full w-full bg-[#020617] p-4 md:p-6 text-white flex flex-col relative overflow-hidden">
      
      <h1 className="text-xl md:text-2xl font-bold mb-4 md:mb-6">Architecture Réseau</h1>
      
      <div className="flex flex-col lg:flex-row gap-4 md:gap-6 flex-1 min-h-0">
        
        {/* Zone de la carte */}
        <div className="flex-1 min-h-[50vh] lg:min-h-0 rounded-xl overflow-hidden bg-[#0f172a] border border-slate-800 relative shadow-inner">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}         // <--- Déclenche l'ouverture du panneau
            onPaneClick={onPaneClick}         // <--- Déclenche la fermeture si clic dans le vide
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
          
          {/* L'infobulle ne s'affiche que si rien n'est sélectionné */}
          {hoveredNode && !selectedNode && <NodeDetailCard node={hoveredNode} />}
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

              {hoveredNode && <NodeDetailCard node={hoveredNode} />}
            </div>

            <div className="w-full lg:w-52 p-4 bg-[#0f172a] rounded-xl border border-slate-800 h-fit shadow-lg">
              <h3 className="font-bold mb-4 text-slate-200">Légende</h3>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 lg:flex lg:flex-col">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"/> Gateway</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/> Router</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"/> Switch</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"/> Server</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]"/> Workstation</div>
              </div>
            </div>
          </div>
        </div>
        {/* Légende */}
        <div className="w-full lg:w-52 p-4 bg-[#0f172a] rounded-xl border border-slate-800 h-fit shadow-lg">
          <h3 className="font-bold mb-4 text-slate-200">Légende</h3>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-400 lg:flex lg:flex-col">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"/> Gateway</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/> Router</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"/> Switch</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"/> Server</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]"/> Workstation</div>
          </div>
        </div>
      </div>

      {/* AJOUT 5 : Le panneau coulissant s'affiche ici si un nœud est sélectionné */}
      {selectedNode && (
        <MachineDetailPanel 
          node={selectedNode} 
          onClose={() => setSelectedNode(null)} 
        />
      )}
    </div>
  );
}
