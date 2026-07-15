"""Motor de regras de batalha, baseado nas regras oficiais da mesa:

- Vida máxima = 5 x nível
- Ataque normal = 1 x nível do atacante
- Ataque com vantagem elemental = 2 x nível do atacante
- Ataque múltiplo: cada golpe causa 1/10 do nível do atacante
- Captura: vida do selvagem entre 35-100% exige vencer as 3 rodadas de dado;
  entre 1-34% exige vencer 2 de 3
- XP de vitória = 10 x nível do pokémon derrotado (o multiplicador 12x de
  líder de ginásio fica reservado para quando o catálogo de líderes existir)

Funções puras, sem I/O — fáceis de testar isoladas (ver test_battle_engine.py).
"""

import math


def max_hp_for_level(level: int) -> int:
    return 5 * level


def damage_for_attack(attacker_level: int, advantage: bool) -> int:
    return attacker_level * (2 if advantage else 1)


def damage_for_multi_hit(attacker_level: int, hit_count: int) -> int:
    """Dano total de um ataque múltiplo: cada golpe causa 1/10 do nível do atacante."""
    return round(attacker_level / 10 * hit_count)


def capture_required_wins(hp_percent: float) -> int | None:
    """Rodadas de dado que o jogador precisa vencer para capturar, dado o
    percentual de vida atual do selvagem. `None` se a captura não é possível
    nesse percentual (0% — já derrotado, ou fora da faixa 0-100)."""
    if hp_percent <= 0 or hp_percent > 100:
        return None
    if hp_percent < 35:
        return 2
    return 3


def xp_for_victory(defeated_level: int, is_gym_leader: bool = False) -> int:
    multiplier = 12 if is_gym_leader else 10
    return multiplier * defeated_level


def hp_percent(current_hp: int, max_hp: int) -> float:
    if max_hp <= 0:
        return 0.0
    return math.floor((current_hp / max_hp) * 10000) / 100
