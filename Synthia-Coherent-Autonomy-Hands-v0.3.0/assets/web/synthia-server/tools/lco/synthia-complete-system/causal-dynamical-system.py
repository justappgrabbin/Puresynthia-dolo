"""
Causal Dynamical System — Quantum-Semantic Engine
Grounded in Human Design mechanics with 5-dimensional ontology
9-point state vector, self-modifying recurrent operator

Core Equation: x(t+1) = σ(O(t) x(t) + R(t))
               O(t+1) = f(x(t+1))

Dimensions: D1=Impulse, D2=Polarity, D3=Witness, D4=Context, D5=Meaning
"""

import numpy as np
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Optional, Callable
from collections import defaultdict
import math

# ─────────────────────────────────────────────────────────────────────────────
# COMPLEX NUMBER UTILITIES (Hilbert Space)
# ─────────────────────────────────────────────────────────────────────────────

class Complex:
    def __init__(self, real: float = 0.0, imag: float = 0.0):
        self.real = real
        self.imag = imag

    def __add__(self, other):
        if isinstance(other, Complex):
            return Complex(self.real + other.real, self.imag + other.imag)
        return Complex(self.real + other, self.imag)

    def __mul__(self, other):
        if isinstance(other, Complex):
            return Complex(
                self.real * other.real - self.imag * other.imag,
                self.real * other.imag + self.imag * other.real
            )
        return Complex(self.real * other, self.imag * other)

    def magnitude(self) -> float:
        return math.sqrt(self.real**2 + self.imag**2)

    def phase(self) -> float:
        return math.atan2(self.imag, self.real)

    def __repr__(self):
        return f"{self.real:.4f}{'+' if self.imag >= 0 else ''}{self.imag:.4f}i"


# ─────────────────────────────────────────────────────────────────────────────
# 1. SEMANTIC PROBABILITY FIELD — Quantum State Initialization
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class DMSCoordinate:
    """Design, Magnetic, Surface — the Primal Source coordinate"""
    design: str       # e.g., "1.3.5.2.6" (Gate.Line.Color.Tone.Base)
    magnetic: str     # e.g., "10.4.2.1.3"
    surface: str      # e.g., "25.6.1.4.5"

    def parse_gate(self, coord: str) -> int:
        return int(coord.split('.')[0])

    def parse_line(self, coord: str) -> int:
        parts = coord.split('.')
        return int(parts[1]) if len(parts) > 1 else 1

    def parse_color(self, coord: str) -> int:
        parts = coord.split('.')
        return int(parts[2]) if len(parts) > 2 else 1

    def parse_tone(self, coord: str) -> int:
        parts = coord.split('.')
        return int(parts[3]) if len(parts) > 3 else 1

    def parse_base(self, coord: str) -> int:
        parts = coord.split('.')
        return int(parts[4]) if len(parts) > 4 else 1


