export function PokeMartPage() {
  return (
    <div className="rounded-3xl border border-black/5 bg-white p-10 text-center shadow-[0_16px_40px_-20px_rgba(0,0,0,0.35)]">
      <div
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "#dc0a2d14", color: "#dc0a2d" }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5 4.4 4.7A1 1 0 0 1 5.36 4h13.28a1 1 0 0 1 .96.7L21 9.5" />
          <path d="M4 9.5v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
          <path d="M3 9.5h18" />
          <path d="M9 19.5V14h6v5.5" />
        </svg>
      </div>
      <h1 className="text-xl font-black text-neutral-900">PokéMart</h1>
      <p className="mx-auto mt-2 max-w-sm text-sm text-neutral-500">
        Em breve — gaste suas Pokémon Coins em pokébolas, poções e itens para a sua jornada.
      </p>
    </div>
  );
}
