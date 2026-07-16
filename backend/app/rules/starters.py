"""Pokémons iniciais disponíveis pra escolha única de jogador novo — os 27
clássicos (grama/fogo/água) de todas as gerações principais, de qualquer
região."""


class InvalidStarterError(Exception):
    pass


STARTER_SPECIES: set[str] = {
    # Geração 1 — Kanto
    "bulbasaur",
    "charmander",
    "squirtle",
    # Geração 2 — Johto
    "chikorita",
    "cyndaquil",
    "totodile",
    # Geração 3 — Hoenn
    "treecko",
    "torchic",
    "mudkip",
    # Geração 4 — Sinnoh
    "turtwig",
    "chimchar",
    "piplup",
    # Geração 5 — Unova
    "snivy",
    "tepig",
    "oshawott",
    # Geração 6 — Kalos
    "chespin",
    "fennekin",
    "froakie",
    # Geração 7 — Alola
    "rowlet",
    "litten",
    "popplio",
    # Geração 8 — Galar
    "grookey",
    "scorbunny",
    "sobble",
    # Geração 9 — Paldea
    "sprigatito",
    "fuecoco",
    "quaxly",
}


def assert_valid_starter(species: str) -> None:
    if species.strip().lower() not in STARTER_SPECIES:
        raise InvalidStarterError(f"'{species}' não é um pokémon inicial válido.")
