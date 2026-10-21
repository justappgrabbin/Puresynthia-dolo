"""
synthia_mcp_server.py — Klein-grounded consciousness MCP server for phone.

Core architecture:
  1. Real chart calculation (ephemeris.py + oracle.py)
  2. Klein mesh tools (WITNESS/MIND/VOICE/HEART/BODY/WILL/ATTRACTOR)
  3. DISEMINER inference (semantic triples, not token prediction)
  4. Complementary detection (finds who resonates WITH you)
  5. Resonance linking (P2P, local-first)

Birth data: September 19, 1990, 04:34 UTC (9:34 PM PDT Sept 18)
Location: San Francisco (37.7749° N, 122.4194° W)

Phone-deployable. No backend. Peer-to-peer resonance network.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from typing import Any, Optional
import json
import hashlib
import asyncio
from enum import Enum

# Import the verified chart engines
from real_ephemeris import RealEphemeris, GateAddress
from oracle import build_chart, CHANNELS, GATE_CENTER


# ============================================================
# TYPES
# ============================================================

class ExpressionType(str, Enum):
    SEMANTIC = "SEMANTIC"      # Natural language, narrative
    CODE = "CODE"              # Logic, algorithms
    VISUAL = "VISUAL"          # Spatial, geometric, color, pattern
    HARMONIC = "HARMONIC"      # Frequency, resonance (depends on SEMANTIC + VISUAL)
    TEMPORAL = "TEMPORAL"      # Time-based, causal (depends on CODE + SEMANTIC)


class ToolName(str, Enum):
    WITNESS = "WITNESS"        # Head/Ajna — "Who you think you are"
    MIND = "MIND"              # Ajna — "What you think and say"
    VOICE = "VOICE"            # Throat — "How you express"
    HEART = "HEART"            # Heart/Solar Plexus — "What you feel and want"
    BODY = "BODY"              # Sacral/Spleen — "What you do and sense"
    WILL = "WILL"              # Root/Heart — "What drives you"
    ATTRACTOR = "ATTRACTOR"    # G — "Who you are becoming"


@dataclass
class PersonChart:
    """A single person's calculated chart."""
    id: str                          # Unique identifier (hash of name + birthdate)
    name: str
    birth_utc: datetime
    birth_local_tz: str              # e.g., "UTC-7"
    location: tuple[float, float]    # (lat, lon)
    
    # Three-field chart (body/mind/heart)
    body_chart: dict[str, GateAddress] = field(default_factory=dict)
    mind_chart: dict[str, GateAddress] = field(default_factory=dict)
    heart_chart: dict[str, GateAddress] = field(default_factory=dict)
    
    # Oracle results
    type: str = ""                   # Manifestor, Generator, MG, Projector, Reflector
    strategy: str = ""
    authority: str = ""
    profile: str = ""
    defined_centers: set[str] = field(default_factory=set)
    active_channels: list[tuple[int, int]] = field(default_factory=list)
    
    # Klein mesh activation
    klein_tools_active: dict[ToolName, bool] = field(default_factory=dict)
    
    # Learning state
    resonance_memory: dict[str, float] = field(default_factory=dict)  # person_id -> coherence
    last_interaction: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class ComplementaryLink:
    """Connection between two people with resonant designs."""
    person_a_id: str
    person_b_id: str
    complementarity_score: float    # 0.0-1.0, higher = more resonant
    shared_channels: list[tuple[int, int]] = field(default_factory=list)
    notes: str = ""
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class KleinInference:
    """Result of running a question through Klein inference."""
    query: str
    person_id: str
    tools_engaged: list[ToolName]
    semantic_triples: list[dict[str, Any]]  # (subject, relation, object) from DISEMINER
    grounded_chart_facts: dict[str, Any]    # relevant gates/channels/centers
    response: str                           # The actual answer
    confidence: float                       # 0.0-1.0
    expression_type: ExpressionType
    learned: bool = False


