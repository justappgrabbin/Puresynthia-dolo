#!/usr/bin/env python3
"""
UNIFIED TRIPLE SCHEMA v1.0 — Python Mirror
Canonical contract for all MESSY Modern surfaces.

Derived from:
- Klein 1976 MESSY Manual (rv, h, created, deleted, STIME)
- MESSY Modern spatial extensions (position, velocity, archetype)
- Self-modification requirements (source, version, checksum)
"""

from typing import Dict, List, Optional, Tuple, Any, Literal
from dataclasses import dataclass, field
from enum import Enum
import numpy as np
import hashlib

# ============================================================
# CORE ENUMS
# ============================================================

class Archetype(str, Enum):
    STRUCTURAL_GATE = "STRUCTURAL_GATE"
    FUNCTIONAL_VECTOR = "FUNCTIONAL_VECTOR"
    ATOMIC_SIGNAL = "ATOMIC_SIGNAL"
    META = "META"

class Surface(str, Enum):
    FRONTEND = "frontend"
    BACKEND = "backend"
    INGESTOR = "ingestor"
    SELFMOD = "selfmod"
    NEURAL = "neural"
    USER = "user"

class TripleOp(str, Enum):
    ASSERT = "ASSERT"
    NEGATE = "NEGATE"
    MODIFY = "MODIFY"

class SyncType(str, Enum):
    SYNC = "SYNC"
    DELTA = "DELTA"
    FULL = "FULL"
    ACK = "ACK"
    ERROR = "ERROR"

class Recommendation(str, Enum):
    APPROVE = "approve"
    REJECT = "reject"
    RETRY = "retry"

# ============================================================
# UNIFIED TRIPLE
# ============================================================

@dataclass
class UnifiedTriple:
    """The canonical triple structure. Every surface must use this exactly."""

    # Core identity (Klein 1976)
    subject: str
    relation: str
    object: Optional[str] = None

    # Historical parameters (Klein 1976, MESSY manual)
    rv: float = 1.0           # Reality Value [0.0, 1.0]
    h: float = 1.0            # Frequency/Probability [0.0, 1.0]
    value: float = 0.0        # Scalar magnitude

    # Temporal tracking (Klein 1976 DUR function)
    created: float = 0.0      # STIME when triple entered network
    deleted: Optional[float] = None  # STIME when triple left (None = active)

    # Spatial parameters (MESSY Modern extension)
    position: np.ndarray = field(default_factory=lambda: np.zeros(3))
    velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))

    # Metadata
    archetype: Archetype = Archetype.ATOMIC_SIGNAL
    source: Surface = Surface.USER
    version: int = 1          # Schema version for migration

    @property
    def id(self) -> str:
        return f"{self.subject}:{self.relation}:{self.object or ''}"

    @property
    def is_active(self) -> bool:
        return self.deleted is None

    @property
    def duration(self) -> float:
        """DUR: Duration in Network (Klein 1976)."""
        if self.deleted is not None:
            return self.deleted - self.created
        # If not deleted, duration is from creation to now (caller provides current stime)
        return 0.0

    def compute_duration(self, current_stime: float) -> float:
        """Compute duration given current simulation time."""
        if self.deleted is not None:
            return self.deleted - self.created
        return current_stime - self.created

# ============================================================
# RELATION REGISTRY
# ============================================================

@dataclass
class RelationPhysics:
    """Physics parameters for a relation type."""
    length: float = 3.0
    stiffness: float = 0.1
    transitive: bool = False
    max_distance: float = float('inf')
    min_distance: float = 0.0

# Default relation physics (Klein 1976 semantic forces)
RELATION_DEFAULTS: Dict[str, RelationPhysics] = {
    "LOVES": RelationPhysics(length=2.0, stiffness=0.5, transitive=False, max_distance=10.0, min_distance=0.5),
    "HATES": RelationPhysics(length=-5.0, stiffness=0.3, transitive=False, max_distance=15.0, min_distance=2.0),
    "MARRIED": RelationPhysics(length=1.0, stiffness=2.0, transitive=False, max_distance=5.0, min_distance=0.3),
    "AT": RelationPhysics(length=0.0, stiffness=10.0, transitive=False, max_distance=0.1, min_distance=0.0),
    "CONTAINS": RelationPhysics(length=1.5, stiffness=0.4, transitive=True, max_distance=8.0, min_distance=0.5),
    "DEPENDS_ON": RelationPhysics(length=3.5, stiffness=0.25, transitive=True, max_distance=12.0, min_distance=1.0),
    "IS_A": RelationPhysics(length=2.0, stiffness=0.6, transitive=True, max_distance=6.0, min_distance=0.5),
    "DEFINES": RelationPhysics(length=1.5, stiffness=0.5, transitive=False, max_distance=5.0, min_distance=0.3),
    "WRITTEN_IN": RelationPhysics(length=2.5, stiffness=0.2, transitive=False, max_distance=8.0, min_distance=0.5),
    "TRIGGERS": RelationPhysics(length=2.5, stiffness=0.2, transitive=True, max_distance=10.0, min_distance=0.5),
    "CONTAINS_FLAW": RelationPhysics(length=8.0, stiffness=0.1, transitive=False, max_distance=20.0, min_distance=3.0),
    "RESOLVED_STATE": RelationPhysics(length=1.0, stiffness=1.0, transitive=False, max_distance=3.0, min_distance=0.2),
}

# ============================================================
# NODE
# ============================================================

