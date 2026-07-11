import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { PokeballSpinner } from "../components/PokeballSpinner";
import { ACCENT_BUTTON, FIELD_INPUT } from "../lib/ui";

export function LoginPage() {
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [resetError, setResetError] = useState<string | null>(null);

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

  const handleForgotPassword = async () => {
    setResetError(null);
    if (!email) {
      setResetError("Digite seu email acima primeiro.");
      return;
    }
    setResetStatus("sending");
    try {
      await resetPassword(email);
      setResetStatus("sent");
    } catch {
      setResetError("Não foi possível enviar o email. Confira o endereço e tente de novo.");
      setResetStatus("idle");
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

            <div className="flex justify-end">
              {resetStatus === "sent" ? (
                <p className="text-xs text-emerald-400">Link de redefinição enviado para {email}.</p>
              ) : (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetStatus === "sending"}
                  className="text-xs text-accent-500 hover:text-accent-300 hover:underline disabled:opacity-50"
                >
                  {resetStatus === "sending" ? "Enviando..." : "Esqueceu a senha?"}
                </button>
              )}
            </div>
            {resetError && <p className="text-xs text-red-400">{resetError}</p>}

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
