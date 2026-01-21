// On ajoute le mot-clé 'type' devant l'import
import { Handle, Position, type NodeProps } from "reactflow";
import { Server, Shield, Router, HardDrive, Monitor, Network } from "lucide-react";


const ROLE_CONFIG: any = {
  FIREWALL: { color: "#ef4444", icon: Shield, label: "Security Gateway" },
  ROUTER: { color: "#22c55e", icon: Router, label: "Router" },
  SWITCH: { color: "#eab308", icon: Network, label: "Switch" },
  WEB: { color: "#3b82f6", icon: Server, label: "Web Server" },
  DB: { color: "#a855f7", icon: HardDrive, label: "Database" },
  WORKSTATION: { color: "#64748b", icon: Monitor, label: "Workstation" },
};

export default function InfraNode({ data, selected }: NodeProps) {
  const config = ROLE_CONFIG[data.role] || { color: "#94a3b8", icon: Server, label: data.role };
  const Icon = config.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      {/* Cercle avec effet de Glow */}
      <div style={{
        width: '52px',
        height: '52px',
        borderRadius: '50%',
        backgroundColor: '#1e293b',
        border: `2px solid ${config.color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Halo lumineux (box-shadow)
        boxShadow: selected ? `0 0 25px ${config.color}` : `0 0 15px ${config.color}66`,
        transition: 'all 0.3s ease',
      }}>
        <Icon size={24} color={config.color} />
        
        {/* Les points d'accroche (Handles) sont masqués mais présents */}
        <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      </div>

      {/* Libellés sous le nœud */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'white', fontSize: '11px', fontWeight: 'bold' }}>{data.hostname}</div>
        <div style={{ color: '#64748b', fontSize: '9px', fontFamily: 'monospace' }}>{data.ip}</div>
      </div>
    </div>
  );
}
