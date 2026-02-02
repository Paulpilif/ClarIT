import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './Components/Layout';
import { AppStoreProvider, useAppStore } from './contexts/AppStore';
import HomePage from './Pages/HomePage';
import PricingPage from './Pages/PricingPage';
import DashboardPage from './Pages/DashboardPage';
import InventoryPage from './Pages/InventoryPage';
import MapPage from './Pages/MapPage';
import SettingsPage from './Pages/SettingsPage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';

function AppContent() {
  const navigate = useNavigate();
  const { auth_status, login, logout } = useAppStore();

  const handleLogin = () => {
    login();
    navigate('/map'); // Rediriger vers la cartographie
  };

  const handleLogout = () => {
    console.log("Déconnexion en cours...");
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('currentUser');
    logout();
    // L'état isAuthenticated étant passé à false, 
    // le routeur affichera automatiquement le bloc (!isAuthenticated)
  };

  return (
    <Routes>
      {/* Pages publiques */}
      <Route path="/" element={<HomePage />} />
      <Route path="/pricing" element={<PricingPage />} />
    
      {/* Login/Register: redirect if already authenticated */}
      {!auth_status ? (
        <>
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      ) : (
        <>
          <Route path="/login" element={<Navigate to="/map" replace />} />
          <Route path="/register" element={<Navigate to="/map" replace />} />
        </>
      )}

      {/* Routes protégées */}
      {auth_status ? (
        <Route element={<Layout onLogout={handleLogout} />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Route>
      ) : null}
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppStoreProvider>
        <AppContent />
      </AppStoreProvider>
    </BrowserRouter>
  );
}