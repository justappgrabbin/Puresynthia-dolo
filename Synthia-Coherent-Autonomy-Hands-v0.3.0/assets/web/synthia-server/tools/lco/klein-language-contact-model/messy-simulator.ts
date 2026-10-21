
/**
 * ============================================================
 * MESSY — Meta-Symbolic Simulation System
 * ============================================================
 * 
 * Original (Klein 1971-1976):
 * "A behavioral simulation programming language that models, generates
 * and manipulates events in the notation of a semantic network that
 * changes through time."
 * 
 * Key innovations:
 * 1. Semantic triples: O-R-O (Object-Relation-Object)
 * 2. Time-indexed assertions with creation/deletion timestamps
 * 3. Complex predicate nodes (self-referential, 2nd-order predicate calculus)
 * 4. Probabilistic rules with subrule conditions
 * 5. Dynamic class creation and modification
 * 6. Natural language meta-compiling (rules can be spoken into existence)
 * 
 * This is the heart of Klein's system. Everything else (AUTOLING, DISEMINER,
 * Novel Writer) plugs into this semantic network as substrate.
 */

import { 
  SemanticNetwork, SemanticNode, SemanticRelation, SemanticTriple,
  LexicalExpressionList, ContextMarker
} from './semantic-network-core';

export interface RuleGroup {
  id: string;
  name: string;
  rules: SimulationRule[];
  enabled: boolean;
  priority: number;
}

export interface SimulationRule {
  id: string;
  name: string;

  // Klein: "Each rule has an action list"
  actionList: RuleAction[];

  // Klein: "Subrules that test conditions in the universe"
  subrules: Subrule[];

  // Klein: "Probability weight"
  probability: number;

  // Klein: "Frequency — how often the rule is evaluated"
  frequency: number; // Time interval between evaluations

  // Klein: "Enabled/disabled"
  enabled: boolean;

  // Metadata
  createdAt: number;
  modifiedAt: number;
  createdBy?: string; // Speaker ID (for meta-compiled rules)
}

export interface Subrule {
  id: string;

  // Klein: "Test conditions in the universe"
  test: NetworkTest;

  // Klein: "Weight added to or subtracted from the probability"
  weight: number;

  // Klein: "AND, OR, NOT operators"
  operator: 'AND' | 'OR' | 'NOT';

  // For compound subrules
  subrules?: Subrule[];
}

export interface NetworkTest {
  type: 'path_exists' | 'node_exists' | 'relation_exists' | 'value_compare' | 'temporal_order' | 'class_membership' | 'custom';

  // Path test: "Does a path exist from A to B through Rk or Ri and Rj but not Rk?"
  fromNode?: string;
  toNode?: string;
  throughRelations?: string[];
  notThroughRelations?: string[];

  // Node test
  nodeId?: string;
  nodeType?: 'atom' | 'class' | 'complex_predicate';

  // Value comparison
  attribute?: string;
  comparator?: '>' | '<' | '=' | '>=' | '<=';
  value?: number;

  // Temporal
  beforeTime?: number;
  afterTime?: number;

  // Custom (for extensibility)
  customFunction?: (network: SemanticNetwork, clock: number) => boolean;
}

export interface RuleAction {
  type: 'ASSERT' | 'NEGATE' | 'SET' | 'ADD' | 'REMOVE' | 'ENABLE' | 'DISABLE' | 'CALL' | 'RETURN' | 'CREATE_CLASS' | 'MODIFY_CLASS' | 'META_COMPILE';

  // Target: node ID, rule ID, or special
  target: string;

  // Value for SET/ADD
  value?: any;

  // For ASSERT: new triple
  newTriple?: {
    subject: string;
    relation: string;
    object: string;
    realityValue?: number;
    hypotheticality?: number;
  };

  // For CALL: parameters
  parameters?: Record<string, any>;

  // For META_COMPILE: natural language to compile
  utterance?: string;
}

export interface RuleContext {
  speaker: string;
  auditor: string;
  setting: string;
  time: number;
  network: SemanticNetwork;
}

export interface RuleResult {
  triggered: boolean;
  probability: number;
  actions: RuleAction[];
  timestamp: number;
}

export class SimulationClock {
  time: number;

  constructor() {
    this.time = 0;
  }

  tick(): number {
    return ++this.time;
  }

  getTime(): number {
    return this.time;
  }
}