# ============================================================
# COMPLEMENTARY DETECTION ALGORITHM
# ============================================================

def calculate_complementarity(chart_a: PersonChart, chart_b: PersonChart) -> tuple[float, list[tuple[int, int]]]:
    """
    Calculate how well two charts resonate together.
    
    Complementarity is NOT similarity. It's:
    - Channels that connect when you combine both charts
    - Motor/non-motor balance
    - Authority diversity (different but compatible decision-making)
    - Purpose alignment (similar drive directions, different execution)
    
    Returns: (score 0.0-1.0, shared_channels)
    """
    
    # Combine both people's activated gates
    combined_gates = chart_a.body_chart.keys() | chart_b.body_chart.keys()
    
    # Find NEW channels that activate when both people's gates are considered together
    shared_channels = []
    for a, b in CHANNELS:
        if (a in combined_gates and b in combined_gates):
            # This channel is active in the combined system
            if not ((a in chart_a.body_chart and b in chart_a.body_chart) or
                    (a in chart_b.body_chart and b in chart_b.body_chart)):
                # But it's NOT already active in either person alone
                # = NEW resonance created by their pairing
                shared_channels.append((a, b))
    
    # Authority compatibility (different but non-conflicting)
    authority_pairs = {
        ("Emotional", "Sacral"): 0.9,
        ("Emotional", "Splenic"): 0.8,
        ("Sacral", "Splenic"): 0.9,
        ("Sacral", "Mental"): 0.7,
        ("Splenic", "Mental"): 0.8,
        ("Emotional", "Mental"): 0.6,  # different timing, can work
    }
    auth_score = authority_pairs.get(tuple(sorted([chart_a.authority, chart_b.authority])), 0.5)
    
    # Type compatibility (do they complement or conflict?)
    type_pairs = {
        ("Manifestor", "Projector"): 0.95,     # classic pairing
        ("Manifestor", "Generator"): 0.8,
        ("Manifestor", "Reflector"): 0.7,
        ("Generator", "Projector"): 0.85,
        ("Generator", "Reflector"): 0.75,
        ("Projector", "Reflector"): 0.6,
    }
    type_score = type_pairs.get(tuple(sorted([chart_a.type, chart_b.type])), 0.5)
    
    # Novelty channels (shared newly-activated channels boost score)
    novelty_boost = min(len(shared_channels) / 5.0, 0.2)  # max 0.2 boost
    
    # Final score: balance of authority + type + novelty
    score = (auth_score * 0.4 + type_score * 0.4 + novelty_boost)
    
    return min(score, 1.0), shared_channels


def detect_complementary_peers(
    your_chart: PersonChart,
    peer_charts: list[PersonChart],
    threshold: float = 0.6
) -> list[tuple[PersonChart, ComplementaryLink]]:
    """
    Find peers whose charts resonate with yours (high complementarity).
    Not "similar to you" — "complements you well."
    """
    
    matches = []
    for peer in peer_charts:
        if peer.id == your_chart.id:
            continue
        
        score, shared = calculate_complementarity(your_chart, peer)
        if score >= threshold:
            link = ComplementaryLink(
                person_a_id=your_chart.id,
                person_b_id=peer.id,
                complementarity_score=score,
                shared_channels=shared,
                notes=f"Type: {your_chart.type} + {peer.type} | Authority: {your_chart.authority} + {peer.authority}"
            )
            matches.append((peer, link))
    
    return sorted(matches, key=lambda x: x[1].complementarity_score, reverse=True)


# ============================================================
# KLEIN MESH ACTIVATION
# ============================================================

