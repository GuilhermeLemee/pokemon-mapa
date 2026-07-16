MAX_PARTY_SIZE = 6


class PartyFullError(Exception):
    pass


def assert_can_join_party(current_count: int) -> None:
    if current_count >= MAX_PARTY_SIZE:
        raise PartyFullError(f"A party já tem o máximo de {MAX_PARTY_SIZE} pokémons.")
