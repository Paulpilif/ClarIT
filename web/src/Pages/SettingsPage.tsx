import { useState, useEffect } from 'react';
import { Users, Trash2, LogOut, Shield } from 'lucide-react';
import { useUser } from '../contexts/UserContext';

export default function SettingsPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [currentUser] = useState(localStorage.getItem('currentUser'));
  const { tier, setTier } = useUser();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users');
        if (response.ok) {
          const users = await response.json();
          setUsersList(users);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des utilisateurs:', err);
      }
    };

    fetchUsers();
  }, []);

  const handleDeleteUser = async (usernameToDelete: string) => {
    if (usernameToDelete === currentUser) {
      alert('Vous ne pouvez pas supprimer votre propre compte');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${usernameToDelete}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setUsersList(usersList.filter(u => u.username !== usernameToDelete));
      } else {
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      alert('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-[#2F2F2F]">
      
      <header className="mb-6 md:mb-8 border-b border-[#4A403A] pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Paramètres & Profil</h1>
        <p className="text-[#6B6B6B] text-sm md:text-base">Gestion de votre compte et de vos préférences</p>
      </header>

      {/* Utilisateur actuel */}
      <div className="mb-8 bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white">
            {currentUser?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-[#6B6B6B] text-sm">Connecté en tant que</p>
            <p className="text-xl font-bold text-[#2F2F2F]">{currentUser}</p>
          </div>
        </div>
      </div>

      {/* Plan et accès utilisateur */}
      <div className="mb-8 bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
            <Shield size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#2F2F2F]">Tier d'accès</h2>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#2F2F2F] mb-3">Sélectionner un tier pour tester :</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => setTier('scout')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tier === 'scout'
                  ? 'border-blue-600 bg-blue-50 text-[#2F2F2F] font-semibold'
                  : 'border-[#D0CACA] bg-white text-[#6B6B6B] hover:border-blue-400'
              }`}
            >
              L'Éclaireur
              <div className="text-xs mt-1 opacity-75">Scout (Carte uniquement)</div>
            </button>
            <button
              onClick={() => setTier('navigator')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tier === 'navigator'
                  ? 'border-blue-600 bg-blue-50 text-[#2F2F2F] font-semibold'
                  : 'border-[#D0CACA] bg-white text-[#6B6B6B] hover:border-blue-400'
              }`}
            >
              Le Navigateur
              <div className="text-xs mt-1 opacity-75">Navigator (Carte + Inventaire)</div>
            </button>
            <button
              onClick={() => setTier('admiral')}
              className={`p-3 rounded-lg border-2 transition-all ${
                tier === 'admiral'
                  ? 'border-blue-600 bg-blue-50 text-[#2F2F2F] font-semibold'
                  : 'border-[#D0CACA] bg-white text-[#6B6B6B] hover:border-blue-400'
              }`}
            >
              L'Amiral
              <div className="text-xs mt-1 opacity-75">Admiral (Accès complet)</div>
            </button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
          <strong>Tier actuel :</strong> {tier === 'scout' ? 'L\'Éclaireur' : tier === 'navigator' ? 'Le Navigateur' : 'L\'Amiral'}
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-700">
            <Users size={24} />
          </div>
          <h2 className="text-xl font-bold text-[#2F2F2F]">Utilisateurs Actifs</h2>
        </div>

        <div className="space-y-3">
          {/* Liste dynamique */}
          {usersList.length === 0 && (
            <p className="text-[#8B8B8B] text-sm italic text-center py-4">Aucun autre utilisateur créé.</p>
          )}

          {usersList.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#F9F5F0] rounded-lg border border-[#D0CACA] group hover:border-[#8B7355] transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#D0CACA] flex items-center justify-center text-xs font-bold uppercase shrink-0 text-[#2F2F2F]">
                  {user.username.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-[#2F2F2F]">{user.username}</p>
                  <p className="text-xs text-[#8B8B8B]">Créé le {user.createdAt}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteUser(user.username)}
                disabled={user.username === currentUser}
                className="text-[#8B8B8B] hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded hover:bg-red-100 transition-colors shrink-0 ml-2"
                title={user.username === currentUser ? 'Impossible de supprimer votre compte' : 'Supprimer cet utilisateur'}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Info supplémentaire */}
        <div className="mt-6 pt-6 border-t border-[#D0CACA]">
          <p className="text-[#6B6B6B] text-sm flex items-center gap-2">
            <LogOut size={16} />
            Pour créer un nouveau compte, utilisez la page d'inscription accessible depuis la page de connexion.
          </p>
        </div>
      </div>
    </div>
  );
}