import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Network, Settings, Activity, LogOut, Menu, X } from 'lucide-react';
import { useUser } from '../contexts/UserContext';
import { useScan } from '../contexts/ScanContext';

// Interface pour TypeScript
interface LayoutProps {
  onLogout: () => void;
}

export default function Layout({ onLogout }: LayoutProps) {
  const { hasAccess } = useUser();
  const { scanCompleted } = useScan();
  // État pour gérer l'ouverture/fermeture du menu sur mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fonction pour fermer le menu quand on clique sur un lien (UX fluide)
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-[#0F1117] text-[#E6EDF3] font-sans overflow-hidden">
      
      {/* --- 1. HEADER MOBILE (Visible uniquement sur mobile 'md:hidden') --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#161B22] border-b border-[#30363D] flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <Activity size={20} className="text-[#3B82F6]" />
          <span className="font-bold text-lg">ClarIT</span>
        </div>
        {/* Bouton Hamburger / Croix */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-[#8B949E] hover:text-[#E6EDF3] transition-colors"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- 2. SIDEBAR RESPONSIVE --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#161B22] border-r border-[#30363D] flex flex-col 
        transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} /* Mobile : caché/visible selon l'état */
        md:translate-x-0 md:static /* PC : Toujours visible et statique */
      `}>
        
        {/* Logo (Caché sur mobile car déjà dans le header du haut) */}
        <div className="hidden md:flex p-6 items-center gap-3 border-b border-[#30363D]">
          <div className="w-8 h-8 bg-[#1E40AF] rounded-lg flex items-center justify-center">
            <Activity size={20} className="text-[#E6EDF3]" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[#E6EDF3]">ClarIT</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 mt-16 md:mt-4">
          {/* Cartographie - Accessible à tous */}
          <NavLink 
            to="/map" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-[#1E40AF] text-[#E6EDF3]' : 'text-[#8B949E] hover:bg-[#21262D]'}`}
          >
            <Network size={20} />
            <span>Cartographie</span>
          </NavLink>

          {/* Inventaire - Accessible Navigateur uniquement (seulement si scan complété) */}
          {(hasAccess('inventory') && scanCompleted) && (
            <NavLink 
              to="/inventory" 
              onClick={closeMobileMenu}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-[#1E40AF] text-[#E6EDF3]' : 'text-[#8B949E] hover:bg-[#21262D]'}`}
            >
              <LayoutDashboard size={20} />
              <span>Inventaire</span>
            </NavLink>
          )}

          {/* Dashboard - Accessible à tous après un scan */}
          {hasAccess('dashboard', scanCompleted) && (
            <NavLink 
              to="/dashboard" 
              onClick={closeMobileMenu}
              className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-[#1E40AF] text-[#E6EDF3]' : 'text-[#8B949E] hover:bg-[#21262D]'}`}
            >
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </NavLink>
          )}

          <NavLink 
            to="/settings" 
            onClick={closeMobileMenu}
            className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive ? 'bg-[#1E40AF] text-[#E6EDF3]' : 'text-[#8B949E] hover:bg-[#21262D]'}`}
          >
            <Settings size={20} />
            <span>Paramètres</span>
          </NavLink>
        </nav>

        {/* Bouton de déconnexion */}
        <div className="p-4 border-t border-[#30363D]">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* --- 3. OVERLAY (Fond noir quand le menu est ouvert sur mobile) --- */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm"
          onClick={closeMobileMenu}
        />
      )}

      {/* --- CONTENU PRINCIPAL --- */}
      {/* pt-16 sur mobile pour ne pas être caché par le header */}
      <main className="flex-1 overflow-auto bg-[#0F1117] relative pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
}