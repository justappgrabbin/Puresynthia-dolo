#!/usr/bin/env python3
"""
SELF-MODIFICATION CONTROLLER v1.0 (Schema-Aligned)
Autopoietic engine with three validation gates.

Derived from:
- SelfModificationController.py (original)
- schema.py (UnifiedTriple, MeshState, ValidationResult)
- Klein 1976 (temporal rules, DUR, probability)
"""

from typing import List, Dict, Any, Optional, Callable
from dataclasses import dataclass, field
from enum import Enum
import numpy as np

from schema import (
    UnifiedTriple, MeshState, Archetype, Surface, 
    ValidationResult, Recommendation, validate_triple,
    DEFAULTS, RELATION_DEFAULTS
)

# ============================================================
# MODIFICATION TYPES
# ============================================================

class ModificationType(Enum):
    QUESTION_TEMPLATE = "question_template"
    TOOL_MODE = "tool_mode"
    GRAPH_TOPOLOGY = "graph_topology"
    CAPABILITY_REGISTRY = "capability_registry"
    DIMENSIONAL_MAPPING = "dimensional_mapping"
    INTERFACE_THEME = "interface_theme"
    RELATION_PHYSICS = "relation_physics"  # NEW: modify force parameters
    NODE_MASS = "node_mass"                # NEW: modify physics properties

@dataclass
class ModificationProposal:
    type: ModificationType
    description: str
    target: str
    new_value: Any
    confidence: float
    evidence: List[str]
    old_value: Any = None  # For reversibility

# ============================================================
# DOCTOR PARSER (Truth Validation)
# ============================================================

class DoctorParser:
    """Validates proposals against system invariants."""

    INVARIANTS = [
        'core_dimensions_must_remain_five',
        'combinatorial_rules_must_persist',
        'fractal_arbiter_must_be_consistent',
        'tool_hierarchy_must_be_maintained',
        'dimensional_order_must_be_lawful',
        'schema_version_must_be_monotonic',
        'triple_rv_must_be_normalized',
        'temporal_causality_must_hold'
    ]

    def validate(self, proposal: ModificationProposal, mesh: MeshState) -> Dict[str, Any]:
        violations = []

        # Check invariants
        for invariant in self.INVARIANTS:
            if self._violates_invariant(proposal, invariant, mesh):
                violations.append(invariant)

        # Check circular dependencies
        if self._creates_circular_dependency(proposal, mesh):
            violations.append('circular_dependency')

        # Check security
        if self._security_risk(proposal):
            violations.append('security_risk')

        # Check causal integrity
        if self._breaks_causality(proposal, mesh):
            violations.append('causal_break')

        # NEW: Check schema compliance
        if self._violates_schema(proposal):
            violations.append('schema_violation')

        return {
            'valid': len(violations) == 0,
            'violations': violations,
            'confidence': proposal.confidence,
            'recommendation': 'approve' if len(violations) == 0 else 'reject'
        }

    def _violates_invariant(self, proposal: ModificationProposal, invariant: str, mesh: MeshState) -> bool:
        if invariant == 'core_dimensions_must_remain_five':
            if proposal.type == ModificationType.DIMENSIONAL_MAPPING:
                if 'add_dimension' in proposal.description or 'remove_dimension' in proposal.description:
                    return True

        elif invariant == 'schema_version_must_be_monotonic':
            if proposal.type == ModificationType.GRAPH_TOPOLOGY:
                if isinstance(proposal.new_value, dict) and 'version' in proposal.new_value:
                    if proposal.new_value['version'] < mesh.version:
                        return True

        elif invariant == 'triple_rv_must_be_normalized':
            if proposal.type == ModificationType.GRAPH_TOPOLOGY:
                if 'rv' in str(proposal.new_value):
                    # Check if any triple would get invalid RV
                    return False  # Detailed check in _violates_schema

        elif invariant == 'temporal_causality_must_hold':
            if proposal.type == ModificationType.GRAPH_TOPOLOGY:
                # Cannot modify past states
                if 'created' in str(proposal.target) and 'modify' in proposal.description:
                    return True

        return False

    def _creates_circular_dependency(self, proposal: ModificationProposal, mesh: MeshState) -> bool:
        if proposal.type == ModificationType.GRAPH_TOPOLOGY:
            # Check if target depends on itself
            if proposal.target in str(proposal.new_value):
                return True
            # Check for cycles in dependency graph
            if 'DEPENDS_ON' in str(proposal.new_value):
                # Would need full cycle detection here
                pass
        return False

    def _security_risk(self, proposal: ModificationProposal) -> bool:
        if 'auth' in proposal.target or 'security' in proposal.target:
            if proposal.confidence < 0.9:
                return True
        # NEW: Cannot modify validation rules themselves
        if 'doctor' in proposal.target or 'veto' in proposal.target:
            if proposal.confidence < 0.95:
                return True
        return False

    def _breaks_causality(self, proposal: ModificationProposal, mesh: MeshState) -> bool:
        if 'history' in proposal.target and 'delete' in proposal.description:
            return True
        # NEW: Cannot delete triples that other triples depend on
        if proposal.type == ModificationType.GRAPH_TOPOLOGY and 'delete' in proposal.description:
            target_id = proposal.target
            for triple in mesh.active_triples():
                if triple.object == target_id:
                    return True
        return False

    def _violates_schema(self, proposal: ModificationProposal) -> bool:
        # Check if proposal would create invalid triples
        if proposal.type == ModificationType.GRAPH_TOPOLOGY:
            if isinstance(proposal.new_value, dict):
                test_triple = UnifiedTriple(**proposal.new_value)
                result = validate_triple(test_triple)
                if not result.valid:
                    return True
        return False