export class MESSY {
  // Klein: "The universe is a semantic network"
  universe: SemanticNetwork;

  // Klein: "Simulation clock"
  clock: SimulationClock;

  // Klein: "Rule groups"
  groups: RuleGroup[];

  // Klein: "Speakers (agents)"
  speakers: Map<string, SpeakerState>;

  // Event log
  events: SimulationEvent[];

  constructor(config: MESSYConfig) {
    this.universe = config.universe || new SemanticNetwork();
    this.clock = new SimulationClock();
    this.groups = config.groups || [];
    this.speakers = new Map();
    this.events = [];
  }

  /**
   * Core simulation tick
   * Klein: "The simulation proceeds by evaluating rules at each time step"
   */
  tick(): SimulationState {
    const currentTime = this.clock.tick();
    const triggeredRules: RuleResult[] = [];

    // Evaluate all enabled rules
    for (const group of this.groups) {
      if (!group.enabled) continue;

      for (const rule of group.rules) {
        if (!rule.enabled) continue;

        // Check if it's time to evaluate this rule
        if (currentTime % rule.frequency !== 0) continue;

        // Evaluate rule
        const result = this.evaluateRule(rule, {
          speaker: '',
          auditor: '',
          setting: 'default',
          time: currentTime,
          network: this.universe
        });

        if (result.triggered) {
          triggeredRules.push(result);

          // Execute actions
          for (const action of result.actions) {
            this.executeAction(action, currentTime);
          }
        }
      }
    }

    // Log events
    this.events.push({
      time: currentTime,
      triggeredRules: triggeredRules.length,
      networkState: this.universe.toJSON()
    });

    return {
      time: currentTime,
      triggeredRules,
      activeTriples: this.countActiveTriples(currentTime),
      networkSize: this.universe.triples.size
    };
  }

  /**
   * Evaluate a single rule
   * Klein: "The probability of a rule is the sum of its subrule weights"
   */
  evaluateRule(rule: SimulationRule, context: RuleContext): RuleResult {
    let probability = rule.probability;
    let allConditionsMet = true;

    // Evaluate subrules
    for (const subrule of rule.subrules) {
      const subruleResult = this.evaluateSubrule(subrule, context);

      if (subrule.operator === 'AND') {
        if (!subruleResult.met) {
          allConditionsMet = false;
          break;
        }
        probability += subrule.weight;
      } else if (subrule.operator === 'OR') {
        if (subruleResult.met) {
          probability += subrule.weight;
          allConditionsMet = true;
        }
      } else if (subrule.operator === 'NOT') {
        if (subruleResult.met) {
          allConditionsMet = false;
          break;
        }
      }
    }

    // Clamp probability
    probability = Math.max(0, Math.min(1, probability));

    // Determine if rule triggers
    const triggered = allConditionsMet && Math.random() < probability;

    return {
      triggered,
      probability,
      actions: triggered ? rule.actionList : [],
      timestamp: context.time
    };
  }

  /**
   * Evaluate a subrule
   * Klein: "Subrules test conditions in the universe"
   */
  evaluateSubrule(subrule: Subrule, context: RuleContext): { met: boolean; weight: number } {
    const test = subrule.test;
    let met = false;

    switch (test.type) {
      case 'path_exists':
        met = this.testPathExists(test, context);
        break;
      case 'node_exists':
        met = this.testNodeExists(test, context);
        break;
      case 'relation_exists':
        met = this.testRelationExists(test, context);
        break;
      case 'value_compare':
        met = this.testValueCompare(test, context);
        break;
      case 'temporal_order':
        met = this.testTemporalOrder(test, context);
        break;
      case 'class_membership':
        met = this.testClassMembership(test, context);
        break;
      case 'custom':
        met = test.customFunction ? test.customFunction(this.universe, context.time) : false;
        break;
    }

    return { met, weight: subrule.weight };
  }

  private testPathExists(test: NetworkTest, context: RuleContext): boolean {
    if (!test.fromNode || !test.toNode) return false;

    const from = this.universe.nodes.get(test.fromNode);
    const to = this.universe.nodes.get(test.toNode);

    if (!from || !to) return false;

    // Find paths
    const paths = this.universe.findPath(
      from,
      to,
      test.throughRelations ? new Set(test.throughRelations) : undefined,
      test.notThroughRelations ? new Set(test.notThroughRelations) : undefined
    );

    return paths.length > 0;
  }

