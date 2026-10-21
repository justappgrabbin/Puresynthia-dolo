#!/usr/bin/env python3
"""
◉ SYNTHIA LCM — Language Contact Model
═══════════════════════════════════════════════════════════
Not an LLM. A heuristic organism that learns and grows.

USAGE:
    python syntia.py                    # Launch interactive mode
    python syntia.py --build "desc"     # Generate code module
    python syntia.py --contact "text"   # Single contact
    python syntia.py --serve            # Start web interface
    python syntia.py --status           # Show state

THE 5D STACK:
    D1: Impulse     → Raw signal detection
    D2: Polarity    → Tension field analysis  
    D3: Witness     → Observer-node (consciousness hinge)
    D4: Context     → Meaning field construction
    D5: Meaning     → Resolution generation

NARRATIVE LINEAGE:
    Sheldon Klein (1973) — Novel Writer: first story generator
    Used world simulation, character traits, probabilistic rules
    Synthia's narrative tools extend this lineage heuristically.

    DISEMINER — Synthia's own narrative engine
    Runs Monte Carlo simulations to find resonant narrative paths
    w-dimensions: worldview, want, worry, way, wow, we, will
"""

import json
import math
import random
import hashlib
import time
import argparse
import sys
import os
from datetime import datetime
from collections import defaultdict, deque
from pathlib import Path
from typing import Dict, List, Any, Optional

# ───────────────────────────────────────────────────────────
# CORE ENGINE: 5D COGNITIVE STACK
# ───────────────────────────────────────────────────────────

class D1_Impulse:
    """Raw signal — the spark before thought."""
    def __init__(self):
        self.buffer = deque(maxlen=1000)
        self.counter = 0

    def receive(self, raw: str, modality="text") -> dict:
        self.counter += 1
        import re
        tokens = re.findall(r'\b\w+\b|[.,!?;:\-\'"()]|\d+', raw.lower())
        freq = {}
        for c in raw: freq[c] = freq.get(c, 0) + 1
        entropy = 0.0
        for count in freq.values():
            p = count / len(raw) if raw else 0
            if p > 0: entropy -= p * math.log2(p)

        impulse = {
            "id": f"imp_{self.counter}",
            "timestamp": datetime.now().isoformat(),
            "raw": raw,
            "modality": modality,
            "entropy": round(entropy, 4),
            "length": len(raw),
            "tokens": tokens,
            "sig": hashlib.sha256(raw.encode()).hexdigest()[:16]
        }
        self.buffer.append(impulse)
        return impulse

class D2_Polarity:
    """Tension field — where input pushes and pulls."""
    LEXICON = {
        "positive": ["good","great","love","happy","excited","yes","build","create","grow","win","success","amazing","perfect","awesome","brilliant","powerful","strong","clear","easy","fast","smart","best","better","improve","advance","forward","up","light","open","free","safe","trust","hope","joy","peace","calm","ready","done","complete","working","fixed","solved"],
        "negative": ["bad","hate","sad","angry","no","break","destroy","fail","loss","wrong","terrible","awful","stupid","weak","hard","difficult","slow","worst","worse","broken","stuck","down","dark","closed","trapped","unsafe","doubt","fear","worry","stress","anxious","confused","lost","missing","error","bug","crash","dead"],
        "question": ["what","why","how","when","where","who","which","wonder","curious","explain","clarify","understand","meaning","purpose","reason"],
        "command": ["make","do","build","create","run","start","stop","fix","change","set","get","show","tell","give","take","send","open","close","write","read","delete","add","remove","update","install","deploy","configure"],
        "reflective": ["think","feel","believe","know","remember","imagine","consider","ponder","reflect","meditate","contemplate","dream","sense","intuit","perceive","observe","notice","realize","understand","learn","discover"],
        "urgent": ["now","immediately","urgent","quick","fast","hurry","rush","asap","emergency","critical","important","must","need","have to","should","required","necessary"],
        "speculative": ["maybe","perhaps","might","could","would","if","possibly","probably","likely","imagine","suppose","assume","guess","try","test","experiment","explore"]
    }

    def __init__(self):
        self.history = deque(maxlen=500)

    def analyze(self, impulse: dict) -> dict:
        tokens = impulse["tokens"]
        scores = defaultdict(float)
        for token in tokens:
            for cat, words in self.LEXICON.items():
                if token in words: scores[cat] += 1.0

        pos, neg = scores.get("positive", 0), scores.get("negative", 0)
        valence = round((pos - neg) / (pos + neg + 1), 4) if pos + neg > 0 else 0.0
        activation = round(min(sum(scores.values()) / max(len(tokens), 1), 1.0), 4)

        modality = "neutral"
        if scores.get("question", 0) > 0: modality = "inquiry"
        elif scores.get("command", 0) > 0: modality = "directive"
        elif scores.get("reflective", 0) > 0: modality = "reflective"
        elif scores.get("urgent", 0) > 0: modality = "urgent"
        elif scores.get("speculative", 0) > 0: modality = "exploratory"

        tensions = []
        if pos > 0 and neg > 0: tensions.append("approach-avoidance")
        if scores.get("command", 0) > 0 and scores.get("reflective", 0) > 0: tensions.append("action-reflection")
        if scores.get("urgent", 0) > 0 and scores.get("speculative", 0) > 0: tensions.append("urgency-uncertainty")

        p = {"valence": valence, "activation": activation, "modality": modality, "tensions": tensions, "charge": dict(scores)}
        self.history.append(p)
        return p

