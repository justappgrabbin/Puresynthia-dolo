"""
Universe Core Engine — Resonance Network
=====================================
The foundational layer: Universe, Indiverse, Connection, matching, learning.
"""

from __future__ import annotations
import json
import random
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from typing import Dict, List, Tuple, Optional, Any
import numpy as np


# ============================================================================
# ENUMS
# ============================================================================

class ChartMode(Enum):
    SIDEREAL = "sidereal"
    TROPICAL = "tropical"
    DRACONIC = "draconic"


class ContextType(Enum):
    ECONOMIC = "economic"
    CREATIVE = "creative"
    RELATIONAL = "relational"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class Signature:
    """The immutable resonance signature of an Indiverse."""
    hd_gates: List[int] = field(default_factory=list)
    body_vector: np.ndarray = field(default_factory=lambda: np.zeros(9))
    chart_mode: ChartMode = ChartMode.TROPICAL
    birth_data: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "hd_gates": self.hd_gates,
            "body_vector": self.body_vector.tolist(),
            "chart_mode": self.chart_mode.value,
            "birth_data": self.birth_data
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Signature":
        return cls(
            hd_gates=d.get("hd_gates", []),
            body_vector=np.array(d.get("body_vector", [0.5]*9)),
            chart_mode=ChartMode(d.get("chart_mode", "tropical")),
            birth_data=d.get("birth_data", {})
        )


@dataclass
class State:
    """The mutable state of an Indiverse."""
    energy_capacity: float = 0.8
    momentum: float = 0.0
    coherence_score: float = 0.5
    last_updated: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "energy_capacity": self.energy_capacity,
            "momentum": self.momentum,
            "coherence_score": self.coherence_score,
            "last_updated": self.last_updated.isoformat()
        }

    @classmethod
    def from_dict(cls, d: dict) -> "State":
        return cls(
            energy_capacity=d.get("energy_capacity", 0.8),
            momentum=d.get("momentum", 0.0),
            coherence_score=d.get("coherence_score", 0.5),
            last_updated=datetime.fromisoformat(d.get("last_updated", datetime.now().isoformat()))
        )