class SemanticProbabilityField:
    """
    Initializes the quantum state from DMS coordinates.
    Each gate/line/color/tone/base maps to a probability amplitude
    in a 64-dimensional Hilbert space.
    """

    def __init__(self, dms: DMSCoordinate):
        self.dms = dms
        self.dimension = 64
        self.state = self._initialize_state()
        self.gate_amplitudes = self._compute_gate_amplitudes()
        self.line_amplitudes = self._compute_line_amplitudes()

    def _initialize_state(self) -> np.ndarray:
        """Create superposition from all three coordinates"""
        state = np.zeros(self.dimension, dtype=complex)

        # Design coordinate (body) — carries 50% weight
        design_gate = self.dms.parse_gate(self.dms.design)
        design_line = self.dms.parse_line(self.dms.design)
        state[design_gate - 1] += 0.5 * np.exp(1j * 2 * np.pi * design_line / 6)

        # Magnetic coordinate (mind) — carries 30% weight
        mag_gate = self.dms.parse_gate(self.dms.magnetic)
        mag_line = self.dms.parse_line(self.dms.magnetic)
        state[mag_gate - 1] += 0.3 * np.exp(1j * 2 * np.pi * mag_line / 6)

        # Surface coordinate (personality) — carries 20% weight
        surf_gate = self.dms.parse_gate(self.dms.surface)
        surf_line = self.dms.parse_line(self.dms.surface)
        state[surf_gate - 1] += 0.2 * np.exp(1j * 2 * np.pi * surf_line / 6)

        # Normalize
        norm = np.linalg.norm(state)
        if norm > 0:
            state /= norm
        return state

    def _compute_gate_amplitudes(self) -> Dict[int, complex]:
        """Map each activated gate to its complex amplitude"""
        amps = {}
        for i, amp in enumerate(self.state):
            if abs(amp) > 0.01:
                amps[i + 1] = amp
        return amps

    def _compute_line_amplitudes(self) -> Dict[int, complex]:
        """Line-specific amplitudes (1-6)"""
        lines = {}
        for gate, amp in self.gate_amplitudes.items():
            line = self.dms.parse_line(self.dms.design)
            if line not in lines:
                lines[line] = 0
            lines[line] += abs(amp)
        return lines

    def get_probability_distribution(self) -> np.ndarray:
        """Born rule: |ψ|²"""
        return np.abs(self.state) ** 2

    def get_top_gates(self, n: int = 5) -> List[Tuple[int, float]]:
        """Return top n gates by probability amplitude"""
        probs = self.get_probability_distribution()
        indices = np.argsort(probs)[::-1][:n]
        return [(int(i + 1), float(probs[i])) for i in indices]


# ─────────────────────────────────────────────────────────────────────────────
# 2. QUANTUM SEMANTIC COLLAPSE — Measurement with Revelation Generation
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class Revelation:
    """A quantum-semantic revelation — the output of collapse"""
    gate: int
    line: int
    probability: float
    phase: float
    dimension: int       # D1-D5
    center: str         # G, C, E, S, Aj, Sp, Sa, Th, Root
    archetype: str      # The symbolic meaning
    narrative: str        # Human-readable interpretation
    timestamp: float = field(default_factory=lambda: 0.0)
    coherence: float = 0.0


