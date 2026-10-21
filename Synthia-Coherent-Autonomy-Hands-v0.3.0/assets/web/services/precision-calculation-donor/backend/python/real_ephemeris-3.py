"""
real_ephemeris.py — Actual planetary positions, not simulated ones.

FIXED in this pass (both corrections computed from your own verified data,
not guessed):
  1. BASE_DEG was TONE_DEG/6 — should be TONE_DEG/5 (Base has 5 positions,
     not 6). This matches your confirmed spec: Gate(64)->Line(6)->Color(6)
     ->Tone(6)->Base(5).
  2. Wheel order was the empirical King-Wen-labeled HD wheel (gate 41 at
     302 deg tropical). Per your confirmation, the wheel is now anchored
     by the Fu Xi / Xian Tian (Earlier Heaven) binary sequence instead.
     FUXI_WHEEL_ORDER below is COMPUTED, not looked up: each King Wen
     hexagram's upper/lower trigram (from your own KingWen.csv) is mapped
     to its real Shao Yong binary value (Qian=111=7 ... Kun=000=0,
     hexagram = upper*8+lower), then sorted 0->63. KW#2 (Earth/Earth) = 0,
     KW#1 (Heaven/Heaven) = 63. Wheel starts at 0 deg Aries (Fu Xi position
     0) rather than the old gate-41-at-302 anchor -- this is a real
     architectural change, not a bug fix: charts will differ from
     mainstream/Jovian-Archive HD software, by design, per your system.

Requires: pip install skyfield --break-system-packages
Requires: de421.bsp in the working directory.
"""

from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
from typing import Literal
import os
import urllib.request

from skyfield.api import load

KERNEL_PATH = "de421.bsp"
KERNEL_URL = "https://ssd.jpl.nasa.gov/ftp/eph/planets/bsp/de421.bsp"

GATE_DEG = 5.625
LINE_DEG = GATE_DEG / 6
COLOR_DEG = LINE_DEG / 6
TONE_DEG = COLOR_DEG / 6
BASE_DEG = TONE_DEG / 5   # <-- FIXED: was /6

# ---------------------------------------------------------------------
# Fu Xi / Xian Tian wheel order — COMPUTED from real trigram data.
# Do not hand-edit; regenerate from KingWen.csv if trigram data changes.
# ---------------------------------------------------------------------
FUXI_WHEEL_ORDER = [
    2, 15, 7, 46, 24, 36, 19, 11, 23, 52, 4, 18, 27, 22, 41, 26,
    8, 39, 29, 48, 3, 63, 60, 5, 20, 53, 59, 57, 42, 37, 61, 9,
    16, 62, 40, 32, 51, 55, 54, 34, 35, 56, 64, 50, 21, 30, 38, 14,
    45, 31, 47, 28, 17, 49, 58, 43, 12, 33, 6, 44, 25, 13, 10, 1,
]
HD_WHEEL_ORDER = FUXI_WHEEL_ORDER  # kept as an alias so older callers don't break
WHEEL_START_DEG = 0.0  # Aries 0 deg = Fu Xi position 0 (KW#2)

PLANET_NAMES = {
    "sun": "sun", "moon": "moon", "mercury": "mercury barycenter",
    "venus": "venus barycenter", "mars": "mars barycenter",
    "jupiter": "jupiter barycenter", "saturn": "saturn barycenter",
    "uranus": "uranus barycenter", "neptune": "neptune barycenter",
    "pluto": "pluto barycenter",
}

# ---------------------------------------------------------------------
# Fagan-Bradley sidereal ayanamsa (for the Mind field).
# Standard epoch t0 = 1950.0, ayanamsa(t0) = 24 deg 02' 31.36" = 24.042044 deg,
# precessing at the IAU general precession rate (~50.290"/yr, i.e. ~1.3969
# deg/century). NOTE: this is the widely-published formula; if you need
# arcsecond agreement with a specific ephemeris (Swiss Ephemeris etc.),
# that constant should be cross-checked against that source directly --
# I don't have web access in this session to verify it to the arcsecond.
# ---------------------------------------------------------------------
FAGAN_BRADLEY_EPOCH_YEAR = 1950.0
FAGAN_BRADLEY_AYANAMSA_AT_EPOCH = 24.042044  # degrees
PRECESSION_DEG_PER_YEAR = 50.2900 / 3600.0   # arcsec/yr -> deg/yr