  private testNodeExists(test: NetworkTest, context: RuleContext): boolean {
    if (!test.nodeId) return false;
    const node = this.universe.nodes.get(test.nodeId);
    if (!node) return false;
    if (test.nodeType && node.type !== test.nodeType) return false;
    return true;
  }

  private testRelationExists(test: NetworkTest, context: RuleContext): boolean {
    // Check if any active triple uses this relation
    for (const triple of this.universe.triples.values()) {
      if (triple.isActive(context.time) && triple.relation.id === test.target) {
        return true;
      }
    }
    return false;
  }

  private testValueCompare(test: NetworkTest, context: RuleContext): boolean {
    if (!test.nodeId || !test.attribute || test.value === undefined) return false;

    const node = this.universe.nodes.get(test.nodeId);
    if (!node) return false;

    const value = node.numericalValue || 0;

    switch (test.comparator) {
      case '>': return value > test.value;
      case '<': return value < test.value;
      case '=': return value === test.value;
      case '>=': return value >= test.value;
      case '<=': return value <= test.value;
      default: return false;
    }
  }

  private testTemporalOrder(test: NetworkTest, context: RuleContext): boolean {
    // Check if event A happened before event B
    // (Simplified — would need actual event tracking)
    return true;
  }

  private testClassMembership(test: NetworkTest, context: RuleContext): boolean {
    // Check if node is member of class
    // (Would need class hierarchy tracking)
    return true;
  }

  /**
   * Execute a rule action
   * Klein: "Actions modify the universe"
   */
  executeAction(action: RuleAction, time: number): void {
    switch (action.type) {
      case 'ASSERT':
        if (action.newTriple) {
          const subject = this.universe.nodes.get(action.newTriple.subject);
          const relation = this.universe.relations.get(action.newTriple.relation);
          const object = this.universe.nodes.get(action.newTriple.object);

          if (subject && relation && object) {
            this.universe.assert(subject, relation, object);
          }
        }
        break;

      case 'NEGATE':
        // Mark triple as deleted
        for (const [id, triple] of this.universe.triples) {
          if (triple.id === action.target) {
            this.universe.negate(id);
          }
        }
        break;

      case 'SET':
        // Set node value
        const node = this.universe.nodes.get(action.target);
        if (node && action.value !== undefined) {
          node.numericalValue = action.value;
        }
        break;

      case 'ADD':
        // Add to node value
        const addNode = this.universe.nodes.get(action.target);
        if (addNode && action.value !== undefined) {
          addNode.numericalValue = (addNode.numericalValue || 0) + action.value;
        }
        break;

      case 'REMOVE':
        // Remove node or triple
        this.universe.nodes.delete(action.target);
        break;

      case 'ENABLE':
        // Enable a rule
        for (const group of this.groups) {
          for (const rule of group.rules) {
            if (rule.id === action.target) {
              rule.enabled = true;
            }
          }
        }
        break;

      case 'DISABLE':
        // Disable a rule
        for (const group of this.groups) {
          for (const rule of group.rules) {
            if (rule.id === action.target) {
              rule.enabled = false;
            }
          }
        }
        break;

      case 'CREATE_CLASS':
        // Create a new class node
        const classNode = new SemanticNode(action.target, 'class');
        this.universe.nodes.set(action.target, classNode);
        break;

      case 'MODIFY_CLASS':
        // Modify class membership
        // (Would need class hierarchy implementation)
        break;

      case 'META_COMPILE':
        // Klein's most radical feature: compile natural language to rules
        if (action.utterance) {
          this.metaCompile(action.utterance, action.target);
        }
        break;
    }
  }

  /**
   * META-COMPILING: Klein's most radical innovation
   * 
   * Original (1976): "A mother may say to a child, 'Don't talk to strangers
   * unless someone you know is with you'. This sentence could be analyzed,
   * reformulated, and submitted to a compiler as a behavioral rule."
   * 
   * The system can accept natural language as input, parse it into semantic
   * triples, and convert those triples into simulation rules that then govern
   * behavior.
   * 
   * This is the bridge between natural language and executable behavior.
   */
  metaCompile(utterance: string, speakerId: string): SimulationRule[] {
    // Step 1: Parse utterance into semantic triples
    // (Would use AUTOLING parser)
    const triples = this.parseUtterance(utterance);

    // Step 2: Extract behavioral intent from triples
    const intent = this.extractBehavioralIntent(triples);

    // Step 3: Convert intent to simulation rules
    const rules = this.intentToRules(intent, speakerId);

    // Step 4: Add rules to a group
    const metaGroup = this.groups.find(g => g.name === 'meta_compiled') ||
      this.createGroup('meta_compiled');

    for (const rule of rules) {
      metaGroup.rules.push(rule);
    }

    return rules;
  }

