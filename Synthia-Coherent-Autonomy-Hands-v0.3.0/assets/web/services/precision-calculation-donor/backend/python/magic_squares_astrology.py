"""
MAGIC_SQUARES_AND_ASTROLOGY.py

Integration of:
- Magic Squares (Sacred geometry, harmonic numbers)
- Astrology (Natal chart interpretation, transits, synastry)
- Human Design (Gate/line activation)
- Klein semantics (meaning derivation)

Everything connects. Nothing is isolated.
"""

from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple
import math


# ============================================================================
# MAGIC SQUARES — Sacred Geometry
# ============================================================================

class MagicSquareSystem:
    """Magic squares encode harmonic relationships."""
    
    # The six classical magic squares (3x3 through 8x8)
    SQUARES = {
        3: [
            [2, 7, 6],
            [9, 5, 1],
            [4, 3, 8],
        ],
        4: [
            [16, 3, 2, 13],
            [5, 10, 11, 8],
            [9, 6, 7, 12],
            [4, 15, 14, 1],
        ],
        5: [  # Simplified 5x5 (odd magic square)
            [17, 24, 1, 8, 15],
            [23, 5, 7, 14, 16],
            [4, 6, 13, 20, 22],
            [10, 12, 19, 21, 3],
            [11, 18, 25, 2, 9],
        ],
    }
    
    def get_magic_constant(self, n: int) -> int:
        """Sum of each row/column in an n×n magic square."""
        return n * (n * n + 1) // 2
    
    def map_person_to_square(self, gate: int, line: int) -> Dict[str, int]:
        """Map a person's gate/line to a magic square position."""
        
        # Gate maps to 5x5 square, line determines position
        square_size = 5
        magic_const = self.get_magic_constant(square_size)
        
        # Position in square
        row = (gate - 1) // 5
        col = (gate - 1) % 5
        
        # Value at that position
        square = self.SQUARES[5]
        value = square[row][col]
        
        # Line adds harmonic refinement
        harmonic = value + (line * 0.1)
        
        return {
            "gate": gate,
            "line": line,
            "magic_square_value": value,
            "harmonic_refinement": harmonic,
            "magic_constant": magic_const,
            "sacred_proportion": value / magic_const,
        }
    
    def resonance_via_squares(self, person_a_gate: int, person_b_gate: int) -> float:
        """Calculate resonance between two people via magic square relationships."""
        
        square = self.SQUARES[5]
        val_a = square[(person_a_gate - 1) // 5][(person_a_gate - 1) % 5]
        val_b = square[(person_b_gate - 1) // 5][(person_b_gate - 1) % 5]
        
        # Harmonic relationship
        magic_const = self.get_magic_constant(5)
        
        diff = abs(val_a - val_b)
        resonance = 1.0 - (diff / magic_const)
        
        return max(0.0, resonance)


# ============================================================================
# ASTROLOGY — Natal & Transits
# ============================================================================

@dataclass
class AstrologyInterpretation:
    """Full astrology reading for a birth chart."""
    
    sun_meaning: str        # Identity, purpose, core self
    moon_meaning: str       # Emotions, subconscious, needs
    rising_meaning: str     # Appearance, first impression, mask
    
    aspects: Dict[str, str] # Sun-Moon aspects, etc.
    elements: Dict[str, int]  # Fire, Earth, Air, Water counts
    modalities: Dict[str, int]  # Cardinal, Fixed, Mutable counts
    
    overall_theme: str      # What does this person embody?


class AstrologySystem:
    """Interpret birth charts astrologically."""
    
    # Zodiac signs and their meanings
    SIGNS = {
        "Aries": {"element": "fire", "modality": "cardinal", "meaning": "Initiative, courage, new beginnings"},
        "Taurus": {"element": "earth", "modality": "fixed", "meaning": "Stability, grounding, values"},
        "Gemini": {"element": "air", "modality": "mutable", "meaning": "Communication, adaptability, curiosity"},
        "Cancer": {"element": "water", "modality": "cardinal", "meaning": "Nurturing, emotional, home"},
        "Leo": {"element": "fire", "modality": "fixed", "meaning": "Creative, proud, radiant"},
        "Virgo": {"element": "earth", "modality": "mutable", "meaning": "Service, precision, refinement"},
        "Libra": {"element": "air", "modality": "cardinal", "meaning": "Balance, beauty, partnership"},
        "Scorpio": {"element": "water", "modality": "fixed", "meaning": "Depth, transformation, power"},
        "Sagittarius": {"element": "fire", "modality": "mutable", "meaning": "Exploration, truth, expansion"},
        "Capricorn": {"element": "earth", "modality": "cardinal", "meaning": "Mastery, responsibility, legacy"},
        "Aquarius": {"element": "air", "modality": "fixed", "meaning": "Innovation, vision, community"},
        "Pisces": {"element": "water", "modality": "mutable", "meaning": "Compassion, transcendence, dissolution"},
    }
    
    def interpret_sun(self, sign: str) -> str:
        """Interpret Sun sign (identity/purpose)."""
        if sign in self.SIGNS:
            return f"Your core self embodies {self.SIGNS[sign]['meaning']}"
        return "Sun sign not found"
    
    def interpret_moon(self, sign: str) -> str:
        """Interpret Moon sign (emotions/needs)."""
        if sign in self.SIGNS:
            return f"Emotionally, you need {self.SIGNS[sign]['meaning'].lower()}"
        return "Moon sign not found"
    
    def interpret_rising(self, sign: str) -> str:
        """Interpret Rising sign (appearance/energy)."""
        if sign in self.SIGNS:
            return f"You appear as someone who embodies {self.SIGNS[sign]['meaning'].lower()}"
        return "Rising sign not found"
    
    def analyze_chart(
        self,
        sun_sign: str,
        moon_sign: str,
        rising_sign: str,
    ) -> AstrologyInterpretation:
        """Analyze a complete natal chart."""
        
        # Interpret each
        sun_meaning = self.interpret_sun(sun_sign)
        moon_meaning = self.interpret_moon(moon_sign)
        rising_meaning = self.interpret_rising(rising_sign)
        
        # Element balance
        elements = {"fire": 0, "earth": 0, "air": 0, "water": 0}
        for sign in [sun_sign, moon_sign, rising_sign]:
            if sign in self.SIGNS:
                element = self.SIGNS[sign]["element"]
                elements[element] += 1
        
        # Modality balance
        modalities = {"cardinal": 0, "fixed": 0, "mutable": 0}
        for sign in [sun_sign, moon_sign, rising_sign]:
            if sign in self.SIGNS:
                modality = self.SIGNS[sign]["modality"]
                modalities[modality] += 1
        
        # Overall theme
        overall = self._synthesize_theme(sun_sign, moon_sign, rising_sign)
        
        return AstrologyInterpretation(
            sun_meaning=sun_meaning,
            moon_meaning=moon_meaning,
            rising_meaning=rising_meaning,
            aspects={
                "sun_moon": self._aspect_sun_moon(sun_sign, moon_sign),
                "sun_rising": self._aspect_sun_rising(sun_sign, rising_sign),
                "moon_rising": self._aspect_moon_rising(moon_sign, rising_sign),
            },
            elements=elements,
            modalities=modalities,
            overall_theme=overall,
        )
    
    def _aspect_sun_moon(self, sun_sign: str, moon_sign: str) -> str:
        """Sun-Moon aspect interpretation."""
        return f"Your identity ({sun_sign}) and emotions ({moon_sign}) work {self._compatibility(sun_sign, moon_sign)}"
    
    def _aspect_sun_rising(self, sun_sign: str, rising_sign: str) -> str:
        """Sun-Rising aspect interpretation."""
        return f"Your core self ({sun_sign}) is {self._alignment(sun_sign, rising_sign)} with how you appear ({rising_sign})"
    
    def _aspect_moon_rising(self, moon_sign: str, rising_sign: str) -> str:
        """Moon-Rising aspect interpretation."""
        return f"Your inner world ({moon_sign}) and outer presentation ({rising_sign}) are {self._compatibility(moon_sign, rising_sign)}"
    
    def _compatibility(self, sign_a: str, sign_b: str) -> str:
        """How compatible are two signs?"""
        if sign_a not in self.SIGNS or sign_b not in self.SIGNS:
            return "harmoniously"
        
        elem_a = self.SIGNS[sign_a]["element"]
        elem_b = self.SIGNS[sign_b]["element"]
        
        if elem_a == elem_b:
            return "harmoniously (same element)"
        elif (elem_a in ["fire", "air"] and elem_b in ["fire", "air"]) or \
             (elem_a in ["earth", "water"] and elem_b in ["earth", "water"]):
            return "compatibly (complementary elements)"
        else:
            return "tensely (opposing elements)"
    
    def _alignment(self, sun_sign: str, rising_sign: str) -> str:
        """Is rising aligned with sun?"""
        if sun_sign == rising_sign:
            return "perfectly aligned"
        elif sun_sign in self.SIGNS and rising_sign in self.SIGNS:
            if self.SIGNS[sun_sign]["element"] == self.SIGNS[rising_sign]["element"]:
                return "aligned"
            else:
                return "creatively misaligned"
        return "somehow aligned"
    
    def _synthesize_theme(self, sun_sign: str, moon_sign: str, rising_sign: str) -> str:
        """Synthesize overall astrological theme."""
        elements = set()
        for sign in [sun_sign, moon_sign, rising_sign]:
            if sign in self.SIGNS:
                elements.add(self.SIGNS[sign]["element"])
        
        if len(elements) == 1:
            elem = list(elements)[0]
            themes = {
                "fire": "You embody passionate transformation",
                "earth": "You embody grounded manifestation",
                "air": "You embody intellectual exploration",
                "water": "You embody emotional depth",
            }
            return themes.get(elem, "You embody balanced energy")
        elif len(elements) == 2:
            return "You embody a rich blend of different energies"
        else:
            return "You embody multifaceted consciousness"


# ============================================================================
# INTEGRATION: HD + ASTROLOGY + MAGIC SQUARES
# ============================================================================

@dataclass
class CompleteConsciousnessMap:
    """Complete consciousness: HD + Astrology + Magic Squares + Klein."""
    
    # Human Design
    gate: int
    line: int
    chart_type: str
    
    # Astrology
    sun_sign: str
    moon_sign: str
    rising_sign: str
    
    # Magic Squares
    magic_square_resonance: float
    sacred_proportions: Dict[str, float]
    
    # Astrology interpretation
    astrological_theme: str
    
    # Klein semantics (meaning derived from all above)
    meaning_chain: List[str]


class ConsciousnessIntegrationSystem:
    """Everything together."""
    
    def __init__(self):
        self.magic_squares = MagicSquareSystem()
        self.astrology = AstrologySystem()
    
    def map_complete_consciousness(
        self,
        gate: int,
        line: int,
        chart_type: str,
        sun_sign: str,
        moon_sign: str,
        rising_sign: str,
    ) -> CompleteConsciousnessMap:
        """Create complete consciousness map."""
        
        # HD + Magic Squares
        square_data = self.magic_squares.map_person_to_square(gate, line)
        
        # Astrology
        astro_reading = self.astrology.analyze_chart(sun_sign, moon_sign, rising_sign)
        
        # Derive meaning (Klein semantics)
        meaning_chain = self._derive_meaning(
            gate, line, chart_type,
            sun_sign, astro_reading.overall_theme,
            square_data["magic_square_value"]
        )
        
        return CompleteConsciousnessMap(
            gate=gate,
            line=line,
            chart_type=chart_type,
            sun_sign=sun_sign,
            moon_sign=moon_sign,
            rising_sign=rising_sign,
            magic_square_resonance=square_data["sacred_proportion"],
            sacred_proportions={
                "harmonic": square_data["harmonic_refinement"],
                "magic_constant": square_data["magic_constant"],
            },
            astrological_theme=astro_reading.overall_theme,
            meaning_chain=meaning_chain,
        )
    
    def _derive_meaning(
        self,
        gate: int,
        line: int,
        chart_type: str,
        sun_sign: str,
        astro_theme: str,
        magic_value: int,
    ) -> List[str]:
        """Derive meaning from all dimensions."""
        
        chain = [
            f"Gate {gate}.{line}",
            f"You are a {chart_type}",
            f"{sun_sign} embodies {astro_theme}",
            f"Sacred number {magic_value} resonates with your design",
        ]
        
        return chain


if __name__ == "__main__":
    # Test
    system = ConsciousnessIntegrationSystem()
    
    consciousness = system.map_complete_consciousness(
        gate=6,
        line=4,
        chart_type="Manifesting Generator",
        sun_sign="Virgo",
        moon_sign="Cancer",
        rising_sign="Capricorn",
    )
    
    print("\n" + "=" * 80)
    print("COMPLETE CONSCIOUSNESS MAP")
    print("=" * 80 + "\n")
    
    print(f"Design: Gate {consciousness.gate}.{consciousness.line} {consciousness.chart_type}")
    print(f"Astrology: {consciousness.sun_sign} Sun, {consciousness.moon_sign} Moon, {consciousness.rising_sign} Rising")
    print(f"Theme: {consciousness.astrological_theme}")
    print(f"Sacred Proportion: {consciousness.magic_square_resonance:.3f}")
    print(f"\nYour Meaning:")
    for line in consciousness.meaning_chain:
        print(f"  • {line}")