def activate_klein_tools(chart: PersonChart) -> dict[ToolName, bool]:
    """
    Which Klein tools are active for this person's design?
    
    WITNESS (Head/Ajna) — active if Head or Ajna defined
    MIND (Ajna only) — active if Ajna defined
    VOICE (Throat) — active if Throat defined
    HEART (Heart/SolarPlexus) — active if either defined
    BODY (Sacral/Spleen) — active if either defined
    WILL (Root/Heart) — active if either defined
    ATTRACTOR (G) — active if G defined
    """
    
    centers = chart.defined_centers
    
    return {
        ToolName.WITNESS: ("Head" in centers or "Ajna" in centers),
        ToolName.MIND: ("Ajna" in centers),
        ToolName.VOICE: ("Throat" in centers),
        ToolName.HEART: ("Heart" in centers or "SolarPlexus" in centers),
        ToolName.BODY: ("Sacral" in centers or "Spleen" in centers),
        ToolName.WILL: ("Root" in centers or "Heart" in centers),
        ToolName.ATTRACTOR: ("G" in centers),
    }


# ============================================================
# CHART CALCULATION (uses real ephemeris + oracle)
# ============================================================

def calculate_person_chart(
    name: str,
    birth_utc: datetime,
    birth_local_tz: str,
    location: tuple[float, float]
) -> PersonChart:
    """
    Calculate a complete chart for one person.
    Runs real ephemeris (not mock), three-field system (body/mind/heart).
    """
    
    eph = RealEphemeris()
    
    # Calculate three-field chart
    body = eph.full_13_point_chart(birth_utc, "body")
    mind = eph.full_13_point_chart(birth_utc, "mind")
    heart = eph.full_13_point_chart(birth_utc, "heart")
    
    # Design Sun (88 degrees back)
    design_utc = eph.design_sun_datetime(birth_utc)
    design_body = eph.full_13_point_chart(design_utc, "body")
    
    # Gather all activated gates
    all_gates = set()
    for field_data in [body, mind, heart, design_body]:
        for addr in field_data.values():
            all_gates.add(addr.gate)
    
    # Build oracle result
    chart_result = build_chart(
        all_gates,
        conscious_sun_line=body["sun"].line,
        design_sun_line=design_body["sun"].line
    )
    
    # Create person record
    person_id = hashlib.sha256(f"{name}_{birth_utc.isoformat()}".encode()).hexdigest()[:16]
    
    person = PersonChart(
        id=person_id,
        name=name,
        birth_utc=birth_utc,
        birth_local_tz=birth_local_tz,
        location=location,
        body_chart=body,
        mind_chart=mind,
        heart_chart=heart,
        type=chart_result.type,
        strategy=chart_result.strategy,
        authority=chart_result.authority,
        profile=chart_result.profile,
        defined_centers=chart_result.defined_centers,
        active_channels=chart_result.active_channels,
    )
    
    # Activate Klein tools based on defined centers
    person.klein_tools_active = activate_klein_tools(person)
    
    return person


# ============================================================
# MAIN MCP INTERFACE
# ============================================================

