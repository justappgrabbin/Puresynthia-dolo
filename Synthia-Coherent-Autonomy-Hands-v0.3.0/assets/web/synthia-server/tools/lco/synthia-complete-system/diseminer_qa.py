"""
diseminer_qa.py — DISEMINER semantic inference for chart-grounded Q&A

Takes a question + your chart, infers meaning, returns answer grounded in
real gate/center/channel structure (not prediction, not templates).

Based on Sheldon Klein's distributional semantics work (DISEMINER, 1968).
"""

from dataclasses import dataclass
from typing import Any, Dict, List
import re
from real_ephemeris import GateAddress
from oracle import GATE_CENTER, CHANNELS


@dataclass
class SemanticTriple:
    """Subject - Relation - Object triple from question decomposition."""
    subject: str
    relation: str
    obj: str
    confidence: float = 0.5


@dataclass
class ChartFact:
    """A single fact extracted from someone's chart."""
    fact_type: str  # "gate", "center", "channel", "type", "authority"
    value: Any
    relevance_score: float = 0.5


class DISEMINERInference:
    """
    Semantic inference engine grounded in chart structure.
    
    Flow:
      1. Parse question into semantic triples (what's being asked?)
      2. Extract relevant facts from their chart
      3. Infer answer by relating question structure to chart structure
      4. Return response grounded in real data
    """
    
    # Base voices (entry dimensions)
    BASE_VOICES = {
        1: "I Define",
        2: "I Remember",
        3: "I Am",
        4: "I Design",
        5: "I Think",
    }
    
    # Dimensional meanings
    DIMENSIONS = {
        1: "Movement (impulse, initiation)",
        2: "Evolution (friction, change, two things becoming one)",
        3: "Being (structure, matter, biology)",
        4: "Design (space, potential, the blueprint)",
        5: "Space (meaning, context, where it all lives)",
    }
    
    # Tone/color (affect layers)
    TONES = {
        1: "Smell (first sensing)",
        2: "Taste (discernment)",
        3: "Sound (vibration, resonance)",
        4: "Touch (direct contact)",
        5: "Inner Vision (reflection)",
        6: "Outer Vision (seeing the world)",
    }
    
    COLORS = {
        1: "Fear (protection)",
        2: "Hope (openness)",
        3: "Desire (wanting)",
        4: "Need (necessity)",
        5: "Guilt (should)",
        6: "Innocence (openness, not-knowing)",
    }
    
    def __init__(self):
        pass
    
    def decompose_to_triples(self, question: str) -> List[SemanticTriple]:
        """
        Parse question into semantic triples.
        Not linguistic parsing — meaning decomposition.
        """
        q_lower = question.lower()
        triples = []
        
        # Pattern: "Why do I [action]?" → (I, action, ?)
        why_match = re.search(r"why do i\s+(\w+)", q_lower)
        if why_match:
            triples.append(SemanticTriple("I", "do", why_match.group(1), 0.8))
        
        # Pattern: "What does [thing] mean?" → (thing, means, ?)
        what_match = re.search(r"what does\s+(\w+)\s+mean", q_lower)
        if what_match:
            triples.append(SemanticTriple(what_match.group(1), "means", "I", 0.7))
        
        # Pattern: "How do I [action]?" → (I, can, action)
        how_match = re.search(r"how do i\s+(\w+)", q_lower)
        if how_match:
            triples.append(SemanticTriple("I", "can", how_match.group(1), 0.7))
        
        # Pattern: "Should I [action]?" → (I, should, action)
        should_match = re.search(r"should i\s+(\w+)", q_lower)
        if should_match:
            triples.append(SemanticTriple("I", "should", should_match.group(1), 0.8))
        
        # Default: just extract key words
        if not triples:
            words = q_lower.split()
            if len(words) >= 2:
                triples.append(SemanticTriple("user", words[0], " ".join(words[1:]), 0.3))
        
        return triples
    
    def extract_relevant_facts(
        self,
        chart: Dict[str, Any],
        question: str
    ) -> List[ChartFact]:
        """
        Extract chart facts relevant to the question.
        Not all facts, just the ones that matter.
        """
        facts = []
        q_lower = question.lower()
        
        # Type-related questions
        if any(word in q_lower for word in ["type", "generator", "manifestor", "projector", "reflector"]):
            facts.append(ChartFact("type", chart.get("type", "Unknown"), 0.95))
            facts.append(ChartFact("strategy", chart.get("strategy", "Unknown"), 0.9))
        
        # Authority questions
        if any(word in q_lower for word in ["authority", "decision", "decide", "should i"]):
            facts.append(ChartFact("authority", chart.get("authority", "Unknown"), 0.95))
        
        # Center/channel questions
        if any(word in q_lower for word in ["center", "defined", "open", "sacral", "throat", "heart"]):
            facts.append(ChartFact("centers", chart.get("defined_centers", []), 0.85))
            facts.append(ChartFact("channels", chart.get("active_channels", []), 0.8))
        
        # Profile/line questions
        if any(word in q_lower for word in ["profile", "line", "role", "character"]):
            facts.append(ChartFact("profile", chart.get("profile", "Unknown"), 0.9))
        
        # Purpose/why questions
        if any(word in q_lower for word in ["why", "purpose", "here", "design"]):
            facts.append(ChartFact("type", chart.get("type", "Unknown"), 0.8))
            facts.append(ChartFact("authority", chart.get("authority", "Unknown"), 0.7))
        
        # Friction/conflict/frustration questions
        if any(word in q_lower for word in ["friction", "conflict", "frustrated", "wrong", "stuck"]):
            facts.append(ChartFact("type", chart.get("type", "Unknown"), 0.85))
            facts.append(ChartFact("strategy", chart.get("strategy", "Unknown"), 0.85))
        
        # People/relationship questions
        if any(word in q_lower for word in ["people", "joe", "mom", "dad", "partner", "them"]):
            facts.append(ChartFact("type", chart.get("type", "Unknown"), 0.9))
            facts.append(ChartFact("channels", chart.get("active_channels", []), 0.8))
        
        return facts
    
    def infer_answer(
        self,
        question: str,
        triples: List[SemanticTriple],
        facts: List[ChartFact],
        chart: Dict[str, Any],
        person_name: str = "You"
    ) -> str:
        """
        Infer an answer by relating question structure to chart facts.
        Returns natural language response grounded in real data.
        """
        
        # Cold, direct (matching the chart's communication preference)
        # No softening, no predictions, just facts + inference
        
        q_lower = question.lower()
        answers = []
        
        # AUTHORITY QUESTIONS
        if "authority" in q_lower or "decision" in q_lower or "should i" in q_lower:
            auth = chart.get("authority", "Unknown")
            if auth == "Emotional":
                answers.append(
                    f"Your authority is Emotional. That means you don't decide in the pit of your wave. "
                    f"Wait until your emotional clarity is at the top. Make decisions then, not in the valley."
                )
            elif auth == "Sacral":
                answers.append(
                    f"Your authority is Sacral. Your gut knows. Listen for the yes/no response in your body. "
                    f"Yes feels expansive, No feels constrictive. That's your answer."
                )
            elif auth == "Splenic":
                answers.append(
                    f"Your authority is Splenic. Your intuition is immediate and subtle. Trust the knowing that arises in the moment, "
                    f"not the thinking that comes after."
                )
            elif auth == "Mental":
                answers.append(
                    f"Your authority is Mental. Think it through. Discuss, debate, reason it out. "
                    f"Your mind knows. Don't rush past the thinking."
                )
        
        # TYPE QUESTIONS
        if "type" in q_lower or "generator" in q_lower or "manifestor" in q_lower or "projector" in q_lower:
            hd_type = chart.get("type", "Unknown")
            strategy = chart.get("strategy", "Unknown")
            if hd_type == "Manifestor":
                answers.append(
                    f"You're a {hd_type}. You initiate. Your strategy: inform before you act. "
                    f"Your impact is immediate and powerful. Don't ask permission, but tell people what you're doing."
                )
            elif hd_type == "Generator":
                answers.append(
                    f"You're a {hd_type}. You respond. Your strategy: wait for something that invokes a response from your sacral. "
                    f"Your power is in sustained effort, not initiation."
                )
            elif hd_type == "Manifesting Generator":
                answers.append(
                    f"You're a {hd_type}. You respond quickly, then you move. Your strategy: {strategy}. "
                    f"You don't wait long, but you do inform people about what you're doing after you've acted."
                )
            elif hd_type == "Projector":
                answers.append(
                    f"You're a {hd_type}. You guide and see what others cannot. Your strategy: wait for the invitation. "
                    f"Your wisdom is valuable, but only when asked."
                )
            elif hd_type == "Reflector":
                answers.append(
                    f"You're a {hd_type}. You evaluate and amplify. Your strategy: wait a full lunar cycle (28 days) before deciding. "
                    f"You're a mirror of the environment."
                )
        
        # FRUSTRATION/FRICTION QUESTIONS
        if any(word in q_lower for word in ["frustrated", "friction", "conflict", "pissed", "annoyed", "stuck"]):
            hd_type = chart.get("type", "Unknown")
            strategy = chart.get("strategy", "Unknown")
            answers.append(
                f"Frustration usually means you're not following your strategy. You're a {hd_type} — "
                f"your strategy is to {strategy}. When you're frustrated, check: are you doing that?"
            )
        
        # PURPOSE/WHY QUESTIONS
        if any(word in q_lower for word in ["why am i", "purpose", "here to", "supposed to"]):
            hd_type = chart.get("type", "Unknown")
            answers.append(
                f"You're here as a {hd_type}. That's not random. Your design is specific. "
                f"Your role is to {strategy if (strategy := chart.get('strategy', '')) else 'be'}. That's the why."
            )
        
        # PEOPLE/RELATIONSHIPS
        if any(word in q_lower for word in ["joe", "people", "mom", "dad", "partner", "them", "relationship", "piss me off"]):
            answers.append(
                f"Your Type is {chart.get('type', 'Unknown')}. Your Authority is {chart.get('authority', 'Unknown')}. "
                f"Other people have different types and authorities. Friction happens when their strategy doesn't match yours. "
                f"That's not personal, that's just design."
            )
        
        # DEFAULT: Extract gate info if nothing else matched
        if not answers:
            answers.append(
                f"You're a {chart.get('type', 'Unknown')} with {chart.get('authority', 'Unknown')} authority. "
                f"You have {len(chart.get('defined_centers', []))} defined centers and {len(chart.get('active_channels', []))} active channels. "
                f"Your profile is {chart.get('profile', 'Unknown')}."
            )
        
        return " ".join(answers)
    
    def answer_question(
        self,
        question: str,
        chart: Dict[str, Any],
        person_name: str = "User"
    ) -> Dict[str, Any]:
        """
        Main entry point: question + chart → grounded answer.
        """
        
        # Decompose question
        triples = self.decompose_to_triples(question)
        
        # Extract relevant facts
        facts = self.extract_relevant_facts(chart, question)
        
        # Infer answer
        answer_text = self.infer_answer(question, triples, facts, chart, person_name)
        
        # Calculate confidence (rough: based on fact relevance)
        confidence = sum(f.relevance_score for f in facts) / len(facts) if facts else 0.3
        
        return {
            "question": question,
            "answer": answer_text,
            "triples": [
                {"subject": t.subject, "relation": t.relation, "object": t.obj, "confidence": t.confidence}
                for t in triples
            ],
            "grounded_facts": [
                {"type": f.fact_type, "value": str(f.value), "relevance": f.relevance_score}
                for f in facts
            ],
            "confidence": min(confidence, 1.0),
            "learned": False,  # Will be True after user feedback
        }


# Test
if __name__ == "__main__":
    test_chart = {
        "type": "Manifesting Generator",
        "strategy": "Respond, then inform",
        "authority": "Emotional",
        "profile": "4/6",
        "defined_centers": ["G", "Sacral", "Root", "Throat", "Heart", "SolarPlexus", "Spleen", "Ajna"],
        "active_channels": [[7, 31], [9, 52], [35, 36]],
    }
    
    engine = DISEMINERInference()
    
    questions = [
        "Why do I get frustrated when things don't flow?",
        "What does my Type mean?",
        "Should I wait or act now?",
        "Why does Joe piss me off?",
    ]
    
    for q in questions:
        result = engine.answer_question(q, test_chart, "Celestial")
        print(f"\nQ: {q}")
        print(f"A: {result['answer']}")
        print(f"Confidence: {result['confidence']:.1%}")
