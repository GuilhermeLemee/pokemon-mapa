import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../lib/types";
import { PokeballSpinner } from "./PokeballSpinner";

const NAV_ITEMS = [
  { to: "/", label: "Início" },
  { to: "/battles", label: "Batalhas" },
  { to: "/admin", label: "Painel do Mestre", staffOnly: true },
];

export function Layout() {
  const { player, logout } = useAuth();
  const { pathname } = useLocation();
  const isStaff = player && STAFF_ROLES.includes(player.role);

  return (
    <div className="relative z-10 flex min-h-screen flex-col sm:flex-row">
      <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-accent-500/15 bg-bg-950/70 p-2 backdrop-blur-md sm:w-48 sm:flex-col sm:items-stretch sm:gap-2 sm:border-b-0 sm:border-r sm:p-4">
        <Link to="/" className="mb-2 hidden items-center gap-2 px-2 text-lg font-semibold text-accent-200 sm:flex">
          <PokeballSpinner size={22} />
          Pokémon Mapa
        </Link>
        {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-accent-300/15 font-medium text-accent-200"
                  : "text-accent-500 hover:bg-accent-300/5 hover:text-accent-300"
              }`}
            >
              <PokeballSpinner size={16} spin={false} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => logout()}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm text-accent-500 hover:bg-accent-300/5 hover:text-accent-300 sm:mt-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Sair
        </button>
        {player && <span className="hidden px-3 pt-2 text-xs text-accent-500 sm:block">{player.display_name}</span>}
      </nav>
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