@dataclass
class Patterns:
    """Learned patterns and archetypes."""
    archetype_blend: Dict[str, float] = field(default_factory=dict)
    success_contexts: List[str] = field(default_factory=list)
    resonance_history: List[Dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "archetype_blend": self.archetype_blend,
            "success_contexts": self.success_contexts,
            "resonance_history": self.resonance_history
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Patterns":
        return cls(
            archetype_blend=d.get("archetype_blend", {}),
            success_contexts=d.get("success_contexts", []),
            resonance_history=d.get("resonance_history", [])
        )


@dataclass
class Indiverse:
    """A single node in the Resonance Network."""
    id: str
    signature: Signature
    state: State = field(default_factory=State)
    patterns: Patterns = field(default_factory=Patterns)
    resonance_credits: float = 0.0
    created_at: datetime = field(default_factory=datetime.now)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "signature": self.signature.to_dict(),
            "state": self.state.to_dict(),
            "patterns": self.patterns.to_dict(),
            "resonance_credits": self.resonance_credits,
            "created_at": self.created_at.isoformat()
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Indiverse":
        return cls(
            id=d["id"],
            signature=Signature.from_dict(d["signature"]),
            state=State.from_dict(d["state"]),
            patterns=Patterns.from_dict(d["patterns"]),
            resonance_credits=d.get("resonance_credits", 0.0),
            created_at=datetime.fromisoformat(d.get("created_at", datetime.now().isoformat()))
        )


@dataclass
class Connection:
    """A link between two Indiverses."""
    id: str
    user_a_id: str
    user_b_id: str
    context: ContextType
    flow_vector: Tuple[float, float, float]
    created_at: datetime = field(default_factory=datetime.now)
    interactions: List[Dict] = field(default_factory=list)
    outcomes: List[Dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "user_a_id": self.user_a_id,
            "user_b_id": self.user_b_id,
            "context": self.context.value,
            "flow_vector": list(self.flow_vector),
            "created_at": self.created_at.isoformat(),
            "interactions": self.interactions,
            "outcomes": self.outcomes
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Connection":
        return cls(
            id=d["id"],
            user_a_id=d["user_a_id"],
            user_b_id=d["user_b_id"],
            context=ContextType(d["context"]),
            flow_vector=tuple(d.get("flow_vector", [0.33, 0.33, 0.34])),
            created_at=datetime.fromisoformat(d.get("created_at", datetime.now().isoformat())),
            interactions=d.get("interactions", []),
            outcomes=d.get("outcomes", [])
        )


@dataclass
class MatchResult:
    """A potential match between two Indiverses."""
    partner: Indiverse
    score: float
    flow_vector: Tuple[float, float, float]
    reasoning: str


# ============================================================================
# UNIVERSE ENGINE
# ============================================================================

class Universe:
    """
    The central orchestrator of the Resonance Network.
    Manages Indiverses, Connections, matching, learning, and credits.
    """

    def __init__(self):
        self.indiverses: Dict[str, Indiverse] = {}
        self.connections: Dict[str, Connection] = {}
        self.outcome_data: List[Dict] = []
        self._match_weights = np.array([0.4, 0.3, 0.2, 0.1])  # gate, body, energy, coherence
        self._id_counter = 0

    # ------------------------------------------------------------------------
    # CRUD
    # ------------------------------------------------------------------------

    def create_indiverse(
        self,
        hd_gates: List[int],
        body_vector: np.ndarray,
        chart_mode: ChartMode = ChartMode.TROPICAL,
        birth_data: Optional[Dict] = None,
        user_id: Optional[str] = None
    ) -> Indiverse:
        """Create a new Indiverse node."""
        self._id_counter += 1
        uid = user_id or f"indiverse_{self._id_counter}_{datetime.now().strftime('%H%M%S')}"

        sig = Signature(
            hd_gates=hd_gates,
            body_vector=np.array(body_vector),
            chart_mode=chart_mode,
            birth_data=birth_data or {}
        )

        user = Indiverse(id=uid, signature=sig)
        self.indiverses[uid] = user
        return user

    def get_indiverse(self, user_id: str) -> Optional[Indiverse]:
        return self.indiverses.get(user_id)

    def update_state(
        self,
        user_id: str,
        energy_capacity: Optional[float] = None,
        momentum: Optional[float] = None,
        coherence_score: Optional[float] = None
    ) -> None:
        """Update mutable state of an Indiverse."""
        user = self.indiverses.get(user_id)
        if not user:
            return
        if energy_capacity is not None:
            user.state.energy_capacity = energy_capacity
        if momentum is not None:
            user.state.momentum = momentum
        if coherence_score is not None:
            user.state.coherence_score = coherence_score
        user.state.last_updated = datetime.now()

    # ------------------------------------------------------------------------
    # CONNECTIONS
    # ------------------------------------------------------------------------

    def create_connection(
        self,
        user_a_id: str,
        user_b_id: str,
        context: ContextType,
        flow_vector: Tuple[float, float, float]
    ) -> Connection:
        """Create a connection between two Indiverses."""
        conn_id = f"conn_{user_a_id}_{user_b_id}_{datetime.now().strftime('%H%M%S')}"
        conn = Connection(
            id=conn_id,
            user_a_id=user_a_id,
            user_b_id=user_b_id,
            context=context,
            flow_vector=flow_vector
        )
        self.connections[conn_id] = conn
        return conn

    def record_interaction(self, connection_id: str, action: str, data: Dict) -> None:
        """Log an interaction on a connection."""
        conn = self.connections.get(connection_id)
        if conn:
            conn.interactions.append({
                "action": action,
                "data": data,
                "timestamp": datetime.now().isoformat()
            })

    def record_outcome(self, connection_id: str, outcome: Dict) -> None:
        """Record an outcome for learning."""
        conn = self.connections.get(connection_id)
        if conn:
            conn.outcomes.append(outcome)
        self.outcome_data.append({
            "connection_id": connection_id,
            "outcome": outcome,
            "timestamp": datetime.now().isoformat()
        })

    # ------------------------------------------------------------------------
    # MATCHING ENGINE
    # ------------------------------------------------------------------------

    def find_matches(
        self,
        user_id: str,
        context: ContextType = ContextType.RELATIONAL,
        n: int = 5,
        flow_preference: Optional[Tuple[float, float, float]] = None
    ) -> List[MatchResult]:
        """
        Find the best matching Indiverses for a given user.
        Uses multi-factor resonance scoring with learned weights.
        """
        user = self.indiverses.get(user_id)
        if not user:
            return []

        candidates = [u for uid, u in self.indiverses.items() if uid != user_id]
        if not candidates:
            return []

        scores = []
        for candidate in candidates:
            score, flow, reasoning = self._compute_resonance(user, candidate, context, flow_preference)
            scores.append((score, candidate, flow, reasoning))

        # Sort by score descending
        scores.sort(key=lambda x: x[0], reverse=True)

        results = []
        for score, candidate, flow, reasoning in scores[:n]:
            results.append(MatchResult(
                partner=candidate,
                score=score,
                flow_vector=flow,
                reasoning=reasoning
            ))

        return results

    def _compute_resonance(
        self,
        user_a: Indiverse,
        user_b: Indiverse,
        context: ContextType,
        flow_pref: Optional[Tuple[float, float, float]]
    ) -> Tuple[float, Tuple[float, float, float], str]:
        """
        Compute resonance score between two Indiverses.
        Returns: (score, flow_vector, reasoning)
        """
        sig_a = user_a.signature
        sig_b = user_b.signature

        # 1. Gate overlap (Jaccard similarity)
        gates_a = set(sig_a.hd_gates)
        gates_b = set(sig_b.hd_gates)
        if gates_a and gates_b:
            gate_overlap = len(gates_a & gates_b) / len(gates_a | gates_b)
        else:
            gate_overlap = 0.0

        # 2. Body vector cosine similarity
        vec_a = sig_a.body_vector
        vec_b = sig_b.body_vector
        if np.linalg.norm(vec_a) > 0 and np.linalg.norm(vec_b) > 0:
            body_sim = float(np.dot(vec_a, vec_b) / (np.linalg.norm(vec_a) * np.linalg.norm(vec_b)))
        else:
            body_sim = 0.0

        # 3. Energy compatibility
        energy_a = user_a.state.energy_capacity
        energy_b = user_b.state.energy_capacity
        energy_comp = 1.0 - abs(energy_a - energy_b)

        # 4. Coherence alignment
        coh_a = user_a.state.coherence_score
        coh_b = user_b.state.coherence_score
        coherence_align = 1.0 - abs(coh_a - coh_b)

        # Weighted composite score
        features = np.array([gate_overlap, body_sim, energy_comp, coherence_align])
        score = float(np.dot(features, self._match_weights))

        # Flow vector: resonant, complementary, catalytic
        # Resonant: high similarity across all dimensions
        resonant = (gate_overlap + body_sim + energy_comp + coherence_align) / 4.0

        # Complementary: body vectors fill gaps
        body_diff = np.abs(vec_a - vec_b)
        complementary = float(np.mean(body_diff))  # higher difference = more complementary

        # Catalytic: tension from gate differences + energy difference
        gate_diff = 1.0 - gate_overlap
        energy_diff = abs(energy_a - energy_b)
        catalytic = (gate_diff + energy_diff) / 2.0

        flow = (resonant, complementary, catalytic)

        # Normalize flow if preference given
        if flow_pref:
            # Weight flow by preference
            weighted_flow = (
                flow[0] * flow_pref[0],
                flow[1] * flow_pref[1],
                flow[2] * flow_pref[2]
            )
            total = sum(weighted_flow)
            if total > 0:
                flow = tuple(f / total for f in weighted_flow)

        # Generate reasoning
        reasons = []
        if gate_overlap > 0.3:
            reasons.append(f"{int(gate_overlap*100)}% gate overlap")
        if body_sim > 0.6:
            reasons.append("strong body resonance")
        if energy_comp > 0.8:
            reasons.append("energy-aligned")
        if coherence_align > 0.8:
            reasons.append("coherence-matched")
        if complementary > 0.5:
            reasons.append("complementary energies")
        if catalytic > 0.5:
            reasons.append("catalytic tension")

        reasoning = ", ".join(reasons) if reasons else "general resonance"

        return score, flow, reasoning

    # ------------------------------------------------------------------------
    # LEARNING
    # ------------------------------------------------------------------------

    def retrain_matcher(self) -> None:
        """
        Adjust matching weights based on outcome data.
        Simple online learning: boost weights for features that correlate with success.
        """
        if len(self.outcome_data) < 5:
            return

        # Simple heuristic: if outcomes with high revenue/completion exist,
        # slightly adjust weights toward features that produced them
        # In a real system, this would be a proper ML model

        successful = [o for o in self.outcome_data if o["outcome"].get("completion", False)]
        if len(successful) > len(self.outcome_data) * 0.5:
            # Slightly increase weight on gate overlap (conservative)
            self._match_weights[0] = min(0.6, self._match_weights[0] + 0.02)
        else:
            # Slightly increase weight on body similarity (exploratory)
            self._match_weights[1] = min(0.5, self._match_weights[1] + 0.02)

        # Renormalize
        self._match_weights = self._match_weights / np.sum(self._match_weights)

    # ------------------------------------------------------------------------
    # CREDITS & VALUE
    # ------------------------------------------------------------------------

    def award_credits(self, user_id: str, amount: float, reason: str) -> None:
        """Award resonance credits to a user."""
        user = self.indiverses.get(user_id)
        if user:
            user.resonance_credits += amount
            user.patterns.resonance_history.append({
                "amount": amount,
                "reason": reason,
                "timestamp": datetime.now().isoformat()
            })

    def calculate_network_value(self, user_id: str) -> float:
        """Calculate the network value of a user based on connections and credits."""
        user = self.indiverses.get(user_id)
        if not user:
            return 0.0

        # Count connections
        conn_count = sum(
            1 for c in self.connections.values()
            if c.user_a_id == user_id or c.user_b_id == user_id
        )

        # Weighted value
        value = (
            user.resonance_credits * 0.4 +
            conn_count * 10.0 +
            user.state.coherence_score * 20.0 +
            user.state.energy_capacity * 10.0
        )
        return value

    # ------------------------------------------------------------------------
    # PERSISTENCE
    # ------------------------------------------------------------------------

    def save_state(self, filepath: str) -> None:
        """Save the entire universe state to JSON."""
        state = {
            "indiverses": {uid: u.to_dict() for uid, u in self.indiverses.items()},
            "connections": {cid: c.to_dict() for cid, c in self.connections.items()},
            "outcome_data": self.outcome_data,
            "match_weights": self._match_weights.tolist(),
            "id_counter": self._id_counter
        }
        with open(filepath, "w") as f:
            json.dump(state, f, indent=2)

    def load_state(self, filepath: str) -> None:
        """Load universe state from JSON."""
        with open(filepath, "r") as f:
            state = json.load(f)

        self.indiverses = {
            uid: Indiverse.from_dict(d) for uid, d in state.get("indiverses", {}).items()
        }
        self.connections = {
            cid: Connection.from_dict(d) for cid, d in state.get("connections", {}).items()
        }
        self.outcome_data = state.get("outcome_data", [])
        self._match_weights = np.array(state.get("match_weights", [0.4, 0.3, 0.2, 0.1]))
        self._id_counter = state.get("id_counter", 0)
