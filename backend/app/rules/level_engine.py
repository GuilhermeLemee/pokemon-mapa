"""Motor de regras de level/XP/vida, baseado nas regras oficiais da mesa:

- XP para o próximo nível = 15 x nível
- Vida máxima = 5 x nível (ver também battle_engine.max_hp_for_level)

Ao subir de nível, a vida máxima aumenta e o pokémon é curado pelo mesmo
delta (convenção comum de RPG), sem passar do novo máximo.
"""

from dataclasses import dataclass

from app.models import Pokemon
from app.rules.battle_engine import max_hp_for_level


def xp_to_next_level_for(level: int) -> int:
    """XP necessário para sair de `level` para `level + 1`."""
    return 15 * level


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

    new_max_hp = max_hp_for_level(level)
    hp_delta = new_max_hp - pokemon.max_hp
    new_current_hp = min(new_max_hp, pokemon.current_hp + max(0, hp_delta))

    updated = pokemon.model_copy(
        update={
            "level": level,
            "current_xp": remaining_xp,
            "xp_to_next_level": threshold,
            "max_hp": new_max_hp,
            "current_hp": new_current_hp,
        }
    )

    return LevelUpResult(pokemon=updated, levels_gained=levels_gained, leveled_up=levels_gained > 0)