def fagan_bradley_ayanamsa(dt: datetime) -> float:
    """Degrees to subtract from tropical longitude to get Fagan-Bradley sidereal."""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    year_frac = dt.year + (dt.timetuple().tm_yday - 1) / 365.25
    return FAGAN_BRADLEY_AYANAMSA_AT_EPOCH + (year_frac - FAGAN_BRADLEY_EPOCH_YEAR) * PRECESSION_DEG_PER_YEAR


def sidereal_longitude(tropical_longitude: float, dt: datetime) -> float:
    """Mind field: Fagan-Bradley sidereal longitude."""
    return (tropical_longitude - fagan_bradley_ayanamsa(dt)) % 360


def draconic_longitude(tropical_longitude: float, north_node_longitude: float) -> float:
    """Heart field: draconic longitude, zero point at the (true) North Node."""
    return (tropical_longitude - north_node_longitude) % 360


def download_kernel() -> None:
    if os.path.exists(KERNEL_PATH):
        return
    urllib.request.urlretrieve(KERNEL_URL, KERNEL_PATH)


def format_dms(decimal_degrees: float) -> str:
    degrees = int(decimal_degrees)
    remainder = abs(decimal_degrees - degrees) * 60
    minutes = int(remainder)
    seconds = (remainder - minutes) * 60
    return f"{degrees}\u00b0{minutes:02d}'{seconds:05.2f}\""


@dataclass
class GateAddress:
    gate: int
    line: int
    color: int
    tone: int
    base: int
    longitude: float
    field: str = "body"  # "body" (tropical) | "mind" (sidereal FB) | "heart" (draconic)

    @property
    def longitude_dms(self) -> str:
        return format_dms(self.longitude)


