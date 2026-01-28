import { Server, ShieldAlert, Activity, Cpu } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Vue d'ensemble</h1>
        <p className="text-slate-400">État du réseau en temps réel</p>
      </header>

      {/* Cartes de Stats (Widgets) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="Total Machines" 
          value="12" 
          icon={<Server size={24} className="text-blue-500" />} 
          trend="+2 cette semaine"
        />
        <StatCard 
          title="Alertes Actives" 
          value="0" 
          icon={<ShieldAlert size={24} className="text-emerald-500" />} 
          trend="Système sain"
          isGood
        />
        <StatCard 
          title="Bande Passante" 
          value="1.2 Gb/s" 
          icon={<Activity size={24} className="text-purple-500" />} 
          trend="Stable"
        />
        <StatCard 
          title="Charge CPU Moy." 
          value="34%" 
          icon={<Cpu size={24} className="text-orange-500" />} 
          trend="Pic à 45%"
        />
      </div>

      {/* Zone de contenu secondaire (ex: logs récents) */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-6 h-96 flex items-center justify-center text-slate-500">
        Graphique d'activité réseau (À venir...)
      </div>
    </div>
  );
}

// Petit composant interne pour les cartes
function StatCard({ title, value, icon, trend, isGood }: any) {
  return (
    <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
          {icon}
        </div>
      </div>
      <p className={`text-xs ${isGood ? 'text-emerald-400' : 'text-slate-500'}`}>
        {trend}
      </p>
    </div>
  );
}