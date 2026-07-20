import type { ReactNode } from "react";

type Badge = { id: string; name: string; svg: ReactNode };

const KANTO_BADGES: Badge[] = [
  {
    id: "boulder",
    name: "Pedra",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <polygon
          points="16,5 32,5 43,16 43,32 32,43 16,43 5,32 5,16"
          fill="#c3c7ce"
          stroke="#5b616b"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <polygon
          points="19,13 29,13 35,19 35,29 29,35 19,35 13,29 13,19"
          fill="#eef0f3"
          stroke="#9aa0a9"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    id: "cascade",
    name: "Cascata",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <path
          d="M24 5 C24 5 39 24 39 32 A15 15 0 1 1 9 32 C9 24 24 5 24 5 Z"
          fill="#3fbaf3"
          stroke="#1878b4"
          strokeWidth="2"
        />
        <path d="M17 30 a7 7 0 0 0 7 9" fill="none" stroke="#e4f4fd" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "thunder",
    name: "Trovão",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <polygon
          points="44,24 31.4,27.1 38.1,38.1 27.1,31.4 24,44 20.9,31.4 9.9,38.1 16.6,27.1 4,24 16.6,20.9 9.9,9.9 20.9,16.6 24,4 27.1,16.6 38.1,9.9 31.4,20.9"
          fill="#f4a41b"
          stroke="#a2540a"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="24" r="7.5" fill="#f6771f" stroke="#a2540a" strokeWidth="1.5" />
        <path d="M22 20 l4 0 -5 8 z" fill="#ffe1a8" opacity="0.9" />
      </svg>
    ),
  },
  {
    id: "rainbow",
    name: "Arco-íris",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <g stroke="#3a3f47" strokeWidth="1">
          <circle cx="24" cy="9" r="7" fill="#e23b3b" />
          <circle cx="35" cy="14" r="7" fill="#f39a1e" />
          <circle cx="39" cy="24" r="7" fill="#f2d024" />
          <circle cx="35" cy="34" r="7" fill="#3fb357" />
          <circle cx="24" cy="39" r="7" fill="#3f86e2" />
          <circle cx="13" cy="34" r="7" fill="#6b57d6" />
          <circle cx="9" cy="24" r="7" fill="#9b46c9" />
          <circle cx="13" cy="14" r="7" fill="#e24397" />
        </g>
        <circle cx="24" cy="24" r="8" fill="#ffffff" stroke="#3a3f47" strokeWidth="1.5" />
        <rect x="21" y="21" width="6" height="6" rx="1" fill="#e2e5ea" stroke="#9aa0a9" />
      </svg>
    ),
  },
  {
    id: "soul",
    name: "Alma",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <path
          d="M24 43 C5 30 6 13 16 11 C21 10 24 15 24 18 C24 15 27 10 32 11 C42 13 43 30 24 43 Z"
          fill="#d5308a"
          stroke="#8f195b"
          strokeWidth="2"
        />
        <circle cx="17" cy="19" r="3" fill="#fbd0e7" opacity="0.85" />
      </svg>
    ),
  },
  {
    id: "marsh",
    name: "Pântano",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <circle cx="24" cy="24" r="19" fill="#f1c319" stroke="#8a640c" strokeWidth="2" />
        <circle cx="24" cy="24" r="11.5" fill="#f8de53" stroke="#b3830f" strokeWidth="2" />
        <circle cx="24" cy="24" r="4" fill="#fdf3b8" stroke="#b3830f" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    id: "volcano",
    name: "Vulcão",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <path
          d="M24 4 C20 12 13 15 13 25 C13 34 17 42 24 44 C31 42 35 34 35 25 C35 15 28 12 24 4 Z"
          fill="#d62828"
          stroke="#8f1414"
          strokeWidth="2"
        />
        <path d="M24 21 l6.5 8.5 -6.5 8.5 -6.5 -8.5 Z" fill="#f6a8cf" stroke="#b8296f" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "earth",
    name: "Terra",
    svg: (
      <svg viewBox="0 0 48 48" className="h-full w-full">
        <path
          d="M9 41 C9 20 26 7 41 7 C41 27 27 41 12 41 Z"
          fill="#43b95a"
          stroke="#1f7d36"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M14 39 C22 31 33 18 39 12" fill="none" stroke="#166534" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export function GymBadges({ earned }: { earned: string[] }) {
  const owns = (b: Badge) =>
    earned.some((e) => e.toLowerCase() === b.id || e.toLowerCase() === b.name.toLowerCase());

  return (
    <div className="grid grid-cols-4 gap-x-2 gap-y-4">
      {KANTO_BADGES.map((b) => {
        const owned = owns(b);
        return (
          <div key={b.id} className="flex flex-col items-center gap-1.5" title={b.name}>
            <div
              className={`h-11 w-11 transition duration-300 ${
                owned
                  ? "drop-shadow-[0_3px_5px_rgba(0,0,0,0.25)]"
                  : "opacity-25 grayscale"
              }`}
            >
              {b.svg}
            </div>
            <span className={`text-[10px] font-semibold ${owned ? "text-neutral-700" : "text-neutral-300"}`}>
              {b.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
