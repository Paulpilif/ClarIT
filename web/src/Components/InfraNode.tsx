import { Handle, Position, type NodeProps } from "reactflow";
import { Server, Shield, Router, Monitor, Network } from "lucide-react";

// Configuration des rôles
const ROLE_CONFIG: any = {
  SECURITY_GATEWAY: { color: "#ef4444", icon: Shield },    
  ROUTER:           { color: "#10b981", icon: Router },    
  SWITCH:           { color: "#f59e0b", icon: Network },   
  SERVER:           { color: "#3b82f6", icon: Server },    
  WORKSTATION:      { color: "#94a3b8", icon: Monitor },   
};

export default function InfraNode({ data, selected }: NodeProps) {
  const config = ROLE_CONFIG[data.role] || ROLE_CONFIG.SERVER;
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      
      {/* Cercle du Nœud */}
      <div 
        className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
          bg-[#0f172a] /* Fond sombre */
          border-2 
          ${selected ? 'scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'shadow-lg'}
        `}
        style={{ 
          borderColor: config.color,
          boxShadow: selected ? `0 0 15px ${config.color}66` : `0 4px 6px -1px rgba(0, 0, 0, 0.5)`
        }}
      >
        <Icon size={24} color={config.color} strokeWidth={2} />
        
        {/* Handles invisibles pour ReactFlow */}
        <Handle type="target" position={Position.Top} className="opacity-0" />
        <Handle type="source" position={Position.Bottom} className="opacity-0" />
      </div>

      {/* Textes (Blanc et Gris clair) */}
      <div className="text-center">
        <div className="text-slate-200 text-[11px] font-bold tracking-wide">
          {data.hostname}
        </div>
        <div className="text-slate-500 text-[9px] font-mono mt-0.5">
          {data.ip}
        </div>
      </div>
    </div>
  );
}