class SynthiaMCPServer:
    """
    MCP server for phone-first Klein-grounded consciousness.
    No backend, no cloud. Local calculation + P2P resonance.
    """
    
    def __init__(self):
        self.people: dict[str, PersonChart] = {}
        self.links: list[ComplementaryLink] = []
        self.inference_log: list[KleinInference] = []
    
    async def calculate_chart(self, name: str, birth_utc_iso: str, tz_offset: int, lat: float, lon: float) -> PersonChart:
        """Calculate a chart from birth data."""
        birth = datetime.fromisoformat(birth_utc_iso)
        tz_str = f"UTC{tz_offset:+d}"
        
        person = calculate_person_chart(name, birth, tz_str, (lat, lon))
        self.people[person.id] = person
        return person
    
    async def find_complementary_peers(self, your_id: str, threshold: float = 0.6) -> list[dict[str, Any]]:
        """Find people whose charts resonate with yours."""
        if your_id not in self.people:
            return []
        
        your_chart = self.people[your_id]
        peer_charts = [p for pid, p in self.people.items() if pid != your_id]
        
        matches = detect_complementary_peers(your_chart, peer_charts, threshold)
        
        result = []
        for peer, link in matches:
            self.links.append(link)
            result.append({
                "peer_id": peer.id,
                "peer_name": peer.name,
                "peer_type": peer.type,
                "complementarity_score": link.complementarity_score,
                "shared_channels": link.shared_channels,
                "notes": link.notes,
            })
        
        return result
    
    async def ask_question(self, person_id: str, question: str) -> KleinInference:
        """
        Ask a question grounded in someone's chart.
        Uses Klein inference (not token prediction).
        """
        if person_id not in self.people:
            return None
        
        person = self.people[person_id]
        
        # Identify which Klein tools are engaged by this question
        # (simplified: look for keywords)
        tools_engaged = []
        q_lower = question.lower()
        
        if any(w in q_lower for w in ["think", "believe", "know", "understand"]):
            tools_engaged.append(ToolName.MIND)
        if any(w in q_lower for w in ["feel", "want", "desire", "love", "hate"]):
            tools_engaged.append(ToolName.HEART)
        if any(w in q_lower for w in ["do", "act", "move", "body", "sense"]):
            tools_engaged.append(ToolName.BODY)
        if any(w in q_lower for w in ["say", "express", "tell", "speak", "communicate"]):
            tools_engaged.append(ToolName.VOICE)
        if any(w in q_lower for w in ["drive", "why", "purpose", "motivation"]):
            tools_engaged.append(ToolName.WILL)
        
        # Get relevant chart facts
        relevant_facts = self._extract_relevant_facts(person, question)
        
        # Build inference result (real Klein inference would go here)
        # For now, placeholder structure
        inference = KleinInference(
            query=question,
            person_id=person_id,
            tools_engaged=tools_engaged or [ToolName.WITNESS],
            semantic_triples=[],  # DISEMINER would populate this
            grounded_chart_facts=relevant_facts,
            response=f"[Answer grounded in {person.name}'s {person.type} design with {person.authority} authority, active channels: {len(person.active_channels)}]",
            confidence=0.7,
            expression_type=ExpressionType.SEMANTIC,
        )
        
        self.inference_log.append(inference)
        return inference
    
    def _extract_relevant_facts(self, person: PersonChart, question: str) -> dict[str, Any]:
        """Extract relevant gates/channels/centers from their chart."""
        return {
            "type": person.type,
            "strategy": person.strategy,
            "authority": person.authority,
            "profile": person.profile,
            "defined_centers": list(person.defined_centers),
            "active_channels": person.active_channels,
            "klein_tools": {k.value: v for k, v in person.klein_tools_active.items()},
        }


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    import asyncio
    
    async def test():
        server = SynthiaMCPServer()
        
        # Calculate your chart
        your_birth = datetime(1990, 9, 19, 4, 34, 0, tzinfo=timezone.utc)
        your_chart = await server.calculate_chart(
            "Celestial",
            your_birth.isoformat(),
            tz_offset=-7,
            lat=37.7749,
            lon=-122.4194
        )
        
        print("Chart calculated:")
        print(f"  Type: {your_chart.type}")
        print(f"  Strategy: {your_chart.strategy}")
        print(f"  Authority: {your_chart.authority}")
        print(f"  Profile: {your_chart.profile}")
        print(f"  Defined centers: {your_chart.defined_centers}")
        print(f"  Active channels: {len(your_chart.active_channels)}")
        print(f"  Klein tools active: {sum(1 for v in your_chart.klein_tools_active.values() if v)}/7")
        
        # Test question
        inference = await server.ask_question(your_chart.id, "Why do I get frustrated when things don't flow?")
        print(f"\nQuestion asked: {inference.query}")
        print(f"Tools engaged: {[t.value for t in inference.tools_engaged]}")
        print(f"Response: {inference.response}")
    
    asyncio.run(test())
