import { enrichedHosts } from '../mock/dashboard-data';
import { useAppStore } from '../contexts/AppStore';
import DataSyncEmptyState from '../Components/DataSyncEmptyState';
import PaywallUpgrade from '../Components/PaywallUpgrade';

export default function InventoryPage() {
  const { subscription_tier, scan_data_status } = useAppStore();
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Aujourd\'hui';
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return `Il y a ${Math.floor(diffDays / 30)} mois`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-[#2F2F2F] mb-2">
          Inventaire de la Flotte
        </h1>
        <p className="text-[#6E7681] text-lg">
          Vue détaillée de toutes les machines de votre parc
        </p>
      </header>

      {subscription_tier === 'eclaireur' ? (
        <PaywallUpgrade
          title="Inventaire réservé au plan Navigateur"
          description="Passez au plan Navigateur pour accéder à l'inventaire détaillé."
        />
      ) : scan_data_status !== 'valid' ? (
        <DataSyncEmptyState 
          title="Données non synchronisées"
          description="Veuillez lancer un scan pour accéder à l'inventaire des machines."
        />
      ) : (
        <>
      {/* Inventory Table */}
      <div className="overflow-x-auto bg-white rounded-xl border-2 border-[#2F2F2F]">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-[#2F2F2F] bg-[#FAF0E6]">
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                Nom de la Machine
              </th>
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                1ère Apparition
              </th>
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                Dernière Observation
              </th>
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                Ports Ouverts
              </th>
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                Services
              </th>
              <th className="px-6 py-4 text-left text-[#2F2F2F] font-bold uppercase text-sm">
                État
              </th>
            </tr>
          </thead>
          <tbody>
            {enrichedHosts.map((host, idx) => (
              <tr
                key={host.id}
                className={`border-b border-[#2F2F2F]/10 hover:bg-[#FAF0E6]/50 transition-colors ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-[#FAF0E6]/20'
                }`}
              >
                <td className="px-6 py-4 text-[#2F2F2F] font-semibold">
                  <div>
                    <p>{host.name}</p>
                    <p className="text-xs text-[#6E7681] mt-1">{host.ip}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-[#6E7681] text-sm">
                  {formatDate(host.firstSeen)}
                </td>
                <td className="px-6 py-4 text-[#6E7681] text-sm">
                  {formatDate(host.lastSeen)}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-2">
                    {host.ports.length > 0 ? (
                      host.ports.slice(0, 3).map((port) => (
                        <span
                          key={port}
                          className="inline-block bg-[#2F2F2F] text-white text-xs px-2 py-1 rounded"
                        >
                          {port}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#6E7681] text-sm">Aucun</span>
                    )}
                    {host.ports.length > 3 && (
                      <span className="text-[#6E7681] text-sm">
                        +{host.ports.length - 3} autres
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {host.services.length > 0 ? (
                      host.services.slice(0, 2).map((service) => (
                        <span
                          key={service}
                          className="inline-block bg-[#FAF0E6] text-[#2F2F2F] text-xs px-2 py-1 rounded border border-[#2F2F2F]/20"
                        >
                          {service}
                        </span>
                      ))
                    ) : (
                      <span className="text-[#6E7681] text-sm">Aucun</span>
                    )}
                    {host.services.length > 2 && (
                      <span className="text-[#6E7681] text-sm">
                        +{host.services.length - 2}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full font-medium text-sm ${
                      host.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {host.status === 'online' ? '✓ En ligne' : '✗ Hors ligne'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <p className="text-[#4A403A] text-sm font-semibold uppercase">
            Total des Machines
          </p>
          <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
            {enrichedHosts.length}
          </p>
        </div>

        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <p className="text-[#4A403A] text-sm font-semibold uppercase">
            En Ligne
          </p>
          <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
            {enrichedHosts.filter((h) => h.status === 'online').length}
          </p>
        </div>

        <div className="bg-[#FAF0E6] border-2 border-[#2F2F2F] rounded-xl p-6">
          <p className="text-[#4A403A] text-sm font-semibold uppercase">
            Hors Ligne
          </p>
          <p className="text-3xl font-bold text-[#2F2F2F] mt-2">
            {enrichedHosts.filter((h) => h.status === 'offline').length}
          </p>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