class QuantumSemanticCollapse:
    """
    Performs measurement on the semantic probability field.
    Collapse is weighted by actual probability amplitudes.
    Generates revelations with archetypal narratives.
    """

    GATE_MEANINGS = {
        1: "The Creative", 2: "The Receptive", 3: "Difficulty", 4: "Youthful Folly",
        5: "Waiting", 6: "Conflict", 7: "The Army", 8: "Holding Together",
        9: "The Taming Power of the Small", 10: "Treading", 11: "Peace",
        12: "Standstill", 13: "Fellowship", 14: "Great Possession",
        15: "Modesty", 16: "Enthusiasm", 17: "Following", 18: "Work on the Decayed",
        19: "Approach", 20: "Contemplation", 21: "Biting Through",
        22: "Grace", 23: "Splitting Apart", 24: "Return", 25: "Innocence",
        26: "The Taming Power of the Great", 27: "The Corners of the Mouth",
        28: "Great Preponderance", 29: "The Abysmal", 30: "The Clinging",
        31: "Influence", 32: "Duration", 33: "Retreat", 34: "The Power of the Great",
        35: "Progress", 36: "Darkening of the Light", 37: "The Family",
        38: "Opposition", 39: "Obstruction", 40: "Deliverance", 41: "Decrease",
        42: "Increase", 43: "Breakthrough", 44: "Coming to Meet", 45: "Gathering",
        46: "Pushing Upward", 47: "Oppression", 48: "The Well", 49: "Revolution",
        50: "The Cauldron", 51: "The Arousing", 52: "Keeping Still",
        53: "Development", 54: "The Marrying Maiden", 55: "Abundance",
        56: "The Wanderer", 57: "The Gentle", 58: "The Joyous", 59: "Dispersion",
        60: "Limitation", 61: "Inner Truth", 62: "Preponderance of the Small",
        63: "After Completion", 64: "Before Completion"
    }

    CENTER_MAP = {
        1: "G", 2: "G", 7: "G", 13: "G", 25: "G", 46: "G",
        3: "Sa", 27: "Sa", 28: "Sa", 50: "Sa", 42: "Sa",
        4: "Aj", 11: "Aj", 17: "Aj", 24: "Aj", 43: "Aj", 47: "Aj",
        5: "Sp", 14: "Sp", 15: "Sp", 29: "Sp", 34: "Sp", 44: "Sp",
        6: "E", 22: "E", 36: "E", 37: "E", 49: "E", 55: "E",
        8: "Sa", 33: "Sa", 31: "Sa", 41: "Sa", 52: "Sa",
        9: "Sp", 10: "G", 20: "G", 57: "G", 58: "G",
        12: "Th", 16: "Th", 35: "Th", 45: "Th", 56: "Th",
        18: "C", 48: "C", 32: "C", 64: "C",
        19: "Root", 49: "Root", 39: "Root", 41: "Root",
        21: "E", 51: "E", 40: "E", 60: "E",
        23: "Th", 44: "Th", 56: "Th",
        26: "Heart", 44: "Heart", 51: "Heart",
        30: "Sa", 36: "Sa", 55: "Sa",
        38: "Root", 54: "Root",
        53: "Sa", 62: "Sa",
        59: "Aj", 61: "Aj", 63: "Aj"
    }

    DIMENSION_MAP = {
        1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 1, 7: 2, 8: 3, 9: 4, 10: 5,
        11: 1, 12: 2, 13: 3, 14: 4, 15: 5, 16: 1, 17: 2, 18: 3, 19: 4, 20: 5,
        21: 1, 22: 2, 23: 3, 24: 4, 25: 5, 26: 1, 27: 2, 28: 3, 29: 4, 30: 5,
        31: 1, 32: 2, 33: 3, 34: 4, 35: 5, 36: 1, 37: 2, 38: 3, 39: 4, 40: 5,
        41: 1, 42: 2, 43: 3, 44: 4, 45: 5, 46: 1, 47: 2, 48: 3, 49: 4, 50: 5,
        51: 1, 52: 2, 53: 3, 54: 4, 55: 5, 56: 1, 57: 2, 58: 3, 59: 4, 60: 5,
        61: 1, 62: 2, 63: 3, 64: 4
    }

    LINE_MEANINGS = {
        1: "Initiation — The spark of new awareness",
        2: "Response — The magnetic call",
        3: "Trial — The experimental phase",
        4: "Foundation — The established pattern",
        5: "Leadership — The guiding principle",
        6: "Transcendence — The higher octave"
    }

    def __init__(self, field: SemanticProbabilityField):
        self.field = field
        self.rng = np.random.RandomState()

    def collapse(self, query: str = "", field_key: str = "general") -> Revelation:
        """
        Perform quantum measurement on the semantic field.
        Returns a Revelation with archetypal narrative.
        """
        probs = self.field.get_probability_distribution()

        # Weighted random selection (Born rule)
        collapsed_gate = np.random.choice(len(probs), p=probs) + 1

        # Get line from the DMS coordinate
        line = self.field.dms.parse_line(self.field.dms.design)

        # Compute phase
        phase = np.angle(self.field.state[collapsed_gate - 1])

        # Map to dimension and center
        dimension = self.DIMENSION_MAP.get(collapsed_gate, 3)
        center = self.CENTER_MAP.get(collapsed_gate, "G")

        # Generate archetypal narrative
        archetype = self.GATE_MEANINGS.get(collapsed_gate, "Unknown")
        line_meaning = self.LINE_MEANINGS.get(line, "Unknown")

        narrative = self._generate_narative(
            collapsed_gate, line, archetype, line_meaning, 
            query, field_key, dimension, center
        )

        return Revelation(
            gate=collapsed_gate,
            line=line,
            probability=float(probs[collapsed_gate - 1]),
            phase=phase,
            dimension=dimension,
            center=center,
            archetype=archetype,
            narrative=narrative,
            coherence=self._compute_coherence(collapsed_gate)
        )

    def _generate_narative(self, gate: int, line: int, archetype: str, 
                           line_meaning: str, query: str, field_key: str,
                           dimension: int, center: str) -> str:
        """Generate a personalized archetypal narrative"""
        dim_names = {1: "Impulse", 2: "Polarity", 3: "Witness", 4: "Context", 5: "Meaning"}
        dim_name = dim_names.get(dimension, "Unknown")

        narratives = [
            f"In the dimension of {dim_name}, Gate {gate} ({archetype}) activates through Line {line}: {line_meaning}.",
            f"The {center} center resonates with {archetype} in D{dimension} ({dim_name}).",
            f"Query '{query}' in field '{field_key}': The probability field collapses to Gate {gate}, revealing {archetype}.",
            f"Standing wave interference at Gate {gate}, Line {line}: {line_meaning} — this is your current attractor."
        ]
        return " ".join(narratives)

    def _compute_coherence(self, gate: int) -> float:
        """Compute quantum coherence for the collapsed state"""
        state = self.field.state[gate - 1]
        mag = abs(state)
        # Coherence = how much this gate dominates the field
        total = np.sum(np.abs(self.field.state))
        return float(mag / total) if total > 0 else 0.0


