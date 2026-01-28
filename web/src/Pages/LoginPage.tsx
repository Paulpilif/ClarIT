import { useState } from 'react';
import { Shield } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Simulation délai
    await new Promise(resolve => setTimeout(resolve, 500));

    if (username === 'ClarIT' && password === 'myefrei') {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin();
    } else {
      setError('Identifiants invalides');
      setIsSubmitting(false);
    }
  };

  return (
    // 1. min-h-screen : Prend toute la hauteur de l'écran
    // 2. flex items-center justify-center : Centre le contenu au milieu absolu
    <div className="min-h-screen w-full flex items-center justify-center bg-[#020617] font-sans p-4">
      
      {/* Container de la carte : largeur max fixée pour ne pas être trop large */}
      <div className="w-full max-w-md">
        
        {/* La carte elle-même */}
        <div className="bg-[#0f172a] rounded-2xl shadow-2xl p-8 border border-slate-800">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600/10 rounded-full mb-4 ring-1 ring-blue-500/30">
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Accès ClarIT</h1>
            <p className="text-sm text-slate-400">Connectez-vous pour gérer le réseau</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="ClarIT"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#1e293b] border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-all duration-200 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-900/20"
            >
              {isSubmitting ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          
        </div>
      </div>
    </div>
  );
}