import { Server, ShieldAlert, Activity, Cpu } from 'lucide-react';

export default function DashboardPage() {
  return (
    // CHANGEMENT 1 : p-4 sur mobile, md:p-8 sur PC.
    // Cela évite que le contenu soit trop compressé sur petit écran.
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <header className="mb-6 md:mb-8">
        {/* CHANGEMENT 2 : Taille du texte adaptative (2xl sur mobile, 3xl sur PC) */}
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Vue d'ensemble
        </h1>
        <p className="text-slate-400 text-sm md:text-base">
          État du réseau en temps réel
        </p>
      </header>

      {/* Cartes de Stats (Widgets) 
         - grid-cols-1 : 1 carte par ligne sur Mobile
         - md:grid-cols-2 : 2 cartes par ligne sur Tablette
         - lg:grid-cols-4 : 4 cartes par ligne sur PC
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
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

      {/* Zone Graphique */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 md:p-6 h-96 flex flex-col items-center justify-center text-slate-500 relative overflow-hidden group">
        
        {/* Un petit effet visuel pour simuler un graphique responsive */}
        <div className="flex items-end gap-2 h-32 mb-4 opacity-50">
           {[40, 70, 45, 90, 60, 80, 50].map((h, i) => (
             <div key={i} className="w-4 md:w-8 bg-blue-600/20 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600/40" style={{ height: `${h}%` }}></div>
           ))}
        </div>
        
        <p>Graphique d'activité réseau (À venir...)</p>
      </div>
    </div>
  );
}

// Composant interne StatCard
// J'ai ajouté 'min-w-0' pour éviter que le texte ne déborde sur les très petits écrans
function StatCard({ title, value, icon, trend, isGood }: any) {
  return (
    <div className="bg-[#0f172a] p-5 md:p-6 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="min-w-0">
          <p className="text-slate-400 text-sm font-medium mb-1 truncate">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
        <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
          {icon}
        </div>
      </div>
      <p className={`text-xs ${isGood ? 'text-emerald-400' : 'text-slate-500'} flex items-center gap-1`}>
        {trend}
      </p>
    </div>
  );
}