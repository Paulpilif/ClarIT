import { useNavigate } from 'react-router-dom';
import { Activity, Check, ArrowRight } from 'lucide-react';

type TierType = 'scout' | 'navigator';

export default function PricingPage() {
  const navigate = useNavigate();

  const tiers: Array<{
    id: TierType;
    name: string;
    title: string;
    description: string;
    price: string;
    period: string;
    features: string[];
    highlighted: boolean;
    cta: string;
  }> = [
    {
      id: 'scout',
      name: 'L\'Éclaireur',
      title: 'Free',
      description: 'Parfait pour débuter votre exploration réseau.',
      price: '0',
      period: 'Gratuit',
      features: [
        'Accès à la Cartographie réseau',
        'Vue en temps réel de votre infrastructure',
        'Jusqu\'à 20 machines',
        'Support par email',
        'Mise à jour automatique',
      ],
      highlighted: false,
      cta: 'Commencer',
    },
    {
      id: 'navigator',
      name: 'Le Navigateur',
      title: 'Premium',
      description: 'Pour les explorateurs avancés.',
      price: '99',
      period: '/mois',
      features: [
        'Tout de L\'Éclaireur',
        'Accès complet à l\'Inventaire',
        'Tableau de bord après scan',
        'Machines illimitées',
        'Historique complet',
        'Alertes et notifications',
        'Rapports personnalisés',
        'Support prioritaire',
        'API d\'accès',
      ],
      highlighted: true,
      cta: 'Essayer',
    },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                <Activity size={20} className="text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-black">ClarIT</span>
            </div>

            {/* Navigation Links */}
            <div className="flex items-center gap-8">
              <a href="/" className="text-black hover:text-gray-600 font-medium transition-colors">
                Accueil
              </a>
              <a href="#" className="text-black hover:text-gray-600 font-medium transition-colors">
                Entreprise
              </a>
              <a href="/pricing" className="text-black hover:text-gray-600 font-medium transition-colors">
                Pricing
              </a>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/register')}
                className="px-6 py-2 text-black font-medium hover:text-gray-600 transition-colors"
              >
                Inscription
              </button>
              <button
                onClick={() => navigate('/login')}
                className="px-6 py-2 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors"
              >
                Connexion
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-black mb-4">
              Des tarifs pour chaque explorateur
            </h1>
            <p className="text-xl text-gray-600">
              Choisissez le plan qui correspond à vos besoins et commencez votre voyage dès aujourd'hui.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.id}
                className={`relative rounded-2xl overflow-hidden transition-all ${
                  tier.highlighted
                    ? 'bg-[#F5F5DC] border-2 border-black shadow-lg scale-105'
                    : 'bg-white border-2 border-gray-200 hover:border-gray-400'
                }`}
              >
                {/* Highlighted Badge */}
                {tier.highlighted && (
                  <div className="absolute top-0 right-0 bg-black text-white px-4 py-1 text-sm font-bold rounded-bl-lg">
                    LE MEILLEUR
                  </div>
                )}

                {/* Card Content */}
                <div className="p-8">
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black mb-2">{tier.name}</h3>
                    <p className="text-gray-600 text-sm">{tier.description}</p>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-black">{tier.price}€</span>
                      <span className="text-gray-600">{tier.period}</span>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    onClick={() => navigate('/login')}
                    className={`w-full mb-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                      tier.highlighted
                        ? 'bg-black text-white hover:bg-gray-800'
                        : 'border-2 border-black text-black hover:bg-gray-50'
                    }`}
                  >
                    {tier.cta} <ArrowRight size={18} />
                  </button>

                  {/* Features */}
                  <div className="space-y-4">
                    <p className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                      Ce qui est inclus :
                    </p>
                    <ul className="space-y-3">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check size={20} className="text-black flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-[#FAF0E6] py-16 mt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-black text-center mb-12">
              Questions fréquemment posées
            </h2>

            <div className="space-y-6">
              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  Puis-je changer de plan plus tard ?
                </h3>
                <p className="text-gray-600">
                  Oui, vous pouvez changer de plan à tout moment. Les changements prendront effet à votre prochain cycle de facturation.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  Y a-t-il une période d'essai gratuite ?
                </h3>
                <p className="text-gray-600">
                  Oui, tous les plans payants incluent 14 jours d'essai gratuit. Pas de carte de crédit requise pour commencer.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  Que se passe-t-il si j'annule mon abonnement ?
                </h3>
                <p className="text-gray-600">
                  Vous conserverez l'accès jusqu'à la fin de votre période de facturation. Vous pourrez réactiver votre compte à tout moment.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border-2 border-gray-200">
                <h3 className="text-xl font-bold text-black mb-2">
                  Avez-vous des offres pour les entreprises ?
                </h3>
                <p className="text-gray-600">
                  Oui, nous proposons des plans d'entreprise personnalisés. Contactez notre équipe pour en savoir plus.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Prêt à explorer votre infrastructure ?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Commencez avec L'Éclaireur gratuitement et passez à un plan supérieur quand vous serez prêt.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
            >
              Commencer maintenant <ArrowRight size={20} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-8 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity size={20} />
                <span className="font-bold">ClarIT</span>
              </div>
              <p className="text-gray-400">© 2026 ClarIT. Tous droits réservés.</p>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
