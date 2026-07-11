import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PokeballSpinner } from "../components/PokeballSpinner";
import { ACCENT_BUTTON, FIELD_INPUT } from "../lib/ui";

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
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="login-card w-full">
          {/* Traço de luz e cantoneiras ficam DENTRO do card, na mesma célula
              de grid que o conteúdo — assim têm sempre o mesmo tamanho exato
              do card (herdando a flutuação também), sem "descolar". */}
          <div className="login-card-ring" aria-hidden="true" />
          <span className="corner-mark -top-[3px] -left-[3px]" aria-hidden="true" />
          <span className="corner-mark -top-[3px] -right-[3px]" aria-hidden="true" />
          <span className="corner-mark -bottom-[3px] -left-[3px]" aria-hidden="true" />
          <span className="corner-mark -right-[3px] -bottom-[3px]" aria-hidden="true" />

          <div className="login-card-content relative space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <PokeballSpinner size={32} />
              <p className="text-sm font-medium text-accent-500">Pokémon Mapa</p>
              <h1 className="text-2xl font-semibold text-accent-200">Entre no mundo Pokémon</h1>
            </div>

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
          </div>
        </form>
      </div>
    </div>
  );
}