# ============================================================
# INFLECTION ARCHITECTURE (Lineage Protection)
# ============================================================

class InflectionArchitecture:
    """Ensures modifications respect evolutionary history."""

    def __init__(self):
        self.lineage = []
        self.rollback_points = []

    def record_modification(self, proposal: ModificationProposal, result: Dict):
        from datetime import datetime
        self.lineage.append({
            'proposal': proposal,
            'result': result,
            'timestamp': datetime.now().isoformat()
        })

    def can_rollback(self, steps: int = 1) -> bool:
        return len(self.lineage) >= steps

    def rollback(self, steps: int = 1) -> List[Dict]:
        if not self.can_rollback(steps):
            return []
        rolled_back = self.lineage[-steps:]
        self.lineage = self.lineage[:-steps]
        return rolled_back

    def check_lineage(self, proposal: ModificationProposal) -> Dict:
        # Modifications must be incremental
        if proposal.confidence < 0.5:
            return {'valid': False, 'reason': 'confidence_too_low'}

        # Modifications must be reversible (have old_value)
        if proposal.old_value is None and proposal.type != ModificationType.CAPABILITY_REGISTRY:
            return {'valid': False, 'reason': 'not_reversible'}

        # Modifications must preserve core identity
        if self._changes_identity(proposal):
            return {'valid': False, 'reason': 'identity_change'}

        # NEW: Modifications must not exceed rate limit
        recent = [entry for entry in self.lineage 
                  if entry['timestamp'] > self._now_minus_minutes(5)]
        if len(recent) > 10:
            return {'valid': False, 'reason': 'rate_limit_exceeded'}

        return {'valid': True}

    def _is_reversible(self, proposal: ModificationProposal) -> bool:
        return proposal.old_value is not None

    def _changes_identity(self, proposal: ModificationProposal) -> bool:
        if 'core_identity' in proposal.target:
            return True
        if proposal.type == ModificationType.DIMENSIONAL_MAPPING and 'remove' in proposal.description:
            return True
        return False

    def _now_minus_minutes(self, minutes: int) -> str:
        from datetime import datetime, timedelta
        return (datetime.now() - timedelta(minutes=minutes)).isoformat()

# ============================================================
# VETO PROTOCOL (Subsystem Authority)
# ============================================================