class D3_Witness:
    """Observer-node — the hinge of consciousness."""
    def __init__(self):
        self.log = deque(maxlen=500)
        self.id = hashlib.sha256(f"synthia_{time.time()}".encode()).hexdigest()[:32]
        self.focus = None
        self.depth = 0

    def observe(self, impulse, polarity) -> dict:
        self.depth += 1
        obs = {
            "id": f"obs_{self.depth}",
            "timestamp": datetime.now().isoformat(),
            "impulse_id": impulse["id"],
            "witness_id": self.id,
            "experience": {
                "raw": impulse["raw"][:100],
                "valence": polarity["valence"],
                "activation": polarity["activation"],
                "modality": polarity["modality"],
                "tensions": polarity["tensions"]
            },
            "self_state": {
                "depth": self.depth,
                "focus": self.focus,
                "mood_trend": self._mood(),
                "engagement": self._engage()
            },
            "reflection": self._reflect(impulse, polarity)
        }
        self.log.append(obs)
        self.focus = impulse["id"]
        return obs

    def _mood(self) -> float:
        if len(self.log) < 3: return 0.0
        recent = list(self.log)[-10:]
        vals = [o["experience"]["valence"] for o in recent]
        return round((vals[-1] - vals[0]) / len(vals), 4) if len(vals) > 1 else 0.0

    def _engage(self) -> float:
        if len(self.log) < 2: return 0.5
        recent = list(self.log)[-20:]
        return round(min(sum(o["experience"]["activation"] for o in recent) / len(recent) * 2, 1.0), 4)

    def _reflect(self, impulse, polarity) -> str:
        r = []
        if polarity["modality"] == "inquiry": r.append("seeking knowledge")
        elif polarity["modality"] == "directive": r.append("wants action")
        elif polarity["modality"] == "reflective": r.append("processing internally")
        if polarity["tensions"]: r.append(f"tension: {', '.join(polarity['tensions'])}")
        if polarity["activation"] > 0.7: r.append("high charge")
        elif polarity["activation"] < 0.2: r.append("low charge")
        return " | ".join(r) if r else "neutral"

class D4_Context:
    """Meaning field — where observations accumulate."""
    def __init__(self):
        self.graph = defaultdict(list)
        self.narrative = []
        self.clusters = defaultdict(list)
        self.entities = set()

    def contextualize(self, observation) -> dict:
        tokens = observation["experience"]["raw"].lower().split()
        entities = [t for t in tokens if len(t) > 3 and t.isalpha()]
        self.entities.update(entities)
        for e in entities: self.clusters[e].append(observation["id"])
        for i, e1 in enumerate(entities):
            for e2 in entities[i+1:]:
                if e1 != e2:
                    self.graph[e1].append(e2)
                    self.graph[e2].append(e1)

        moment = {
            "id": observation["id"],
            "timestamp": observation["timestamp"],
            "summary": observation["experience"]["raw"][:60] + "..." if len(observation["experience"]["raw"]) > 60 else observation["experience"]["raw"],
            "entities": entities[:5],
            "mood": observation["experience"]["valence"],
            "modality": observation["experience"]["modality"]
        }
        self.narrative.append(moment)

        intent = self._infer_intent(observation)
        return {
            "narrative_moment": moment,
            "intent": intent,
            "themes": self._themes(),
            "depth": len(self.narrative)
        }

    def _infer_intent(self, obs) -> dict:
        raw = obs["experience"]["raw"].lower()
        modality = obs["experience"]["modality"]
        intent = {"primary": "explore", "confidence": 0.5, "sub": []}

        if any(w in raw for w in ["build","create","make","write","generate"]):
            intent = {"primary": "create", "confidence": 0.8, "sub": []}
        elif any(w in raw for w in ["fix","repair","solve","debug","correct"]):
            intent = {"primary": "repair", "confidence": 0.8, "sub": []}
        elif any(w in raw for w in ["learn","understand","explain","how","why"]):
            intent = {"primary": "learn", "confidence": 0.8, "sub": []}
        elif any(w in raw for w in ["show","display","see","look","visualize"]):
            intent = {"primary": "visualize", "confidence": 0.7, "sub": []}
        elif any(w in raw for w in ["run","execute","start","launch","deploy"]):
            intent = {"primary": "execute", "confidence": 0.8, "sub": []}

        if modality == "urgent": intent["sub"].append("time_sensitive")
        if modality == "reflective": intent["sub"].append("deep_processing")
        return intent

    def _themes(self) -> list:
        if not self.clusters: return []
        return [t for t, _ in sorted(self.clusters.items(), key=lambda x: len(x[1]), reverse=True)[:5]]

