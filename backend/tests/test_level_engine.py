from app.models import Pokemon
from app.rules.battle_engine import max_hp_for_level
from app.rules.level_engine import apply_xp, xp_to_next_level_for


def make_pokemon(**overrides) -> Pokemon:
    base = dict(
        id="p1",
        nickname="Sparky",
        species="Pikachu",
        level=1,
        current_xp=0,
        xp_to_next_level=xp_to_next_level_for(1),
        current_hp=max_hp_for_level(1),
        max_hp=max_hp_for_level(1),
    )
    base.update(overrides)
    return Pokemon(**base)


def test_apply_xp_without_leveling_up():
    pokemon = make_pokemon(current_xp=5)
    result = apply_xp(pokemon, xp_gained=5)

    assert result.leveled_up is False
    assert result.levels_gained == 0
    assert result.pokemon.level == 1
    assert result.pokemon.current_xp == 10


def test_apply_xp_levels_up_once_with_carry_over():
    pokemon = make_pokemon(level=1, current_xp=10)
    result = apply_xp(pokemon, xp_gained=10)

    assert result.leveled_up is True
    assert result.levels_gained == 1
    assert result.pokemon.level == 2
    # Nível 1 -> 2 custa 15 xp; sobram 5 no novo nível
    assert result.pokemon.current_xp == 5
    assert result.pokemon.xp_to_next_level == xp_to_next_level_for(2)
    # Vida máxima e atual sobem junto (5 x nível)
    assert result.pokemon.max_hp == max_hp_for_level(2)
    assert result.pokemon.current_hp == max_hp_for_level(2)


def test_apply_xp_can_level_up_multiple_times():
    pokemon = make_pokemon(level=1, current_xp=0)
    # 15 (nível 1->2) + 30 (nível 2->3) = 45 exatos para dois níveis
    result = apply_xp(pokemon, xp_gained=45)

    assert result.levels_gained == 2
    assert result.pokemon.level == 3
    assert result.pokemon.current_xp == 0
    assert result.pokemon.max_hp == max_hp_for_level(3)
