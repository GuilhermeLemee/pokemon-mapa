import pytest

from app.rules.starters import STARTER_SPECIES, InvalidStarterError, assert_valid_starter


def test_allows_every_known_starter():
    for species in STARTER_SPECIES:
        assert_valid_starter(species)


def test_allows_case_insensitive():
    assert_valid_starter("Bulbasaur")


def test_rejects_non_starter():
    with pytest.raises(InvalidStarterError):
        assert_valid_starter("mewtwo")
