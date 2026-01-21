import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage";
import HostsPage from "./Pages/HostsPage";
import LoginPage from "./Pages/LoginPage";
import HostDetailsPage from "./Pages/HostDetailsPage";
import MapPage from "./Pages/MapPage";

export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: "flex", gap: 12 }}>
        <Link to="/">Dashboard</Link>
        <Link to="/hosts">Machines</Link>
        <Link to="/login">Login</Link>
        <Link to="/map">Cartographie</Link>

      </nav>

      <Routes>

        <Route path="/map" element={<MapPage />} />       
        <Route path="/" element={<DashboardPage />} />
        <Route path="/hosts" element={<HostsPage />} />
        <Route path="/hosts/:id" element={<HostDetailsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  );
}
