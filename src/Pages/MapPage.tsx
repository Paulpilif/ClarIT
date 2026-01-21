import { useCallback, useState, useMemo } from "react";
import ReactFlow, { 
  Background, 
  useNodesState, 
  useEdgesState, 
  type Node, 
  type Edge, 
  Controls
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";

import { mockHosts } from "../mock/hosts";
import InfraNode from "../Components/InfraNode";

const nodeTypes = { infra: InfraNode };

// On ne garde que les rôles du sketch
type SketchRole = "SECURITY_GATEWAY" | "ROUTER" | "SWITCH" | "SERVER" | "WORKSTATION";

const LAYERS_Y: Record<SketchRole, number> = {
  SECURITY_GATEWAY: 100,
  ROUTER: 250,
  SWITCH: 400,
  SERVER: 550,       // Tous les serveurs (Web, DB, Cache) alignés ici
  WORKSTATION: 700,  // Les PC en bas
};

// Fonction simplifiée : Tout ce qui n'est pas réseau ou PC devient un SERVER
function getRole(host: any): SketchRole {
  const type = host.type?.toLowerCase();

  if (type === "firewall") return "SECURITY_GATEWAY";
  if (type === "router") return "ROUTER";
  if (type === "switch") return "SWITCH";
  if (type === "workstation") return "WORKSTATION";
  
  // Par défaut, tout le reste (web, db, cache) est considéré comme un SERVER
  return "SERVER";
}

const initialNodes: Node[] = mockHosts.map((h) => {
  const role = getRole(h);
  
  // Calcul de la position Pyramidale
  const centerX = 600; 
  const horizontalGap = 200; 

  // On récupère tous les éléments qui ont EXACTEMENT le même rôle final
  const peers = mockHosts.filter(host => getRole(host) === role);
  const index = peers.findIndex(host => host.id === h.id);
  const total = peers.length;

  // Formule pour centrer le groupe horizontalement
  const xPos = centerX + (index - (total - 1) / 2) * horizontalGap;

  return {
    id: h.id,
    type: "infra",
    position: { x: xPos, y: LAYERS_Y[role] },
    data: {
      hostname: h.hostname,
      ip: h.ip,
      role: role, // On envoie le rôle simplifié (ex: "SERVER") au composant
    },
  };
});

export default function MapPage() {
  const navigate = useNavigate();
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  // Génération automatique des liens hiérarchiques
  const initialEdges: Edge[] = useMemo(() => {
    const edges: Edge[] = [];
    
    // On repère les équipements uniques
    const gateway = nodes.find(n => n.data.role === "SECURITY_GATEWAY");
    const router = nodes.find(n => n.data.role === "ROUTER");
    const sw = nodes.find(n => n.data.role === "SWITCH");

    // 1. Gateway -> Router
    if (gateway && router) {
      edges.push({ id: 'e-gw-rt', source: gateway.id, target: router.id, style: { stroke: '#94a3b8', strokeDasharray: '5,5' } });
    }
    // 2. Router -> Switch
    if (router && sw) {
      edges.push({ id: 'e-rt-sw', source: router.id, target: sw.id, style: { stroke: '#94a3b8', strokeDasharray: '5,5' } });
    }
    // 3. Switch -> Tout le reste (Servers & Workstations)
    nodes.forEach(node => {
      if (sw && (node.data.role === "SERVER" || node.data.role === "WORKSTATION")) {
        edges.push({
          id: `e-sw-${node.id}`,
          source: sw.id,
          target: node.id,
          style: { stroke: '#cbd5e1', strokeWidth: 1.5, strokeDasharray: '5,5' },
        });
      }
    });

    return edges;
  }, [nodes]);

  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617', padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Architecture Réseau</h1>
      
      <div style={{ display: 'flex', gap: '20px', height: '85%' }}>
        {/* Zone de la carte avec fond papier */}
        <div style={{ flex: 1, borderRadius: '12px', overflow: 'hidden', background: '#f5f3ed', position: 'relative' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
          >
            <Background color="#cbd5e1" gap={30} size={1} />
            <Controls />
          </ReactFlow>
        </div>

        {/* Légende Simplifiée */}
        <div style={{ width: '200px', padding: '15px', background: '#1e293b', borderRadius: '12px', height: 'fit-content' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '15px' }}>Légende</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:12, height:12, background:'#ef4444', borderRadius:'50%' }}/> Gateway</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:12, height:12, background:'#10b981', borderRadius:'50%' }}/> Router</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:12, height:12, background:'#f59e0b', borderRadius:'50%' }}/> Switch</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:12, height:12, background:'#3b82f6', borderRadius:'50%' }}/> Server</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width:12, height:12, background:'#64748b', borderRadius:'50%' }}/> Workstation</div>
          </div>
        </div>
      </div>
    </div>
  );
}