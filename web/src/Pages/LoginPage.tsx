import { useState } from "react";
import { Shield, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LoginPageProps {
  onLogin: () => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      // Appel à l'API d'authentification
      const response = await fetch(`${apiBaseUrl}/api/v1/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Erreur lors de la connexion");
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem("auth_status", "true");
      localStorage.setItem("api_token", data.apiToken);
      localStorage.setItem("currentUser", data.companyName);
      onLogin();
      navigate("/map");
    } catch (err) {
      setError(
        `Erreur de connexion au serveur. Assurez-vous que le serveur d'authentification est démarré. ${err}`,
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // Le style inline garantit que le fond prend tout l'écran, même sur mobile
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#0F1117",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      {/* w-full + max-w-md + m-4 : Assure que la carte ne touche pas les bords sur mobile */}
      <div className="w-full max-w-md bg-[#161B22] rounded-2xl shadow-2xl border border-[#30363D] p-8 m-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/20 rounded-full mb-4 ring-1 ring-blue-500/30">
            <Shield className="w-8 h-8 text-[#3B82F6]" />
          </div>
          <h1 className="text-2xl font-bold text-[#E6EDF3]">Accès ClarIT</h1>
          <p className="text-[#8B949E] text-sm mt-2">
            Zone d'administration sécurisée
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Identifiant
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-[#21262D] border border-[#30363D] text-[#E6EDF3] rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none"
              placeholder="Ex: ClarIT"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#E6EDF3] mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#21262D] border border-[#30363D] text-[#E6EDF3] rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-600 outline-none"
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
            className="w-full bg-[#1E40AF] hover:bg-[#1e3a8a] text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-blue-900/20"
          >
            {isSubmitting ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#30363D] space-y-4">
          <p className="text-[#8B949E] text-sm text-center mb-4">
            Pas encore de compte ?
          </p>
          <button
            onClick={() => navigate("/register")}
            className="w-full flex items-center justify-center gap-2 bg-[#21262D]/50 hover:bg-[#21262D] text-[#E6EDF3] font-medium py-3 rounded-lg transition-colors border border-[#30363D]"
          >
            <UserPlus size={18} />
            <span>S'inscrire</span>
          </button>

          <button
            onClick={() => navigate("/")}
            className="w-full flex items-center justify-center gap-2 bg-transparent hover:bg-[#21262D] text-[#8B949E] hover:text-[#E6EDF3] font-medium py-3 rounded-lg transition-colors border border-[#30363D]"
          >
            <span>Revenir à l'accueil</span>
          </button>
        </div>
      </div>
    </div>
  );
}
