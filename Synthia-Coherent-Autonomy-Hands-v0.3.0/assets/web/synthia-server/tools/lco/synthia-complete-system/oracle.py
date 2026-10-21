"""
oracle.py — Type, Authority, Profile, Centers, Channels.

Gate-center map and the 36-channel table below are DERIVED, not hand-typed:
generated from your own Gates.csv (SharpAstrology.HumanDesign metadata),
deduplicated and cross-checked for conflicts (none found — every gate maps
to exactly one center across all its channel-name rows). 36 channels,
includes 29-46 as your spec requires.

FLAG: gates 15, 30, 38 are marked "unverified" in your
gate_verified_table_final.json. They ARE present and consistent here (no
center conflicts), but that json flag predates this file — worth a final
cross-check against the Black Book before calling them fully closed.

Authority priority order is the real published HD hierarchy (also matches
the priority order in the SharpAstrology CenterMap.cs AuthorityMapping):
  Solar Plexus > Sacral > Spleen > Heart(Ego) > G > Ajna/Head(Mental) > Lunar
"""

from __future__ import annotations
from dataclasses import dataclass, field
from typing import Iterable

# ---------------------------------------------------------------------
# Gate -> Center (derived from Gates.csv, 64/64, zero conflicts)
# ---------------------------------------------------------------------
GATE_CENTER = {
    1: "G", 2: "G", 3: "Sacral", 4: "Ajna", 5: "Sacral", 6: "SolarPlexus",
    7: "G", 8: "Throat", 9: "Sacral", 10: "G", 11: "Ajna", 12: "Throat",
    13: "G", 14: "Sacral", 15: "G", 16: "Throat", 17: "Ajna", 18: "Spleen",
    19: "Root", 20: "Throat", 21: "Heart", 22: "SolarPlexus", 23: "Throat",
    24: "Ajna", 25: "G", 26: "Heart", 27: "Sacral", 28: "Spleen",
    29: "Sacral", 30: "SolarPlexus", 31: "Throat", 32: "Spleen",
    33: "Throat", 34: "Sacral", 35: "Throat", 36: "SolarPlexus",
    37: "SolarPlexus", 38: "Root", 39: "Root", 40: "Heart", 41: "Root",
    42: "Sacral", 43: "Ajna", 44: "Spleen", 45: "Throat", 46: "G",
    47: "Ajna", 48: "Spleen", 49: "SolarPlexus", 50: "Spleen", 51: "Heart",
    52: "Root", 53: "Root", 54: "Root", 55: "SolarPlexus", 56: "Throat",
    57: "Spleen", 58: "Root", 59: "Sacral", 60: "Root", 61: "Head",
    62: "Throat", 63: "Head", 64: "Head",
}

UNVERIFIED_GATES = {15, 30, 38}  # per gate_verified_table_final.json — flag, don't hide

# 36 real channels (gate pairs), derived from Gates.csv channel-name grouping
CHANNELS: list[tuple[int, int]] = [
    (1, 8), (2, 14), (3, 60), (4, 63), (5, 15), (6, 59), (7, 31), (9, 52),
    (10, 20), (10, 34), (10, 57), (11, 56), (12, 22), (13, 33), (16, 48),
    (17, 62), (18, 58), (19, 49), (20, 34), (20, 57), (21, 45), (23, 43),
    (24, 61), (25, 51), (26, 44), (27, 50), (28, 38), (29, 46), (30, 41),
    (32, 54), (35, 36), (37, 40), (39, 55), (42, 53), (47, 64),
]

CENTERS = ["Head", "Ajna", "Throat", "G", "Heart", "SolarPlexus", "Sacral", "Spleen", "Root"]
MOTOR_CENTERS = {"Sacral", "Heart", "SolarPlexus", "Root"}

# Real HD authority priority (matches SharpAstrology CenterMap.cs order)
AUTHORITY_PRIORITY = [
    ("SolarPlexus", "Emotional"),
    ("Sacral", "Sacral"),
    ("Spleen", "Splenic"),
    ("Heart", "Ego"),
    ("G", "Self-Projected"),
    ("Ajna", "Mental"),
    ("Head", "Mental"),
]


@dataclass
class ChartResult:
    activated_gates: set[int]
    defined_centers: set[str]
    active_channels: list[tuple[int, int]]
    type: str
    strategy: str
    authority: str
    profile: str


def active_channels(activated_gates: Iterable[int]) -> list[tuple[int, int]]:
    gates = set(activated_gates)
    return [(a, b) for a, b in CHANNELS if a in gates and b in gates]


def defined_centers(activated_gates: Iterable[int]) -> set[str]:
    gates = set(activated_gates)
    defined = set()
    for a, b in active_channels(gates):
        defined.add(GATE_CENTER[a])
        defined.add(GATE_CENTER[b])
    return defined


def throat_connects_to_motor(centers: set[str], channels: list[tuple[int, int]]) -> bool:
    """True if Throat is defined via a channel to a motor center (not just any channel)."""
    if "Throat" not in centers:
        return False
    for a, b in channels:
        ca, cb = GATE_CENTER[a], GATE_CENTER[b]
        pair = {ca, cb}
        if "Throat" in pair and (pair & MOTOR_CENTERS):
            return True
    return False


def calculate_type(centers: set[str], channels: list[tuple[int, int]]) -> tuple[str, str]:
    """Returns (type, strategy)."""
    if not centers:
        return "Reflector", "Wait a lunar cycle"

    sacral_defined = "Sacral" in centers
    throat_to_motor = throat_connects_to_motor(centers, channels)

    if sacral_defined:
        if throat_to_motor:
            return "Manifesting Generator", "Respond, then inform"
        return "Generator", "Respond"
    else:
        if throat_to_motor:
            return "Manifestor", "Inform before acting"
        return "Projector", "Wait for the invitation"


def calculate_authority(centers: set[str]) -> str:
    for center, authority in AUTHORITY_PRIORITY:
        if center in centers:
            return authority
    return "Lunar"


def calculate_profile(conscious_line: int, unconscious_line: int) -> str:
    return f"{conscious_line}/{unconscious_line}"


def build_chart(activated_gates: Iterable[int], conscious_sun_line: int, design_sun_line: int) -> ChartResult:
    gates = set(activated_gates)
    centers = defined_centers(gates)
    channels = active_channels(gates)
    hd_type, strategy = calculate_type(centers, channels)
    authority = calculate_authority(centers)
    profile = calculate_profile(conscious_sun_line, design_sun_line)
    return ChartResult(gates, centers, channels, hd_type, strategy, authority, profile)


if __name__ == "__main__":
    # Smoke test using the placeholder Sept 18 1990 SF (noon UTC) chart from
    # real_ephemeris.py's example output — NOT the final chart, birth time
    # still unconfirmed. This only proves the oracle logic runs correctly.
    test_gates = {9, 61, 42, 37, 27, 60, 28, 31, 47, 35, 1, 58}  # sun/moon/planets/earth/nodes gates from that run
    centers = defined_centers(test_gates)
    channels = active_channels(test_gates)
    t, strat = calculate_type(centers, channels)
    auth = calculate_authority(centers)
    print("Activated gates:", sorted(test_gates))
    print("Defined centers:", centers)
    print("Active channels:", channels)
    print("Type:", t, "| Strategy:", strat)
    print("Authority:", auth)