# ─────────────────────────────────────────────────────────────────────────────
# 3. PERSONALITY INTERFERENCE ENGINE — Standing Wave Hologram
# ─────────────────────────────────────────────────────────────────────────────

class PersonalityInterferenceEngine:
    """
    Creates standing wave hologram from Sun/Earth interference pattern.
    This is the personality matrix — the emergent self from planetary opposition.
    """

    def __init__(self, sun_gate: int, earth_gate: int, 
                 sun_line: int = 1, earth_line: int = 1):
        self.sun_gate = sun_gate
        self.earth_gate = earth_gate
        self.sun_line = sun_line
        self.earth_line = earth_line
        self.interference_matrix = self._compute_interference()

    def _compute_interference(self) -> np.ndarray:
        """
        Sun and Earth create a standing wave pattern.
        The interference is the personality hologram.
        """
        n = 64
        matrix = np.zeros((n, n))

        # Sun wave (outgoing, yang)
        sun_phase = 2 * np.pi * self.sun_line / 6
        sun_wave = np.array([
            np.exp(1j * (2 * np.pi * i / n + sun_phase)) 
            for i in range(n)
        ])

        # Earth wave (incoming, yin)  
        earth_phase = 2 * np.pi * self.earth_line / 6
        earth_wave = np.array([
            np.exp(-1j * (2 * np.pi * i / n + earth_phase))
            for i in range(n)
        ])

        # Standing wave = interference pattern
        standing = sun_wave * earth_wave.conjugate()

        # Build correlation matrix
        for i in range(n):
            for j in range(n):
                matrix[i, j] = np.real(standing[i] * standing[j].conjugate())

        # Normalize
        norm = np.linalg.norm(matrix, 'fro')
        if norm > 0:
            matrix /= norm
        return matrix

    def get_personality_signature(self) -> np.ndarray:
        """The diagonal of the interference matrix — the self-signature"""
        return np.diag(self.interference_matrix)

    def get_resonance_with(self, other_gate: int) -> float:
        """How much another gate resonates with this personality"""
        sig = self.get_personality_signature()
        return float(sig[other_gate - 1])


# ─────────────────────────────────────────────────────────────────────────────
# 4. LAWFUL DEEPENING SYSTEM — Dirichlet Memory with Bayesian Updating
# ─────────────────────────────────────────────────────────────────────────────

