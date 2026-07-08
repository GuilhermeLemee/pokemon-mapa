import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../lib/types";
import { PokeballSpinner } from "./PokeballSpinner";

export function Layout() {
  const { player, logout } = useAuth();
  const isStaff = player && STAFF_ROLES.includes(player.role);

  return (
    <div className="relative z-10 min-h-screen">
      <div
        className="relative h-44 bg-cover bg-[position:50%_30%] sm:h-56"
        style={{ backgroundImage: "url(/header.jpg)" }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-bg-950 via-bg-950/40 to-bg-950/10" />
        <Link
          to="/"
          className="absolute bottom-4 left-4 flex items-center gap-2 text-2xl font-semibold text-accent-200 drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)] sm:left-6"
        >
          <PokeballSpinner size={28} />
          Pokémon Mapa
        </Link>
      </div>
      <header className="border-b border-accent-500/15 bg-bg-950/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-end px-4 py-3">
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
