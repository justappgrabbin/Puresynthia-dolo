"""
SynthAi MCP Server
Connects Claude ↔ Chart Data ↔ Klein Narrative Engine
Allows Claude to ask questions about your chart and get personalized responses
"""

import asyncio
import json
from typing import Any, Optional
import httpx

# MCP Server setup (assumes anthropic-sdk with MCP support)
# In practice, this would use the official MCP SDK

class SynthAiMCPServer:
    """MCP server that exposes SynthAi capabilities to Claude"""
    
    def __init__(self, api_url: str = "http://localhost:8000"):
        self.api_url = api_url
        self.client = httpx.AsyncClient()
        self.user_chart_data = None
    
    # ================================================================
    # TOOL: Get Your Chart
    # ================================================================
    
    async def get_chart(self, name: str, birth_date: str, birth_time: str, 
                        latitude: float, longitude: float) -> dict:
        """
        Calculate your full astrological chart
        Returns: Tropical, Sidereal, Draconic + Gates + Centers
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/chart/calculate",
                json={
                    "person1": {
                        "name": name,
                        "birth_date": birth_date,
                        "birth_time": birth_time,
                        "latitude": latitude,
                        "longitude": longitude
                    }
                }
            )
            self.user_chart_data = response.json()
            return self.user_chart_data
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Ask Klein About Your Chart
    # ================================================================
    
    async def ask_klein(self, question: str, context: Optional[str] = None) -> dict:
        """
        Ask Klein (semantic narrative engine) a question about your chart
        Klein will generate a personalized, contextual response
        """
        try:
            if not self.user_chart_data:
                return {"error": "Chart data not loaded. Call get_chart first."}
            
            response = await self.client.post(
                f"{self.api_url}/api/klein/insight",
                json={
                    "chart_data": self.user_chart_data,
                    "question": question,
                    "context": context or ""
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Get Specific Gate Meaning
    # ================================================================
    
    async def get_gate_insight(self, gate_number: int) -> dict:
        """
        Get Klein's insight about what a specific gate means for you
        """
        try:
            return await self.ask_klein(
                f"What does Gate {gate_number} mean in my chart? How does it shape my life?"
            )
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Get Relationship Resonance
    # ================================================================
    
    async def get_relationship_resonance(self, other_person_name: str,
                                         other_birth_date: str,
                                         other_birth_time: str,
                                         other_latitude: float,
                                         other_longitude: float) -> dict:
        """
        Calculate resonance/compatibility with another person
        Uses CHNOPS biochemical vectors
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/chart/calculate",
                json={
                    "person1": {"name": "you", **self.user_chart_data},
                    "person2": {
                        "name": other_person_name,
                        "birth_date": other_birth_date,
                        "birth_time": other_birth_time,
                        "latitude": other_latitude,
                        "longitude": other_longitude
                    },
                    "chart_type": "relationship"
                }
            )
            chart = response.json()
            
            # Get CHNOPS resonance
            chnops_response = await self.client.post(
                f"{self.api_url}/api/chart/chnops",
                json=chart
            )
            chnops = chnops_response.json()
            
            return {
                "resonance_score": chnops.get("resonance_score"),
                "compatibility": "High" if chnops.get("resonance_score", 0) > 0.75 else "Moderate",
                "biochemical_vectors": chnops,
                "insight": await self.ask_klein(
                    f"What is my resonance with {other_person_name}? What should I know?"
                )
            }
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Generate Personalized Advice
    # ================================================================
    
    async def get_personalized_advice(self, topic: str, context: str = "") -> dict:
        """
        Get Klein-generated advice specifically for you
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/klein/narrative",
                json={
                    "chart_data": self.user_chart_data,
                    "prompt": f"Give me personalized advice about {topic}. Context: {context}",
                    "temperature": 0.7,
                    "max_length": 500
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Run Experiment & Generate Report
    # ================================================================
    
    async def generate_experiment_report(self, experiment_name: str,
                                         hypothesis: str,
                                         results: str) -> dict:
        """
        Generate a scientific report from an experiment
        AutoNovel writes markdown, optionally generates code for reproducibility
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/autonovel/generate-report",
                json={
                    "chart_data": self.user_chart_data,
                    "analysis_type": f"Experiment: {experiment_name}",
                    "hypothesis": hypothesis,
                    "results": results
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Generate Test Code
    # ================================================================
    
    async def generate_test(self, scenario: str, test_type: str = "unit") -> dict:
        """
        AutoNovel generates test code for a scenario
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/autonovel/generate-test",
                json={
                    "scenario": scenario,
                    "test_type": test_type,
                    "context": self.user_chart_data or {}
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Run Test & Get Results
    # ================================================================
    
    async def run_test(self, test_code: str) -> dict:
        """
        Execute test code and return results
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/autonovel/execute-test",
                json={"test_code": test_code}
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Generate & View Visual
    # ================================================================
    
    async def generate_visual(self, mood: str = "creative", description: str = "") -> dict:
        """
        Trigger Synthia to generate a video/visual representation
        """
        try:
            response = await self.client.post(
                f"{self.api_url}/api/synthia/generate-visual",
                json={
                    "chart_data": self.user_chart_data or {},
                    "mood": mood,
                    "description": description
                }
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    # ================================================================
    # TOOL: Save/Load State
    # ================================================================
    
    async def save_state(self, state: dict) -> dict:
        """Save full application state"""
        try:
            response = await self.client.post(
                f"{self.api_url}/api/state/save",
                json=state
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}
    
    async def load_state(self, session_id: str) -> dict:
        """Load saved application state"""
        try:
            response = await self.client.get(
                f"{self.api_url}/api/state/load/{session_id}"
            )
            return response.json()
        except Exception as e:
            return {"error": str(e)}


# ================================================================
# MCP TOOL DEFINITIONS
# ================================================================
# These are what Claude sees when connected

MCP_TOOLS = {
    "get_chart": {
        "description": "Calculate your astrological chart (Tropical, Sidereal, Draconic, gates, centers)",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "Your name"},
                "birth_date": {"type": "string", "description": "ISO format: YYYY-MM-DD"},
                "birth_time": {"type": "string", "description": "HH:MM:SS"},
                "latitude": {"type": "number"},
                "longitude": {"type": "number"}
            }
        }
    },
    "ask_klein": {
        "description": "Ask Klein (narrative engine) a question about your chart",
        "input_schema": {
            "type": "object",
            "properties": {
                "question": {"type": "string"},
                "context": {"type": "string", "description": "Optional context"}
            }
        }
    },
    "get_gate_insight": {
        "description": "Get personalized insight about a specific Human Design gate",
        "input_schema": {
            "type": "object",
            "properties": {
                "gate_number": {"type": "integer", "description": "Gate 1-64"}
            }
        }
    },
    "get_relationship_resonance": {
        "description": "Calculate resonance/compatibility with another person",
        "input_schema": {
            "type": "object",
            "properties": {
                "other_person_name": {"type": "string"},
                "other_birth_date": {"type": "string"},
                "other_birth_time": {"type": "string"},
                "other_latitude": {"type": "number"},
                "other_longitude": {"type": "number"}
            }
        }
    },
    "get_personalized_advice": {
        "description": "Get Klein-generated advice specific to your chart",
        "input_schema": {
            "type": "object",
            "properties": {
                "topic": {"type": "string"},
                "context": {"type": "string"}
            }
        }
    },
    "generate_experiment_report": {
        "description": "Generate a scientific report from an experiment",
        "input_schema": {
            "type": "object",
            "properties": {
                "experiment_name": {"type": "string"},
                "hypothesis": {"type": "string"},
                "results": {"type": "string"}
            }
        }
    },
    "generate_test": {
        "description": "AutoNovel generates test code for a scenario",
        "input_schema": {
            "type": "object",
            "properties": {
                "scenario": {"type": "string"},
                "test_type": {"type": "string", "enum": ["unit", "integration", "e2e"]}
            }
        }
    },
    "run_test": {
        "description": "Execute generated test and get results",
        "input_schema": {
            "type": "object",
            "properties": {
                "test_code": {"type": "string"}
            }
        }
    },
    "generate_visual": {
        "description": "Trigger Synthia to generate video/visual representation",
        "input_schema": {
            "type": "object",
            "properties": {
                "mood": {"type": "string", "enum": ["creative", "analytical", "introspective"]},
                "description": {"type": "string"}
            }
        }
    },
    "save_state": {
        "description": "Save full application state",
        "input_schema": {"type": "object"}
    },
    "load_state": {
        "description": "Load saved application state",
        "input_schema": {
            "type": "object",
            "properties": {
                "session_id": {"type": "string"}
            }
        }
    }
}


if __name__ == "__main__":
    # Example usage
    async def main():
        server = SynthAiMCPServer()
        
        # Get chart
        chart = await server.get_chart(
            name="You",
            birth_date="1990-05-15",
            birth_time="14:30:00",
            latitude=40.7128,
            longitude=-74.0060
        )
        print("Chart:", chart)
        
        # Ask Klein
        insight = await server.ask_klein("What does my chart tell me about my purpose?")
        print("Klein Insight:", insight)
    
    asyncio.run(main())
