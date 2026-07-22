import type { ReactNode } from "react";

/**
 * Símbolos (glifos brancos) de cada tipo de Pokémon, desenhados como SVG
 * próprios para ficarem sobre o círculo colorido do tipo. Aproximações simples
 * e reconhecíveis — a cor do círculo reforça o tipo.
 */
const GLYPHS: Record<string, ReactNode> = {
  normal: <circle cx="12" cy="12" r="5" fill="#fff" />,
  fire: (
    <path
      d="M13 2c.4 3.4 3.3 4.7 3.3 8A4.3 4.3 0 0 1 7.5 12c0-1.2.4-2.1 1-2.9.8 1.3 2.2 1 2.1-.9C10.4 6.6 11.6 4.1 13 2Z"
      fill="#fff"
    />
  ),
  water: (
    <path d="M12 3.4c3.1 3.7 5.3 6.8 5.3 9.6a5.3 5.3 0 0 1-10.6 0c0-2.8 2.2-5.9 5.3-9.6Z" fill="#fff" />
  ),
  electric: <path d="M13.6 2 6 13h4.3l-1.5 9 8.4-12h-4.7l2.1-8Z" fill="#fff" />,
  grass: (
    <>
      <path d="M19.5 4.5C10 4.5 4.5 10 4.5 18.5c0 .6.4 1 1 1 8.5 0 14-5.5 14-15Z" fill="#fff" />
      <path d="M8 16.5C11 13.5 14.2 9.8 17.2 7.2" stroke="#c9c9c9" strokeWidth="1.3" fill="none" strokeLinecap="round" />
    </>
  ),
  ice: (
    <g stroke="#fff" strokeWidth="1.7" strokeLinecap="round">
      <path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5 4.2 16.5" />
    </g>
  ),
  fighting: (
    <path d="M8 9a1.6 1.6 0 0 1 3.2 0v.4a1.6 1.6 0 0 1 3.1-.4v.6a1.7 1.7 0 0 1 3.2.5v3.5a4.2 4.2 0 0 1-4.2 4.2h-1.6A4.2 4.2 0 0 1 7.5 13l-1.9-2.1a1.3 1.3 0 0 1 1.8-1.8L8 9.6Z" fill="#fff" />
  ),
  poison: (
    <>
      <path d="M12 4.2c3 2.6 5 5.1 5 8a5 5 0 0 1-10 0c0-2.9 2-5.4 5-8Z" fill="#fff" />
      <path d="M10 13c.6 1.4 3 1.6 4 .2" stroke="#b0b0b0" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </>
  ),
  ground: <path d="M3 18 9 8l3.4 5L15 9l6 9Z" fill="#fff" />,
  flying: <path d="M3 11c6-2.6 12.2-1.6 18 2.6-5-.4-9.2 1.5-12.7 4.6C8 14.2 6 12.6 3 11Z" fill="#fff" />,
  psychic: (
    <>
      <path d="M12 4a8 8 0 1 1-5.7 2.4" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2.3" fill="#fff" />
    </>
  ),
  bug: (
    <>
      <ellipse cx="12" cy="14" rx="4.4" ry="5.4" fill="#fff" />
      <path d="M12 8.6V5.2M9 6.4 7.4 4.3M15 6.4l1.6-2.1" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M7.7 12.5h8.6M7.7 15.3h8.6" stroke="#bdbdbd" strokeWidth="1" />
    </>
  ),
  rock: <path d="M7 8l5-3.6L17 8v6l-5 3.6L7 14Z" fill="#fff" />,
  ghost: (
    <>
      <path d="M6 12a6 6 0 0 1 12 0v6.2l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5Z" fill="#fff" />
      <circle cx="10" cy="11.6" r="1.1" fill="#6b6b6b" />
      <circle cx="14" cy="11.6" r="1.1" fill="#6b6b6b" />
    </>
  ),
  dragon: (
    <>
      <path d="M4 8.5c4.2-1.2 7.4.1 9.4 3.2 1-1 2.9-1 4 .1-1 .5-1.5 1.4-1.5 2.5-2.6.7-6.2.5-8.2-1.6-1 1-2.6 1.1-3.2.4C5.4 10.2 5 9.3 4 8.5Z" fill="#fff" />
      <circle cx="7.3" cy="10.2" r="0.9" fill="#7a7a7a" />
    </>
  ),
  dark: (
    <>
      <circle cx="12.3" cy="12" r="7.2" fill="#fff" />
      <circle cx="15.6" cy="8.9" r="5.8" fill="#705848" />
    </>
  ),
  steel: (
    <>
      <path d="M8.6 3.6h6.8L20.4 8.6v6.8l-5 5H8.6l-5-5V8.6Z" fill="#fff" />
      <circle cx="12" cy="12" r="2.6" fill="#8a8a8a" />
    </>
  ),
  fairy: <path d="M12 3l1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9Z" fill="#fff" />,
};

export function TypeIcon({ type, className }: { type: string | null | undefined; className?: string }) {
  const key = (type ?? "").toLowerCase();
  const glyph = GLYPHS[key] ?? <circle cx="12" cy="12" r="5" fill="#fff" />;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {glyph}
    </svg>
  );
}
