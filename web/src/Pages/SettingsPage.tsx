import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, CreditCard, Mail, Lock, AlertCircle, X } from 'lucide-react';
import { useAppStore } from '../contexts/AppStore';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [currentUser] = useState(localStorage.getItem('currentUser'));
  const { set_subscription_tier, set_scan_data_status } = useAppStore();
  const [activeTab, setActiveTab] = useState<'profil' | 'abonnement'>('profil');
  const [showPlanChangeNotification, setShowPlanChangeNotification] = useState(false);
  
  // État du profil
  const [profileData, setProfileData] = useState({
    username: currentUser || '',
    email: 'user@example.com',
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // État de l'abonnement
  const [subscriptionData, setSubscriptionData] = useState({
    currentPlan: 'navigateur',
    billingEmail: 'user@example.com',
    billingName: currentUser || ''
  });

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubscriptionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSubscriptionData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = () => {
    if (profileData.newPassword && profileData.newPassword !== profileData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    alert('Profil mis à jour avec succès');
    setProfileData(prev => ({ ...prev, oldPassword: '', newPassword: '', confirmPassword: '' }));
  };

  const handleChangePlan = (newPlan: 'eclaireur' | 'navigateur') => {
    set_subscription_tier(newPlan);
    setSubscriptionData(prev => ({ ...prev, currentPlan: newPlan }));
    if (newPlan === 'navigateur') {
      set_scan_data_status('outdated');
    } else {
      set_scan_data_status('none');
    }
    setShowPlanChangeNotification(true);
  };

  const handleGoToMap = () => {
    setShowPlanChangeNotification(false);
    navigate('/map');
  };

  const handleStayInSettings = () => {
    setShowPlanChangeNotification(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto text-[#2F2F2F]">
      
      <header className="mb-6 md:mb-8 border-b border-[#4A403A] pb-4">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Paramètres</h1>
        <p className="text-[#6B6B6B] text-sm md:text-base">Gestion de votre compte et de vos préférences</p>
      </header>

      {/* Onglets */}
      <div className="flex gap-2 mb-6 border-b border-[#D0CACA]">
        <button
          onClick={() => setActiveTab('profil')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'profil'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#2F2F2F]'
          }`}
        >
          <User size={18} />
          <span>Profil</span>
        </button>
        <button
          onClick={() => setActiveTab('abonnement')}
          className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
            activeTab === 'abonnement'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-[#6B6B6B] hover:text-[#2F2F2F]'
          }`}
        >
          <CreditCard size={18} />
          <span>Abonnement</span>
        </button>
      </div>

      {/* ONGLET PROFIL */}
      {activeTab === 'profil' && (
        <div className="space-y-6">
          {/* Utilisateur actuel */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
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

          {/* Informations personnelles */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
            <h2 className="text-lg font-bold text-[#2F2F2F] mb-4 flex items-center gap-2">
              <User size={20} />
              Informations personnelles
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Nom d'utilisateur</label>
                <input
                  type="text"
                  name="username"
                  value={profileData.username}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2 flex items-center gap-2">
                  <Mail size={16} />
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Sécurité - Changer le mot de passe */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
            <h2 className="text-lg font-bold text-[#2F2F2F] mb-4 flex items-center gap-2">
              <Lock size={20} />
              Sécurité
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={profileData.oldPassword}
                  onChange={handleProfileChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Nouveau mot de passe</label>
                <input
                  type="password"
                  name="newPassword"
                  value={profileData.newPassword}
                  onChange={handleProfileChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Confirmer le mot de passe</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={profileData.confirmPassword}
                  onChange={handleProfileChange}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveProfile}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Enregistrer les modifications
            </button>
          </div>
        </div>
      )}

      {/* ONGLET ABONNEMENT */}
      {activeTab === 'abonnement' && (
        <div className="space-y-6">
          {/* Plan actuel */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                <Shield size={24} />
              </div>
              <h2 className="text-xl font-bold text-[#2F2F2F]">Plan actuel</h2>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-6">
              <p className="text-sm text-[#6B6B6B] mb-1">Vous êtes actuellement sur le plan :</p>
              <p className="text-2xl font-bold text-blue-600">
                {subscriptionData.currentPlan === 'eclaireur' ? 'L\'Éclaireur' : 'Le Navigateur'}
              </p>
              <p className="text-xs text-[#6B6B6B] mt-1">
                {subscriptionData.currentPlan === 'eclaireur' 
                  ? 'Accès à la cartographie uniquement' 
                  : 'Accès complet : Cartographie + Inventaire + Dashboard'}
              </p>
            </div>
          </div>

          {/* Changer de plan */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
            <h2 className="text-lg font-bold text-[#2F2F2F] mb-4">Changer de plan</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleChangePlan('eclaireur')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  subscriptionData.currentPlan === 'eclaireur'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-[#D0CACA] bg-white hover:border-blue-400'
                }`}
              >
                <h3 className="font-semibold text-[#2F2F2F] mb-1">L'Éclaireur</h3>
                <p className="text-sm text-[#6B6B6B] mb-3">Éclaireur - Carte uniquement</p>
                <p className="text-lg font-bold text-blue-600">Gratuit</p>
                {subscriptionData.currentPlan === 'eclaireur' && (
                  <p className="text-xs text-blue-600 mt-2 font-semibold">✓ Plan actuel</p>
                )}
              </button>

              <button
                onClick={() => handleChangePlan('navigateur')}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  subscriptionData.currentPlan === 'navigateur'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-[#D0CACA] bg-white hover:border-blue-400'
                }`}
              >
                <h3 className="font-semibold text-[#2F2F2F] mb-1">Le Navigateur</h3>
                <p className="text-sm text-[#6B6B6B] mb-3">Navigateur - Accès complet</p>
                <p className="text-lg font-bold text-blue-600">19,99€/mois</p>
                {subscriptionData.currentPlan === 'navigateur' && (
                  <p className="text-xs text-blue-600 mt-2 font-semibold">✓ Plan actuel</p>
                )}
              </button>
            </div>
          </div>

          {/* Informations de facturation */}
          <div className="bg-white p-5 md:p-6 rounded-xl border border-[#4A403A]">
            <h2 className="text-lg font-bold text-[#2F2F2F] mb-4">Informations de facturation</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Nom</label>
                <input
                  type="text"
                  name="billingName"
                  value={subscriptionData.billingName}
                  onChange={handleSubscriptionChange}
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#2F2F2F] mb-2">Adresse e-mail de facturation</label>
                <input
                  type="email"
                  name="billingEmail"
                  value={subscriptionData.billingEmail}
                  onChange={handleSubscriptionChange}
                  className="w-full px-3 py-2 border border-[#D0CACA] rounded-lg focus:ring-2 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900">
                <strong>Prochaine facturation :</strong> 2 mars 2026
              </div>
            </div>

            <button
              onClick={() => alert('Modifications enregistrées')}
              className="mt-6 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Enregistrer les informations de facturation
            </button>
          </div>
        </div>
      )}

      {/* MODAL - Notification changement de plan */}
      {showPlanChangeNotification && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
            {/* Bouton fermer */}
            <button
              onClick={handleStayInSettings}
              className="absolute top-4 right-4 text-[#6B6B6B] hover:text-[#2F2F2F] transition-colors"
            >
              <X size={24} />
            </button>

            {/* Contenu du modal */}
            <div className="flex flex-col items-center text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-100 rounded-full mb-4 ring-1 ring-blue-300">
                <AlertCircle className="w-7 h-7 text-blue-600" />
              </div>

              <h2 className="text-xl font-bold text-[#2F2F2F] mb-2">Plan changé avec succès ! 🎉</h2>
              
              <p className="text-[#6B6B6B] text-sm mb-6">
                Pour enregistrer votre cartographie dans la BDD, veuillez relancer un nouveau scan.
              </p>

              <div className="w-full space-y-3">
                <button
                  onClick={handleGoToMap}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                >
                  Aller à la cartographie
                </button>
                <button
                  onClick={handleStayInSettings}
                  className="w-full bg-[#FAF0E6] hover:bg-[#EFE5D6] text-[#2F2F2F] font-semibold py-3 px-4 rounded-lg transition-colors border border-[#D0CACA]"
                >
                  Rester ici
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
