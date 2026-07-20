import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { STAFF_ROLES, type BattleRoom } from "../lib/types";
import { PokeballSpinner } from "./PokeballSpinner";

function TrainerIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21v-1a7 7 0 0 1 14 0v1" />
    </svg>
  );
}

function SwordsIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" />
      <line x1="13" y1="19" x2="19" y2="13" />
      <line x1="16" y1="16" x2="20" y2="20" />
      <line x1="19" y1="21" x2="21" y2="19" />
      <polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" />
      <line x1="5" y1="14" x2="9" y2="18" />
      <line x1="7" y1="17" x2="4" y2="20" />
      <line x1="3" y1="19" x2="5" y2="21" />
    </svg>
  );
}

function StoreIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 4.4 4.7A1 1 0 0 1 5.36 4h13.28a1 1 0 0 1 .96.7L21 9.5" />
      <path d="M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
      <path d="M3 9.5h18" />
      <path d="M9 19.5V14h6v5.5" />
    </svg>
  );
}

function CrownIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 5 4.5 3.5L12 3l5.5 5.5L22 5l-2 13H4L2 5Z" />
      <path d="M5 21h14" />
    </svg>
  );
}

const NAV_ITEMS = [
  { to: "/", label: "Treinador", icon: TrainerIcon },
  { to: "/battles", label: "Batalhas", icon: SwordsIcon, notifiable: true },
  { to: "/pokemart", label: "PokéMart", icon: StoreIcon },
  { to: "/admin", label: "Mestre", icon: CrownIcon, staffOnly: true },
];

export function Layout() {
  const { player, logout } = useAuth();
  const { pathname } = useLocation();
  const isStaff = player && STAFF_ROLES.includes(player.role);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (!player) return;
    api.get<BattleRoom[]>("/battles").then((rooms) => {
      const pending = rooms.filter(
        (r) =>
          (r.status === "pending_approval" && isStaff) ||
          (r.status === "pending_accept" && r.side_a.uid === player.uid),
      );
      setPendingCount(pending.length);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  return (
    <div className="relative z-10 flex min-h-screen flex-col gap-3 bg-slate-100 p-3 sm:flex-row">
      <nav className="flex shrink-0 items-center gap-2 overflow-x-auto rounded-3xl border border-white/10 bg-gradient-to-b from-neutral-900 to-black p-3 shadow-2xl sm:w-24 sm:flex-col sm:items-stretch sm:gap-3 sm:overflow-visible sm:py-6">
        <Link
          to="/"
          className="mb-1 hidden h-12 w-12 items-center justify-center self-center rounded-full bg-white shadow-[inset_0_-2px_4px_rgba(0,0,0,0.15),0_4px_10px_rgba(0,0,0,0.4)] sm:flex"
        >
          <PokeballSpinner size={26} />
        </Link>

        {NAV_ITEMS.filter((item) => !item.staffOnly || isStaff).map((item) => {
          const active = pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className="group relative flex shrink-0 flex-col items-center gap-1 px-1"
            >
              <span
                className={`relative flex h-12 w-12 items-center justify-center rounded-full transition-all ${
                  active
                    ? "bg-white text-neutral-900 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1),0_4px_12px_rgba(0,0,0,0.35)]"
                    : "bg-white/10 text-white/70 shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] group-hover:bg-white/20 group-hover:text-white"
                }`}
              >
                <Icon />
                {item.notifiable && pendingCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-black bg-red-500 text-[10px] font-bold text-white">
                    {pendingCount}
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-medium ${active ? "text-white" : "text-white/50"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        <button
          onClick={() => logout()}
          className="mt-1 flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-[#e5153a] to-[#c00822] px-3 py-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_4px_10px_rgba(0,0,0,0.35)] sm:mt-auto"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M16 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-[10px] font-bold tracking-wide">SAIR</span>
        </button>
      </nav>
      <main className="mx-auto w-full max-w-4xl flex-1 pb-6">
        <Outlet />
      </main>
    </div>
  );
}