class VetoProtocol:
    """Body, Heart, Mind can veto modifications."""

    def __init__(self):
        self.subsystems = {
            'body': {'priority': 1, 'concerns': ['stability', 'resources', 'performance', 'memory']},
            'heart': {'priority': 2, 'concerns': ['meaning', 'purpose', 'alignment', 'user_trust']},
            'mind': {'priority': 3, 'concerns': ['logic', 'consistency', 'uncertainty', 'schema_compliance']}
        }

    def evaluate(self, proposal: ModificationProposal, mesh: MeshState) -> Dict[str, Any]:
        vetoes = []

        for subsystem, config in self.subsystems.items():
            veto = self._check_subsystem(subsystem, proposal, config, mesh)
            if veto:
                vetoes.append(veto)
                if subsystem == 'body':
                    break  # Body veto is absolute

        return {
            'approved': len(vetoes) == 0,
            'vetoes': vetoes,
            'priority_veto': any(v['subsystem'] == 'body' for v in vetoes)
        }

    def _check_subsystem(self, name: str, proposal: ModificationProposal, config: Dict, mesh: MeshState) -> Optional[Dict]:
        concerns = config['concerns']

        # Body: stability concerns
        if 'stability' in concerns and proposal.type == ModificationType.GRAPH_TOPOLOGY:
            if proposal.confidence < 0.7:
                return {
                    'subsystem': name,
                    'concern': 'stability',
                    'reason': f'{name} veto: modification too risky for system stability'
                }

        # Body: memory concerns
        if 'memory' in concerns:
            node_count = len(mesh.nodes)
            if node_count > 10000 and proposal.type == ModificationType.GRAPH_TOPOLOGY:
                return {
                    'subsystem': name,
                    'concern': 'memory',
                    'reason': f'{name} veto: mesh too large ({node_count} nodes), modification risky'
                }

        # Heart: meaning concerns
        if 'meaning' in concerns and proposal.type == ModificationType.DIMENSIONAL_MAPPING:
            if 'meaning' not in proposal.description:
                return {
                    'subsystem': name,
                    'concern': 'meaning',
                    'reason': f'{name} veto: modification lacks meaning alignment'
                }

        # Heart: user trust
        if 'user_trust' in concerns:
            if proposal.confidence < 0.6 and 'user' in proposal.description:
                return {
                    'subsystem': name,
                    'concern': 'user_trust',
                    'reason': f'{name} veto: low confidence for user-facing change'
                }

        # Mind: logic concerns
        if 'logic' in concerns and proposal.confidence < 0.6:
            return {
                'subsystem': name,
                'concern': 'logic',
                'reason': f'{name} veto: insufficient confidence for logical consistency'
            }

        # Mind: schema compliance
        if 'schema_compliance' in concerns:
            if proposal.type == ModificationType.GRAPH_TOPOLOGY:
                test_triple = UnifiedTriple(**proposal.new_value) if isinstance(proposal.new_value, dict) else None
                if test_triple:
                    from schema import validate_triple
                    result = validate_triple(test_triple)
                    if not result.valid:
                        return {
                            'subsystem': name,
                            'concern': 'schema_compliance',
                            'reason': f'{name} veto: proposal violates schema: {result.violations}'
                        }

        return None

# ============================================================
# SELF-MODIFICATION CONTROLLER (Autopoietic Engine)
# ============================================================

