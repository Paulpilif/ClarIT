import { RefreshCw, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../contexts/AppStore';

interface DataSyncEmptyStateProps {
  title?: string;
  description?: string;
}

export default function DataSyncEmptyState({
  title = "Données en attente de synchronisation",
  description = "Votre plan a changé. Veuillez lancer un scan pour mettre à jour la cartographie avec les nouvelles données."
}: DataSyncEmptyStateProps) {
  const navigate = useNavigate();
  const { is_scanning, launch_scan } = useAppStore();

  const handleScan = async () => {
    if (is_scanning) return;
    const result = await launch_scan();
    if (result === 'missing-target') {
      navigate('/map');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-blue-50 rounded-full">
            <Database size={56} className="text-blue-600" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-3">
          {title}
        </h2>

        {/* Description */}
        <p className="text-[#6E7681] text-base md:text-lg mb-8 max-w-md">
          {description}
        </p>

        {/* CTA Button */}
        <button
          onClick={handleScan}
          disabled={is_scanning}
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {is_scanning ? (
            <>
              <RefreshCw size={20} className="animate-spin" />
              <span>Scan en cours...</span>
            </>
          ) : (
            <>
              <RefreshCw size={20} />
              <span>Lancer le Scan maintenant</span>
            </>
          )}
        </button>

        {/* Additional info */}
        {is_scanning && (
          <p className="text-[#6E7681] text-sm mt-6">
            Ne fermez pas cette fenêtre. Le scan peut prendre quelques minutes...
          </p>
        )}
      </div>
    </div>
  );
}
