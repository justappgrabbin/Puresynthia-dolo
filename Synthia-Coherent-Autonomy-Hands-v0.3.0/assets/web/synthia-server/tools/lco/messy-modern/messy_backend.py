#!/usr/bin/env python3
"""
MESSY MODERN — Python Backend
Neural Engine + Code Generation + Sandbox Execution
"""

import asyncio
import json
import ast
import types
import math
import random
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from collections import defaultdict

import numpy as np
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ============================================================
# CORE DATA STRUCTURES
# ============================================================

@dataclass
class SpatialNode:
    id: str
    position: np.ndarray = field(default_factory=lambda: np.zeros(3))
    velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))
    mass: float = 1.0
    charge: float = 0.0
    extent: float = 0.0
    traits: Dict = field(default_factory=dict)

@dataclass
class SpatialRelation:
    id: str
    max_distance: float = float('inf')
    min_distance: float = 0.0
    length: float = 1.0
    stiffness: float = 0.1
    transitive: bool = False

@dataclass
class SpatialTriple:
    subject: str
    relation: str
    object: Optional[str] = None
    value: float = 0.0
    rv: float = 1.0
    h: float = 0.0
    created: float = 0.0
    deleted: Optional[float] = None
    position: np.ndarray = field(default_factory=lambda: np.zeros(3))
    secondary: Dict = field(default_factory=dict)

    @property
    def id(self) -> str:
        return f"{self.subject}:{self.relation}:{self.object or ''}"

    def is_active(self, time: float) -> bool:
        return self.created <= time and (self.deleted is None or self.deleted > time)

