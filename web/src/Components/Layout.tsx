import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, Activity, LogOut, Menu, X } from 'lucide-react';

interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  // NOUVEAU : On vérifie si l'utilisateur est ADMIN
  const userRole = localStorage.getItem('userRole');
  const isAdmin = userRole === 'ADMIN';

  return (
    <div className="flex h-screen bg-[#020617] text-white font-sans overflow-hidden">
      
      {/* --- HEADER MOBILE --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0f172a] border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          <span className="font-bold text-lg">ClarIT</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-300 hover:text-white transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 md:static
      `}>
        
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-slate-800">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-100">ClarIT</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-4">
          <NavLink 
            to="/dashboard" 
            onClick={closeMobileMenu} 
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/map" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            <Network size={20} />
            <span>Cartographie</span>
          </NavLink>

          {/* NOUVEAU : Ce lien ne s'affiche que si on est ADMIN */}
          {isAdmin && (
            <NavLink 
              to="/settings" 
              onClick={closeMobileMenu}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
            >
              <Settings size={20} />
              <span>Paramètres</span>
            </NavLink>
          )}
        </nav>

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

      {/* --- OVERLAY MOBILE --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* --- CONTENU --- */}
      <main className="flex-1 overflow-auto bg-[#020617] relative pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}