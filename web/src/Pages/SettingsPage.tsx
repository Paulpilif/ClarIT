import { useState, useEffect } from 'react';
import { Users, Trash2, LogOut } from 'lucide-react';

export default function SettingsPage() {
  const [usersList, setUsersList] = useState<any[]>([]);
  const [currentUser] = useState(localStorage.getItem('currentUser'));

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
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-white">
      
      <header className="mb-6 md:mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Paramètres Admin</h1>
        <p className="text-slate-400 text-sm md:text-base">Gestion des accès et de la configuration</p>
      </header>

      {/* Utilisateur actuel */}
      <div className="mb-8 bg-[#0f172a] p-5 md:p-6 rounded-xl border border-blue-800/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
            {currentUser?.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-slate-400 text-sm">Connecté en tant que</p>
            <p className="text-xl font-bold text-blue-400">{currentUser}</p>
          </div>
        </div>
      </div>

      {/* Liste des utilisateurs */}
      <div className="bg-[#0f172a] p-5 md:p-6 rounded-xl border border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-600/20 rounded-lg text-purple-500">
            <Users size={24} />
          </div>
          <h2 className="text-xl font-bold">Utilisateurs Actifs</h2>
        </div>

        <div className="space-y-3">
          {/* Liste dynamique */}
          {usersList.length === 0 && (
            <p className="text-slate-500 text-sm italic text-center py-4">Aucun autre utilisateur créé.</p>
          )}

          {usersList.map((user, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-700 group hover:border-slate-600 transition-colors">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase shrink-0">
                  {user.username.substring(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{user.username}</p>
                  <p className="text-xs text-slate-500">Créé le {user.createdAt}</p>
                </div>
              </div>
              
              <button 
                onClick={() => handleDeleteUser(user.username)}
                disabled={user.username === currentUser}
                className="text-slate-500 hover:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed p-2 rounded hover:bg-red-900/20 transition-colors shrink-0 ml-2"
                title={user.username === currentUser ? 'Impossible de supprimer votre compte' : 'Supprimer cet utilisateur'}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {/* Info supplémentaire */}
        <div className="mt-6 pt-6 border-t border-slate-800">
          <p className="text-slate-400 text-sm flex items-center gap-2">
            <LogOut size={16} />
            Pour créer un nouveau compte, utilisez la page d'inscription accessible depuis la page de connexion.
          </p>
        </div>
      </div>
    </div>
  );
}