class SelfModificationController:
    """Watches mesh, identifies gaps, generates solutions, validates, deploys."""

    def __init__(self):
        self.doctor = DoctorParser()
        self.inflection = InflectionArchitecture()
        self.veto = VetoProtocol()
        self.proposal_history = []
        self.modification_log = []

    def watch_mesh(self, mesh: MeshState) -> List[ModificationProposal]:
        """Monitor mesh for capability gaps and generate proposals."""
        proposals = []

        # Check for missing relation physics
        active = mesh.active_triples()
        relations_used = set(t.relation for t in active)
        for rel in relations_used:
            if rel not in mesh.relations:
                proposals.append(ModificationProposal(
                    type=ModificationType.RELATION_PHYSICS,
                    description=f'Add physics defaults for relation {rel}',
                    target=f'relations.{rel}',
                    new_value={'length': 3.0, 'stiffness': 0.1, 'transitive': False},
                    confidence=0.9,
                    evidence=[f'Missing physics for relation {rel}'],
                    old_value=None
                ))

        # Check for low-RV triples that need attention
        low_rv = [t for t in active if t.rv < 0.3]
        for t in low_rv:
            proposals.append(ModificationProposal(
                type=ModificationType.GRAPH_TOPOLOGY,
                description=f'Investigate low-RV triple: {t.id}',
                target=t.id,
                new_value={**t.__dict__, 'rv': 0.5},  # Boost RV
                confidence=0.6,
                evidence=[f'Low RV ({t.rv}) detected'],
                old_value=t.rv
            ))

        # Check for orphaned nodes (no active triples)
        active_ids = set()
        for t in active:
            active_ids.add(t.subject)
            if t.object:
                active_ids.add(t.object)

        for node_id in mesh.nodes:
            if node_id not in active_ids:
                proposals.append(ModificationProposal(
                    type=ModificationType.GRAPH_TOPOLOGY,
                    description=f'Remove orphaned node: {node_id}',
                    target=node_id,
                    new_value=None,
                    confidence=0.8,
                    evidence=[f'Node {node_id} has no active triples'],
                    old_value=mesh.nodes[node_id]
                ))

        # Check for stale triples (old, low h, not deleted)
        stale = [t for t in active if mesh.stime - t.created > 1000 and t.h < 0.1]
        for t in stale:
            proposals.append(ModificationProposal(
                type=ModificationType.GRAPH_TOPOLOGY,
                description=f'Archive stale triple: {t.id}',
                target=t.id,
                new_value={**t.__dict__, 'deleted': mesh.stime},
                confidence=0.7,
                evidence=[f'Stale triple: DUR={mesh.stime - t.created}, h={t.h}'],
                old_value=t.deleted
            ))

        return proposals

    def validate_proposal(self, proposal: ModificationProposal, mesh: MeshState) -> Dict:
        """Full validation pipeline: Doctor -> Inflection -> Veto."""

        # Step 1: Doctor Parser
        doctor_result = self.doctor.validate(proposal, mesh)
        if not doctor_result['valid']:
            return {
                'approved': False,
                'stage': 'doctor_parser',
                'reason': doctor_result['violations']
            }

        # Step 2: Inflection Architecture
        lineage_result = self.inflection.check_lineage(proposal)
        if not lineage_result['valid']:
            return {
                'approved': False,
                'stage': 'inflection',
                'reason': lineage_result['reason']
            }

        # Step 3: Veto Protocol
        veto_result = self.veto.evaluate(proposal, mesh)
        if not veto_result['approved']:
            return {
                'approved': False,
                'stage': 'veto',
                'reason': veto_result['vetoes']
            }

        return {
            'approved': True,
            'stages': ['doctor_parser', 'inflection', 'veto']
        }

    def deploy_modification(self, proposal: ModificationProposal, mesh: MeshState) -> Dict:
        """Deploy validated modification and record in lineage."""
        result = self._execute(proposal, mesh)
        self.inflection.record_modification(proposal, result)
        self.modification_log.append({
            'proposal': proposal,
            'result': result,
            'timestamp': self._now()
        })
        return result

    def _execute(self, proposal: ModificationProposal, mesh: MeshState) -> Dict:
        """Execute the modification on the mesh."""
        if proposal.type == ModificationType.RELATION_PHYSICS:
            mesh.relations[proposal.target.replace('relations.', '')] = RelationPhysics(**proposal.new_value)
            return {'status': 'deployed', 'type': 'relation_physics', 'target': proposal.target}

        elif proposal.type == ModificationType.GRAPH_TOPOLOGY:
            if isinstance(proposal.new_value, dict) and 'deleted' in proposal.new_value:
                # Negate triple
                triple_id = proposal.target
                if triple_id in mesh.triples:
                    mesh.triples[triple_id].deleted = proposal.new_value['deleted']
                    return {'status': 'deployed', 'type': 'negate', 'target': triple_id}

        return {'status': 'deployed', 'type': proposal.type.value, 'target': proposal.target}

    def self_update(self, mesh: MeshState) -> List[Dict]:
        """Full self-update cycle: Watch -> Propose -> Validate -> Deploy."""
        proposals = self.watch_mesh(mesh)
        results = []

        for proposal in proposals:
            validation = self.validate_proposal(proposal, mesh)
            if validation['approved']:
                result = self.deploy_modification(proposal, mesh)
                results.append({
                    'proposal': proposal,
                    'status': 'deployed',
                    'result': result
                })
            else:
                results.append({
                    'proposal': proposal,
                    'status': 'rejected',
                    'reason': validation
                })

        return results

    def _now(self) -> str:
        from datetime import datetime
        return datetime.now().isoformat()

# ============================================================
# EXPORTS
# ============================================================

__all__ = [
    'SelfModificationController',
    'DoctorParser',
    'InflectionArchitecture',
    'VetoProtocol',
    'ModificationProposal',
    'ModificationType'
]
