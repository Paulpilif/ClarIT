import { useState, useEffect } from 'react';
import { Server, ShieldAlert, Activity, Cpu, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
// Import des données partagées
import { mockHosts } from '../mock/hosts';

export default function DashboardPage() {
  // État pour les métriques instantanées
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeAlerts: 0,
    bandwidth: 0,
    cpuLoad: 0
  });

  // État pour l'historique du graphique (tableau de données)
  const [trafficData, setTrafficData] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initialisation des données basées sur mockHosts
    // On calcule les vraies alertes basées sur le statut 'error' dans tes mocks
    const initialAlerts = mockHosts.filter(h => h.status === 'offline').length;
    
    // Initialisation du graph avec des données vides pour l'animation d'entrée
    const initialHistory = Array.from({ length: 20 }, (_, i) => ({
      name: i,
      value: Math.floor(Math.random() * 30) + 20
    }));
    setTrafficData(initialHistory);

    // Fonction de mise à jour (Simulation intelligente)
    const updateMetrics = () => {
      setStats(prev => {
        // Variation douce du CPU (on ne saute pas de 20 à 90 d'un coup)
        const change = Math.floor(Math.random() * 10) - 5; // -5 à +5
        let newCpu = prev.cpuLoad + change;
        if (newCpu < 10) newCpu = 15;
        if (newCpu > 90) newCpu = 85;

        // Bande passante fluctuante
        const newBandwidth = parseFloat((Math.random() * (3.5 - 1.2) + 1.2).toFixed(1));

        return {
          totalMachines: mockHosts.length, // Donnée réelle
          activeAlerts: initialAlerts,     // Donnée réelle (basée sur le mock)
          bandwidth: newBandwidth,
          cpuLoad: newCpu
        };
      });

      // Mise à jour du graphique (Slide window)
      setTrafficData(currentData => {
        const newValue = Math.floor(Math.random() * (100 - 40) + 40);
        const newArray = [...currentData.slice(1), { name: '', value: newValue }];
        return newArray;
      });
    };

    // Lancer immédiatement
    updateMetrics();

    // Intervalle de mise à jour (2 secondes)
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* --- EN-TÊTE --- */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Vue d'ensemble</h1>
          <p className="text-slate-400">
            État du cluster : <span className="text-emerald-400 font-medium">Opérationnel</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-xs font-bold uppercase tracking-wider animate-pulse border border-emerald-500/20">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                Live
            </div>
            <div className="text-slate-500 text-xs text-right hidden sm:block">
                <p>Taux de rafraîchissement</p>
                <p className="font-mono text-slate-300">2000ms</p>
            </div>
        </div>
      </header>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Machines" 
          value={stats.totalMachines} 
          icon={<Server size={22} className="text-blue-500" />} 
          trend="Nœuds connectés"
          color="blue"
          onClick={() => navigate('/hosts')}
        />

        <StatCard 
          title="Alertes Critiques" 
          value={stats.activeAlerts} 
          icon={<ShieldAlert size={22} className={stats.activeAlerts > 0 ? "text-red-500" : "text-emerald-500"} />} 
          trend={stats.activeAlerts > 0 ? "Attention requise" : "Système sain"}
          isNegative={stats.activeAlerts > 0}
          color={stats.activeAlerts > 0 ? "red" : "emerald"}
          onClick={() => navigate('/hosts')}
        />

        <StatCard 
          title="Bande Passante" 
          value={`${stats.bandwidth} Gb/s`} 
          icon={<Activity size={22} className="text-purple-500" />} 
          trend="Trafic sortant"
          trendUp={stats.bandwidth > 2.0}
          color="purple"
        />

        <StatCard 
          title="Charge CPU Moy." 
          value={`${stats.cpuLoad}%`} 
          icon={<Cpu size={22} className="text-orange-500" />} 
          trend="Charge cluster"
          isNegative={stats.cpuLoad > 80}
          color="orange"
        />
      </div>

      {/* --- GRAPHIQUE TEMPS RÉEL (Recharts) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Graphique principal (prend 2 colonnes) */}
        <div className="lg:col-span-2 bg-[#0f172a] rounded-xl border border-slate-800 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-slate-200 font-bold flex items-center gap-2">
              <Activity size={18} className="text-blue-400"/>
              Trafic Réseau (Temps réel)
            </h3>
            <span className="text-xs text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">Dernières 60s</span>
          </div>

          <div className="h-75 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trafficData}>
                <defs>
                  <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" hide />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#60a5fa' }}
                  labelStyle={{ display: 'none' }}
                  formatter={(value) => [`${value} MB/s`, 'Débit']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTraffic)" 
                  animationDuration={500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Panneau latéral : Derniers logs (Statique pour l'instant) */}
        <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 flex flex-col">
            <h3 className="text-slate-200 font-bold mb-4">Activité récente</h3>
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex gap-3 items-start text-sm border-b border-slate-800/50 pb-3 last:border-0">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0"></div>
                        <div>
                            <p className="text-slate-300">Synchronisation du nœud <span className="font-mono text-xs text-slate-500">srv-{100+i}</span></p>
                            <p className="text-slate-500 text-xs mt-1">Il y a {2 + i * 5} min</p>
                        </div>
                    </div>
                ))}
            </div>
            <button className="mt-4 w-full py-2 text-sm text-slate-400 hover:text-white border border-slate-700 hover:border-slate-600 rounded-lg transition-colors">
                Voir tous les logs
            </button>
        </div>
      </div>
    </div>
  );
}

// Composant Carte Réutilisable
// Ajoute onClick dans les props
function StatCard({ title, value, icon, trend, isNegative, trendUp, color, onClick }: any) {
    const colorClasses: any = {
        blue: "group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
        red: "group-hover:border-red-500/50 group-hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
        emerald: "group-hover:border-emerald-500/50 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]",
        purple: "group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]",
        orange: "group-hover:border-orange-500/50 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]",
    };

    return (
      <div 
        onClick={onClick} // 1. On branche le clic ici
        className={`
            bg-[#0f172a] p-6 rounded-xl border border-slate-800 transition-all duration-300 group 
            ${colorClasses[color] || ""}
            ${onClick ? "cursor-pointer hover:bg-slate-800/80 active:scale-95" : ""} // 2. Effet visuel au clic
        `}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-white tabular-nums">{value}</h3>
          </div>
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 shrink-0 text-slate-300">
            {icon}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
            {trendUp !== undefined && (
                 trendUp 
                 ? <ArrowUpRight size={16} className="text-emerald-500" /> 
                 : <ArrowDownRight size={16} className="text-orange-500" />
            )}
            <span className={`text-xs font-medium ${isNegative ? "text-red-400" : "text-emerald-400"}`}>
                {trend}
            </span>
        </div>
      </div>
    );
}