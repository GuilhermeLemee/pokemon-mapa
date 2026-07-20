import { GLASS_CARD } from "../lib/ui";

export function PokedexPage() {
  return (
    <div className={`${GLASS_CARD} space-y-2 p-6 text-center`}>
      <h1 className="text-xl font-semibold text-accent-200">Pokédex</h1>
      <p className="text-sm text-accent-500">
        Em breve — um catálogo pra consultar qualquer pokémon, seus tipos e golpes.
      </p>
    </div>
  );
}
