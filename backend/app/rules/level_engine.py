"""Motor de regras de level/XP.

PLACEHOLDER: as regras oficiais da mesa ainda não foram definidas pelo
usuário. A fórmula abaixo é um substituto simples só para o sistema
funcionar ponta a ponta. Quando as regras reais chegarem, troque apenas
`xp_to_next_level_for` e `apply_xp` — o resto do backend (endpoints,
persistência) não precisa mudar, pois a interface pública permanece a
mesma.
"""

from dataclasses import dataclass

from app.models import Pokemon


def xp_to_next_level_for(level: int) -> int:
    """XP necessário para sair de `level` para `level + 1`."""
    return 100 * level


@dataclass
class LevelUpResult:
    pokemon: Pokemon
    levels_gained: int
    leveled_up: bool


def apply_xp(pokemon: Pokemon, xp_gained: int) -> LevelUpResult:
    """Aplica XP ganho em batalha a um pokémon, subindo de nível quando aplicável.

    XP excedente é levado para o próximo nível (não é descartado).
    """
    remaining_xp = pokemon.current_xp + xp_gained
    level = pokemon.level
    levels_gained = 0

    threshold = xp_to_next_level_for(level)
    while remaining_xp >= threshold:
        remaining_xp -= threshold
        level += 1
        levels_gained += 1
        threshold = xp_to_next_level_for(level)

    updated = pokemon.model_copy(
        update={
            "level": level,
            "current_xp": remaining_xp,
            "xp_to_next_level": threshold,
        }
    )

    return LevelUpResult(pokemon=updated, levels_gained=levels_gained, leveled_up=levels_gained > 0)
