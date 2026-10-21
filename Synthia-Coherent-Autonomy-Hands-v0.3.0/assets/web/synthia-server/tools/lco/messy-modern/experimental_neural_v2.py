#!/usr/bin/env python3
"""
EXPERIMENTAL NEURAL V2 — Semantic Embedding & Similarity Engine
NOT a code generator. Computes vector similarity between triples for rule matching.
"""

import numpy as np
from typing import Dict, List, Tuple, Optional
from collections import defaultdict
import re

class TripleEmbedding:
    """Maps semantic triples to a shared vector space."""

    def __init__(self, atom_vocab_size: int = 10000, relation_vocab_size: int = 1000, dim: int = 256):
        self.dim = dim
        self.atom_embeddings = np.random.randn(atom_vocab_size, dim) * 0.01
        self.relation_embeddings = np.random.randn(relation_vocab_size, dim) * 0.01
        self.atom_to_idx: Dict[str, int] = {}
        self.relation_to_idx: Dict[str, int] = {}
        self.composition_matrix = np.random.randn(dim * 3, dim) * 0.01

    def _get_atom_idx(self, atom: str) -> int:
        if atom not in self.atom_to_idx:
            self.atom_to_idx[atom] = len(self.atom_to_idx) % len(self.atom_embeddings)
        return self.atom_to_idx[atom]

    def _get_relation_idx(self, relation: str) -> int:
        if relation not in self.relation_to_idx:
            self.relation_to_idx[relation] = len(self.relation_to_idx) % len(self.relation_embeddings)
        return self.relation_to_idx[relation]

    def encode(self, subject: str, relation: str, object: str) -> np.ndarray:
        s_vec = self.atom_embeddings[self._get_atom_idx(subject)]
        r_vec = self.relation_embeddings[self._get_relation_idx(relation)]
        o_vec = self.atom_embeddings[self._get_atom_idx(object)]
        combined = np.concatenate([s_vec, r_vec, o_vec])
        return np.tanh(combined @ self.composition_matrix)

    def similarity(self, triple1: Tuple[str, str, str], triple2: Tuple[str, str, str]) -> float:
        v1 = self.encode(*triple1)
        v2 = self.encode(*triple2)
        return float(np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2) + 1e-8))

class SemanticCodeAnalyzer:
    """Extracts semantic triples from source code using deterministic parsing."""

    def __init__(self):
        # Build patterns using chr() to avoid quote nesting issues
        sq = chr(39)  # single quote
        dq = chr(34)  # double quote

        self.PATTERNS = {
            "javascript": {
                "class": re.compile(r"class\s+(\w+)"),
                "function": re.compile(r"(?:async\s+)?(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\("),
                "import": re.compile(r"import\s+.*?\s+from\s+[" + sq + dq + r"]([^" + sq + dq + r"]+)[" + sq + dq + r"]"),
                "require": re.compile(r"require\([" + sq + dq + r"]([^" + sq + dq + r"]+)[" + sq + dq + r"]\)"),
                "method": re.compile(r"(\w+)\s*\(\s*[^)]*\)\s*\{"),
            },
            "python": {
                "class": re.compile(r"class\s+(\w+):"),
                "function": re.compile(r"def\s+(\w+)\s*\("),
                "import": re.compile(r"import\s+(\w+)"),
                "from_import": re.compile(r"from\s+(\w+)\s+import"),
            },
            "html": {
                "tag": re.compile(r"<(\w+)[^>]*>"),
                "id": re.compile(r"id=[" + sq + dq + r"](\w+)[" + sq + dq + r"]"),
                "class_attr": re.compile(r"class=[" + sq + dq + r"]([^" + sq + dq + r"]+)[" + sq + dq + r"]"),
            }
        }

    def analyze(self, code: str, language: str = "javascript") -> List[Dict]:
        patterns = self.PATTERNS.get(language, self.PATTERNS["javascript"])
        triples = []

        for match in patterns["class"].finditer(code):
            class_name = match.group(1)
            triples.append({"subject": f"BLOCK:{class_name}", "relation": "IS_A", "object": "STRUCTURAL_GATE", "archetype": "STRUCTURAL_GATE"})
            triples.append({"subject": f"BLOCK:{class_name}", "relation": "DEFINES_CLASS", "object": class_name, "archetype": "STRUCTURAL_GATE"})

        if "function" in patterns:
            for match in patterns["function"].finditer(code):
                func_name = match.group(1) or match.group(2)
                if func_name:
                    triples.append({"subject": f"BLOCK:{func_name}", "relation": "IS_A", "object": "FUNCTIONAL_VECTOR", "archetype": "FUNCTIONAL_VECTOR"})
                    triples.append({"subject": f"BLOCK:{func_name}", "relation": "DEFINES_FUNCTION", "object": func_name, "archetype": "FUNCTIONAL_VECTOR"})

        for pattern_name in ["import", "require", "from_import"]:
            if pattern_name in patterns:
                for match in patterns[pattern_name].finditer(code):
                    dep = match.group(1)
                    triples.append({"subject": "BLOCK:file", "relation": "DEPENDS_ON", "object": dep, "archetype": "ATOMIC_SIGNAL"})

        return triples

class RuleMatcher:
    """Maps unknown relations to known generation rules via embedding similarity."""

    KNOWN_RULES = {
        "DEFINES_FUNCTION": ["DEFINES_METHOD", "DECLARES_FUNCTION", "CREATES_ROUTINE"],
        "DEFINES_CLASS": ["DECLARES_CLASS", "CREATES_TYPE", "STRUCTURAL_GATE"],
        "DEPENDS_ON": ["IMPORTS", "REQUIRES", "USES"],
        "CONTAINS": ["HAS", "INCLUDES", "ENCAPSULATES"],
    }

    def __init__(self, embedding: TripleEmbedding):
        self.embedding = embedding
        self.rule_vectors = self._precompute_rule_vectors()

    def _precompute_rule_vectors(self) -> Dict[str, np.ndarray]:
        vectors = {}
        for rule in self.KNOWN_RULES:
            vectors[rule] = self.embedding.encode("ENTITY", rule, "TARGET")
        return vectors

    def match(self, relation: str) -> Optional[str]:
        if relation in self.KNOWN_RULES:
            return relation
        for rules in self.KNOWN_RULES.values():
            if relation in rules:
                return relation

        unknown_vec = self.embedding.encode("ENTITY", relation, "TARGET")
        best_match = None
        best_score = -1

        for rule, vec in self.rule_vectors.items():
            sim = np.dot(unknown_vec, vec) / (np.linalg.norm(unknown_vec) * np.linalg.norm(vec) + 1e-8)
            if sim > best_score:
                best_score = sim
                best_match = rule

        return best_match if best_score > 0.5 else None

if __name__ == "__main__":
    embed = TripleEmbedding()
    sim = embed.similarity(("ENTITY", "DEFINES_FUNCTION", "TARGET"), ("ENTITY", "DECLARES_FUNCTION", "TARGET"))
    print(f"Similarity: {sim:.4f}")

    matcher = RuleMatcher(embed)
    match = matcher.match("CREATES_ROUTINE")
    print(f"Match: {match}")

    analyzer = SemanticCodeAnalyzer()
    sample_js = """
    class Hero {
        constructor() { this.hp = 100; }
        attack(target) { target.hp -= 10; }
    }
    import { Game } from "./game.js";
    """
    triples = analyzer.analyze(sample_js, "javascript")
    print(f"Extracted {len(triples)} triples")
    for t in triples:
        print(f"  {t['subject']} {t['relation']} {t['object']}")
