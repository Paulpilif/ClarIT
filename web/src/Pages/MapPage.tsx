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

import { useHosts, type Host } from "../data/hosts";
import InfraNode from "../Components/InfraNode";
// Attention : vérifie que le nom du fichier correspond bien (s ou pas de s à Detail)
import NodeDetailCard from "../Components/NodeDetailsCard";

const nodeTypes = { infra: InfraNode };

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

function getRole(host: any): SketchRole {
  const type = host.type?.toLowerCase();

  if (type === "firewall") return "SECURITY_GATEWAY";
  if (type === "router") return "ROUTER";
  if (type === "switch") return "SWITCH";
  if (type === "workstation" || type === "pc") return "WORKSTATION";

  return "SERVER";
}

const buildNodes = (hosts: Host[]): Node[] => {
  return hosts.map((host) => {
    const role = getRole(host);

    const centerX = 600;
    const horizontalGap = 200;

    const peers = hosts.filter((peer) => getRole(peer) === role);
    const index = peers.findIndex((peer) => peer.id === host.id);
    const total = peers.length;

    const xPos = centerX + (index - (total - 1) / 2) * horizontalGap;

    return {
      id: host.id,
      type: "infra",
      position: { x: xPos, y: LAYERS_Y[role] },
      data: {
        ...host,
        role,
      },
    };
  });
};

const buildEdges = (nodes: Node[]): Edge[] => {
  const edges: Edge[] = [];

  const gateway = nodes.find((n) => n.data.role === "SECURITY_GATEWAY");
  const router = nodes.find((n) => n.data.role === "ROUTER");
  const sw = nodes.find((n) => n.data.role === "SWITCH");

  if (gateway && router) {
    edges.push({
      id: "e-gw-rt",
      source: gateway.id,
      target: router.id,
      style: { stroke: "#94a3b8", strokeDasharray: "5,5" },
    });
  }
  if (router && sw) {
    edges.push({
      id: "e-rt-sw",
      source: router.id,
      target: sw.id,
      style: { stroke: "#94a3b8", strokeDasharray: "5,5" },
    });
  }
  nodes.forEach((node) => {
    if (
      sw &&
      (node.data.role === "SERVER" || node.data.role === "WORKSTATION")
    ) {
      edges.push({
        id: `e-sw-${node.id}`,
        source: sw.id,
        target: node.id,
        style: { stroke: "#cbd5e1", strokeWidth: 1.5, strokeDasharray: "5,5" },
      });
    }
  });

  return edges;
};

export default function MapPage() {
  const { hosts, loading, error } = useHosts();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    const nextNodes = buildNodes(hosts);
    setNodes(nextNodes);
    setEdges(buildEdges(nextNodes));
  }, [hosts, setNodes, setEdges]);

  // ✅ CORRECTION ICI AUSSI : On envoie directement 'node.data' au lieu de tout le 'node'
  const onNodeMouseEnter = (_: React.MouseEvent, node: Node) => {
    setHoveredNode(node.data);
  };

  const onNodeMouseLeave = () => {
    setHoveredNode(null);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        backgroundColor: "#020617",
        padding: "20px",
        color: "white",
      }}
    >
      <h1
        style={{ fontSize: "24px", fontWeight: "bold", marginBottom: "20px" }}
      >
        Architecture Réseau
      </h1>

      {loading && <p>Chargement de la cartographie...</p>}
      {error && <p>Erreur: {error}</p>}

      <div style={{ display: "flex", gap: "20px", height: "85%" }}>
        <div
          style={{
            flex: 1,
            borderRadius: "12px",
            overflow: "hidden",
            background: "#f5f3ed",
            position: "relative",
          }}
        >
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
            <Background color="#cbd5e1" gap={30} size={1} />
            <Controls />
          </ReactFlow>

          {/* La carte s'affichera désormais avec les données ! */}
          {hoveredNode && <NodeDetailCard node={hoveredNode} />}
        </div>

        {/* Légende */}
        <div
          style={{
            width: "200px",
            padding: "15px",
            background: "#1e293b",
            borderRadius: "12px",
            height: "fit-content",
          }}
        >
          <h3 style={{ fontWeight: "bold", marginBottom: "15px" }}>Légende</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              fontSize: "13px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#ef4444",
                  borderRadius: "50%",
                }}
              />{" "}
              Gateway
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#10b981",
                  borderRadius: "50%",
                }}
              />{" "}
              Router
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#f59e0b",
                  borderRadius: "50%",
                }}
              />{" "}
              Switch
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#3b82f6",
                  borderRadius: "50%",
                }}
              />{" "}
              Server
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  background: "#64748b",
                  borderRadius: "50%",
                }}
              />{" "}
              Workstation
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
