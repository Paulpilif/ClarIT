import { useEffect, useMemo, useState } from "react";
import { TrendingUp, AlertTriangle, Ship } from "lucide-react";
import { useAppStore } from "../contexts/AppStore";
import DataSyncEmptyState from "../Components/DataSyncEmptyState";
import PaywallUpgrade from "../Components/PaywallUpgrade";

const GRAPH_JSON_URL = import.meta.env.VITE_GRAPH_JSON_URL || "";
const GRAPH_API_BASE_URL =
  import.meta.env.VITE_GRAPH_API_URL || "http://localhost:8080/api/v1";

type GraphNode = {
  id: string;
  created_at?: number;
  last_seen?: number;
};

type NetworkGraph = {
  nodes: GraphNode[];
};

export default function DashboardPage() {
  const { subscription_tier, scan_data_status } = useAppStore();
  const [kpis, setKpis] = useState({
    totalMachines: 0,
    createdLast30Days: 0,
    missingLast30Days: 0,
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const resolveGraphUrl = useMemo(() => {
    if (GRAPH_JSON_URL) return GRAPH_JSON_URL;
    const companyName = localStorage.getItem("currentUser");
    if (companyName) {
      return `${GRAPH_API_BASE_URL}/graph/company/${encodeURIComponent(companyName)}`;
    }
    return `${GRAPH_API_BASE_URL}/graph`;
  }, []);

  useEffect(() => {
    let cancelled = false;

    const toMillis = (value?: number) => {
      if (!value) return undefined;
      return value > 1_000_000_000_000 ? value : value * 1000;
    };

    const loadGraph = async () => {
      if (scan_data_status !== "valid") {
        setKpis({
          totalMachines: 0,
          createdLast30Days: 0,
          missingLast30Days: 0,
        });
        setLoadError(null);
        return;
      }

      try {
        setIsLoading(true);
        setLoadError(null);
        const response = await fetch(resolveGraphUrl);
        if (!response.ok) {
          throw new Error(`Graph fetch failed: ${response.status}`);
        }
        const graphData = (await response.json()) as NetworkGraph;
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

        const totalMachines = graphData.nodes.length;
        const createdLast30Days = graphData.nodes.filter((node) => {
          const created = toMillis(node.created_at);
          return created !== undefined && created >= thirtyDaysAgo;
        }).length;
        const missingLast30Days = graphData.nodes.filter((node) => {
          const lastSeen =
            toMillis(node.last_seen) ?? toMillis(node.created_at);
          return lastSeen !== undefined && lastSeen < thirtyDaysAgo;
        }).length;

        if (!cancelled) {
          setKpis({ totalMachines, createdLast30Days, missingLast30Days });
        }
      } catch (error) {
        console.error("Dashboard load error:", error);
        if (!cancelled) {
          setLoadError(
            "Impossible de charger le tableau de bord. Vérifiez que l'API est démarrée.",
          );
          setKpis({
            totalMachines: 0,
            createdLast30Days: 0,
            missingLast30Days: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadGraph();

    return () => {
      cancelled = true;
    };
  }, [resolveGraphUrl, scan_data_status]);

  if (subscription_tier === "eclaireur") {
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
  if (scan_data_status !== "valid") {
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

      {loadError && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {loadError}
        </div>
      )}

      {isLoading && (
        <div className="mb-6 rounded-lg border border-[#2F2F2F]/10 bg-[#FAF0E6]/40 px-4 py-3 text-[#6E7681]">
          Chargement du tableau de bord...
        </div>
      )}

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
                {kpis.createdLast30Days}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">
                Machines créées sur 30 jours
              </p>
            </div>
            <div className="p-3 bg-[#2F2F2F] rounded-lg">
              <TrendingUp size={24} className="text-[#FAF0E6]" />
            </div>
          </div>
          <div className="pt-4 border-t border-[#2F2F2F]/20">
            <p className="text-[#6E7681] text-sm font-medium">
              Basé sur l'inventaire réel
            </p>
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
                {kpis.missingLast30Days}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">
                Non vues depuis 30 jours
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
                {kpis.totalMachines}
              </h2>
              <p className="text-[#6E7681] text-sm mt-2">Machines détectées</p>
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
          <li>
            • <strong>Nouveaux Horizons</strong>: Suivez les nouvelles machines
            ajoutées à votre infrastructure
          </li>
          <li>
            • <strong>Vaisseaux Fantômes</strong>: Identifiez les machines qui
            n'ont pas été vues depuis plus d'un mois
          </li>
          <li>
            • <strong>Flotte Totale</strong>: Vue instantanée du nombre total de
            machines actives
          </li>
        </ul>
      </div>
    </div>
  );
}
