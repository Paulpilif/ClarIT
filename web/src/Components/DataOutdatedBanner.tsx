import { AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../contexts/AppStore';

export default function DataOutdatedBanner() {
  const navigate = useNavigate();
  const {
    scan_data_status,
    is_scanning,
    launch_scan,
  } = useAppStore();

  if (scan_data_status !== 'outdated') return null;

  const handleScan = async () => {
    if (is_scanning) return;
    const result = await launch_scan();
    if (result === 'missing-target') {
      navigate('/map');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
        {/* Left: Icon + Message */}
        <div className="flex items-center gap-3 flex-1">
          <AlertCircle size={24} className="flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm md:text-base">
              Plan mis à jour
            </p>
            <p className="text-white/90 text-xs md:text-sm">
              Relancez un scan pour voir les détails.
            </p>
          </div>
        </div>

        {/* Middle: Scan Button */}
        <button
          onClick={handleScan}
          disabled={is_scanning}
          className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 font-semibold rounded-lg hover:bg-white/90 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex-shrink-0"
        >
          {is_scanning ? (
            <>
              <Loader size={18} className="animate-spin" />
              <span className="text-sm">Scan en cours...</span>
            </>
          ) : (
            <span className="text-sm">Lancer le Scan</span>
          )}
        </button>

      </div>
    </div>
  );
}