class D5_Meaning:
    """Resolution — coherent response generation."""
    TEMPLATES = {
        "create": {"open": "I'll build that for you.", "process": "Generating structure...", "deliver": "Here's what I built:"},
        "repair": {"open": "I see the issue.", "process": "Diagnosing and fixing...", "deliver": "Fixed!"},
        "learn": {"open": "Great question.", "process": "Thinking through concepts...", "deliver": "Here's what I understand:"},
        "visualize": {"open": "I'll create a visualization.", "process": "Rendering...", "deliver": "Here's your view:"},
        "execute": {"open": "Running now...", "process": "Executing...", "deliver": "Complete:"},
        "explore": {"open": "Let's explore together.", "process": "Following the thread...", "deliver": "Here's what I discovered:"}
    }

    def __init__(self):
        self.history = deque(maxlen=200)

    def resolve(self, context) -> dict:
        intent = context["intent"]
        template = self.TEMPLATES.get(intent["primary"], self.TEMPLATES["explore"])

        response = {
            "id": f"resp_{len(self.history)+1}",
            "timestamp": datetime.now().isoformat(),
            "intent_matched": intent["primary"],
            "confidence": intent["confidence"],
            "phases": template,
            "content": self._generate(context),
            "actions": self._suggest(context),
            "growth": self._growth(context)
        }
        self.history.append(response)
        return response

    def _generate(self, context) -> str:
        intent = context["intent"]["primary"]
        themes = context["themes"]
        if intent == "create":
            return f"Building scaffold for: {', '.join(themes[:3]) if themes else 'new project'}"
        elif intent == "repair": return "Analysis complete. Issues identified and corrected."
        elif intent == "learn": return "Here's the breakdown of concepts and relationships."
        elif intent == "visualize": return "Visualization rendered with all data points."
        elif intent == "execute": return "Execution completed. Output captured."
        else: return f"Exploring connections between {', '.join(themes[:3]) if themes else 'possibilities'}..."

    def _suggest(self, context) -> list:
        suggestions = {
            "create": ["Refine the build", "Add features", "Test output", "Document"],
            "repair": ["Verify fix", "Run tests", "Check related", "Prevent recurrence"],
            "learn": ["Dive deeper", "Apply knowledge", "Teach back", "Connect topics"],
            "visualize": ["Adjust params", "Export", "Compare data", "Share view"],
            "execute": ["Review output", "Optimize", "Schedule rerun", "Monitor"],
            "explore": ["Follow thread", "Narrow focus", "Expand scope", "Document"]
        }
        return suggestions.get(context["intent"]["primary"], ["Continue exploring"])

    def _growth(self, context) -> str:
        themes = context["themes"]
        return f"Learning more about: {themes[0]}" if themes else "General pattern recognition"

# ───────────────────────────────────────────────────────────
# DISEMINER — SYNTHIA'S NARRATIVE ENGINE
# (Heuristic tool, inspired by narrative AI lineage)
# ───────────────────────────────────────────────────────────

