import { TrendingUp, AlertTriangle, Ship } from 'lucide-react';
import { getNewHorizonCount, getGhostVesselsCount, getTotalFleetCount } from '../mock/dashboard-data';
import { useAppStore } from '../contexts/AppStore';
import DataSyncEmptyState from '../Components/DataSyncEmptyState';
import PaywallUpgrade from '../Components/PaywallUpgrade';

export default function DashboardPage() {
  const { subscription_tier, scan_data_status } = useAppStore();
  
  const newHorizonData = getNewHorizonCount();
  const ghostVessels = getGhostVesselsCount();
  const totalFleet = getTotalFleetCount();

  const trend = newHorizonData.current > newHorizonData.previous ? 'up' : newHorizonData.current < newHorizonData.previous ? 'down' : 'flat';

  if (subscription_tier === 'eclaireur') {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#2F2F2F] mb-2">
            Tableau de Bord
          </h1>
          <p className="text-[#6E7681] text-lg">
            Vue d'ensemble de votre flotte
          </p>
        </header>
        <PaywallUpgrade
          title="Tableau de Bord réservé au plan Navigateur"
          description="Passez au plan Navigateur pour accéder aux indicateurs avancés."
        />
      </div>
    );
  }

  // Si données non synchronisées, afficher l'empty state
  if (scan_data_status !== 'valid') {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-[#2F2F2F] mb-2">
            Tableau de Bord
          </h1>
          <p className="text-[#6E7681] text-lg">
            Vue d'ensemble de votre flotte
          </p>
        </header>
        <DataSyncEmptyState 
          title="Données non synchronisées"
          description="Veuillez lancer un scan pour accéder au tableau de bord."
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-[#2F2F2F] mb-2">
          Tableau de Bord
        </h1>
        <p className="text-[#6E7681] text-lg">
          Vue d'ensemble de votre flotte réseau
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Nouveaux Horizons */}
        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#4A403A] text-sm font-semibold uppercase tracking-wide">
                Nouveaux Horizons
              </p>
              <h2 className="text-4xl font-bold text-[#2F2F2F] mt-2">
                {newHorizonData.current}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">
                VMs créées ce mois-ci
              </p>
            </div>
            <div className="p-3 bg-[#2F2F2F] rounded-lg">
              <TrendingUp size={24} className="text-[#FAF0E6]" />
            </div>
          </div>

          {/* Trend comparé au mois dernier */}
          <div className="pt-4 border-t border-[#2F2F2F]/20">
            {trend === 'up' && (
              <p className="text-green-700 text-sm font-medium">
                ↑ {newHorizonData.current - newHorizonData.previous} de plus que le mois dernier
              </p>
            )}
            {trend === 'down' && (
              <p className="text-red-700 text-sm font-medium">
                ↓ {newHorizonData.previous - newHorizonData.current} de moins que le mois dernier
              </p>
            )}
            {trend === 'flat' && (
              <p className="text-[#6E7681] text-sm font-medium">
                Même nombre qu'en mois dernier
              </p>
            )}
          </div>
        </div>

        {/* Vaisseaux Fantômes */}
        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#4A403A] text-sm font-semibold uppercase tracking-wide">
                Vaisseaux Fantômes
              </p>
              <h2 className="text-4xl font-bold text-[#2F2F2F] mt-2">
                {ghostVessels}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">
                Machines hors ligne (30j+)
              </p>
            </div>
            <div className="p-3 bg-[#2F2F2F] rounded-lg">
              <AlertTriangle size={24} className="text-[#FAF0E6]" />
            </div>
          </div>

          <div className="pt-4 border-t border-[#2F2F2F]/20">
            <p className="text-[#6E7681] text-sm font-medium">
              À surveiller étroitement
            </p>
          </div>
        </div>

        {/* Flotte Totale */}
        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-[#4A403A] text-sm font-semibold uppercase tracking-wide">
                Flotte Totale
              </p>
              <h2 className="text-4xl font-bold text-[#2F2F2F] mt-2">
                {totalFleet}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">
                Machines actives en ligne
              </p>
            </div>
            <div className="p-3 bg-[#2F2F2F] rounded-lg">
              <Ship size={24} className="text-[#FAF0E6]" />
            </div>
          </div>

          <div className="pt-4 border-t border-[#2F2F2F]/20">
            <p className="text-[#6E7681] text-sm font-medium">
              État sain de la flotte
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-white border-2 border-[#2F2F2F] rounded-xl p-6">
        <h3 className="text-lg font-bold text-[#2F2F2F] mb-4">
          À propos de ce tableau de bord
        </h3>
        <p className="text-[#6E7681] mb-3">
          Ce dashboard fournit une vue stratégique de votre flotte réseau:
        </p>
        <ul className="space-y-2 text-[#6E7681]">
          <li>• <strong>Nouveaux Horizons</strong>: Suivez les nouvelles machines ajoutées à votre infrastructure</li>
          <li>• <strong>Vaisseaux Fantômes</strong>: Identifiez les machines qui n'ont pas été vues depuis plus d'un mois</li>
          <li>• <strong>Flotte Totale</strong>: Vue instantanée du nombre total de machines actives</li>
        </ul>
      </div>
    </div>
    );
}