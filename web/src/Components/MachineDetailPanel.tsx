import { 
  X, Activity, Terminal, Shield, Power, RefreshCw, Server, 
  Clock, Layers, Cpu, HardDrive, MemoryStick, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { useState, useMemo } from 'react';
// On importe le type pour TypeScript (optionnel mais recommandé)
import { type HostData } from '../mock/hosts';

interface MachineDetailPanelProps {
  node: HostData; // On utilise notre type précis
  onClose: () => void;
}

export default function MachineDetailPanel({ node, onClose }: MachineDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'logs'>('info');
  const [isRebooting, setIsRebooting] = useState(false);

  // Simulation d'action
  const handleReboot = () => {
    setIsRebooting(true);
    setTimeout(() => setIsRebooting(false), 3000);
  };

  // Génération de logs dynamiques basés sur le nom et le statut
  const machineLogs = useMemo(() => {
    if (!node) return [];
    const logs = [];
    
    // Log récent
    logs.push({ time: 'Now', msg: `Connection established to ${node.ip}`, type: 'info' });
    
    if (node.status === 'offline') {
        logs.push({ time: '14:30:00', msg: 'Heartbeat lost. System unreachable.', type: 'error' });
        logs.push({ time: '14:29:55', msg: 'Kernel panic detected', type: 'error' });
    } else {
        logs.push({ time: '10:00:23', msg: `Service ${node.services?.[0] || 'System'} started`, type: 'info' });
        logs.push({ time: '04:15:00', msg: 'Daily backup completed', type: 'info' });
    }
    
    if (node.status === 'warning') {
        logs.push({ time: '09:00:00', msg: 'High resource usage detected', type: 'warn' });
    }

    return logs;
  }, [node]);

  if (!node) return null;

  // Définition des couleurs selon le status
  const statusColor = 
    node.status === 'online' ? 'text-emerald-400' : 
    node.status === 'warning' ? 'text-amber-400' : 
    'text-red-400';

  const StatusIcon = 
    node.status === 'online' ? CheckCircle : 
    AlertTriangle;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-[#0f172a]/95 backdrop-blur-xl border-l border-slate-700 shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col">
      
      {/* HEADER */}
      <div className="p-6 border-b border-slate-700 flex justify-between items-start bg-slate-900/50">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl bg-slate-800 border border-slate-600 relative ${isRebooting ? 'animate-spin' : ''}`}>
             <Server size={24} className="text-blue-500" />
             {/* Pastille de status */}
             <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 
                ${node.status === 'online' ? 'bg-emerald-500' : node.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'}
             `}></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {node.hostname}
            </h2>
            <p className="text-sm text-blue-400 font-mono">{node.ip}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* TABS */}
      <div className="flex border-b border-slate-700">
        <button 
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Vue d'ensemble
        </button>
        <button 
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'logs' ? 'text-blue-400 border-b-2 border-blue-500 bg-slate-800/30' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Logs Système
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-6">
        
        {activeTab === 'info' ? (
          <div className="space-y-6">
            
            {/* Infos Clés */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs uppercase font-bold">
                  <Activity size={14} /> Uptime
                </div>
                <div className="text-sm text-white font-mono font-bold">
                  {node.uptime}
                </div>
              </div>
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <div className="flex items-center gap-2 text-slate-400 mb-2 text-xs uppercase font-bold">
                  <Shield size={14} /> Status
                </div>
                <div className={`text-sm font-bold uppercase flex items-center gap-2 ${statusColor}`}>
                    <StatusIcon size={14} /> {node.status}
                </div>
              </div>
            </div>

            {/* Hardware Specs (Dynamique via node.specs) */}
            {node.specs && (
                <div>
                    <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                        <Cpu size={16} /> Spécifications
                    </h3>
                    <div className="bg-slate-800/30 rounded-lg p-3 border border-slate-700/50 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><Cpu size={14}/> CPU</span>
                            <span className="text-white font-mono">{node.specs.cpu}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><MemoryStick size={14}/> RAM</span>
                            <span className="text-white font-mono">{node.specs.ram}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 flex items-center gap-2"><HardDrive size={14}/> Storage</span>
                            <span className="text-white font-mono">{node.specs.disk}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Services */}
            {node.services && node.services.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                  <Layers size={16} /> Services Détectés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {node.services.map((svc, i) => (
                    <span key={i} className="px-2 py-1 bg-blue-900/30 text-blue-300 text-xs rounded border border-blue-800">
                      {svc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Ports Ouverts */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                <Terminal size={16} /> Ports Ouverts
              </h3>
              <div className="space-y-2">
                {node.ports && node.ports.length > 0 ? (
                  node.ports.map((p, index) => (
                    <div key={index} className="flex justify-between items-center bg-slate-800/30 px-3 py-2 rounded text-sm border border-slate-700/50">
                      <span className="font-mono text-blue-400">{p.port}</span>
                      <span className="text-slate-300 uppercase">{p.serviceName || p.protocol}</span>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase ${p.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {p.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 text-sm italic">Aucun port ouvert détecté.</p>
                )}
              </div>
            </div>

            {/* Actions Rapides */}
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-3">Actions d'urgence</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={handleReboot}
                  disabled={isRebooting || node.status === 'offline'}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-red-500/20 hover:border-red-500/50 border border-slate-700 text-slate-300 hover:text-red-400 py-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isRebooting ? <RefreshCw size={18} className="animate-spin" /> : <Power size={18} />}
                  <span>{isRebooting ? '...' : 'Reboot'}</span>
                </button>
                <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-blue-500/20 hover:border-blue-500/50 border border-slate-700 text-slate-300 hover:text-blue-400 py-3 rounded-lg transition-all">
                  <Terminal size={18} />
                  <span>SSH</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Onglet LOGS Dynamique */
          <div className="space-y-4">
            {machineLogs.map((log, i) => (
              <div key={i} className="flex gap-3 text-xs font-mono border-b border-slate-800 pb-2 last:border-0">
                <span className="text-slate-500 shrink-0 flex items-center gap-1"><Clock size={10} /> {log.time}</span>
                <span className={`${log.type === 'error' ? 'text-red-400' : log.type === 'warn' ? 'text-amber-400' : 'text-slate-300'}`}>
                  {log.msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}