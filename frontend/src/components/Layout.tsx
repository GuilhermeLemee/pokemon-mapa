import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../lib/types";

export function Layout() {
  const { player, logout } = useAuth();
  const isStaff = player && STAFF_ROLES.includes(player.role);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="font-semibold text-slate-900 dark:text-white">
            Pokémon Mapa
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {isStaff && (
              <Link to="/admin" className="text-indigo-600 dark:text-indigo-400 hover:underline">
                Painel do Mestre
              </Link>
            )}
            <span className="text-slate-500 dark:text-slate-400">{player?.display_name}</span>
            <button onClick={() => logout()} className="text-slate-500 dark:text-slate-400 hover:underline">
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
