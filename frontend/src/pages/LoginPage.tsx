import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ACCENT_BUTTON, FIELD_INPUT, GLASS_CARD } from "../lib/ui";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Email ou senha inválidos.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className={`${GLASS_CARD} w-full max-w-sm space-y-4 p-8`}>
        <h1 className="text-2xl font-semibold text-accent-200">Pokémon Mapa</h1>
        <p className="text-sm text-accent-500">Entre com sua conta de treinador.</p>

        <div className="space-y-1">
          <label className="text-sm font-medium text-accent-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium text-accent-300">Senha</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={FIELD_INPUT}
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button type="submit" disabled={submitting} className={`w-full ${ACCENT_BUTTON}`}>
          {submitting ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