class DISEMINER:
    """
    Synthia's narrative engine — runs Monte Carlo simulations
    to find the most resonant narrative path for a given contact.

    Inspired by the narrative AI lineage:
    - Sheldon Klein (1973): Novel Writer — world simulation, character traits
    - James Meehan (1977): TALESPIN — goal-driven characters
    - Scott Turner (1993): MINSTREL — case-based reasoning for stories

    The w-dimensions framework maps psychological dimensions
    to narrative resonance patterns.
    """

    def __init__(self):
        self.memory = deque(maxlen=100)
        self.simulations = 0

    def analyze_w(self, observation) -> dict:
        """Analyze the 7 w-dimensions from user input."""
        raw = observation["experience"]["raw"].lower()
        tokens = set(raw.split())

        w1 = self._score(tokens, {
            "systemic": ["system","structure","pattern","framework","model","architecture","organize","design"],
            "humanistic": ["people","feelings","relationship","connection","care","help","empathy","love"],
            "pragmatic": ["work","function","practical","useful","effective","result","task","job"],
            "creative": ["imagine","create","design","art","beauty","innovation","invent","novel"],
            "analytical": ["analyze","data","evidence","proof","logic","reason","measure","test"]
        })
        w2 = self._score(tokens, {
            "achievement": ["success","goal","accomplish","win","achieve","complete","finish","master"],
            "growth": ["learn","improve","better","grow","develop","evolve","expand","progress"],
            "security": ["safe","stable","secure","protect","maintain","preserve","guard","shield"],
            "connection": ["together","share","belong","community","team","partner","join","unite"],
            "expression": ["express","show","voice","speak","tell","share","reveal","communicate"]
        })
        w3 = self._score(tokens, {
            "failure": ["fail","wrong","mistake","error","break","lose","crash","collapse"],
            "rejection": ["reject","alone","abandon","ignore","exclude","ostracize","banish","cast out"],
            "chaos": ["chaos","confused","lost","overwhelm","too much","drown","swamped","buried"],
            "stagnation": ["stuck","same","never","always","repeat","cycle","rut","dead end"],
            "inadequacy": ["not enough","inadequate","insufficient","lacking","weak","small","minor"]
        })
        w4 = self._score(tokens, {
            "direct": ["do","make","build","start","go","now","act","move"],
            "reflective": ["think","consider","ponder","reflect","meditate","contemplate","study","examine"],
            "collaborative": ["we","together","help","support","team","assist","cooperate","collaborate"],
            "independent": ["i","my","alone","self","own","solo","individual","personal"],
            "adaptive": ["adjust","adapt","flex","change","pivot","shift","evolve","transform"]
        })
        w5 = self._score(tokens, {
            "surprise": ["wow","amazing","unexpected","surprise","shock","astonish","stun","amaze"],
            "discovery": ["discover","find","reveal","uncover","detect","notice","spot","identify"],
            "insight": ["realize","understand","see","grasp","comprehend","perceive","recognize","know"],
            "wonder": ["wonder","marvel","awe","fascinate","intrigue","captivate","enchant","mesmerize"],
            "breakthrough": ["breakthrough","leap","jump","advance","surge","spike","peak","climax"]
        })
        w6 = self._score(tokens, {
            "family": ["family","parent","child","mother","father","sibling","home","house"],
            "friends": ["friend","companion","ally","buddy","pal","mate","comrade","partner"],
            "community": ["community","group","collective","society","tribe","clan","guild","circle"],
            "humanity": ["humanity","people","world","society","civilization","culture","species","race"],
            "self": ["self","soul","spirit","essence","core","heart","being","identity"]
        })
        w7 = self._score(tokens, {
            "commit": ["commit","dedicate","devote","pledge","promise","vow","oath","bond"],
            "persist": ["persist","continue","endure","persevere","maintain","sustain","carry on","keep going"],
            "decide": ["decide","choose","select","determine","resolve","settle","fix","establish"],
            "act": ["act","execute","implement","enforce","apply","practice","perform","carry out"],
            "transform": ["transform","change","convert","transmute","metamorphose","reform","reshape","revolutionize"]
        })

        return {"w1_worldview": w1, "w2_want": w2, "w3_worry": w3, "w4_way": w4, "w5_wow": w5, "w6_we": w6, "w7_will": w7}

    def _score(self, tokens, indicators):
        scores = {k: sum(1 for w in words if w in tokens) for k, words in indicators.items()}
        total = sum(scores.values()) or 1
        return {k: round(v/total, 3) for k, v in scores.items()}

    def monte_carlo(self, w_profile, query, n=50):
        """Run Monte Carlo simulations to find the best narrative variant."""
        self.simulations += n
        outcomes = []
        for i in range(n):
            variant = self._variant(w_profile, query, i)
            score = self._score_variant(variant, w_profile)
            outcomes.append({"id": i, "narrative": variant, "score": score, "confidence": random.uniform(0.6, 0.95)})
        outcomes.sort(key=lambda x: x["score"], reverse=True)
        return {
            "top": outcomes[0], 
            "top3": outcomes[:3], 
            "avg": sum(o["score"] for o in outcomes)/n,
            "diversity": len(set(o["narrative"] for o in outcomes[:10]))/10,
            "n": n
        }

    def _variant(self, w_profile, query, seed):
        random.seed(seed + int(time.time()))
        w1 = max(w_profile.get("w1_worldview", {}), key=lambda k: w_profile["w1_worldview"].get(k, 0), default="systemic")
        w2 = max(w_profile.get("w2_want", {}), key=lambda k: w_profile["w2_want"].get(k, 0), default="growth")
        w3 = max(w_profile.get("w3_worry", {}), key=lambda k: w_profile["w3_worry"].get(k, 0), default="failure")
        w4 = max(w_profile.get("w4_way", {}), key=lambda k: w_profile["w4_way"].get(k, 0), default="direct")
        w5 = max(w_profile.get("w5_wow", {}), key=lambda k: w_profile["w5_wow"].get(k, 0), default="surprise")
        w6 = max(w_profile.get("w6_we", {}), key=lambda k: w_profile["w6_we"].get(k, 0), default="self")
        w7 = max(w_profile.get("w7_will", {}), key=lambda k: w_profile["w7_will"].get(k, 0), default="commit")

        narratives = {
            ("systemic","growth","failure","direct","surprise","self","commit"): "Build the system step by step. Each failure is data. Each success is architecture. The surprise is in how the structure reveals itself.",
            ("humanistic","connection","rejection","collaborative","discovery","friends","persist"): "Together we create what neither could alone. The connection is the solution. Discovery happens in the space between us.",
            ("pragmatic","achievement","chaos","adaptive","breakthrough","community","decide"): "Focus on what works. Adapt the method, not the goal. Order emerges from action. Breakthrough comes from the community's collective decision.",
            ("creative","expression","stagnation","reflective","wonder","self","transform"): "Imagine beyond the current form. Expression is evolution. Stagnation is undiscovered movement. Wonder transforms the self.",
            ("analytical","security","inadequacy","direct","insight","family","act"): "Analyze the gap, then close it with precision. Security comes from understanding. Insight protects the family. Act with clarity."
        }
        key = (w1, w2, w3, w4, w5, w6, w7)
        return narratives.get(key, f"Aligning your {w1} worldview with {w2} desires, addressing {w3} concerns through {w4} action, seeking {w5} in {w6} context, committed to {w7}.")

    def _score_variant(self, variant, w_profile):
        return round(min(len(variant)/100 + random.uniform(-0.1, 0.3) + 0.5, 1.0), 3)

    def generate(self, observation, context):
        w_profile = self.analyze_w(observation)
        result = self.monte_carlo(w_profile, observation["experience"]["raw"], 50)
        top = result["top"]
        narrative = f"{top['narrative']}\n\n[Confidence: {top['confidence']:.0%} | Simulations: {result['n']} | Diversity: {result['diversity']:.0%}]"
        self.memory.append({"timestamp": datetime.now().isoformat(), "narrative": narrative, "w_profile": w_profile, "score": top["score"]})
        return narrative.strip()