@dataclass
class UnifiedNode:
    """A node in the spatial mesh."""
    id: str
    position: np.ndarray = field(default_factory=lambda: np.zeros(3))
    velocity: np.ndarray = field(default_factory=lambda: np.zeros(3))
    mass: float = 1.5
    charge: float = 0.0
    archetype: Archetype = Archetype.ATOMIC_SIGNAL
    traits: Dict[str, Any] = field(default_factory=dict)

# ============================================================
# MESH STATE
# ============================================================

@dataclass
class MeshState:
    """Complete state of the semantic mesh."""
    triples: Dict[str, UnifiedTriple] = field(default_factory=dict)
    nodes: Dict[str, UnifiedNode] = field(default_factory=dict)
    relations: Dict[str, RelationPhysics] = field(default_factory=lambda: RELATION_DEFAULTS.copy())
    stime: float = 0.0
    version: int = 1

    @property
    def checksum(self) -> str:
        """Deterministic hash of active triples for integrity."""
        active = [t for t in self.triples.values() if t.is_active]
        data = "|".join(
            f"{t.subject}:{t.relation}:{t.object}:{t.rv}:{t.h}:{t.created}"
            for t in sorted(active, key=lambda x: x.created)
        )
        return hashlib.sha256(data.encode()).hexdigest()[:16]

    def active_triples(self) -> List[UnifiedTriple]:
        return [t for t in self.triples.values() if t.is_active]

# ============================================================
# SYNC PROTOCOL
# ============================================================

@dataclass
class TripleDelta:
    """A single change to the mesh."""
    op: TripleOp
    triple: UnifiedTriple
    prior_checksum: Optional[str] = None

@dataclass
class MeshSyncMessage:
    """WebSocket message format for mesh synchronization."""
    type: SyncType
    sequence: int
    timestamp: float
    stime: float
    payload: Dict[str, Any]
    surface: Surface

# ============================================================
# VALIDATION
# ============================================================

@dataclass
class ValidationResult:
    valid: bool
    stage: str
    violations: List[str]
    confidence: float
    recommendation: Recommendation

def validate_triple(triple: UnifiedTriple) -> ValidationResult:
    """Validate a triple against the schema."""
    violations = []

    # E1.1: Missing subject
    if not triple.subject or triple.subject.strip() == '':
        violations.append('E1.1: missing_subject')

    # E1.2: Missing relation
    if not triple.relation or triple.relation.strip() == '':
        violations.append('E1.2: missing_relation')

    # E1.3: Invalid RV range
    if triple.rv < 0 or triple.rv > 1 or np.isnan(triple.rv):
        violations.append('E1.3: invalid_rv_range')

    # E1.4: Invalid h range
    if triple.h < 0 or triple.h > 1 or np.isnan(triple.h):
        violations.append('E1.4: invalid_h_range')

    # E1.5: Null object on non-unary relation
    if triple.object is None and triple.relation not in ['ASSERT', 'EXISTS', 'DECLARE']:
        violations.append('E1.6: suspicious_null_object')

    # E1.7: Invalid archetype
    if not isinstance(triple.archetype, Archetype):
        violations.append('E1.7: invalid_archetype')

    return ValidationResult(
        valid=len(violations) == 0,
        stage='schema_validator',
        violations=violations,
        confidence=1.0 if len(violations) == 0 else max(0.0, 1.0 - len(violations) * 0.2),
        recommendation=Recommendation.APPROVE if len(violations) == 0 else Recommendation.REJECT
    )

def sanitize_identifier(name: str) -> str:
    """Convert arbitrary string to valid Python/JS identifier."""
    import re
    clean = re.sub(r'[^a-zA-Z0-9_]', '_', name.lower())
    clean = re.sub(r'_+', '_', clean)
    clean = re.sub(r'^_', '', clean)
    if clean and clean[0].isdigit():
        clean = f'node_{clean}'
    return clean or 'anonymous_entity'

def create_triple(
    subject: str,
    relation: str,
    object: Optional[str] = None,
    **kwargs
) -> UnifiedTriple:
    """Factory for creating validated triples with defaults."""
    now = kwargs.get('created', 0.0)

    return UnifiedTriple(
        subject=subject,
        relation=relation,
        object=object,
        rv=kwargs.get('rv', 1.0),
        h=kwargs.get('h', 1.0),
        value=kwargs.get('value', 0.0),
        created=now,
        deleted=kwargs.get('deleted', None),
        position=np.array(kwargs.get('position', [0.0, 0.0, 0.0])),
        velocity=np.array(kwargs.get('velocity', [0.0, 0.0, 0.0])),
        archetype=kwargs.get('archetype', Archetype.ATOMIC_SIGNAL),
        source=kwargs.get('source', Surface.USER),
        version=kwargs.get('version', 1),
    )

# ============================================================
# CONSTANTS (Klein 1976 defaults)
# ============================================================

DEFAULTS = {
    'RV': 1.0,
    'H': 1.0,
    'STIME': 0.0,
    'SCHEMA_VERSION': 1,
    'MASS': 1.5,
    'CHARGE': 0.0,
    'DAMPING': 0.9,
    'DT': 0.016,
    'REPULSION': 100.0,
}

__all__ = [
    'UnifiedTriple', 'UnifiedNode', 'MeshState',
    'Archetype', 'Surface', 'TripleOp', 'SyncType', 'Recommendation',
    'RelationPhysics', 'RELATION_DEFAULTS',
    'TripleDelta', 'MeshSyncMessage',
    'ValidationResult', 'validate_triple',
    'sanitize_identifier', 'create_triple',
    'DEFAULTS'
]
