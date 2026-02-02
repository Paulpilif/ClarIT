import { Shield, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PaywallUpgradeProps {
  title?: string;
  description?: string;
}

export default function PaywallUpgrade({
  title = "Accès réservé au plan Navigateur",
  description = "Passez au plan Navigateur pour accéder à cette fonctionnalité premium."
}: PaywallUpgradeProps) {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[500px]">
      <div className="bg-white border border-[#D0CACA] rounded-2xl p-8 md:p-10 text-center max-w-lg shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-amber-100 rounded-full">
            <Shield size={56} className="text-amber-600" />
          </div>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold text-[#2F2F2F] mb-3">
          {title}
        </h2>
        <p className="text-[#6E7681] text-base md:text-lg mb-8">
          {description}
        </p>
        <button
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white font-semibold rounded-lg hover:bg-amber-700 transition-all"
        >
          Mettre à niveau
          <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}