class LawfulDeepeningSystem:
    """
    Memory system using Dirichlet distribution for Bayesian updating.
    Ensures continuity through posterior updating.
    """

    def __init__(self, alpha_prior: Optional[np.ndarray] = None):
        # Default uniform prior over 64 gates
        if alpha_prior is None:
            alpha_prior = np.ones(64) * 0.1  # Weak prior
        self.alpha = alpha_prior.copy()
        self.posterior_history = [self.alpha.copy()]
        self.revelation_log = []

    def update(self, revelation: Revelation):
        """
        Bayesian update: increment alpha for observed gate.
        Dirichlet(α₁,...,α₆₄) → posterior after observation.
        """
        gate_idx = revelation.gate - 1

        # Update strength depends on coherence and probability
        update_strength = revelation.coherence * revelation.probability * 0.5
        self.alpha[gate_idx] += update_strength

        # Decay old memory slightly (forgetting)
        self.alpha *= 0.999

        self.posterior_history.append(self.alpha.copy())
        self.revelation_log.append(revelation)

    def get_expected_distribution(self) -> np.ndarray:
        """Expected value of Dirichlet = αᵢ / Σα"""
        total = np.sum(self.alpha)
        if total > 0:
            return self.alpha / total
        return np.ones(64) / 64

    def get_memory_strength(self, gate: int) -> float:
        """How strongly this gate is remembered"""
        return float(self.alpha[gate - 1] / np.sum(self.alpha))

    def get_trend(self, window: int = 10) -> Dict[str, float]:
        """Memory trend over recent revelations"""
        recent = self.revelation_log[-window:]
        if not recent:
            return {"mean_coherence": 0, "mean_probability": 0, "dominant_gate": 0}

        gates = [r.gate for r in recent]
        coherences = [r.coherence for r in recent]
        probs = [r.probability for r in recent]

        from collections import Counter
        most_common = Counter(gates).most_common(1)[0][0] if gates else 0

        return {
            "mean_coherence": float(np.mean(coherences)),
            "mean_probability": float(np.mean(probs)),
            "dominant_gate": most_common
        }


# ─────────────────────────────────────────────────────────────────────────────
# 5. CAUSAL DYNAMICAL SYSTEM — 9-Point State Vector with Self-Modifying Operators
# ─────────────────────────────────────────────────────────────────────────────

