import { useState } from "react";
import { UserPlus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface RegisterPageProps {
  onRegisterSuccess?: () => void;
}

export default function RegisterPage({ onRegisterSuccess }: RegisterPageProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    // Validations
    if (!username.trim()) {
      setError("Veuillez entrer un nom d'utilisateur");
      setIsSubmitting(false);
      return;
    }

    if (username.length < 3) {
      setError("Le nom d'utilisateur doit contenir au moins 3 caractères");
      setIsSubmitting(false);
      return;
    }

    if (!password) {
      setError("Veuillez entrer un mot de passe");
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
        }),
      });

      if (!response.ok) {
        let apiError = "";
        try {
          const errorBody = await response.json();
          if (typeof errorBody?.error === "string") {
            apiError = errorBody.error;
          }
        } catch {
          // ignore JSON parsing errors
        }

        if (response.status === 409 || apiError === "user_exists") {
          setError("Ce nom d'utilisateur existe déjà");
        } else if (
          response.status === 400 ||
          apiError === "missing_credentials"
        ) {
          setError("Informations manquantes ou invalides");
        } else {
          setError("Erreur lors de la création du compte");
        }
        setIsSubmitting(false);
        return;
      }

      const data = await response.json();
      if (data?.apiToken) {
        localStorage.setItem("apiToken", data.apiToken);
      }

      setSuccess("Compte créé avec succès ! Redirection vers la connexion...");
      setUsername("");
      setPassword("");
      setConfirmPassword("");

      // Rediriger vers la page de login après 2 secondes
      setTimeout(() => {
        navigate("/login");
        if (onRegisterSuccess) onRegisterSuccess();
      }, 2000);
    } catch {
      setError("Erreur réseau.");
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        backgroundColor: "#020617",
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 50,
      }}
    >
      <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-800 p-8 m-4">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-900/20 rounded-full mb-4 ring-1 ring-emerald-500/30">
            <UserPlus className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Créer un compte</h1>
          <p className="text-slate-400 text-sm mt-2">
            Inscrivez-vous pour accéder à ClarIT
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none disabled:opacity-50"
              placeholder="Ex: john_doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSubmitting}
              className="w-full bg-[#1e293b] border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-600 outline-none disabled:opacity-50"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/20 py-3 rounded border border-red-900/30">
              {error}
            </div>
          )}

          {success && (
            <div className="text-emerald-400 text-sm text-center bg-emerald-900/20 py-3 rounded border border-emerald-900/30">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
          >
            {isSubmitting ? "Création..." : "S'inscrire"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-800">
          <button
            onClick={() => navigate("/login")}
            className="w-full flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            Retour à la connexion
          </button>
        </div>
      </div>
    </div>
  );
}
