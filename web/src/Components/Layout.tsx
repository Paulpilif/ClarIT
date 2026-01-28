import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, Activity, LogOut } from 'lucide-react';

// Ajoute l'interface pour TypeScript
interface LayoutProps {
  onLogout: () => void;
}


export default function Layout({ onLogout }: LayoutProps) {
  return (
    <div className="flex h-screen bg-[#020617] text-white font-sans overflow-hidden">
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">ClarIT</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavLink to="/dashboard" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/map" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Network size={20} />
            <span>Cartographie</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
            <Settings size={20} />
            <span>Paramètres</span>
          </NavLink>
        </nav>

        {/* Bouton de déconnexion tout en bas */}
        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto bg-[#020617] relative">
        <Outlet />
      </main>
    </div>
  );
}

