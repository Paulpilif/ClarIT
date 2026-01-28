import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, Activity } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#020617] text-white font-sans overflow-hidden">
      {/* --- Sidebar (Menu Gauche) --- */}
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col">
        
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Activity size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">ClarIT</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
            `}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Dashboard</span>
          </NavLink>

          <NavLink 
            to="/map" 
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
            `}
          >
            <Network size={20} />
            <span className="font-medium">Cartographie</span>
          </NavLink>

          <NavLink 
            to="/settings" 
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20 translate-x-1' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}
            `}
          >
            <Settings size={20} />
            <span className="font-medium">Paramètres</span>
          </NavLink>
        </nav>

        {/* Version Footer */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-600 text-center">
          v1.0.0 Stable
        </div>
      </aside>

      {/* --- Contenu Principal (La page change ici) --- */}
      <main className="flex-1 overflow-auto bg-[#020617] relative">
        <Outlet />
      </main>
    </div>
  );
}