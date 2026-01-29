import { useState, useEffect } from 'react';
import { Server, ShieldAlert, Activity, Cpu, ArrowUpRight, ArrowDownRight } from 'lucide-react';
// On importe tes données "réelles"
import { mockHosts } from '../mock/hosts';

export default function DashboardPage() {
  // État pour stocker les métriques dynamiques
  const [stats, setStats] = useState({
    totalMachines: 0,
    activeAlerts: 0,
    bandwidth: 0,
    cpuLoad: 0
  });

  // Simulation "Temps Réel"
  useEffect(() => {
    // 1. Initialisation des données statiques (basées sur la Map)
    const total = mockHosts.length;

    // Fonction qui met à jour les données vivantes
    const updateMetrics = () => {
      setStats(prev => ({
        totalMachines: total,
        
        // Simule 0 ou 1 alerte aléatoirement pour donner de la vie
        activeAlerts: Math.random() > 0.8 ? 1 : 0, 
        
        // Simule une bande passante entre 0.8 et 2.5 Gb/s
        bandwidth: parseFloat((Math.random() * (2.5 - 0.8) + 0.8).toFixed(1)),
        
        // Simule une charge CPU entre 20% et 65%
        cpuLoad: Math.floor(Math.random() * (65 - 20) + 20)
      }));
    };

    // On lance tout de suite
    updateMetrics();

    // On met à jour toutes les 3 secondes
    const interval = setInterval(updateMetrics, 3000);

    // Nettoyage quand on quitte la page
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-6 md:mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Vue d'ensemble</h1>
          <p className="text-slate-400 text-sm md:text-base">
            Monitoring temps réel du parc <span className="text-blue-400 font-mono">({stats.totalMachines} nœuds)</span>
          </p>
        </div>
        {/* Petit indicateur de "Live" */}
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider animate-pulse">
          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
          Live
        </div>
      </header>

      {/* --- CARTES DYNAMIQUES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Carte 1 : Vrai compte des machines */}
        <StatCard 
          title="Total Machines" 
          value={stats.totalMachines.toString()} 
          icon={<Server size={24} className="text-blue-500" />} 
          trend="Données synchronisées"
          trendUp={true} // Flèche verte
        />

        {/* Carte 2 : Alertes (Change si > 0) */}
        <StatCard 
          title="Alertes Actives" 
          value={stats.activeAlerts.toString()} 
          icon={<ShieldAlert size={24} className={stats.activeAlerts > 0 ? "text-red-500" : "text-emerald-500"} />} 
          trend={stats.activeAlerts > 0 ? "Intervention requise" : "Système sain"}
          isGood={stats.activeAlerts === 0}
        />

        {/* Carte 3 : Bande Passante (Variable) */}
        <StatCard 
          title="Bande Passante" 
          value={`${stats.bandwidth} Gb/s`} 
          icon={<Activity size={24} className="text-purple-500" />} 
          trend="Flux entrant"
          trendUp={stats.bandwidth > 1.5}
        />

        {/* Carte 4 : CPU (Variable) */}
        <StatCard 
          title="Charge CPU Moy." 
          value={`${stats.cpuLoad}%`} 
          icon={<Cpu size={24} className="text-orange-500" />} 
          trend="Charge cluster"
          isGood={stats.cpuLoad < 50}
        />
      </div>

      {/* --- GRAPHIQUE ANIMÉ --- */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 md:p-6 h-96 flex flex-col relative overflow-hidden">
        <h3 className="text-slate-200 font-bold mb-6 z-10">Trafic Réseau (Temps réel)</h3>
        
        {/* Simulation de graphique à barres animé */}
        <div className="flex items-end justify-between h-full gap-1 md:gap-2 px-2 pb-2 opacity-80">
           {/* On génère 20 barres qui changent de hauteur aléatoirement via CSS */}
           {Array.from({ length: 20 }).map((_, i) => (
             <div 
               key={i} 
               className="w-full bg-blue-600/30 rounded-t-sm transition-all duration-1000 ease-in-out hover:bg-blue-500/80"
               style={{ 
                 height: `${Math.random() * (90 - 20) + 20}%`, // Hauteur aléatoire initiale
                 animation: `pulseHeight ${2 + i * 0.1}s infinite alternate` // Animation CSS
               }}
             ></div>
           ))}
        </div>
        
        {/* Grille de fond */}
        <div className="absolute inset-0 grid grid-rows-4 pointer-events-none">
          <div className="border-b border-slate-800/50 w-full"></div>
          <div className="border-b border-slate-800/50 w-full"></div>
          <div className="border-b border-slate-800/50 w-full"></div>
        </div>
      </div>

      {/* Style pour l'animation des barres */}
      <style>{`
        @keyframes pulseHeight {
          0% { transform: scaleY(0.8); opacity: 0.5; }
          100% { transform: scaleY(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// Composant StatCard amélioré avec indicateurs de tendance
function StatCard({ title, value, icon, trend, isGood, trendUp }: any) {
  // Détermine la couleur du petit texte en bas
  let trendColor = "text-slate-500";
  if (isGood === true) trendColor = "text-emerald-400";
  if (isGood === false) trendColor = "text-red-400";

  return (
    <div className="bg-[#0f172a] p-5 md:p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-sm group">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <p className="text-slate-400 text-sm font-medium mb-1 truncate">{title}</p>
          <h3 className="text-2xl font-bold text-white tabular-nums">{value}</h3>
        </div>
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 shrink-0 group-hover:scale-110 transition-transform duration-300">
          {icon}
        </div>
      </div>
      
      <div className={`text-xs ${trendColor} flex items-center gap-1`}>
        {/* Affiche une flèche si trendUp est défini */}
        {trendUp !== undefined && (
          trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />
        )}
        {trend}
      </div>
    </div>
  );
}