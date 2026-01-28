import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import DashboardPage from './Pages/DashboardPage';
import MapPage from './Pages/MapPage';
import SettingsPage from './Pages/SettingsPage';
import LoginPage from './Pages/LoginPage';
import RegisterPage from './Pages/RegisterPage';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Au démarrage, on regarde si on est déjà connecté
  useEffect(() => {
    const auth = localStorage.getItem('isAuthenticated');
    if (auth === 'true') setIsAuthenticated(true);
  }, []);

  const handleLogin = () => setIsAuthenticated(true);

  const handleLogout = () => {
    console.log("Déconnexion en cours...");
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
    // L'état isAuthenticated étant passé à false, 
    // le routeur affichera automatiquement le bloc (!isAuthenticated)
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Si pas connecté, on montre uniquement le login et register */}
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          /* Si connecté, on montre le Layout avec le Dashboard */
          <Route element={<Layout onLogout={handleLogout} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}