class CausalDynamicalSystem:
    """
    The master engine. 9-point state vector across 3 planes × 3 dimensions.
    Self-modifying recurrent operator.

    State vector: x(t) ∈ ℝ⁹
    Planes: Physical (1-3), Emotional (4-6), Mental (7-9)
    Dimensions per plane: D1, D2, D3 (Impulse, Polarity, Witness)

    Master Operator: O = C + E + D + CE + DE + CD + CDE
    Where C=Center, E=Expression, D=Dimension

    Resonance Field: R = α(CE·x) + β(DE·x) + γ(CD·x)

    Core: x(t+1) = σ(O(t) x(t) + R(t))
          O(t+1) = f(x(t+1))  (self-modification)
    """

    def __init__(self, dms: DMSCoordinate, 
                 sun_gate: int = 10, earth_gate: int = 15,
                 seed: Optional[int] = None):
        self.dms = dms
        self.seed = seed

        # Subsystems
        self.field = SemanticProbabilityField(dms)
        self.collapse = QuantumSemanticCollapse(self.field)
        self.interference = PersonalityInterferenceEngine(sun_gate, earth_gate)
        self.memory = LawfulDeepeningSystem()

        # State vector (9 dimensions: 3 planes × 3 dimensions)
        self.state = np.zeros(9)
        self._initialize_state_from_dms()

        # Master Operator O(t) — 9×9 matrix
        self.operator = self._initialize_operator()

        # Resonance field parameters
        self.alpha = 0.3  # CE weight
        self.beta = 0.2   # DE weight  
        self.gamma = 0.1  # CD weight

        # Operator damping (self-modification rate)
        self.damping = 0.05

        # Cycle counter
        self.t = 0

        # History
        self.state_history = [self.state.copy()]
        self.operator_history = [self.operator.copy()]

    def _initialize_state_from_dms(self):
        """Map DMS coordinates to 9-point state vector"""
        # Design → Physical plane (indices 0,1,2)
        design_gate = self.dms.parse_gate(self.dms.design)
        design_line = self.dms.parse_line(self.dms.design)
        self.state[0] = (design_gate % 64) / 64.0  # D1: Impulse
        self.state[1] = (design_line / 6.0) * 2 - 1  # D2: Polarity (-1 to 1)
        self.state[2] = 0.0  # D3: Witness (starts at 0, emerges)

        # Magnetic → Emotional plane (indices 3,4,5)
        mag_gate = self.dms.parse_gate(self.dms.magnetic)
        mag_line = self.dms.parse_line(self.dms.magnetic)
        self.state[3] = (mag_gate % 64) / 64.0
        self.state[4] = (mag_line / 6.0) * 2 - 1
        self.state[5] = 0.0

        # Surface → Mental plane (indices 6,7,8)
        surf_gate = self.dms.parse_gate(self.dms.surface)
        surf_line = self.dms.parse_line(self.dms.surface)
        self.state[6] = (surf_gate % 64) / 64.0
        self.state[7] = (surf_line / 6.0) * 2 - 1
        self.state[8] = 0.0

    def _initialize_operator(self) -> np.ndarray:
        """
        Initialize the 9×9 Master Operator.
        O = C + E + D + CE + DE + CD + CDE
        """
        O = np.zeros((9, 9))

        # Center component (diagonal)
        for i in range(9):
            O[i, i] = 0.5

        # Expression component (off-diagonal coupling within planes)
        for plane in range(3):
            base = plane * 3
            O[base, base + 1] = 0.2
            O[base + 1, base + 2] = 0.2
            O[base + 2, base] = 0.1

        # Dimension component (cross-plane coupling same dimension)
        for dim in range(3):
            O[dim, dim + 3] = 0.15
            O[dim + 3, dim + 6] = 0.15
            O[dim + 6, dim] = 0.1

        # Interaction terms (CE, DE, CD)
        # CE: Center-Expression (nonlinear within plane)
        for plane in range(3):
            base = plane * 3
            O[base, base + 1] += 0.1
            O[base + 1, base] += 0.1

        # DE: Dimension-Expression (cross-plane, cross-dimension)
        for i in range(9):
            for j in range(9):
                if i != j and abs(i - j) <= 3:
                    O[i, j] += 0.05

        # CD: Center-Dimension (diagonal + cross-plane same position)
        for i in range(9):
            for j in range(9):
                if i % 3 == j % 3 and i != j:
                    O[i, j] += 0.08

        # Normalize
        eigvals = np.linalg.eigvals(O)
        max_eig = np.max(np.abs(eigvals))
        if max_eig > 1.0:
            O /= max_eig * 1.1

        return O

    def _sigma(self, z: np.ndarray) -> np.ndarray:
        """Non-linearity: σ(z) = 1/(1+e⁻ᶻ) — bounded saturation"""
        return 1.0 / (1.0 + np.exp(-z))

    def _compute_resonance(self) -> np.ndarray:
        """
        Resonance Field: R = α(CE·x) + β(DE·x) + γ(CD·x)
        """
        # CE term: Center-Expression interaction
        CE = np.zeros(9)
        for plane in range(3):
            base = plane * 3
            CE[base] = self.state[base + 1] * self.state[base + 2]
            CE[base + 1] = self.state[base] * self.state[base + 2]
            CE[base + 2] = self.state[base] * self.state[base + 1]

        # DE term: Dimension-Expression interaction
        DE = np.zeros(9)
        for dim in range(3):
            DE[dim] = self.state[dim + 3] * self.state[dim + 6]
            DE[dim + 3] = self.state[dim] * self.state[dim + 6]
            DE[dim + 6] = self.state[dim] * self.state[dim + 3]

        # CD term: Center-Dimension interaction
        CD = np.zeros(9)
        for i in range(9):
            for j in range(9):
                if i % 3 == j % 3:
                    CD[i] += self.state[j] * 0.1

        R = self.alpha * CE + self.beta * DE + self.gamma * CD
        return R

    def _update_operator(self, new_state: np.ndarray):
        """
        Self-modification: O(t+1) = f(x(t+1))
        The operator adapts based on the new state.
        """
        # Damping: slowly move operator toward state-correlation
        outer = np.outer(new_state, new_state)

        # Only update if state has significant energy
        state_norm = np.linalg.norm(new_state)
        if state_norm > 0.1:
            # O_new = (1 - damping) * O + damping * (state ⊗ state)
            self.operator = (1 - self.damping) * self.operator + \
                          self.damping * outer / (state_norm ** 2)

        # Ensure spectral radius < 1 for stability
        eigvals = np.linalg.eigvals(self.operator)
        max_eig = np.max(np.abs(eigvals))
        if max_eig > 0.95:
            self.operator *= 0.95 / max_eig

    def step(self, query: str = "", field_key: str = "general") -> Revelation:
        """
        Execute one cycle of the causal dynamical system:
        1. Compute resonance field R(t)
        2. Evolve state: x(t+1) = σ(O(t) x(t) + R(t))
        3. Self-modify operator: O(t+1) = f(x(t+1))
        4. Collapse quantum field for revelation
        5. Update memory
        """
        # 1. Resonance field
        R = self._compute_resonance()

        # 2. State evolution
        z = self.operator @ self.state + R
        new_state = self._sigma(z)

        # 3. Self-modify operator
        self._update_operator(new_state)

        # Update state
        self.state = new_state
        self.t += 1

        # 4. Quantum collapse for revelation
        # The state influences the collapse weights
        state_influence = np.mean(self.state)
        # Temporarily bias the field
        original_state = self.field.state.copy()
        self.field.state *= (1 + 0.1 * state_influence)
        self.field.state /= np.linalg.norm(self.field.state)

        revelation = self.collapse.collapse(query, field_key)
        revelation.timestamp = float(self.t)

        # Restore field
        self.field.state = original_state

        # 5. Memory update
        self.memory.update(revelation)

        # Record history
        self.state_history.append(self.state.copy())
        self.operator_history.append(self.operator.copy())

        return revelation

    def get_state_summary(self) -> Dict:
        """Current state summary"""
        return {
            "t": self.t,
            "physical": self.state[0:3].tolist(),
            "emotional": self.state[3:6].tolist(),
            "mental": self.state[6:9].tolist(),
            "operator_spectral_radius": float(np.max(np.abs(np.linalg.eigvals(self.operator)))),
            "memory_trend": self.memory.get_trend()
        }