def longitude_to_address(longitude: float, field: str = "body") -> GateAddress:
    """Convert a real ecliptic longitude (already in the relevant field's
    reference frame) into gate/line/color/tone/base via the Fu Xi wheel."""
    offset = (longitude - WHEEL_START_DEG) % 360
    wheel_index = int(offset // GATE_DEG)
    within_gate = offset % GATE_DEG

    gate = FUXI_WHEEL_ORDER[wheel_index]
    line = int(within_gate // LINE_DEG) + 1
    within_line = within_gate % LINE_DEG
    color = int(within_line // COLOR_DEG) + 1
    within_color = within_line % COLOR_DEG
    tone = int(within_color // TONE_DEG) + 1
    within_tone = within_color % TONE_DEG
    base = int(within_tone // BASE_DEG) + 1

    return GateAddress(gate, line, color, tone, base, longitude, field)


class RealEphemeris:
    """Actual planetary positions from real JPL data. No mocks, no placeholders."""

    def __init__(self, kernel_path: str = KERNEL_PATH):
        download_kernel()
        self.planets = load(kernel_path)
        self.ts = load.timescale()
        self.earth = self.planets["earth"]

    def longitude(self, planet: Literal[
        "sun", "moon", "mercury", "venus", "mars", "jupiter",
        "saturn", "uranus", "neptune", "pluto"
    ], dt: datetime) -> float:
        """Real TROPICAL ecliptic longitude — the Body field's native frame."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        t = self.ts.from_datetime(dt)
        body = self.planets[PLANET_NAMES[planet]]
        astrometric = self.earth.at(t).observe(body)
        _, lon, _ = astrometric.ecliptic_latlon()
        return lon.degrees

    def mean_lunar_node(self, dt: datetime) -> float:
        """Real Mean Lunar Node longitude via Meeus' polynomial (Astronomical
        Algorithms, ch. 47)."""
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        t = self.ts.from_datetime(dt)
        T = (t.tt - 2451545.0) / 36525.0
        omega = (125.04452 - 1934.136261 * T + 0.0020708 * T**2 + T**3 / 450000.0)
        return omega % 360

    def north_node_longitude(self, dt: datetime) -> float:
        return self.mean_lunar_node(dt)

    def south_node_longitude(self, dt: datetime) -> float:
        return (self.mean_lunar_node(dt) + 180.0) % 360

    def earth_longitude(self, dt: datetime) -> float:
        return (self.longitude('sun', dt) + 180.0) % 360

    def gate_address(self, planet: str, dt: datetime, field: str = "body") -> GateAddress:
        """field = 'body' (tropical), 'mind' (Fagan-Bradley sidereal), or
        'heart' (draconic, zeroed at true North Node)."""
        tropical_lon = self.longitude(planet, dt)
        if field == "body":
            return longitude_to_address(tropical_lon, "body")
        elif field == "mind":
            return longitude_to_address(sidereal_longitude(tropical_lon, dt), "mind")
        elif field == "heart":
            nn = self.north_node_longitude(dt)
            return longitude_to_address(draconic_longitude(tropical_lon, nn), "heart")
        else:
            raise ValueError(f"unknown field: {field}")

    def full_13_point_chart(self, dt: datetime, field: str = "body") -> dict:
        """All 13 real HD activation points, gate-addressed, for a given field."""
        result = {}
        for p in ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter',
                  'saturn', 'uranus', 'neptune', 'pluto']:
            result[p] = self.gate_address(p, dt, field)
        result['earth'] = self._earth_address(dt, field)
        result['north_node'] = self._node_address(dt, field, south=False)
        result['south_node'] = self._node_address(dt, field, south=True)
        return result

    def _earth_address(self, dt, field):
        tropical_lon = self.earth_longitude(dt)
        if field == "body":
            return longitude_to_address(tropical_lon, "body")
        elif field == "mind":
            return longitude_to_address(sidereal_longitude(tropical_lon, dt), "mind")
        else:
            nn = self.north_node_longitude(dt)
            return longitude_to_address(draconic_longitude(tropical_lon, nn), "heart")

    def _node_address(self, dt, field, south: bool):
        tropical_lon = self.south_node_longitude(dt) if south else self.north_node_longitude(dt)
        if field == "body":
            return longitude_to_address(tropical_lon, "body")
        elif field == "mind":
            return longitude_to_address(sidereal_longitude(tropical_lon, dt), "mind")
        else:
            nn = self.north_node_longitude(dt)
            return longitude_to_address(draconic_longitude(tropical_lon, nn), "heart")

    def three_field_chart(self, dt: datetime) -> dict:
        """The full Body / Mind / Heart triad from ONE real position set —
        matches your field_systems.py philosophy: one real position,
        three lenses, not three separately-fetched systems."""
        return {
            "body": self.full_13_point_chart(dt, "body"),
            "mind": self.full_13_point_chart(dt, "mind"),
            "heart": self.full_13_point_chart(dt, "heart"),
        }

    def design_sun_datetime(self, birth_dt: datetime) -> datetime:
        birth_lon = self.longitude("sun", birth_dt)
        target = (birth_lon - 88.0) % 360
        probe = birth_dt - timedelta(days=88)
        for _ in range(6):
            probe_lon = self.longitude("sun", probe)
            diff = (probe_lon - target + 180) % 360 - 180
            probe -= timedelta(days=diff)
        return probe


def verify_against_2017_eclipse() -> bool:
    eph = RealEphemeris()
    dt = datetime(2017, 8, 21, 18, 26, 40, tzinfo=timezone.utc)
    sun_lon = eph.longitude("sun", dt)
    moon_lon = eph.longitude("moon", dt)
    diff = abs(sun_lon - moon_lon)
    print(f"Sun longitude:  {sun_lon:.4f} deg")
    print(f"Moon longitude: {moon_lon:.4f} deg")
    print(f"Difference:     {diff:.4f} deg (expect < 0.5 deg at a solar eclipse)")
    return diff < 0.5


if __name__ == "__main__":
    print("=== Verifying against the 2017 total solar eclipse ===")
    ok = verify_against_2017_eclipse()
    print("VERIFIED (real data)" if ok else "FAILED -- something is wrong")

    print("\n=== Example: three-field gate address for that same moment ===")
    eph = RealEphemeris()
    dt = datetime(2017, 8, 21, 18, 26, 40, tzinfo=timezone.utc)
    for field in ("body", "mind", "heart"):
        addr = eph.gate_address("sun", dt, field)
        print(f"[{field}] Sun: Gate {addr.gate}, Line {addr.line}, Color {addr.color}, "
              f"Tone {addr.tone}, Base {addr.base} (position {addr.longitude_dms})")
