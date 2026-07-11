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
        className="relative h-44 bg-cover bg-[position:50%_48%] sm:h-56"
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
        <button
          onClick={() => logout()}
          title="Sair"
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-lg bg-bg-950/50 px-3 py-1.5 text-sm text-accent-300 backdrop-blur-sm hover:bg-bg-950/70 hover:text-accent-200 sm:top-4 sm:right-4"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sair
        </button>
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
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