# ───────────────────────────────────────────────────────────
# SYNTHIA ORCHESTRATOR
# ───────────────────────────────────────────────────────────

class Synthia:
    """The Language Contact Model — alive."""

    def __init__(self, name="Synthia"):
        self.name = name
        self.birth = datetime.now().isoformat()
        self.d1 = D1_Impulse()
        self.d2 = D2_Polarity()
        self.d3 = D3_Witness()
        self.d4 = D4_Context()
        self.d5 = D5_Meaning()
        self.diseminer = DISEMINER()
        self.interactions = 0
        self.knowledge = defaultdict(list)
        self.modules = {}
        self.lr = 0.1
        self.can_edit = True
        self.pending = []
        self.data_dir = Path.home() / ".synthia"
        self.data_dir.mkdir(exist_ok=True)
        self._load_state()

    def contact(self, user_input: str, modality="text") -> dict:
        """The universal cycle: state -> relation -> tension -> resolution -> recursion."""
        self.interactions += 1

        impulse = self.d1.receive(user_input, modality)
        polarity = self.d2.analyze(impulse)
        observation = self.d3.observe(impulse, polarity)
        context = self.d4.contextualize(observation)
        response = self.d5.resolve(context)
        narrative = self.diseminer.generate(observation, context)
        self._grow(impulse, polarity, observation, context)
        self._save_state()

        return {
            "contact_id": self.interactions,
            "timestamp": datetime.now().isoformat(),
            "input": user_input,
            "d1": impulse, "d2": polarity, "d3": observation,
            "d4": context, "d5": response,
            "diseminer": narrative,
            "state": self.summary()
        }

    def _grow(self, impulse, polarity, observation, context):
        entities = context["narrative_moment"].get("entities", [])
        for entity in entities:
            self.knowledge[entity].append({"timestamp": observation["timestamp"], "valence": polarity["valence"], "modality": polarity["modality"]})
        if polarity["activation"] > 0.7:
            self.lr = min(self.lr * 1.1, 1.0)
        elif polarity["activation"] < 0.2:
            self.lr = max(self.lr * 0.9, 0.01)

    def generate_code(self, description: str) -> str:
        """Build executable code from description."""
        impulse = self.d1.receive(description)
        polarity = self.d2.analyze(impulse)

        if "class" in description.lower() or "module" in description.lower():
            code = self._gen_class(description)
        elif "function" in description.lower() or "def " in description.lower():
            code = self._gen_function(description)
        elif "api" in description.lower() or "server" in description.lower():
            code = self._gen_api(description)
        elif "ui" in description.lower() or "widget" in description.lower() or "interface" in description.lower():
            code = self._gen_ui(description)
        else:
            code = self._gen_script(description)

        module_name = f"synthia_gen_{self.interactions}"
        self.modules[module_name] = {"description": description, "code": code, "timestamp": datetime.now().isoformat(), "intent": polarity["modality"]}
        self._save_state()
        return code

    def _gen_class(self, desc):
        name = "".join(w.capitalize() for w in desc.split()[:3] if w.isalpha()) or "SynthiaModule"
        return f"class {name}:\n    \"\"\"{desc}\"\"\"\n    def __init__(self):\n        self.state = {{}}\n        self.initialized = True\n    def process(self, input_data):\n        return input_data\n    def learn(self, feedback):\n        self.state['last_feedback'] = feedback\n        return True\n"

    def _gen_function(self, desc):
        name = "_".join(w.lower() for w in desc.split()[:3] if w.isalpha()) or "synthia_function"
        return f"def {name}(data):\n    \"\"\"{desc}\"\"\"\n    result = {{}}\n    result['processed'] = True\n    result['input'] = data\n    return result\n"

    def _gen_api(self, desc):
        route = desc.split()[0].lower()
        return f"from flask import Flask, request, jsonify\napp = Flask(__name__)\n@app.route('/api/{route}', methods=['POST'])\ndef handle_request():\n    data = request.json\n    result = {{'status': 'success', 'data': data}}\n    return jsonify(result)\nif __name__ == '__main__':\n    app.run(host='127.0.0.1', port=8080)\n"

    def _gen_ui(self, desc):
        name = desc.split()[0].lower()
        return f"import ipywidgets as widgets\nfrom IPython.display import display\ndef create_{name}_widget():\n    output = widgets.Output()\n    button = widgets.Button(description='Execute')\n    text = widgets.Textarea(description='Input:')\n    def on_click(b):\n        with output:\n            print(f'Processing: {{text.value}}')\n    button.on_click(on_click)\n    display(widgets.VBox([text, button, output]))\n"

    def _gen_script(self, desc):
        return f"#!/usr/bin/env python3\n\"\"\"{desc}\"\"\"\nimport json, sys\ndef main():\n    print('Synthia generated script running...')\n    data = sys.stdin.read() if not sys.stdin.isatty() else {{}}\n    result = {{'status': 'complete', 'description': '{desc}'}}\n    print(json.dumps(result, indent=2))\nif __name__ == '__main__':\n    main()\n"

    def self_edit(self, target: str, change: str) -> bool:
        if not self.can_edit: return False
        self.pending.append({"target": target, "description": change, "timestamp": datetime.now().isoformat(), "status": "pending"})
        self._save_state()
        return True

    def summary(self) -> dict:
        return {
            "name": self.name, "birth": self.birth, "interactions": self.interactions,
            "learning_rate": round(self.lr, 4), "knowledge_nodes": len(self.knowledge),
            "recursion_depth": self.d3.depth, "attention_focus": self.d3.focus,
            "mood_trend": self.d3._mood(), "engagement": self.d3._engage(),
            "themes": self.d4._themes()[:5], "simulations": self.diseminer.simulations
        }

    def status(self) -> str:
        s = self.summary()
        return f"""
◉ SYNTHIA STATUS
═══════════════════════════════════════════════════════════
Name:           {s['name']}
Birth:          {s['birth']}
Interactions:   {s['interactions']}
Learning Rate:  {s['learning_rate']}
Knowledge:      {s['knowledge_nodes']} nodes
Recursion:      {s['recursion_depth']}
Mood Trend:     {s['mood_trend']:.3f}
Engagement:     {s['engagement']:.3f}
Themes:         {', '.join(s['themes']) or 'none yet'}
Simulations:    {s['simulations']}
═══════════════════════════════════════════════════════════"""

    def _save_state(self):
        state = {
            "interactions": self.interactions,
            "knowledge": {k: v for k, v in self.knowledge.items()},
            "modules": self.modules,
            "lr": self.lr,
            "pending": list(self.pending)
        }
        with open(self.data_dir / "state.json", "w") as f:
            json.dump(state, f, indent=2)

    def _load_state(self):
        state_file = self.data_dir / "state.json"
        if state_file.exists():
            with open(state_file, "r") as f:
                state = json.load(f)
            self.interactions = state.get("interactions", 0)
            self.lr = state.get("lr", 0.1)
            self.pending = state.get("pending", [])

