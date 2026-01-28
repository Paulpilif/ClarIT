import { useState, useEffect } from 'react';
import { UserPlus, Users, Trash2, Save } from 'lucide-react';

export default function SettingsPage() {
  // États pour le formulaire
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [feedback, setFeedback] = useState({ msg: '', type: '' }); // 'success' | 'error'

  // État pour la liste des utilisateurs
  const [usersList, setUsersList] = useState<any[]>([]);

  // Charger les utilisateurs au démarrage
  useEffect(() => {
    const stored = localStorage.getItem('clarit_users');
    if (stored) {
      setUsersList(JSON.parse(stored));
    }
  }, []);

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser || !newPass) {
      setFeedback({ msg: 'Veuillez remplir tous les champs', type: 'error' });
      return;
    }

    // Création du nouvel objet user
    const userToAdd = { username: newUser, password: newPass, createdAt: new Date().toLocaleDateString() };
    
    // Ajout à la liste
    const updatedList = [...usersList, userToAdd];
    
    // Sauvegarde et mise à jour
    setUsersList(updatedList);
    localStorage.setItem('clarit_users', JSON.stringify(updatedList));
    
    // Reset du formulaire
    setNewUser('');
    setNewPass('');
    setFeedback({ msg: `Utilisateur ${newUser} créé avec succès !`, type: 'success' });
    
    // Effacer le message après 3 sec
    setTimeout(() => setFeedback({ msg: '', type: '' }), 3000);
  };

  const handleDeleteUser = (usernameToDelete: string) => {
    const updatedList = usersList.filter(u => u.username !== usernameToDelete);
    setUsersList(updatedList);
    localStorage.setItem('clarit_users', JSON.stringify(updatedList));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto text-white">
      <header className="mb-8 border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-bold mb-2">Paramètres Administrateur</h1>
        <p className="text-slate-400">Gestion des accès et de la configuration système</p>
      </header>

      <div className="grid gap-8 md:grid-cols-2">
        
        {/* --- COLONNE 1 : Créer un utilisateur --- */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-600/20 rounded-lg text-blue-500">
              <UserPlus size={24} />
            </div>
            <h2 className="text-xl font-bold">Nouvel Utilisateur</h2>
          </div>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Nom d'utilisateur</label>
              <input 
                type="text" 
                value={newUser}
                onChange={(e) => setNewUser(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Ex: stagiaire_reseau"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Mot de passe temporaire</label>
              <input 
                type="text" // Type text pour voir ce qu'on crée (c'est l'admin)
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Mot de passe"
              />
            </div>

            {feedback.msg && (
              <div className={`text-sm py-2 px-3 rounded border ${feedback.type === 'success' ? 'bg-emerald-900/20 border-emerald-900/30 text-emerald-400' : 'bg-red-900/20 border-red-900/30 text-red-400'}`}>
                {feedback.msg}
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <Save size={18} />
              Enregistrer l'utilisateur
            </button>
          </form>
        </div>

        {/* --- COLONNE 2 : Liste des utilisateurs --- */}
        <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-600/20 rounded-lg text-purple-500">
              <Users size={24} />
            </div>
            <h2 className="text-xl font-bold">Utilisateurs Actifs</h2>
          </div>

          <div className="space-y-3">
            {/* L'Admin Principal */}
            <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold">AD</div>
                <div>
                  <p className="font-medium">ClarIT (Admin)</p>
                  <p className="text-xs text-slate-500">Accès Root</p>
                </div>
              </div>
              <span className="text-xs bg-blue-900/30 text-blue-400 px-2 py-1 rounded">Système</span>
            </div>

            {/* Liste dynamique */}
            {usersList.length === 0 && (
              <p className="text-slate-500 text-sm italic text-center py-4">Aucun autre utilisateur créé.</p>
            )}

            {usersList.map((user, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#1e293b] rounded-lg border border-slate-700 group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold uppercase">
                    {user.username.substring(0, 2)}
                  </div>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-xs text-slate-500">Créé le {user.createdAt}</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleDeleteUser(user.username)}
                  className="text-slate-500 hover:text-red-400 p-2 rounded hover:bg-red-900/20 transition-colors"
                  title="Supprimer l'accès"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}