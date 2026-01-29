import { useParams, useNavigate } from 'react-router-dom';
import { mockHosts, type HostData } from '../mock/hosts';
import { ArrowLeft, X, Activity, HardDrive, Cpu, Server as ServerIcon } from 'lucide-react';

// On définit les "Props" optionnelles pour le mode Volet
interface MachineDetailPanelProps {
  node?: HostData;       // Donnée passée directement (Map)
  onClose?: () => void;  // Fonction de fermeture (Map)
}

export default function MachineDetailPanel({ node, onClose }: MachineDetailPanelProps) {
  const { id } = useParams();
  const navigate = useNavigate();

  // LOGIQUE INTELLIGENTE :
  // Si on a reçu 'node' via les props (Map), on l'utilise.
  // Sinon, on cherche l'ID dans l'URL (Route /hosts/:id) et on trouve la machine dans le mock.
  const machine = node || mockHosts.find(h => h.id.toString() === id);
  
  // Est-on en mode "Volet Latéral" ? (si onClose existe, c'est oui)
  const isPanelMode = !!onClose;

  if (!machine) {
    return (
        <div className="p-8 text-white">
            <div className="text-red-400">Machine introuvable.</div>
            <button onClick={() => navigate(-1)} className="mt-4 text-blue-400 underline">Retour</button>
        </div>
    );
  }

  // --- RENDU ---
  // On adapte le conteneur selon le mode (Page complète ou Volet Latéral)
  return (
    <div className={`
        text-white flex flex-col
        ${isPanelMode 
            ? 'fixed inset-y-0 right-0 w-full md:w-[480px] bg-[#0f172a] border-l border-slate-800 shadow-2xl z-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-300' 
            : 'p-8 max-w-4xl mx-auto' // Mode Page normale
        }
    `}>
      
      {/* HEADER : Bouton Fermer (Volet) OU Bouton Retour (Page) */}
      <div className="flex items-center justify-between mb-8">
        {isPanelMode ? (
            <button 
                onClick={onClose}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 p-2 rounded-lg"
            >
                <X size={20} /> Fermer
            </button>
        ) : (
            <button 
                onClick={() => navigate(-1)} 
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft size={20} /> Retour à la liste
            </button>
        )}
        
        {/* Badge de statut */}
        <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
            machine.status === 'online' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            machine.status === 'warning' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
            'bg-red-500/10 text-red-400 border-red-500/20'
        }`}>
            {machine.status}
        </div>
      </div>

      {/* TITRE & IP */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
            <div className="p-2bg-blue-600/20 rounded-lg">
                <ServerIcon className="text-blue-500" size={32} />
            </div>
            <h1 className="text-3xl font-bold">{machine.hostname}</h1>
        </div>
        <p className="text-slate-400 text-lg flex items-center gap-2">
            <span className="font-mono text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">{machine.ip}</span>
            <span className="text-slate-600">•</span>
            <span>{machine.type.toUpperCase()}</span>
        </p>
      </div>
      
      {/* CARTES DE DÉTAILS */}
      <div className="space-y-6">
        
        {/* Carte Système */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <Activity size={18} /> Système
            </h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">OS</p>
                    <p className="font-medium text-slate-200">{machine.os}</p>
                </div>
                <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Uptime</p>
                    <p className="font-mono text-emerald-400">{machine.uptime}</p>
                </div>
                <div>
                    <p className="text-slate-500 text-xs uppercase font-bold mb-1">Dernière activité</p>
                    <p className="font-medium text-slate-300">
                        {new Date(machine.lastSeen).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </p>
                </div>
            </div>
        </div>

        {/* Carte Hardware */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <Cpu size={18} /> Hardware
            </h2>
            <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">CPU</span>
                    <span className="font-mono">{machine.specs.cpu}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-slate-400">RAM</span>
                    <span className="font-mono">{machine.specs.ram}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-slate-400">Stockage</span>
                    <span className="font-mono">{machine.specs.disk}</span>
                </div>
            </div>
        </div>

        {/* Carte Services / Ports */}
        <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800">
            <h2 className="text-lg font-semibold mb-4 text-slate-200 flex items-center gap-2">
                <HardDrive size={18} /> Services & Ports
            </h2>
            <div className="flex flex-wrap gap-2 mb-4">
                {machine.services.map(svc => (
                    <span key={svc} className="px-2 py-1 bg-slate-800 text-slate-300 text-xs rounded border border-slate-700">
                        {svc}
                    </span>
                ))}
            </div>
            <div className="space-y-2">
                {machine.ports.map((p, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                        <span className="text-slate-400 uppercase w-16">{p.protocol}</span>
                        <span className="text-slate-200 flex-1">:{p.port} ({p.serviceName})</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${p.status === 'open' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {p.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>

      </div>
    </div>
  );
}