  private parseUtterance(utterance: string): SemanticTriple[] {
    // Placeholder: would use AUTOLING parser
    // For now, create simple triples from key phrases
    const triples: SemanticTriple[] = [];

    // Example: "Don't talk to strangers" → 
    //   (speaker, should_not, talk_to_strangers)
    //   (talk_to_strangers, object, strangers)

    return triples;
  }

  private extractBehavioralIntent(triples: SemanticTriple[]): BehavioralIntent {
    // Analyze triples to extract:
    // - Prohibitions ("don't X")
    // - Permissions ("you may X if Y")
    // - Obligations ("you must X")
    // - Conditions ("unless X", "if Y")

    return {
      type: 'prohibition',
      action: 'talk_to_strangers',
      conditions: ['someone_known_present'],
      exceptions: ['emergency']
    };
  }

  private intentToRules(intent: BehavioralIntent, speakerId: string): SimulationRule[] {
    const rules: SimulationRule[] = [];

    // Convert prohibition to rule
    if (intent.type === 'prohibition') {
      const rule: SimulationRule = {
        id: `prohibition_${Date.now()}`,
        name: `Don't ${intent.action}`,
        actionList: [
          {
            type: 'NEGATE',
            target: intent.action
          }
        ],
        subrules: [
          {
            id: 'check_conditions',
            test: {
              type: 'custom',
              customFunction: (network, time) => {
                // Check if conditions are met (e.g., no one known present)
                // This would check the semantic network
                return true; // Simplified
              }
            },
            weight: 1.0,
            operator: 'AND'
          }
        ],
        probability: 0.9, // High probability of enforcement
        frequency: 1, // Check every tick
        enabled: true,
        createdAt: this.clock.getTime(),
        modifiedAt: this.clock.getTime(),
        createdBy: speakerId
      };

      rules.push(rule);
    }

    // Convert permission to rule
    if (intent.type === 'permission') {
      // Similar structure but with lower probability
    }

    return rules;
  }

  private createGroup(name: string): RuleGroup {
    const group: RuleGroup = {
      id: `group_${Date.now()}`,
      name,
      rules: [],
      enabled: true,
      priority: 0
    };
    this.groups.push(group);
    return group;
  }

  private countActiveTriples(time: number): number {
    let count = 0;
    for (const triple of this.universe.triples.values()) {
      if (triple.isActive(time)) count++;
    }
    return count;
  }

  // Run simulation for N ticks
  run(ticks: number): SimulationState[] {
    const states: SimulationState[] = [];

    for (let i = 0; i < ticks; i++) {
      states.push(this.tick());
    }

    return states;
  }

  // Export simulation trace
  exportTrace(): SimulationTrace {
    return {
      events: this.events,
      finalNetwork: this.universe.toJSON(),
      ruleGroups: this.groups.map(g => ({
        name: g.name,
        ruleCount: g.rules.length,
        enabled: g.enabled
      }))
    };
  }
}

export interface SpeakerState {
  id: string;
  currentLocation: string;
  emotionalState: number; // -10 to +10 (Klein's affective scale)
  activeGoals: string[];
  memory: string[]; // IDs of triples this speaker knows
}

export interface SimulationEvent {
  time: number;
  triggeredRules: number;
  networkState: object;
}

export interface SimulationState {
  time: number;
  triggeredRules: RuleResult[];
  activeTriples: number;
  networkSize: number;
}

export interface SimulationTrace {
  events: SimulationEvent[];
  finalNetwork: object;
  ruleGroups: Array<{ name: string; ruleCount: number; enabled: boolean }>;
}

export interface MESSYConfig {
  universe?: SemanticNetwork;
  groups?: RuleGroup[];
}

export interface BehavioralIntent {
  type: 'prohibition' | 'permission' | 'obligation' | 'suggestion';
  action: string;
  conditions: string[];
  exceptions: string[];
}
