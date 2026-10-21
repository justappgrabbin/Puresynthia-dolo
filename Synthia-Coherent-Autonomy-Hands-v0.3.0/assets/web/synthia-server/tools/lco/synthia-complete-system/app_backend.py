"""
app_backend.py — Flask backend for the Human Design chart app.

Entry point: POST /api/chart with birth data
Returns: Full three-field chart (Body/Mind/Heart) + Type/Authority/Profile + explanations

Phone-deployable, no external APIs except ephemeris (Skyfield downloads once).
"""

from flask import Flask, request, jsonify
from datetime import datetime, timezone, timedelta
from typing import Tuple
import json

# Import our verified chart engines
from real_ephemeris import RealEphemeris
from oracle import build_chart, CHANNELS, GATE_CENTER
from diseminer_qa import DISEMINERInference

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Import conversation engine
from conversation_engine import ConversationEngine

# Initialize engines
eph = RealEphemeris()
conversation_engine = ConversationEngine()
active_conversations = {}  # person_id → ConversationState


# ============================================================
# CITY/TIMEZONE AUTOCOMPLETE DATA
# ============================================================

CITIES = [
    {"name": "San Francisco", "lat": 37.7749, "lon": -122.4194, "tz": "UTC-8", "tz_offset": -8},
    {"name": "New York", "lat": 40.7128, "lon": -74.0060, "tz": "UTC-5", "tz_offset": -5},
    {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437, "tz": "UTC-8", "tz_offset": -8},
    {"name": "London", "lat": 51.5074, "lon": -0.1278, "tz": "UTC+0", "tz_offset": 0},
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503, "tz": "UTC+9", "tz_offset": 9},
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093, "tz": "UTC+10", "tz_offset": 10},
    {"name": "Berlin", "lat": 52.5200, "lon": 13.4050, "tz": "UTC+1", "tz_offset": 1},
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522, "tz": "UTC+1", "tz_offset": 1},
    {"name": "Barcelona", "lat": 41.3874, "lon": 2.1686, "tz": "UTC+1", "tz_offset": 1},
    {"name": "Mexico City", "lat": 19.4326, "lon": -99.1332, "tz": "UTC-6", "tz_offset": -6},
]

# ============================================================
# EXPLANATION TEMPLATES (will be upgraded to DISEMINER)
# ============================================================

GATE_MEANINGS = {
    1: "Self-Expression & Initiation",
    2: "Higher Knowing & Direction",
    3: "Ordering & Mutation",
    4: "Logic & Formulization",
    5: "Fixed Rhythms & Routine",
    6: "Conflict & Friction",
    7: "Role of the Self",
    # ... add all 64 as needed
}

TYPE_EXPLANATIONS = {
    "Manifestor": "You are here to initiate. Inform before you act. Your impact is immediate and powerful.",
    "Generator": "You are here to respond. Wait for something that invokes a response from your sacral. Your power is in sustained effort.",
    "Manifesting Generator": "You are here to respond, then inform. Respond to life, act quickly, then tell people what you did.",
    "Projector": "You are here to guide. Wait for the invitation. Your wisdom is in seeing what others cannot see.",
    "Reflector": "You are here to evaluate. Wait a full lunar cycle. You amplify and mirror the environment.",
}

AUTHORITY_EXPLANATIONS = {
    "Emotional": "Your authority is emotional. Make decisions when your emotional wave is at the top (clarity). Never decide in the pit.",
    "Sacral": "Your authority is sacral. Listen to your gut response — it knows. Yes feels expansive, No feels constrictive.",
    "Splenic": "Your authority is splenic. Your intuition is immediate. Trust the subtle knowing that arises in the moment.",
    "Mental": "Your authority is mental. Think it through. Discuss, debate, reason. Your mind knows.",
    "Self-Projected": "Your authority is self-projected. Ask yourself: 'Does this feel like me?' Trust your own knowing.",
    "Lunar": "Your authority is lunar. Wait a full lunar cycle (28 days) before deciding. Your clarity comes with time.",
}


# ============================================================
# API ENDPOINTS
# ============================================================

@app.route('/api/cities', methods=['GET'])
def get_cities():
    """Autocomplete for city names."""
    query = request.args.get('q', '').lower()
    matches = [c for c in CITIES if query in c['name'].lower()]
    return jsonify(matches)


