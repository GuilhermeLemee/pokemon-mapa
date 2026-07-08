import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../lib/types";

export function Layout() {
  const { player, logout } = useAuth();
  const isStaff = player && STAFF_ROLES.includes(player.role);

  return (
    <div className="relative z-10 min-h-screen">
      <header className="border-b border-accent-500/15 bg-bg-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold text-accent-200">
            Pokémon Mapa
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isStaff && (
              <Link to="/admin" className="text-accent-300 hover:text-accent-200 hover:underline">
                Painel do Mestre
              </Link>
            )}
            <span className="text-accent-500">{player?.display_name}</span>
            <button onClick={() => logout()} className="text-accent-500 hover:text-accent-300 hover:underline">
              Sair
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
