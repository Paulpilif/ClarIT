import { useCallback, useMemo } from "react";
import ReactFlow, { 
  MarkerType, 
  Background, 
  useNodesState, 
  useEdgesState, 
  type Node, 
  type Edge 
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";

import { mockHosts } from "../mock/hosts";
import InfraNode from "../Components/InfraNode";

// 1. Configuration statique
const nodeTypes = { infra: InfraNode };

type Role = "WEB" | "APP" | "DB" | "CACHE" | "FIREWALL" | "ROUTER" | "SWITCH" | "WORKSTATION" | "OTHER";

const LAYERS_Y: Record<Role, number> = {
  FIREWALL: 80, ROUTER: 180, SWITCH: 280, WEB: 450, APP: 450, DB: 600, CACHE: 600, WORKSTATION: 750, OTHER: 450,
};

function getRole(host: any): Role {
  if (host.type === "firewall") return "FIREWALL";
  if (host.type === "router") return "ROUTER";
  if (host.type === "switch") return "SWITCH";
  if (host.type === "workstation") return "WORKSTATION";
  const ports = host.ports?.map((p: any) => p.port) || [];
  if (ports.includes(80) || ports.includes(443)) return "WEB";
  if (ports.includes(5432) || ports.includes(3306)) return "DB";
  return "OTHER";
}

// 2. Préparation des données initiales
const initialNodes: Node[] = mockHosts.map((h, i) => {
  const role = getRole(h);
  return {
    id: h.id,
    type: "infra",
    position: { 
      x: (role === "FIREWALL" || role === "ROUTER" || role === "SWITCH") ? 300 : 650 + (i * 250), 
      y: LAYERS_Y[role] 
    },
    data: {
      hostname: h.hostname,
      ip: h.ip,
      os: h.os,
      role: role,
      portsCount: h.ports?.length || 0,
    },
  };
});

// 3. COMPOSANT PRINCIPAL
export default function MapPage() {
  const navigate = useNavigate();

  // Utilisation des hooks d'état pour permettre le drag & drop
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  
  // Génération des liens (edges) basée sur l'état actuel des nœuds
  const initialEdges: Edge[] = useMemo(() => {
    const out: Edge[] = [];
    const firewall = nodes.find(n => n.data.role === "FIREWALL");
    const router = nodes.find(n => n.data.role === "ROUTER");
    const sw = nodes.find(n => n.data.role === "SWITCH");

    if (firewall && router) {
      out.push({ id: 'e-f-r', source: firewall.id, target: router.id, animated: true, style: { stroke: '#94a3b8' } });
    }
    if (router && sw) {
      out.push({ id: 'e-r-s', source: router.id, target: sw.id, style: { stroke: '#94a3b8' } });
    }

    nodes.forEach(node => {
        if (sw && !["FIREWALL", "ROUTER", "SWITCH"].includes(node.data.role)) {
          out.push({
            id: `e-sw-${node.id}`,
            source: sw.id,
            target: node.id,
            type: 'straight', // ✅ Ligne droite pour le look "sketch"
            style: { 
              stroke: '#475569', 
              strokeWidth: 1.5, 
              strokeDasharray: '5,5' // ✅ Optionnel : ligne pointillée
            },
          });
        }
      });
    return out;
  }, [nodes]);

  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback((_: any, node: any) => {
    navigate(`/hosts/${node.id}`);
  }, [navigate]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#020617', padding: '20px', color: 'white' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>Cartographie de l'infrastructure</h1>
      
      <div style={{ display: 'flex', gap: '20px', height: '85%' }}>
        <div style={{ flex: 1, border: '1px solid #1e293b', borderRadius: '12px', overflow: 'hidden', background: '#0f172a' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange} // Active le déplacement des nœuds
            onEdgesChange={onEdgesChange} // Gère les changements de liens si nécessaire
            onNodeClick={onNodeClick}
            fitView
          >
            <Background color="#334155" gap={20} />
          </ReactFlow>
        </div>

        {/* Légende */}
        <div style={{ width: '200px', padding: '15px', background: '#1e293b', borderRadius: '12px', height: 'fit-content' }}>
          <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>Légende</h3>
          <div style={{ fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', background: '#2563eb', borderRadius: '2px' }} /> WEB
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '12px', height: '12px', background: '#7c3aed', borderRadius: '2px' }} /> DB
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}