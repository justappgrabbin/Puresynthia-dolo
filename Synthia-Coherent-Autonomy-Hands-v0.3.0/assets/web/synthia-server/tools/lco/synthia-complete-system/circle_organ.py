"""
Circle Organ — Creative Expression Layer
=====================================
The creative counterpart to HiveOrgan.
Generates creative projects and tracks artistic/collaborative outcomes.
"""

from __future__ import annotations
import random
from datetime import datetime, timedelta
from typing import Dict, Optional
from universe_core import Universe, Connection, ContextType


class CircleOrgan:
    """Creative expression layer — generates collaborative art projects and tracks creative outcomes."""

    PROJECT_TEMPLATES = {
        "soundscape": {
            "name": "Soundscape Collaboration",
            "description": "Co-create ambient audio experiences based on resonance signatures",
            "estimated_days": 14,
            "coherence_potential": (0.7, 0.95)
        },
        "visual_mandala": {
            "name": "Visual Mandala",
            "description": "Generate collaborative visual art from body vector intersections",
            "estimated_days": 21,
            "coherence_potential": (0.6, 0.9)
        },
        "poetry_weave": {
            "name": "Poetry Weave",
            "description": "Co-write poetry where each line is sourced from one partner's gates",
            "estimated_days": 7,
            "coherence_potential": (0.5, 0.85)
        },
        "ritual_design": {
            "name": "Ritual Design",
            "description": "Design a shared ceremonial practice based on combined signatures",
            "estimated_days": 30,
            "coherence_potential": (0.75, 0.98)
        },
        "movement_score": {
            "name": "Movement Score",
            "description": "Create a collaborative movement/dance piece from energy patterns",
            "estimated_days": 28,
            "coherence_potential": (0.65, 0.92)
        }
    }

    def __init__(self, universe: Universe):
        self.universe = universe
        self.active_projects: Dict[str, dict] = {}

    def suggest_project(self, user_a_id: str, user_b_id: str) -> str:
        """Suggest a creative project based on user archetypes and signatures."""
        user_a = self.universe.get_indiverse(user_a_id)
        user_b = self.universe.get_indiverse(user_b_id)

        if not user_a or not user_b:
            return "visual_mandala"  # default

        # Collect archetypes
        archetypes = []
        if user_a.patterns.archetype_blend:
            archetypes.extend(user_a.patterns.archetype_blend.keys())
        if user_b.patterns.archetype_blend:
            archetypes.extend(user_b.patterns.archetype_blend.keys())

        # Map archetypes to projects
        if "Oracle" in archetypes or "Visionary" in archetypes:
            return "ritual_design"
        elif "Builder" in archetypes:
            return "movement_score"
        elif "Connector" in archetypes:
            return "poetry_weave"
        elif "Curator" in archetypes:
            return "visual_mandala"
        else:
            return "soundscape"

    def launch_project(self, connection_id: str, project_type: str) -> dict:
        """Create a creative container for this connection."""
        template = self.PROJECT_TEMPLATES[project_type]

        project = {
            "connection_id": connection_id,
            "type": project_type,
            "template": template,
            "started": datetime.now(),
            "estimated_completion": datetime.now() + timedelta(days=template["estimated_days"]),
            "status": "active",
            "coherence_achieved": 0.0
        }

        self.active_projects[connection_id] = project

        # Record in Universe
        self.universe.record_interaction(
            connection_id,
            "creative_project_launch",
            {
                "project_type": project_type,
                "template": template["name"],
                "estimated_days": template["estimated_days"]
            }
        )

        return project

    def simulate_outcome(self, connection_id: str) -> Optional[dict]:
        """Simulate creative project completion for demo."""
        project = self.active_projects.get(connection_id)
        if not project:
            return None

        template = project["template"]

        # Simulate outcome
        coherence = random.uniform(*template["coherence_potential"])
        completion = random.random() > 0.15  # 85% completion rate (creative is more forgiving)

        project["status"] = "completed" if completion else "abandoned"
        project["coherence_achieved"] = coherence if completion else 0.0

        # Record outcome in Universe
        self.universe.record_outcome(
            connection_id,
            {
                "coherence": coherence,
                "completion": completion,
                "creative_success": completion and coherence > 0.75,
                "engagement": random.uniform(0.6, 0.95)
            }
        )

        # Award credits (creative rewards coherence, not revenue)
        if completion:
            connection = self.universe.connections.get(connection_id)
            if connection:
                credit_amount = 50 + (coherence * 100)  # base + coherence bonus
                self.universe.award_credits(connection.user_a_id, credit_amount, "creative_project_completion")
                self.universe.award_credits(connection.user_b_id, credit_amount, "creative_project_completion")

        return project
