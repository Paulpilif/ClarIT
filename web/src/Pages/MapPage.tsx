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
// On retire useNavigate s'il n'est pas utilisé, sinon garde-le
import { mockHosts } from "../mock/hosts";
import InfraNode from "../Components/InfraNode";
import NodeDetailCard from "../Components/NodeDetailsCard"; 

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
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  const onNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
    setHoveredNode(node.data);
  };

  const onNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    const gateway = nodes.find(n => n.data.role === "SECURITY_GATEWAY");
    const router = nodes.find(n => n.data.role === "ROUTER");
    const sw = nodes.find(n => n.data.role === "SWITCH");

    // COULEURS DES LIGNES (EDGES) : Éclaircies pour le fond sombre
    // stroke: '#64748b' (Slate-500) est assez visible mais discret
    
    if (gateway && router) {
      edges.push({ id: 'e-gw-rt', source: gateway.id, target: router.id, style: { stroke: '#64748b', strokeDasharray: '5,5' } });
    }
    if (router && sw) {
      edges.push({ id: 'e-rt-sw', source: router.id, target: sw.id, style: { stroke: '#64748b', strokeDasharray: '5,5' } });
    }
    nodes.forEach(node => {
      if (sw && (node.data.role === "SERVER" || node.data.role === "WORKSTATION")) {
        edges.push({
          id: `e-sw-${node.id}`,
          source: sw.id,
          target: node.id,
          style: { stroke: '#475569', strokeWidth: 1.5 }, // Ligne continue plus sombre pour les liens finaux
        });
      }
    });

    return edges;
  }, [nodes]);

  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    // Fond global sombre
    <div className="h-full w-full bg-[#020617] p-6 text-white flex flex-col">
      <h1 className="text-2xl font-bold mb-6">Architecture Réseau</h1>
      
      <div className="flex gap-6 flex-1 min-h-0">
        {/* Zone de la carte : Fond Slate-900 pour contraster légèrement */}
        <div className="flex-1 rounded-xl overflow-hidden bg-[#0f172a] border border-slate-800 relative shadow-inner">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={onNodeMouseLeave}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            {/* Grille : points gris foncé discrets */}
            <Background color="#334155" gap={30} size={1} />
            <Controls className="bg-slate-800 border-slate-700 fill-white" />
          </ReactFlow>
          
          {hoveredNode && <NodeDetailCard node={hoveredNode} />}
        </div>

        {/* Légende */}
        <div className="w-52 p-4 bg-[#0f172a] rounded-xl border border-slate-800 h-fit shadow-lg">
          <h3 className="font-bold mb-4 text-slate-200">Légende</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-400">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"/> Gateway</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"/> Router</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"/> Switch</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"/> Server</div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.6)]"/> Workstation</div>
          </div>
        </div>
      </div>
    </div>
  );
}