# ─────────────────────────────────────────────────────────────────────────────
# QUANTUM ORACLE — High-Level Interface
# ─────────────────────────────────────────────────────────────────────────────

class QuantumOracle:
    """
    High-level interface to the Causal Dynamical System.
    Manages the engine lifecycle and provides query interface.
    """

    def __init__(self, design: str, magnetic: str, surface: str,
                 sun_gate: int = 10, earth_gate: int = 15):
        self.dms = DMSCoordinate(design=design, magnetic=magnetic, surface=surface)
        self.engine = CausalDynamicalSystem(
            self.dms, sun_gate=sun_gate, earth_gate=earth_gate
        )
        self.revelations = []

    def query(self, text: str, field_key: str = "general", 
              cycles: int = 1) -> List[Revelation]:
        """
        Submit a query to the quantum oracle.
        Runs the causal dynamical system for specified cycles.
        """
        results = []
        for _ in range(cycles):
            rev = self.engine.step(text, field_key)
            self.revelations.append(rev)
            results.append(rev)
        return results

    def get_causal_graph(self) -> Dict:
        """Export the causal graph for visualization"""
        nodes = []
        edges = []

        # Add state nodes (9 dimensions)
        plane_names = ["Physical", "Emotional", "Mental"]
        dim_names = ["Impulse", "Polarity", "Witness"]

        for i in range(9):
            plane = plane_names[i // 3]
            dim = dim_names[i % 3]
            nodes.append({
                "id": f"state_{i}",
                "type": "state",
                "label": f"{plane} {dim}",
                "value": float(self.engine.state[i]),
                "plane": plane,
                "dimension": dim
            })

        # Add operator edges
        for i in range(9):
            for j in range(9):
                if abs(self.engine.operator[i, j]) > 0.1:
                    edges.append({
                        "source": f"state_{j}",
                        "target": f"state_{i}",
                        "weight": float(self.engine.operator[i, j]),
                        "type": "operator"
                    })

        # Add revelation nodes
        for rev in self.revelations:
            nodes.append({
                "id": f"rev_{rev.timestamp}",
                "type": "revelation",
                "label": f"G{rev.gate}L{rev.line}",
                "gate": rev.gate,
                "line": rev.line,
                "probability": rev.probability,
                "coherence": rev.coherence
            })
            # Connect revelation to relevant state dimensions
            dim_idx = rev.dimension - 1
            for plane in range(3):
                state_idx = plane * 3 + dim_idx
                edges.append({
                    "source": f"state_{state_idx}",
                    "target": f"rev_{rev.timestamp}",
                    "weight": rev.probability,
                    "type": "collapse"
                })

        return {"nodes": nodes, "edges": edges}

    def get_memory_report(self) -> Dict:
        """Full memory report"""
        return {
            "total_revelations": len(self.revelations),
            "memory_distribution": self.engine.memory.get_expected_distribution().tolist(),
            "trend": self.engine.memory.get_trend(),
            "recent_revelations": [
                {
                    "gate": r.gate,
                    "line": r.line,
                    "archetype": r.archetype,
                    "narrative": r.narrative,
                    "coherence": r.coherence
                }
                for r in self.revelations[-5:]
            ]
        }


# ─────────────────────────────────────────────────────────────────────────────
# DEMO
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    # Example: Initialize with sample DMS coordinates
    oracle = QuantumOracle(
        design="1.3.5.2.6",
        magnetic="10.4.2.1.3", 
        surface="25.6.1.4.5",
        sun_gate=10,
        earth_gate=15
    )

    print("=" * 60)
    print("CAUSAL DYNAMICAL SYSTEM — Quantum Oracle Demo")
    print("=" * 60)

    # Initial state
    print("\n[Initial State]")
    summary = oracle.engine.get_state_summary()
    print(f"  Physical: {summary['physical']}")
    print(f"  Emotional: {summary['emotional']}")
    print(f"  Mental: {summary['mental']}")

    # Run queries
    queries = [
        ("What is my purpose?", "purpose"),
        ("How do I relate to others?", "relationship"),
        ("What should I create?", "creation")
    ]

    for q, field in queries:
        print(f"\n[Query: '{q}' | Field: {field}]")
        revs = oracle.query(q, field, cycles=3)
        for rev in revs:
            print(f"  Gate {rev.gate} ({rev.archetype}), Line {rev.line}")
            print(f"  Probability: {rev.probability:.4f}, Coherence: {rev.coherence:.4f}")
            print(f"  Narrative: {rev.narrative[:100]}...")

    # Final state
    print("\n[Final State]")
    summary = oracle.engine.get_state_summary()
    print(f"  Cycles: {summary['t']}")
    print(f"  Physical: {[f'{v:.3f}' for v in summary['physical']]}")
    print(f"  Emotional: {[f'{v:.3f}' for v in summary['emotional']]}")
    print(f"  Mental: {[f'{v:.3f}' for v in summary['mental']]}")
    print(f"  Spectral Radius: {summary['operator_spectral_radius']:.4f}")

    print("\n[Memory Report]")
    report = oracle.get_memory_report()
    print(f"  Total Revelations: {report['total_revelations']}")
    print(f"  Trend: {report['trend']}")