class UniformGrid:
    def __init__(self, cell_size: float = 10.0):
        self.cell_size = cell_size
        self.cells: Dict[str, set] = {}

    def _key(self, x: float, y: float, z: float) -> str:
        return f"{int(x//self.cell_size)}:{int(y//self.cell_size)}:{int(z//self.cell_size)}"

    def insert(self, node: SpatialNode):
        key = self._key(*node.position)
        if key not in self.cells:
            self.cells[key] = set()
        self.cells[key].add(node)

    def get_nearby(self, center: SpatialNode, radius: float) -> List[SpatialNode]:
        results = []
        r = int(radius // self.cell_size) + 1
        cx, cy, cz = [int(c // self.cell_size) for c in center.position]

        for dx in range(-r, r+1):
            for dy in range(-r, r+1):
                for dz in range(-r, r+1):
                    key = f"{cx+dx}:{cy+dy}:{cz+dz}"
                    if key in self.cells:
                        for node in self.cells[key]:
                            dist = np.linalg.norm(node.position - center.position)
                            if dist <= radius:
                                results.append(node)
        return results

    def clear(self):
        self.cells.clear()

# ============================================================
# CANONICAL MESH
# ============================================================

class CanonicalMesh:
    def __init__(self, dimensions: int = 3, cell_size: float = 10.0):
        self.dimensions = dimensions
        self.cell_size = cell_size
        self.triples: Dict[str, SpatialTriple] = {}
        self.nodes: Dict[str, SpatialNode] = {}
        self.relations: Dict[str, SpatialRelation] = {}
        self.grid = UniformGrid(cell_size)
        self.time = 0.0
        self.callbacks: Dict[str, callable] = {}
        self.meta_triples: set = set()
        self.files: Dict[str, Dict] = {}

        # Physics
        self.repulsion = 100.0
        self.attraction = 0.01
        self.damping = 0.9
        self.dt = 0.016

        self._init_meta_triples()

    def _init_meta_triples(self):
        self.assert_triple("MESH", "HAS", "DIMENSIONS", {"value": self.dimensions})
        self.assert_triple("MESH", "HAS", "CELL_SIZE", {"value": self.cell_size})
        self.assert_triple("MESH", "HAS", "TIME", {"value": 0})
        self.assert_triple("MESH", "CAN", "ASSERT")
        self.assert_triple("MESH", "CAN", "NEGATE")
        self.assert_triple("MESH", "CAN", "QUERY")
        self.assert_triple("MESH", "CAN", "GENERATE")
        self.assert_triple("MESH", "CAN", "EXECUTE")
        self.assert_triple("MESH", "CAN", "MODIFY_SELF")
        self.assert_triple("MESH", "CAN", "INGEST")
        self.assert_triple("SYSTEM", "VERSION", "MESSY_MODERN_1.0")
        self.assert_triple("KERNEL", "TYPE", "PAPER_PRODUCTION")

    def assert_triple(self, subject: str, relation: str, object: Optional[str] = None, 
                      meta: Optional[Dict] = None) -> SpatialTriple:
        meta = meta or {}
        triple_id = f"{subject}:{relation}:{object or ''}"

        # Ensure nodes
        for atom in [subject, object]:
            if atom and atom not in self.nodes:
                pos = np.random.randn(3) * 10
                node = SpatialNode(id=atom, position=pos)
                self.nodes[atom] = node
                self.grid.insert(node)

        # Ensure relation
        if relation not in self.relations:
            self.relations[relation] = SpatialRelation(id=relation)

        # Create triple
        triple = SpatialTriple(
            subject=subject,
            relation=relation,
            object=object,
            value=meta.get("value", 0),
            rv=meta.get("rv", 1),
            h=meta.get("h", 0),
            created=self.time
        )

        self.triples[triple_id] = triple
        self._apply_semantic_force(triple)

        if subject in ("MESH", "SYSTEM", "NEURAL"):
            self.meta_triples.add(triple_id)

        self._notify("triple_asserted", triple)
        return triple

    def ingest_triples(self, triples: List[Dict]):
        for t in triples:
            self.assert_triple(t["subject"], t["relation"], t.get("object"), 
                             {"archetype": t.get("archetype")})
        self._notify("ingest_complete", {"count": len(triples)})

    def negate(self, triple_id: str):
        triple = self.triples.get(triple_id)
        if triple:
            triple.deleted = self.time
            self._notify("triple_negated", triple)

    def query(self, pattern: Optional[Dict] = None) -> List[SpatialTriple]:
        pattern = pattern or {}
        results = []
        for triple in self.triples.values():
            if triple.deleted is not None:
                continue
            if pattern.get("subject") and triple.subject != pattern["subject"]:
                continue
            if pattern.get("relation") and triple.relation != pattern["relation"]:
                continue
            if pattern.get("object") and triple.object != pattern["object"]:
                continue
            results.append(triple)
        return results

    def query_radius(self, center_id: str, radius: float) -> List[Tuple[SpatialTriple, float]]:
        center = self.nodes.get(center_id)
        if not center:
            return []

        candidates = self.grid.get_nearby(center, radius)
        results = []

        for node in candidates:
            dist = np.linalg.norm(node.position - center.position)
            if dist <= radius:
                for triple in self.triples.values():
                    if triple.deleted is not None:
                        continue
                    if triple.subject == node.id or triple.object == node.id:
                        results.append((triple, dist))

        return sorted(results, key=lambda x: x[1])

    def _apply_semantic_force(self, triple: SpatialTriple):
        rel = self.relations.get(triple.relation)
        s_node = self.nodes.get(triple.subject)
        o_node = self.nodes.get(triple.object) if triple.object else None

        if not all([rel, s_node, o_node]):
            return

        relation_physics = {
            "LOVES": (2.0, 0.5), "AFFECTION": (2.0, 0.5), "LIKES": (3.0, 0.3),
            "HATES": (-5.0, 0.3), "AVOIDS": (-5.0, 0.3), "DISLIKES": (-4.0, 0.3),
            "MARRIED": (1.0, 2.0), "AT": (0.0, 10.0), "WANTS": (3.0, 0.2),
            "CONTAINS": (3.0, 0.4), "IS_A": (2.0, 0.6), "DEPENDS_ON": (4.0, 0.3),
            "DEFINES": (1.5, 0.5), "WRITTEN_IN": (2.5, 0.2), "IMPORTS": (3.5, 0.3),
            "INVESTIGATES": (4.0, 0.1), "FLIRT": (2.5, 0.4), "HAPPENED_AT": (3.0, 0.2),
            "FOUND_AT": (2.0, 0.3), "ON": (1.0, 0.8)
        }

        if triple.relation in relation_physics:
            rel.length, rel.stiffness = relation_physics[triple.relation]
        else:
            rel.length = 4.0
            rel.stiffness = 0.1

        diff = o_node.position - s_node.position
        dist = np.linalg.norm(diff)

        if dist > 0.1:
            displacement = dist - abs(rel.length)
            force = rel.stiffness * displacement * (1 if rel.length >= 0 else -1)
            direction = diff / dist
            s_node.velocity -= direction * force * self.dt
            o_node.velocity += direction * force * self.dt

    def step(self, dt: Optional[float] = None) -> float:
        dt = dt or self.dt
        self.time += dt

        # Repulsion
        node_list = list(self.nodes.values())
        for i in range(len(node_list)):
            for j in range(i+1, len(node_list)):
                n1, n2 = node_list[i], node_list[j]
                diff = n2.position - n1.position
                dist = np.linalg.norm(diff)
                if 0.1 < dist < 30:
                    force = self.repulsion / (dist ** 2)
                    direction = diff / dist
                    n1.velocity -= direction * force * dt
                    n2.velocity += direction * force * dt

        # Attraction along edges
        for triple in self.triples.values():
            if triple.deleted is not None:
                continue
            self._apply_semantic_force(triple)

        # Update positions
        for node in self.nodes.values():
            node.velocity *= self.damping
            node.position += node.velocity * dt

        # Reindex
        self.grid.clear()
        for node in self.nodes.values():
            self.grid.insert(node)

        self._notify("physics_step", {"time": self.time})
        return self.time

    def _notify(self, event: str, data: Any):
        for name, handler in self.callbacks.items():
            try:
                handler(event, data)
            except Exception as e:
                print(f"Surface {name} failed: {e}")

    def register_surface(self, name: str, handler: callable):
        self.callbacks[name] = handler

    def get_stats(self) -> Dict:
        active = [t for t in self.triples.values() if t.deleted is None]
        return {
            "nodes": len(self.nodes),
            "triples": len(self.triples),
            "active": len(active),
            "time": round(self.time, 2),
            "files": list(self.files.keys())
        }

    def to_dict(self) -> Dict:
        return {
            "nodes": {k: {"position": v.position.tolist()} for k, v in self.nodes.items()},
            "triples": [
                {
                    "subject": t.subject,
                    "relation": t.relation,
                    "object": t.object,
                    "value": t.value,
                    "created": t.created,
                    "deleted": t.deleted
                }
                for t in self.triples.values()
            ],
            "time": self.time
        }

# ============================================================
# DETERMINISTIC CODE GENERATOR
# ============================================================

class DeterministicGenerator:
    """Maps semantic triples to code via pattern rules and topological sorting."""

    GENERATION_RULES = {
        "DEFINES_FUNCTION": {
            "javascript": lambda s, o: f"function {s}() {{\n  // Logic for {o}\n}}",
            "python": lambda s, o: f"def {s}():\n    # Logic for {o}\n    pass"
        },
        "CALLS": {
            "javascript": lambda s, o: f"  {s}(); // via CALLS relation",
            "python": lambda s, o: f"    {s}() # via CALLS relation"
        },
        "HAS_PROPERTY": {
            "javascript": lambda s, o: f"this.{o} = null;",
            "python": lambda s, o: f"    self.{o} = None"
        }
    }

    def __init__(self, mesh: CanonicalMesh):
        self.mesh = mesh

    @staticmethod
    def sanitize_identifier(name: str) -> str:
        """Converts arbitrary triple symbols into valid Python/JS identifiers."""
        clean = name.lower().replace(" ", "_").replace("-", "_")
        clean = re.sub(r'[^a-z0-9_]', '', clean)
        if clean and clean[0].isdigit():
            clean = f"node_{clean}"
        return clean or "anonymous_entity"

    def topological_sort(self, triples: List[SpatialTriple]) -> List[str]:
        """Orders nodes so dependencies are declared before dependents."""
        adjacency = defaultdict(list)
        in_degree = defaultdict(int)
        all_nodes = set()

        for t in triples:
            all_nodes.add(t.subject)
            if t.object:
                all_nodes.add(t.object)
            if t.relation in ["DEPENDS_ON", "EXTENDS", "CALLS"]:
                adjacency[t.object].append(t.subject)
                in_degree[t.subject] += 1

        queue = [node for node in all_nodes if in_degree[node] == 0]
        ordered = []

        while queue:
            curr = queue.pop(0)
            ordered.append(curr)
            for neighbor in adjacency[curr]:
                in_degree[neighbor] -= 1
                if in_degree[neighbor] == 0:
                    queue.append(neighbor)

        remaining = all_nodes - set(ordered)
        return ordered + list(remaining)

    def generate_javascript(self) -> str:
        triples = self.mesh.query()
        code_lines = [
            "// Automatically synthesized by MESSY Core Fallback Engine",
            "class ApplicationContext {",
            "  constructor() {",
            "    this.state = {};",
            "    this.components = new Map();",
            "  }",
            ""
        ]

        # Topological sort for dependency ordering
        ordered = self.topological_sort(triples)
        emitted = set()

        for node in ordered:
            if node in emitted:
                continue
            node_triples = [t for t in triples if t.subject == node]

            for t in node_triples:
                s = self.sanitize_identifier(t.subject)
                o = self.sanitize_identifier(t.object) if t.object else ""

                if t.relation == "DEFINES_FUNCTION":
                    code_lines.append(f"  {s}() {{")
                    code_lines.append(f"    console.log('Executing: {t.subject}');")
                    code_lines.append(f"  }}")
                    code_lines.append("")
                elif t.relation == "DEFINES_CLASS":
                    code_lines.append(f"  get {s}() {{")
                    code_lines.append(f"    return class {t.subject} {{}};")
                    code_lines.append(f"  }}")
                    code_lines.append("")
                elif t.relation == "HAS_PROPERTY":
                    code_lines.append(f"  this.{o} = null;")

            emitted.add(node)

        code_lines.append("}")
        code_lines.append("")
        code_lines.append("// Instantiate and bootstrap the synthesized mesh state")
        code_lines.append("const app = new ApplicationContext();")

        # Second pass: link behaviors
        for t in triples:
            if t.relation == "CALLS":
                s = self.sanitize_identifier(t.subject)
                code_lines.append(f"if (typeof app.{s} === 'function') app.{s}();")

        return "\n".join(code_lines)

    def generate_python(self) -> str:
        triples = self.mesh.query()
        code_lines = [
            "#!/usr/bin/env python3",
            "# Generated by MESSY Modern — Deterministic Fallback Engine",
            "from collections import defaultdict",
            ""
        ]

        ordered = self.topological_sort(triples)
        emitted = set()

        code_lines.append("class SemanticNetwork:")
        code_lines.append("    def __init__(self):")
        code_lines.append("        self.triples = []")
        code_lines.append("")
        code_lines.append("    def assert_triple(self, s, r, o):")
        code_lines.append("        self.triples.append((s, r, o))")
        code_lines.append("        print(f'Asserted: {s} --[{r}]--> {o}')")
        code_lines.append("")

        for node in ordered:
            if node in emitted:
                continue
            node_triples = [t for t in triples if t.subject == node]

            for t in node_triples:
                s = self.sanitize_identifier(t.subject)
                o = self.sanitize_identifier(t.object) if t.object else ""

                if t.relation == "DEFINES_FUNCTION":
                    code_lines.append(f"    def {s}(self):")
                    code_lines.append(f"        # Logic for {t.object or 'unknown'}")
                    code_lines.append(f"        pass")
                    code_lines.append("")
                elif t.relation == "DEFINES_CLASS":
                    code_lines.append(f"class {t.subject}:")
                    code_lines.append(f"    pass")
                    code_lines.append("")

            emitted.add(node)

        code_lines.append("# Initialize Core Engine State")
        code_lines.append("network = SemanticNetwork()")
        code_lines.append("")

        for t in triples:
            s = self.sanitize_identifier(t.subject)
            r = self.sanitize_identifier(t.relation)
            o = self.sanitize_identifier(t.object) if t.object else ""
            code_lines.append(f"network.assert_triple('{s}', '{r}', '{o}')")

        return "\n".join(code_lines)

# ============================================================
# SANDBOX EXECUTION
# ============================================================

class TripleSandbox:
    """Restricted execution environment for generated code."""

    ALLOWED_NODES = {
        ast.Expression, ast.Call, ast.Name, ast.Constant, ast.BinOp,
        ast.UnaryOp, ast.BoolOp, ast.Compare, ast.If, ast.For, ast.While,
        ast.FunctionDef, ast.Return, ast.Assign, ast.AugAssign,
        ast.List, ast.Dict, ast.Tuple, ast.Subscript, ast.Attribute,
        ast.Module, ast.Load, ast.Store, ast.Expr
    }

    def __init__(self, mesh: CanonicalMesh, surface: str = "python"):
        self.mesh = mesh
        self.surface = surface
        self.triples = []
        self.log = []

    def execute(self, code: str) -> Dict[str, Any]:
        try:
            tree = ast.parse(code)
        except SyntaxError as e:
            return {"success": False, "error": str(e)}

        # Validate AST
        for node in ast.walk(tree):
            if type(node) not in self.ALLOWED_NODES:
                return {"success": False, "error": f"Disallowed: {type(node).__name__}"}

        # Prepare environment
        env = {
            "__builtins__": {
                "len": len, "range": range, "enumerate": enumerate,
                "zip": zip, "map": map, "filter": filter,
                "sum": sum, "min": min, "max": max,
                "abs": abs, "round": round, "int": int, "float": float,
                "str": str, "bool": bool, "list": list, "dict": dict,
                "set": set, "tuple": tuple, "print": self._safe_print,
                "math": math, "random": random
            },
            "assert_triple": self._assert_triple,
            "query": self._query,
            "mesh": self.mesh
        }

        try:
            compiled = compile(tree, "<generated>", "exec")
            exec(compiled, env)
            return {
                "success": True,
                "triples": self.triples,
                "log": self.log
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def _assert_triple(self, s: str, r: str, o: str = None, **kwargs):
        self.triples.append((s, r, o, kwargs))
        self.mesh.assert_triple(s, r, o, kwargs)

    def _query(self, pattern: Dict) -> List:
        return self.mesh.query(pattern)

    def _safe_print(self, *args):
        self.log.append(" ".join(str(a) for a in args))

# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(title="MESSY Modern API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global mesh instance
mesh = CanonicalMesh()
generator = DeterministicGenerator(mesh)

@app.get("/")
async def root():
    return {"status": "MESSY Modern Backend", "version": "1.0"}

@app.get("/stats")
async def get_stats():
    return mesh.get_stats()

@app.get("/triples")
async def get_triples(subject: Optional[str] = None, relation: Optional[str] = None, 
                       object: Optional[str] = None):
    return [{
        "subject": t.subject,
        "relation": t.relation,
        "object": t.object,
        "value": t.value,
        "created": t.created
    } for t in mesh.query({"subject": subject, "relation": relation, "object": object})]

@app.post("/triples")
async def assert_triple(data: Dict):
    triple = mesh.assert_triple(
        data["subject"],
        data["relation"],
        data.get("object"),
        data.get("meta", {})
    )
    return {"id": triple.id, "status": "asserted"}

@app.delete("/triples/{triple_id}")
async def negate_triple(triple_id: str):
    mesh.negate(triple_id)
    return {"status": "negated"}

@app.post("/generate")
async def generate_code(data: Dict):
    target = data.get("target", "javascript")
    if target == "python":
        code = generator.generate_python()
    else:
        code = generator.generate_javascript()
    return {"code": code, "target": target}

@app.post("/execute")
async def execute_code(data: Dict):
    code = data.get("code", "")
    surface = data.get("surface", "python")
    sandbox = TripleSandbox(mesh, surface)
    result = sandbox.execute(code)
    return result

@app.post("/step")
async def step_simulation():
    mesh.step()
    return mesh.get_stats()

@app.post("/ingest")
async def ingest_files(data: Dict):
    triples = data.get("triples", [])
    mesh.ingest_triples(triples)
    return {"status": "ingested", "count": len(triples)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()

    def handler(event, data):
        asyncio.create_task(websocket.send_json({
            "event": event,
            "data": str(data) if not isinstance(data, dict) else data
        }))

    mesh.register_surface("websocket", handler)

    try:
        while True:
            msg = await websocket.receive_json()
            if msg.get("action") == "assert":
                mesh.assert_triple(
                    msg["subject"], msg["relation"], msg.get("object"), msg.get("meta", {})
                )
            elif msg.get("action") == "step":
                mesh.step()
                await websocket.send_json({"event": "step", "stats": mesh.get_stats()})
            elif msg.get("action") == "generate":
                target = msg.get("target", "javascript")
                if target == "python":
                    code = generator.generate_python()
                else:
                    code = generator.generate_javascript()
                await websocket.send_json({"event": "generated", "code": code})
    except WebSocketDisconnect:
        pass

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
