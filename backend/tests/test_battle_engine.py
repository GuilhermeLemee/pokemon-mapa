from app.rules.battle_engine import (
    capture_required_wins,
    damage_for_attack,
    damage_for_multi_hit,
    hp_percent,
    max_hp_for_level,
    xp_for_victory,
)


def test_max_hp_for_level():
    assert max_hp_for_level(1) == 5
    assert max_hp_for_level(20) == 100


def test_damage_for_normal_attack():
    assert damage_for_attack(attacker_level=10, advantage=False) == 10


def test_damage_for_advantage_attack():
    assert damage_for_attack(attacker_level=10, advantage=True) == 20


def test_damage_for_multi_hit():
    # 1/10 do nível por golpe, 3 golpes, nível 20 -> 2 por golpe * 3 = 6
    assert damage_for_multi_hit(attacker_level=20, hit_count=3) == 6


def test_damage_for_multi_hit_rounds():
    # 1/10 de 15 = 1.5 por golpe; 2 golpes = 3.0 -> arredonda pra 3
    assert damage_for_multi_hit(attacker_level=15, hit_count=2) == 3


def test_capture_requires_all_three_rounds_above_35_percent():
    assert capture_required_wins(35) == 3
    assert capture_required_wins(100) == 3


def test_capture_requires_two_of_three_below_35_percent():
    assert capture_required_wins(34) == 2
    assert capture_required_wins(1) == 2


def test_capture_not_possible_at_zero_or_above_100():
    assert capture_required_wins(0) is None
    assert capture_required_wins(101) is None


def test_hp_percent():
    assert hp_percent(current_hp=50, max_hp=100) == 50.0
    assert hp_percent(current_hp=0, max_hp=100) == 0.0
    assert hp_percent(current_hp=100, max_hp=0) == 0.0


def test_xp_for_victory():
    assert xp_for_victory(defeated_level=10) == 100
    assert xp_for_victory(defeated_level=10, is_gym_leader=True) == 120
