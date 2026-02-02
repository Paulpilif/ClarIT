import { useState } from 'react';
import { Search, Filter, MoreHorizontal, Server, Circle } from 'lucide-react';
import { mockHosts } from '../mock/hosts';

export default function HostsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'online' | 'offline' | 'warning'>('all');

  // Filtrage des données
  const filteredHosts = mockHosts.filter(host => {
    const matchesSearch = 
      host.hostname.toLowerCase().includes(searchTerm.toLowerCase()) || 
      host.ip.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || host.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* En-tête avec Titre + Stats rapides */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Inventaire</h1>
          <p className="text-slate-400">
            Gestion du parc informatique ({filteredHosts.length} machines affichées)
          </p>
        </div>
        
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
          <Server size={18} />
          Ajouter une machine
        </button>
      </div>

      {/* Barre d'outils (Recherche + Filtres) */}
      <div className="bg-[#0f172a] p-4 rounded-xl border border-slate-800 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        
        {/* Recherche */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher (nom, IP...)" 
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filtres (Tabs) */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
            {(['all', 'online', 'warning', 'offline'] as const).map((status) => (
                <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                        filterStatus === status 
                        ? 'bg-slate-700 text-white shadow-sm' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                    {status === 'all' ? 'Tous' : status}
                </button>
            ))}
        </div>
      </div>

      {/* Liste des machines (Tableau) */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/50 border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium">Machine</th>
                <th className="p-4 font-medium">IP Address</th>
                <th className="p-4 font-medium">OS</th>
                <th className="p-4 font-medium">Ressources</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredHosts.length > 0 ? (
                filteredHosts.map((host) => (
                  <tr key={host.id} className="hover:bg-slate-800/30 transition-colors group">
                    {/* Statut */}
                    <td className="p-4">
                      <StatusBadge status={host.status} />
                    </td>
                    
                    {/* Nom + ID */}
                    <td className="p-4">
                      <div className="font-medium text-slate-200">{host.hostname}</div>
                      <div className="text-xs text-slate-500">ID: {host.id}</div>
                    </td>

                    {/* IP */}
                    <td className="p-4 text-slate-400 font-mono text-sm">
                      {host.ip}
                    </td>

                    {/* OS */}
                    <td className="p-4 text-slate-300">
                      {host.os}
                    </td>

                    {/* Ressources (Tags) */}
                    <td className="p-4">
                      <div className="flex gap-2">
                        <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                            {host.specs.cpu}
                        </span>
                        <span className="text-xs bg-slate-800 border border-slate-700 text-slate-400 px-2 py-0.5 rounded">
                            {host.specs.ram}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button className="p-2 text-slate-500 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    Aucune machine trouvée pour cette recherche.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Petit composant pour le badge de statut (réutilisable)
function StatusBadge({ status }: { status: string }) {
  const styles = {
    online: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    offline: "bg-red-500/10 text-red-400 border-red-500/20",
    warning: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  };

  const icons = {
    online: "bg-emerald-500",
    offline: "bg-red-500",
    warning: "bg-orange-500",
  };

  const currentStyle = styles[status as keyof typeof styles] || styles.offline;
  const currentIcon = icons[status as keyof typeof icons] || icons.offline;

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium border ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${currentIcon} animate-pulse`}></span>
      <span className="capitalize">{status}</span>
    </div>
  );
}