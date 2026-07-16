import pytest

from app.rules.roster import MAX_PARTY_SIZE, PartyFullError, assert_can_join_party


def test_allows_joining_when_below_max():
    for count in range(MAX_PARTY_SIZE):
        assert_can_join_party(count)


def test_rejects_joining_when_at_max():
    with pytest.raises(PartyFullError):
        assert_can_join_party(MAX_PARTY_SIZE)
