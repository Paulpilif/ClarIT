import { Handle, Position, type NodeProps } from "reactflow";
import { Server, Shield, Router, Monitor, Network } from "lucide-react";

// Configuration stricte des 5 rôles demandés
const ROLE_CONFIG: any = {
  SECURITY_GATEWAY: { color: "#ef4444", icon: Shield },    // Rouge
  ROUTER:           { color: "#10b981", icon: Router },    // Vert
  SWITCH:           { color: "#f59e0b", icon: Network },   // Orange
  SERVER:           { color: "#3b82f6", icon: Server },    // Bleu (Regroupe Web, DB, Cache)
  WORKSTATION:      { color: "#64748b", icon: Monitor },   // Gris/Bleu
};

export default function InfraNode({ data, selected }: NodeProps) {
  // Si le rôle n'est pas trouvé, on fallback sur SERVER (Bleu)
  const config = ROLE_CONFIG[data.role] || ROLE_CONFIG.SERVER;
  const Icon = config.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      
      {/* Cercle style Sketch */}
      <div style={{
        position: 'relative',
        width: '50px',
        height: '50px',
        borderRadius: '50%',
        backgroundColor: 'white',
        border: `2px solid ${config.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: selected ? `0 0 0 4px ${config.color}33` : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.2s ease',
        transform: selected ? 'scale(1.1)' : 'scale(1)',
      }}>
        <Icon size={24} color={config.color} strokeWidth={2} />
        
        {/* Handles invisibles pour ReactFlow */}
        <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
        <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
      </div>

      {/* Libellé */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: '#334155', fontSize: '11px', fontWeight: '700' }}>
          {data.hostname}
        </div>
        <div style={{ color: '#64748b', fontSize: '9px', fontFamily: 'monospace' }}>
          {data.ip}
        </div>
      </div>
    </div>
  );
}