import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './Components/Layout';
import DashboardPage from './Pages/DashboardPage';
import MapPage from './Pages/MapPage';
import SettingsPage from './Pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Le Layout enveloppe toutes les pages */}
        <Route element={<Layout />}>
          
          {/* Redirection par défaut : si on arrive sur "/", on va au dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/settings" element={<SettingsPage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}