from app.models import Pokemon
from app.rules.level_engine import apply_xp, xp_to_next_level_for


def make_pokemon(**overrides) -> Pokemon:
    base = dict(
        id="p1",
        nickname="Sparky",
        species="Pikachu",
        level=1,
        current_xp=0,
        xp_to_next_level=xp_to_next_level_for(1),
        current_hp=20,
        max_hp=20,
    )
    base.update(overrides)
    return Pokemon(**base)


def test_apply_xp_without_leveling_up():
    pokemon = make_pokemon(current_xp=10)
    result = apply_xp(pokemon, xp_gained=20)

    assert result.leveled_up is False
    assert result.levels_gained == 0
    assert result.pokemon.level == 1
    assert result.pokemon.current_xp == 30


def test_apply_xp_levels_up_once_with_carry_over():
    pokemon = make_pokemon(level=1, current_xp=90)
    result = apply_xp(pokemon, xp_gained=30)

    assert result.leveled_up is True
    assert result.levels_gained == 1
    assert result.pokemon.level == 2
    # Nível 1 -> 2 custa 100 xp; sobram 20 no novo nível
    assert result.pokemon.current_xp == 20
    assert result.pokemon.xp_to_next_level == xp_to_next_level_for(2)


def test_apply_xp_can_level_up_multiple_times():
    pokemon = make_pokemon(level=1, current_xp=0)
    # 100 (nível 1->2) + 200 (nível 2->3) = 300 exatos para dois níveis
    result = apply_xp(pokemon, xp_gained=300)

    assert result.levels_gained == 2
    assert result.pokemon.level == 3
    assert result.pokemon.current_xp == 0
