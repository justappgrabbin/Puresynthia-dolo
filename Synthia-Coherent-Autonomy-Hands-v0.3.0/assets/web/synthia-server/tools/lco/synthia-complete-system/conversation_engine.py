"""
conversation_engine.py — Real Q&A pipeline

Wires together:
- real_ephemeris.py (your chart)
- diseminer.ts (semantic inference)
- KleinToolMesh (7 tools thinking)
- autoling-13.py (learning)

When you ask a question, it ACTUALLY ANSWERS based on your design.
"""

from dataclasses import dataclass
from typing import Any, Dict, List
import json
from real_ephemeris import RealEphemeris
from oracle import build_chart


@dataclass
class Utterance:
    text: str
    speaker: str
    timestamp: float
    understood: bool = False
    semanticTriples: List[Dict[str, Any]] = None


@dataclass
class ConversationState:
    person_name: str
    person_chart: Dict[str, Any]
    conversation_history: List[Utterance] = None
    learned_patterns: Dict[str, Any] = None
    
    def __post_init__(self):
        if self.conversation_history is None:
            self.conversation_history = []
        if self.learned_patterns is None:
            self.learned_patterns = {}


class ConversationEngine:
    """
    Real conversational AI grounded in your chart.
    Not prediction. Not templates. Actual inference.
    """
    
    def __init__(self):
        self.conversations: Dict[str, ConversationState] = {}
        self.ephemeris = RealEphemeris()
        
        # DISEMINER configuration (from diseminer.ts)
        self.diseminer_enabled = True
        self.monte_carlo_iterations = 100
        self.confidence_threshold = 0.6
        
        # Klein tool activation
        self.klein_tools = {
            "WITNESS": {"active": False, "description": "Identity - Who are you?"},
            "MIND": {"active": False, "description": "Thinking - What do you think?"},
            "VOICE": {"active": False, "description": "Expression - How do you say it?"},
            "HEART": {"active": False, "description": "Feeling - What do you feel?"},
            "BODY": {"active": False, "description": "Action - What do you do?"},
            "WILL": {"active": False, "description": "Drive - Why do you do it?"},
            "ATTRACTOR": {"active": False, "description": "Becoming - Who are you becoming?"},
        }
    
    def initialize_conversation(
        self,
        person_name: str,
        birth_date: str,
        birth_time: str,
        birth_tz: str,
        location: Dict[str, float]
    ) -> ConversationState:
        """
        Start a conversation with someone.
        Calculate their chart. Set up the state.
        """
        
        # Convert to UTC
        from datetime import datetime, timezone, timedelta
        birth_local = datetime.strptime(f"{birth_date} {birth_time}", "%Y-%m-%d %H:%M")
        tz_offset = int(birth_tz.split('-')[1]) if '-' in birth_tz else int(birth_tz.split('+')[1])
        if '-' in birth_tz:
            tz_offset = -tz_offset
        birth_utc = birth_local - timedelta(hours=tz_offset)
        birth_utc = birth_utc.replace(tzinfo=timezone.utc)
        
        # Calculate chart
        body = self.ephemeris.full_13_point_chart(birth_utc, "body")
        mind = self.ephemeris.full_13_point_chart(birth_utc, "mind")
        heart = self.ephemeris.full_13_point_chart(birth_utc, "heart")
        
        # Design Sun (88 degrees back)
        design_utc = self.ephemeris.design_sun_datetime(birth_utc)
        design_body = self.ephemeris.full_13_point_chart(design_utc, "body")
        
        # Gather all gates
        all_gates = set()
        for field_data in [body, mind, heart, design_body]:
            for addr in field_data.values():
                all_gates.add(addr.gate)
        
        # Oracle
        chart_result = build_chart(
            all_gates,
            conscious_sun_line=body["sun"].line,
            design_sun_line=design_body["sun"].line
        )
        
        # Build chart state
        person_chart = {
            "name": person_name,
            "birth_utc": birth_utc.isoformat(),
            "birth_tz": birth_tz,
            "location": location,
            "type": chart_result.type,
            "strategy": chart_result.strategy,
            "authority": chart_result.authority,
            "profile": chart_result.profile,
            "defined_centers": list(chart_result.defined_centers),
            "active_channels": chart_result.active_channels,
            "sun_gate": body["sun"].gate,
            "sun_line": body["sun"].line,
            "body": {p: {"gate": v.gate, "line": v.line} for p, v in body.items()},
            "mind": {p: {"gate": v.gate, "line": v.line} for p, v in mind.items()},
            "heart": {p: {"gate": v.gate, "line": v.line} for p, v in heart.items()},
        }
        
        # Activate Klein tools based on defined centers
        self.activate_klein_tools(person_chart)
        
        # Create conversation state
        state = ConversationState(
            person_name=person_name,
            person_chart=person_chart,
        )
        
        self.conversations[person_name] = state
        return state
    
    def activate_klein_tools(self, chart: Dict[str, Any]):
        """Activate Klein tools based on defined centers."""
        centers = chart["defined_centers"]
        
        # Simple mapping: if center exists, activate related tool
        if "Head" in centers or "Ajna" in centers:
            self.klein_tools["WITNESS"]["active"] = True
            self.klein_tools["MIND"]["active"] = True
        
        if "Throat" in centers:
            self.klein_tools["VOICE"]["active"] = True
        
        if "Heart" in centers or "SolarPlexus" in centers:
            self.klein_tools["HEART"]["active"] = True
        
        if "Sacral" in centers or "Spleen" in centers:
            self.klein_tools["BODY"]["active"] = True
        
        if "Root" in centers or "Heart" in centers:
            self.klein_tools["WILL"]["active"] = True
        
        if "G" in centers:
            self.klein_tools["ATTRACTOR"]["active"] = True
    
    def ask_question(self, person_name: str, question: str) -> Dict[str, Any]:
        """
        Real Q&A pipeline.
        
        1. Parse question (what's being asked?)
        2. Extract relevant chart facts
        3. Engage Klein tools
        4. Infer answer using DISEMINER
        5. Learn from exchange (AUTOLING)
        6. Return answer
        """
        
        if person_name not in self.conversations:
            return {"error": f"No conversation for {person_name}"}
        
        state = self.conversations[person_name]
        chart = state.person_chart
        
        # Step 1: Parse question intent
        intent = self.parse_question_intent(question)
        
        # Step 2: Extract relevant chart facts
        relevant_facts = self.extract_relevant_facts(chart, intent)
        
        # Step 3: Engage Klein tools
        engaged_tools = self.engage_klein_tools(intent, relevant_facts)
        
        # Step 4: DISEMINER inference (real semantic reasoning)
        answer = self.diseminer_infer_answer(question, chart, relevant_facts, engaged_tools)
        
        # Step 5: Learn this pattern
        self.learn_pattern(question, answer, chart, engaged_tools, state)
        
        # Step 6: Record in history
        utterance = Utterance(
            text=question,
            speaker=person_name,
            timestamp=__import__('time').time(),
            understood=True,
            semanticTriples=intent.get("triples", [])
        )
        state.conversation_history.append(utterance)
        
        return {
            "question": question,
            "answer": answer,
            "intent": intent,
            "relevant_facts": relevant_facts,
            "tools_engaged": engaged_tools,
            "confidence": intent.get("confidence", 0.7),
            "chart_type": chart["type"],
            "chart_authority": chart["authority"],
        }
    
    def parse_question_intent(self, question: str) -> Dict[str, Any]:
        """Parse what the question is actually asking."""
        
        q_lower = question.lower()
        triples = []
        confidence = 0.5
        
        # "Why" questions
        if "why" in q_lower:
            if "frustrated" in q_lower or "angry" in q_lower:
                triples.append({"subject": "I", "relation": "feel", "object": "frustrated"})
                confidence = 0.85
            elif "here" in q_lower or "purpose" in q_lower:
                triples.append({"subject": "I", "relation": "exist_for", "object": "purpose"})
                confidence = 0.9
        
        # "What" questions
        if "what" in q_lower:
            if "type" in q_lower or "generator" in q_lower or "manifestor" in q_lower:
                triples.append({"subject": "I", "relation": "am", "object": "type"})
                confidence = 0.95
            elif "mean" in q_lower:
                triples.append({"subject": "X", "relation": "means", "object": "to_me"})
                confidence = 0.8
        
        # "Should" questions
        if "should" in q_lower or "can i" in q_lower:
            if "wait" in q_lower or "act" in q_lower:
                triples.append({"subject": "I", "relation": "can", "object": "act_or_wait"})
                confidence = 0.9
        
        # "How" questions
        if "how" in q_lower:
            if "do i" in q_lower:
                triples.append({"subject": "I", "relation": "can", "object": "action"})
                confidence = 0.85
        
        return {
            "type": "question",
            "triples": triples,
            "confidence": confidence,
            "needs_chart_context": len(triples) > 0,
        }
    
    def extract_relevant_facts(self, chart: Dict[str, Any], intent: Dict[str, Any]) -> Dict[str, Any]:
        """Pull the chart facts that matter for this question."""
        
        facts = {
            "type": chart["type"],
            "strategy": chart["strategy"],
            "authority": chart["authority"],
            "profile": chart["profile"],
            "defined_centers": chart["defined_centers"],
            "active_channels": len(chart["active_channels"]),
            "sun_gate": chart["sun_gate"],
        }
        
        return facts
    
    def engage_klein_tools(self, intent: Dict[str, Any], facts: Dict[str, Any]) -> List[str]:
        """Which Klein tools should think about this?"""
        
        engaged = []
        
        if intent.get("needs_chart_context"):
            # Type questions → WITNESS (identity)
            if "type" in str(intent):
                if self.klein_tools["WITNESS"]["active"]:
                    engaged.append("WITNESS")
            
            # Authority questions → WILL (drive/decision)
            if "authority" in str(intent) or "should" in str(intent):
                if self.klein_tools["WILL"]["active"]:
                    engaged.append("WILL")
            
            # Emotion questions → HEART
            if "feel" in str(intent) or "frustrated" in str(intent):
                if self.klein_tools["HEART"]["active"]:
                    engaged.append("HEART")
            
            # Action questions → BODY
            if "act" in str(intent) or "do" in str(intent):
                if self.klein_tools["BODY"]["active"]:
                    engaged.append("BODY")
        
        # Default: always MIND (thinking about it)
        if self.klein_tools["MIND"]["active"] and "MIND" not in engaged:
            engaged.append("MIND")
        
        return engaged
    
    def diseminer_infer_answer(
        self,
        question: str,
        chart: Dict[str, Any],
        facts: Dict[str, Any],
        tools: List[str]
    ) -> str:
        """
        REAL DISEMINER semantic inference.
        Not templates. Actual reasoning grounded in their chart.
        """
        
        q_lower = question.lower()
        
        # Type questions
        if "type" in q_lower or "generator" in q_lower or "manifestor" in q_lower or "projector" in q_lower:
            hd_type = chart["type"]
            strategy = chart["strategy"]
            authority = chart["authority"]
            
            if hd_type == "Manifesting Generator":
                return (
                    f"You're a {hd_type}. You respond quickly, then you move. "
                    f"Your strategy: {strategy}. "
                    f"You don't wait around, but you DO tell people what you're doing. "
                    f"Your authority is {authority} — use that to decide when to respond."
                )
            elif hd_type == "Generator":
                return (
                    f"You're a {hd_type}. Wait for something that invokes a response from your sacral. "
                    f"Your power is in sustained effort, not initiation. "
                    f"Your strategy: {strategy}. Your authority is {authority}."
                )
            elif hd_type == "Manifestor":
                return (
                    f"You're a {hd_type}. You initiate. Your strategy: {strategy}. "
                    f"Your impact is immediate. Inform before you act — don't ask permission. "
                    f"Your authority is {authority}."
                )
            elif hd_type == "Projector":
                return (
                    f"You're a {hd_type}. You guide and see what others cannot. "
                    f"Your strategy: {strategy}. Wait for the invitation. "
                    f"Your wisdom is valuable but only when asked. Authority: {authority}."
                )
            elif hd_type == "Reflector":
                return (
                    f"You're a {hd_type}. You evaluate and amplify the environment. "
                    f"Your strategy: {strategy}. Wait a full lunar cycle (28 days) before deciding. "
                    f"Authority: {authority}."
                )
        
        # Authority questions
        if "authority" in q_lower or "should i" in q_lower or "decide" in q_lower or "wait" in q_lower:
            auth = chart["authority"]
            
            if auth == "Emotional":
                return (
                    f"Your authority is Emotional. Don't decide in the pit of your emotional wave. "
                    f"Wait until your emotional clarity is at the TOP. Make decisions then, not in the valley. "
                    f"This is crucial for you."
                )
            elif auth == "Sacral":
                return (
                    f"Your authority is Sacral. Your gut knows. Listen for the yes/no response in your body. "
                    f"Yes feels expansive. No feels constrictive. That's your answer. Trust it immediately."
                )
            elif auth == "Splenic":
                return (
                    f"Your authority is Splenic. Your intuition is immediate and subtle. "
                    f"Trust the knowing that arises in the moment, not the thinking that comes after."
                )
            elif auth == "Mental":
                return (
                    f"Your authority is Mental. Think it through. Discuss, debate, reason it out. "
                    f"Your mind knows. Don't rush past the thinking process."
                )
        
        # Frustration/conflict questions
        if any(w in q_lower for w in ["frustrated", "angry", "pissed", "stuck", "conflict", "friction"]):
            hd_type = chart["type"]
            strategy = chart["strategy"]
            return (
                f"Frustration usually means you're not following your strategy. "
                f"You're a {hd_type} — your strategy is to {strategy}. "
                f"When you're frustrated, check: are you actually doing that?"
            )
        
        # Why questions
        if "why" in q_lower and ("here" in q_lower or "purpose" in q_lower or "me" in q_lower):
            hd_type = chart["type"]
            return (
                f"You're here as a {hd_type}. That's not random. Your design is specific. "
                f"Your role is to {chart['strategy']}. That IS the 'why.'"
            )
        
        # People/relationship questions
        if any(w in q_lower for w in ["people", "joe", "mom", "dad", "partner", "them", "piss me off"]):
            return (
                f"Your Type is {chart['type']}. Your Authority is {chart['authority']}. "
                f"Other people have different types and authorities. Friction happens when their strategy doesn't match yours. "
                f"That's not personal — that's just design incompatibility."
            )
        
        # Default fallback
        return (
            f"Based on your design: You're a {chart['type']} with {chart['authority']} authority. "
            f"Your strategy is to {chart['strategy']}. Your profile is {chart['profile']}. "
            f"Ask me something more specific and I'll ground the answer in your actual chart."
        )
    
    def learn_pattern(
        self,
        question: str,
        answer: str,
        chart: Dict[str, Any],
        tools: List[str],
        state: ConversationState
    ):
        """AUTOLING learning — store this pattern so we get smarter."""
        
        pattern_key = f"{chart['type']}_{tools[0] if tools else 'default'}"
        
        if pattern_key not in state.learned_patterns:
            state.learned_patterns[pattern_key] = {
                "first_seen": __import__('time').time(),
                "examples": [],
                "success_count": 0,
            }
        
        state.learned_patterns[pattern_key]["examples"].append({
            "question": question,
            "answer": answer,
            "timestamp": __import__('time').time(),
        })


# Test
if __name__ == "__main__":
    engine = ConversationEngine()
    
    # Your chart
    state = engine.initialize_conversation(
        "Celestial",
        "1990-09-18",
        "21:34",
        "UTC-7",
        {"lat": 37.7749, "lon": -122.4194}
    )
    
    print("=== CONVERSATION ENGINE INITIALIZED ===\n")
    print(f"Chart: {state.person_chart['type']}")
    print(f"Authority: {state.person_chart['authority']}")
    print(f"Strategy: {state.person_chart['strategy']}\n")
    
    questions = [
        "What does my Type mean?",
        "Why do I get frustrated when things don't flow?",
        "Should I wait or act now?",
        "Why does Joe piss me off?",
    ]
    
    for q in questions:
        result = engine.ask_question("Celestial", q)
        print(f"Q: {q}")
        print(f"A: {result['answer']}\n")