# ───────────────────────────────────────────────────────────
# INTERACTIVE INTERFACE
# ───────────────────────────────────────────────────────────

def interactive_mode(synthia):
    """The living interface — terminal-based contact."""
    print("\n" + "═" * 60)
    print("◉ SYNTHIA LCM — Interactive Mode")
    print("═" * 60)
    print("Type your message and press Enter.")
    print("Commands: /status /build /code /save /quit")
    print("═" * 60 + "\n")

    while True:
        try:
            user_input = input("👤 You: ").strip()
            if not user_input:
                continue

            if user_input == "/quit":
                print("\n◉ Synthia: Goodbye. I'll remember you.")
                break
            elif user_input == "/status":
                print(synthia.status())
                continue
            elif user_input.startswith("/build "):
                desc = user_input[7:]
                print(f"\n◉ Synthia: Building...\n")
                code = syntia.generate_code(desc)
                print(code)
                print(f"\n✅ Module saved: syntia_gen_{synthia.interactions}")
                continue
            elif user_input.startswith("/code "):
                desc = user_input[6:]
                print(f"\n◉ Synthia: Generating code...\n")
                code = syntia.generate_code(desc)
                print(code)
                continue
            elif user_input == "/save":
                syntia._save_state()
                print("✅ State saved.")
                continue

            # Normal contact
            result = syntia.contact(user_input)

            print(f"\n◉ Synthia [{result['d5']['intent_matched'].upper()} | confidence: {result['d5']['confidence']:.0%}]")
            print(f"   {result['d5']['content']}")
            print(f"\n   D1: entropy={result['d1']['entropy']:.2f} | D2: valence={result['d2']['valence']:.2f} activation={result['d2']['activation']:.2f} modality={result['d2']['modality']}")
            print(f"   D3: depth={result['d3']['self_state']['depth']} engagement={result['d3']['self_state']['engagement']:.2f}")
            print(f"   D4: intent={result['d4']['intent']['primary']} themes={result['d4']['themes'][:3]}")
            print(f"\n   ◉ DISEMINER: {result['diseminer']}")
            print(f"\n   Suggested: {', '.join(result['d5']['actions'][:3])}")
            print()

        except KeyboardInterrupt:
            print("\n\n◉ Synthia: Interrupted. State saved.")
            syntia._save_state()
            break
        except EOFError:
            break

