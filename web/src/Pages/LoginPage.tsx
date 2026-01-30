import { useState } from 'react';
import { Shield, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Simulation d'attente (pour l'effet UI)
    await new Promise(resolve => setTimeout(resolve, 500));

    // Vérification Utilisateurs (LocalStorage)
    const storedUsersString = localStorage.getItem('clarit_users');
    const storedUsers = storedUsersString ? JSON.parse(storedUsersString) : [];
    
    const foundUser = storedUsers.find((u: any) => u.username === username && u.password === password);

    if (foundUser) {
      localStorage.setItem('isAuthenticated', 'true');
      // On sauvegarde qui est connecté (utile pour l'affichage plus tard)
      localStorage.setItem('currentUser', username); 
      onLogin();
    } else {
      setError('Identifiants incorrects.');
      setIsSubmitting(false);
    }
  };

  return (
    // Le style inline garantit que le fond prend tout l'écran, même sur mobile
    <div style={{ 
      display: 'flex', justifyContent: 'center', alignItems: 'center', 
      height: '100vh', width: '100vw', backgroundColor: '#020617',
      position: 'fixed', top: 0, left: 0, zIndex: 50
    }}>
      {/* w-full + max-w-md + m-4 : Assure que la carte ne touche pas les bords sur mobile */}
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 p-8 m-4">
        
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4 ring-1 ring-blue-500/30">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Accès ClarIT</h1>
          <p className="text-slate-400 text-sm mt-2">Zone d'administration sécurisée</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Identifiant</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Ex: ClarIT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="••••••••"
            />
          </div>
          
          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 rounded border border-red-900/30">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            {isSubmitting ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-sm text-center mb-4">Pas encore de compte ?</p>
          <button
            onClick={() => navigate('/register')}
            className="w-full flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-white font-medium py-3 rounded-lg transition-colors border border-slate-600"
          >
            <UserPlus size={18} />
            <span>S'inscrire</span>
          </button>
        </div>
      </div>
    </div>
  );
}