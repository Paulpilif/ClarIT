import { Handle, Position, type NodeProps } from "reactflow";
import { Server, Shield, Router, Monitor, Network, Activity } from "lucide-react";

const ROLE_CONFIG: any = {
  SECURITY_GATEWAY: { color: "#ef4444", icon: Shield, pulse: true }, // Pulse activé
  ROUTER:           { color: "#10b981", icon: Router, pulse: true }, // Pulse activé
  SWITCH:           { color: "#f59e0b", icon: Network, pulse: false },
  SERVER:           { color: "#3b82f6", icon: Server, pulse: false },
  WORKSTATION:      { color: "#94a3b8", icon: Monitor, pulse: false },
};

export default function InfraNode({ data, selected }: NodeProps) {
  const config = ROLE_CONFIG[data.role] || ROLE_CONFIG.SERVER;
  const Icon = config.icon;

  // On détermine si ce nœud doit "respirer" (Animation Tailwind 'animate-pulse')
  const shouldPulse = config.pulse && !selected; 

  return (
    <div className="flex flex-col items-center gap-2 group">
      
      {/* Conteneur relatif pour positionner les badges */}
      <div className="relative">
        
        {/* Effet de Halo (Glow) derrière le nœud */}
        <div 
          className={`absolute inset-0 rounded-full blur-md transition-all duration-500
            ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-40'}
          `}
          style={{ backgroundColor: config.color }}
        />

        {/* Le Cercle Principal */}
        <div 
          className={`
            relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300
            bg-[#0f172a] border-2 z-10
            ${selected ? 'scale-110 shadow-[0_0_20px_rgba(59,130,246,0.6)]' : 'shadow-lg'}
            ${shouldPulse ? 'animate-pulse' : ''} /* Animation de respiration */
          `}
          style={{ 
            borderColor: config.color,
            boxShadow: selected ? `0 0 15px ${config.color}66` : `0 4px 6px -1px rgba(0, 0, 0, 0.5)`
          }}
        >
          <Icon size={24} color={config.color} strokeWidth={2} />
        </div>

        {/* Petite LED de statut (Point qui clignote) */}
        <div className="absolute top-0 right-0 z-20">
          <span className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 bg-emerald-500`}></span>
          </span>
        </div>
      </div>

      {/* Libellés */}
      <div className="text-center z-10">
        <div className="text-slate-200 text-[11px] font-bold tracking-wide flex items-center justify-center gap-1">
          {data.hostname}
          {/* Petite icône d'activité si c'est un serveur */}
          {data.role === 'SERVER' && <Activity size={10} className="text-emerald-500 animate-bounce" />}
        </div>
        <div className="text-slate-500 text-[9px] font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          {data.ip}
        </div>
      </div>

      {/* Handles ReactFlow */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  );
}