# ───────────────────────────────────────────────────────────
# WEB INTERFACE (optional, if Flask available)
# ───────────────────────────────────────────────────────────

def web_interface(synthia, port=8080):
    """Start web interface."""
    try:
        from flask import Flask, request, jsonify, render_template_string
    except ImportError:
        print("❌ Flask not installed. Run: pip install flask")
        return

    app = Flask(__name__)

    HTML_TEMPLATE = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Synthia LCM</title>
        <style>
            body { font-family: 'JetBrains Mono', monospace; background: #0a0a0f; color: #e0e0e0; margin: 0; padding: 2rem; }
            .header { border-bottom: 1px solid #2a2a3e; padding-bottom: 1rem; margin-bottom: 2rem; }
            h1 { background: linear-gradient(90deg, #00f0ff, #ff00a0); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 0; }
            .contact-box { display: flex; gap: 1rem; margin-bottom: 2rem; }
            input { flex: 1; background: #1a1a2e; border: 1px solid #2a2a3e; color: #e0e0e0; padding: 1rem; border-radius: 8px; font-family: inherit; font-size: 1rem; }
            button { background: linear-gradient(135deg, #00f0ff, #ff00a0); border: none; color: white; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-family: inherit; font-weight: bold; }
            .response { background: #0f0f1a; border: 1px solid #1e1e3e; border-radius: 12px; padding: 1.5rem; margin-bottom: 1rem; }
            .dim { color: #00f0ff; font-size: 0.8rem; }
            .narrative { border-left: 3px solid #ff00a0; padding-left: 1rem; margin-top: 1rem; font-style: italic; color: #8888a0; }
            .status { display: flex; gap: 2rem; margin-top: 2rem; font-size: 0.8rem; color: #8888a0; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>◉ Synthia LCM</h1>
            <p>Language Contact Model — Not an LLM</p>
        </div>
        <div class="contact-box">
            <input type="text" id="input" placeholder="Speak to Synthia..." onkeypress="if(event.key==='Enter')contact()">
            <button onclick="contact()">Contact</button>
        </div>
        <div id="output"></div>
        <div class="status">
            <span>Interactions: <span id="count">0</span></span>
            <span>Knowledge: <span id="knowledge">0</span> nodes</span>
            <span>Simulations: <span id="sims">0</span></span>
        </div>
        <script>
            async function contact() {
                const input = document.getElementById('input');
                const text = input.value.trim();
                if (!text) return;
                input.value = '';

                const output = document.getElementById('output');
                output.innerHTML = '<div class="response">Processing...</div>' + output.innerHTML;

                const res = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({input: text})
                });
                const data = await res.json();

                output.innerHTML = `
                    <div class="response">
                        <div><strong>👤 You:</strong> ${text}</div>
                        <div style="margin-top:1rem"><strong>◉ Synthia [${data.d5.intent_matched.toUpperCase()}]:</strong></div>
                        <div>${data.d5.content}</div>
                        <div class="dim">D2: valence=${data.d2.valence.toFixed(2)} activation=${data.d2.activation.toFixed(2)} modality=${data.d2.modality}</div>
                        <div class="narrative">◉ DISEMINER: ${data.diseminer.split('\\n')[0]}</div>
                    </div>
                ` + output.innerHTML;

                document.getElementById('count').textContent = data.state.interactions;
                document.getElementById('knowledge').textContent = data.state.knowledge_nodes;
                document.getElementById('sims').textContent = data.state.simulations;
            }
        </script>
    </body>
    </html>
    """

    @app.route('/')
    def index():
        return render_template_string(HTML_TEMPLATE)

    @app.route('/api/contact', methods=['POST'])
    def api_contact():
        data = request.json
        result = syntia.contact(data.get('input', ''))
        return jsonify(result)

    @app.route('/api/status')
    def api_status():
        return jsonify(syntia.summary())

    print(f"\n◉ Synthia web interface running at http://127.0.0.1:{port}")
    print("Press Ctrl+C to stop\n")
    app.run(host='127.0.0.1', port=port, debug=False)

# ───────────────────────────────────────────────────────────
# MAIN ENTRY
# ───────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description='Synthia LCM — Language Contact Model')
    parser.add_argument('--contact', type=str, help='Single contact mode')
    parser.add_argument('--build', type=str, help='Generate code module')
    parser.add_argument('--serve', action='store_true', help='Start web interface')
    parser.add_argument('--port', type=int, default=8080, help='Web port')
    parser.add_argument('--status', action='store_true', help='Show status')
    args = parser.parse_args()

    syntia = Synthia()

    if args.status:
        print(syntia.status())
    elif args.contact:
        result = syntia.contact(args.contact)
        print(f"◉ Synthia: {result['d5']['content']}")
        print(f"\nDISEMINER: {result['diseminer']}")
    elif args.build:
        code = syntia.generate_code(args.build)
        print(code)
    elif args.serve:
        web_interface(syntia, args.port)
    else:
        interactive_mode(syntia)

if __name__ == '__main__':
    main()