@app.route('/api/chart', methods=['POST'])
def calculate_chart():
    """
    Main endpoint: POST with birth data, get full chart + explanations.
    
    Expected JSON:
    {
        "name": "Celestial",
        "birth_date": "1990-09-18",
        "birth_time": "21:34",
        "birth_local_tz": "UTC-7",
        "location": {"lat": 37.7749, "lon": -122.4194}
    }
    """
    
    try:
        data = request.json
        
        # Parse birth data
        name = data.get('name', 'Unknown')
        birth_date_str = data.get('birth_date')  # YYYY-MM-DD
        birth_time_str = data.get('birth_time')  # HH:MM
        tz_str = data.get('birth_local_tz', 'UTC+0')
        location = data.get('location', {})
        
        # Convert to UTC
        birth_local = datetime.strptime(f"{birth_date_str} {birth_time_str}", "%Y-%m-%d %H:%M")
        tz_offset = int(tz_str.split('-')[1]) if '-' in tz_str else int(tz_str.split('+')[1])
        if '-' in tz_str:
            tz_offset = -tz_offset
        
        birth_utc = birth_local - timedelta(hours=tz_offset)
        birth_utc = birth_utc.replace(tzinfo=timezone.utc)
        
        # Calculate three-field chart
        body = eph.full_13_point_chart(birth_utc, "body")
        mind = eph.full_13_point_chart(birth_utc, "mind")
        heart = eph.full_13_point_chart(birth_utc, "heart")
        
        # Design Sun (88 degrees back)
        design_utc = eph.design_sun_datetime(birth_utc)
        design_body = eph.full_13_point_chart(design_utc, "body")
        
        # Gather activated gates from all fields
        all_gates = set()
        for field_data in [body, mind, heart, design_body]:
            for addr in field_data.values():
                all_gates.add(addr.gate)
        
        # Calculate oracle (Type/Authority/Profile)
        chart_result = build_chart(
            all_gates,
            conscious_sun_line=body["sun"].line,
            design_sun_line=design_body["sun"].line
        )
        
        # Build response
        response = {
            "name": name,
            "birth_utc": birth_utc.isoformat(),
            "birth_local_tz": tz_str,
            "location": location,
            "chart": {
                "type": chart_result.type,
                "strategy": chart_result.strategy,
                "authority": chart_result.authority,
                "profile": chart_result.profile,
                "defined_centers": list(chart_result.defined_centers),
                "active_channels": chart_result.active_channels,
            },
            "fields": {
                "body": {
                    "system": "Tropical",
                    "sun": {
                        "gate": body["sun"].gate,
                        "line": body["sun"].line,
                        "color": body["sun"].color,
                        "tone": body["sun"].tone,
                        "base": body["sun"].base,
                        "longitude": body["sun"].longitude_dms,
                    },
                    "moon": {
                        "gate": body["moon"].gate,
                        "line": body["moon"].line,
                        "color": body["moon"].color,
                        "tone": body["moon"].tone,
                        "base": body["moon"].base,
                        "longitude": body["moon"].longitude_dms,
                    },
                },
                "mind": {
                    "system": "Sidereal (Fagan-Bradley)",
                    "sun": {
                        "gate": mind["sun"].gate,
                        "line": mind["sun"].line,
                        "color": mind["sun"].color,
                        "tone": mind["sun"].tone,
                        "base": mind["sun"].base,
                        "longitude": mind["sun"].longitude_dms,
                    },
                },
                "heart": {
                    "system": "Draconic",
                    "sun": {
                        "gate": heart["sun"].gate,
                        "line": heart["sun"].line,
                        "color": heart["sun"].color,
                        "tone": heart["sun"].tone,
                        "base": heart["sun"].base,
                        "longitude": heart["sun"].longitude_dms,
                    },
                },
            },
            "explanations": {
                "type": TYPE_EXPLANATIONS.get(chart_result.type, ""),
                "strategy": f"Your strategy is: {chart_result.strategy}",
                "authority": AUTHORITY_EXPLANATIONS.get(chart_result.authority, ""),
            },
        }
        
        return jsonify(response), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/chat', methods=['POST'])
def chat():
    """
    Real Q&A endpoint using ConversationEngine.
    Grounds answers in actual chart structure via DISEMINER inference.
    
    Expected JSON:
    {
        "person_id": "celestial",
        "question": "What does my Type mean?"
    }
    """
    try:
        data = request.json
        person_id = data.get('person_id', 'user')
        question = data.get('question', '')
        
        if not question:
            return jsonify({"error": "No question provided"}), 400
        
        # Initialize conversation if new
        if person_id not in active_conversations:
            return jsonify({
                "error": "No active conversation. Call /api/chart first to initialize.",
                "person_id": person_id
            }), 400
        
        # Get the conversation and ask the question
        result = conversation_engine.ask_question(person_id, question)
        
        return jsonify(result), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/api/start-conversation', methods=['POST'])
def start_conversation():
    """
    Initialize a conversation with someone.
    Calculate their chart, set up state, ready for Q&A.
    
    Expected JSON:
    {
        "person_id": "celestial",
        "birth_date": "1990-09-18",
        "birth_time": "21:34",
        "birth_tz": "UTC-7",
        "location": {"lat": 37.7749, "lon": -122.4194}
    }
    """
    try:
        data = request.json
        person_id = data.get('person_id', 'user')
        birth_date = data.get('birth_date')
        birth_time = data.get('birth_time')
        birth_tz = data.get('birth_tz', 'UTC+0')
        location = data.get('location', {'lat': 0, 'lon': 0})
        
        if not all([birth_date, birth_time]):
            return jsonify({"error": "Missing birth data"}), 400
        
        # Initialize conversation
        state = conversation_engine.initialize_conversation(
            person_id,
            birth_date,
            birth_time,
            birth_tz,
            location
        )
        
        # Store in active conversations
        active_conversations[person_id] = state
        
        return jsonify({
            "person_id": person_id,
            "type": state.person_chart["type"],
            "authority": state.person_chart["authority"],
            "strategy": state.person_chart["strategy"],
            "profile": state.person_chart["profile"],
            "ready_for_questions": True,
            "message": f"Ready to chat with {state.person_chart['type']}. Ask me anything about your design."
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"}), 200


# ============================================================
# MAIN
# ============================================================

if __name__ == '__main__':
    print("Starting HD Chart App Backend...")
    print("POST /api/chart with birth data to calculate chart")
    print("GET /api/cities?q=<name> for city autocomplete")
    app.run(host='0.0.0.0', port=5000, debug=True)
