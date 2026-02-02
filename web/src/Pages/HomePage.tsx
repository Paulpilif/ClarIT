import { useNavigate } from 'react-router-dom';
import { Activity, ArrowRight, Shield, Network, Zap } from 'lucide-react';

export default function HomePage() {
  const navigate = useNavigate();

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
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Text */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-black mb-6 leading-tight">
                Maîtrisez votre infrastructure réseau
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                ClarIT vous offre une visibilité complète sur votre infrastructure IT avec une cartographie réseau en temps réel, des analyses avancées et une gestion centralisée.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 bg-black text-white font-medium rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  Commencer <ArrowRight size={20} />
                </button>
                <button className="px-8 py-3 text-black font-medium border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  En savoir plus
                </button>
              </div>
            </div>

            {/* Right Side - Illustration */}
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-12 flex items-center justify-center min-h-96">
              <div className="text-center">
                <Network size={80} className="text-black mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Cartographie réseau avancée</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-gray-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-black text-center mb-12">
              Fonctionnalités principales
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <Network size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Cartographie Réseau</h3>
                <p className="text-gray-600">
                  Visualisez toute votre infrastructure réseau en temps réel avec une représentation graphique intuitive.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <Shield size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Sécurité Avancée</h3>
                <p className="text-gray-600">
                  Identifiez les vulnérabilités et les risques de sécurité avec nos outils d'analyse approfondie.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-white p-8 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center mb-4">
                  <Zap size={24} className="text-white" />
                </div>
                <h3 className="text-xl font-bold text-black mb-3">Monitoring Temps Réel</h3>
                <p className="text-gray-600">
                  Surveiller les performances et les alertes avec un tableau de bord centralisé et des notifications instantanées.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-black text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl font-bold mb-6">Prêt à gérer votre infrastructure ?</h2>
            <p className="text-xl text-gray-300 mb-8">
              Rejoignez des entreprises du monde entier qui font confiance à ClarIT pour leur gestion réseau.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate('/login')}
                className="px-8 py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-100 transition-colors inline-flex items-center gap-2"
              >
                Accéder à la plateforme <ArrowRight size={20} />
              </button>
              <button
                onClick={() => navigate('/register')}
                className="px-8 py-3 border border-white text-white font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                S'inscrire
              </button>
            </div>
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
