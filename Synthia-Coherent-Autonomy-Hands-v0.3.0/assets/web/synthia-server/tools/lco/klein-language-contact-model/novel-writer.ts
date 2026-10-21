
/**
 * ============================================================
 * AUTOMATIC NOVEL WRITING — Semantic Network Discourse Generation
 * ============================================================
 * 
 * Original (Klein 1973):
 * "2100-word murder mystery stories, complete with semantic deep structure,
 * in less than 19 seconds."
 * 
 * Key mechanism: Surface structure // Semantic network production rules
 * S → NP VP // O-R (Object-Relation mapping)
 * 
 * The system generates stories by:
 * 1. Creating a semantic network (the "universe" of the story)
 * 2. Running simulation rules (character behavior)
 * 3. Mapping resulting events to surface structure via production rules
 * 4. Applying style control (weighted probabilistic grammar)
 * 
 * Modern: Transformer-based generation guided by semantic network constraints,
 * with style transfer and multi-modal output.
 */

import { SemanticNetwork, SemanticNode, SemanticRelation, SemanticTriple } from './semantic-network-core';
import { MESSY, SimulationRule, RuleAction, RuleGroup } from './messy-simulator';
import { AUTOLING, GrammarFramework, StyleProfile } from './autoling-engine';
import { DISEMINER } from './diseminer-engine';

export interface PlotOutline {
  title: string;
  genre: string;
  setting: string;
  characters: Character[];
  acts: Act[];
  themes: string[];
  moral: string;
}

export interface Character {
  id: string;
  name: string;
  role: 'protagonist' | 'antagonist' | 'supporting' | 'foil';
  traits: string[];
  goals: string[];
  fears: string[];
  relationships: Map<string, string>; // character ID -> relationship type
  semanticNode: SemanticNode;
}

export interface Act {
  number: number;
  name: string;
  scenes: Scene[];
  turningPoint: string;
}

export interface Scene {
  id: string;
  setting: string;
  characters: string[]; // Character IDs
  events: StoryEvent[];
  mood: string;
  time: string;
}

export interface StoryEvent {
  id: string;
  type: 'action' | 'dialogue' | 'description' | 'revelation' | 'conflict';
  participants: string[];
  semanticTriple: SemanticTriple;
  surfaceText?: string;
  emotionalImpact: number; // -10 to +10
}

export interface ProductionRule {
  id: string;
  surfaceStructure: string;    // e.g., "S → NP VP"
  semanticForm: string;        // e.g., "O-R" (Object-Relation)
  links: SurfaceSemanticLink[];
  transformations: Transformation[];
  styleWeights: Map<string, number>;
}

export interface SurfaceSemanticLink {
  surfaceElement: string;      // e.g., "NP"
  semanticRole: string;        // e.g., "Agent"
  mapping: string;             // How to map between them
}

export interface Transformation {
  name: string;
  condition: (context: GenerationContext) => boolean;
  apply: (text: string, context: GenerationContext) => string;
}

export interface GenerationContext {
  scene: Scene;
  character: Character;
  mood: string;
  previousEvents: StoryEvent[];
  style: StyleProfile;
  network: SemanticNetwork;
}

export class NovelWriter {
  // Klein: "The semantic network represents the universe of the story"
  universe: SemanticNetwork;

  // Klein: "Simulation rules govern character behavior"
  messy: MESSY;

  // Klein: "Production rules map surface structure to semantic network"
  productionRules: ProductionRule[];

  // Modern: Grammar engine for surface generation
  autoling: AUTOLING;

  // Modern: DISEMINER for semantic enrichment
  diseminer: DISEMINER;

  // Style controller
  styleController: StyleController;

  constructor(config: NovelWriterConfig) {
    this.universe = config.universe || new SemanticNetwork();
    this.messy = config.messy || new MESSY({});
    this.autoling = config.autoling || new AUTOLING();
    this.diseminer = config.diseminer || new DISEMINER();
    this.styleController = new StyleController();
    this.productionRules = this.initializeProductionRules();
  }

  /**
   * Generate a complete story
   * Klein: "2100-word murder mystery in less than 19 seconds"
   */
  async generateStory(config: StoryConfig): Promise<string> {
    const startTime = Date.now();

    // 1. Generate plot outline
    const plot = this.generatePlot(config);

    // 2. Build semantic network for the story universe
    this.buildStoryUniverse(plot);

    // 3. Run simulation to generate events
    const events = this.simulateEvents(plot);

    // 4. Map events to discourse via production rules
    const discourse = this.generateDiscourse(events, plot, config.style);

    // 5. Apply style control
    const styled = this.styleController.apply(discourse, config.style);

    const elapsed = Date.now() - startTime;
    console.log(`Generated ${styled.split(/\s+/).length} words in ${elapsed}ms`);

    return styled;
  }

  /**
   * Generate plot outline
   * Klein: "The plot is a sequence of events in the semantic network"
   */
  generatePlot(config: StoryConfig): PlotOutline {
    const characters = this.createCharacters(config);
    const acts = this.structureActs(config, characters);

    return {
      title: config.title || 'Untitled',
      genre: config.genre || 'general',
      setting: config.setting || 'unknown',
      characters,
      acts,
      themes: config.themes || [],
      moral: config.moral || ''
    };
  }

  private createCharacters(config: StoryConfig): Character[] {
    const characters: Character[] = [];

    for (const charConfig of config.characters || []) {
      const node = new SemanticNode(charConfig.id, 'atom');
      node.numericalValue = 0; // Neutral affective state

      characters.push({
        id: charConfig.id,
        name: charConfig.name,
        role: charConfig.role || 'supporting',
        traits: charConfig.traits || [],
        goals: charConfig.goals || [],
        fears: charConfig.fears || [],
        relationships: new Map(),
        semanticNode: node
      });
    }

    return characters;
  }

  private structureActs(config: StoryConfig, characters: Character[]): Act[] {
    // Classic 3-act structure (or other based on genre)
    const acts: Act[] = [];

    // Act 1: Setup
    acts.push({
      number: 1,
      name: 'Setup',
      scenes: this.createScenes('setup', characters, config),
      turningPoint: 'Inciting incident'
    });

    // Act 2: Confrontation
    acts.push({
      number: 2,
      name: 'Confrontation',
      scenes: this.createScenes('confrontation', characters, config),
      turningPoint: 'Crisis'
    });

    // Act 3: Resolution
    acts.push({
      number: 3,
      name: 'Resolution',
      scenes: this.createScenes('resolution', characters, config),
      turningPoint: 'Climax'
    });

    return acts;
  }

  private createScenes(phase: string, characters: Character[], config: StoryConfig): Scene[] {
    const scenes: Scene[] = [];

    // Create scenes based on genre conventions
    if (config.genre === 'murder_mystery') {
      if (phase === 'setup') {
        scenes.push({
          id: 'scene_1',
          setting: 'drawing_room',
          characters: characters.map(c => c.id),
          events: [],
          mood: 'tense',
          time: 'evening'
        });
      }
    }

    return scenes;
  }

  /**
   * Build semantic network for story universe
   * Klein: "The universe is a semantic network of objects and relations"
   */
  private buildStoryUniverse(plot: PlotOutline): void {
    // Add characters as nodes
    for (const character of plot.characters) {
      this.universe.nodes.set(character.id, character.semanticNode);
    }

    // Add setting as nodes
    const settingNode = new SemanticNode('setting', 'atom');
    this.universe.nodes.set('setting', settingNode);

    // Add relations between characters
    const relation = new SemanticRelation('knows', { type: 'subject_governor', governor: '', dependent: '', relation: 'acquaintance' });
    this.universe.relations.set('knows', relation);

    for (let i = 0; i < plot.characters.length; i++) {
      for (let j = i + 1; j < plot.characters.length; j++) {
        this.universe.assert(
          plot.characters[i].semanticNode,
          relation,
          plot.characters[j].semanticNode
        );
      }
    }
  }

  /**
   * Simulate events using MESSY rules
   * Klein: "Simulation rules govern character behavior"
   */
  private simulateEvents(plot: PlotOutline): StoryEvent[] {
    const events: StoryEvent[] = [];

    // Create behavioral rules for each character
    for (const character of plot.characters) {
      const rules = this.createCharacterRules(character, plot);
      const group: RuleGroup = {
        id: `group_${character.id}`,
        name: character.name,
        rules,
        enabled: true,
        priority: 1
      };
      this.messy.groups.push(group);
    }

    // Run simulation
    const states = this.messy.run(100); // 100 ticks

    // Extract events from simulation trace
    for (const state of states) {
      for (const ruleResult of state.triggeredRules) {
        for (const action of ruleResult.actions) {
          if (action.type === 'ASSERT' && action.newTriple) {
            events.push({
              id: `event_${events.length}`,
              type: 'action',
              participants: [action.newTriple.subject, action.newTriple.object],
              semanticTriple: this.universe.triples.get(`${action.newTriple.subject}-knows-${action.newTriple.object}@${this.universe.clock}`)!,
              emotionalImpact: 0
            });
          }
        }
      }
    }

    return events;
  }

  private createCharacterRules(character: Character, plot: PlotOutline): SimulationRule[] {
    const rules: SimulationRule[] = [];

    // Goal-seeking rules
    for (const goal of character.goals) {
      rules.push({
        id: `goal_${goal}_${character.id}`,
        name: `${character.name} seeks ${goal}`,
        actionList: [
          {
            type: 'ASSERT',
            target: goal,
            newTriple: {
              subject: character.id,
              relation: 'seeks',
              object: goal
            }
          }
        ],
        subrules: [
          {
            id: 'goal_not_achieved',
            test: {
              type: 'custom',
              customFunction: () => true // Simplified
            },
            weight: 0.8,
            operator: 'AND'
          }
        ],
        probability: 0.7,
        frequency: 5,
        enabled: true,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      });
    }

    // Fear-avoidance rules
    for (const fear of character.fears) {
      rules.push({
        id: `fear_${fear}_${character.id}`,
        name: `${character.name} avoids ${fear}`,
        actionList: [
          {
            type: 'NEGATE',
            target: fear
          }
        ],
        subrules: [
          {
            id: 'fear_present',
            test: {
              type: 'custom',
              customFunction: () => Math.random() < 0.3
            },
            weight: 0.9,
            operator: 'AND'
          }
        ],
        probability: 0.8,
        frequency: 3,
        enabled: true,
        createdAt: Date.now(),
        modifiedAt: Date.now()
      });
    }

    return rules;
  }

  /**
   * Generate discourse from events
   * Klein: "Production rules map surface structure to semantic network"
   */
  private generateDiscourse(events: StoryEvent[], plot: PlotOutline, style: StyleProfile): string {
    const paragraphs: string[] = [];

    // Opening
    paragraphs.push(this.generateOpening(plot, style));

    // Events
    for (const event of events) {
      const text = this.eventToText(event, plot, style);
      if (text) paragraphs.push(text);
    }

    // Closing
    paragraphs.push(this.generateClosing(plot, style));

    return paragraphs.join('\n\n');
  }

  private generateOpening(plot: PlotOutline, style: StyleProfile): string {
    const characterNames = plot.characters.map(c => c.name).join(', ');
    return `It was a ${plot.setting} evening. ${characterNames} had gathered, each with their own secrets and desires. None could have predicted what would unfold.`;
  }

  private generateClosing(plot: PlotOutline, style: StyleProfile): string {
    return `And so the ${plot.genre} came to its inevitable conclusion. ${plot.moral}`;
  }

  private eventToText(event: StoryEvent, plot: PlotOutline, style: StyleProfile): string {
    // Map semantic triple to surface text via production rules
    const triple = event.semanticTriple;

    // Find matching production rule
    const rule = this.productionRules.find(r => 
      r.semanticForm === `${triple.subject.id}-${triple.relation.id}-${triple.object.id}`
    );

    if (rule) {
      // Apply production rule
      return this.applyProductionRule(rule, event, plot);
    }

    // Default: simple statement
    return `${triple.subject.id} ${triple.relation.id} ${triple.object.id}.`;
  }

  private applyProductionRule(rule: ProductionRule, event: StoryEvent, plot: PlotOutline): string {
    // Map semantic elements to surface elements
    let text = rule.surfaceStructure;

    for (const link of rule.links) {
      // Replace semantic roles with surface elements
      const semanticValue = this.getSemanticValue(link.semanticRole, event, plot);
      text = text.replace(link.surfaceElement, semanticValue);
    }

    return text;
  }

  private getSemanticValue(role: string, event: StoryEvent, plot: PlotOutline): string {
    const triple = event.semanticTriple;

    switch (role) {
      case 'Agent':
        return plot.characters.find(c => c.id === triple.subject.id)?.name || triple.subject.id;
      case 'Patient':
        return plot.characters.find(c => c.id === triple.object.id)?.name || triple.object.id;
      case 'Action':
        return triple.relation.id;
      default:
        return '';
    }
  }

  /**
   * Style Control (Klein 1965)
   * "Weighted probabilistic grammar for stylistic mimicry"
   */
  applyStyle(text: string, sourceStyle: StyleProfile, targetStyle: StyleProfile): string {
    return this.styleController.transfer(text, sourceStyle, targetStyle);
  }

  private initializeProductionRules(): ProductionRule[] {
    return [
      {
        id: 'SVO',
        surfaceStructure: 'NP VP',
        semanticForm: 'Agent-Action-Patient',
        links: [
          { surfaceElement: 'NP', semanticRole: 'Agent', mapping: 'subject' },
          { surfaceElement: 'VP', semanticRole: 'Action', mapping: 'predicate' }
        ],
        transformations: [],
        styleWeights: new Map()
      }
    ];
  }
}

export class StyleController {
  /**
   * Apply style transfer
   * Klein: "The frequency of application of each rule is a parameter
   * that can be adjusted to produce different styles"
   */
  apply(text: string, style: StyleProfile): string {
    // Adjust sentence length
    const sentences = text.split(/(?<=[.!?])\s+/);
    const adjusted = sentences.map(s => this.adjustSentenceLength(s, style));

    // Adjust vocabulary
    const vocabAdjusted = adjusted.map(s => this.adjustVocabulary(s, style));

    // Adjust pronoun frequency
    const pronounAdjusted = vocabAdjusted.map(s => this.adjustPronouns(s, style));

    return pronounAdjusted.join(' ');
  }

  transfer(text: string, sourceStyle: StyleProfile, targetStyle: StyleProfile): string {
    // Compute style difference
    const lengthDiff = targetStyle.sentenceLength.mean - sourceStyle.sentenceLength.mean;
    const vocabDiff = this.computeVocabDifference(sourceStyle, targetStyle);

    // Apply transformations
    let transformed = text;

    // Adjust sentence length
    if (lengthDiff > 0) {
      transformed = this.expandSentences(transformed, lengthDiff);
    } else if (lengthDiff < 0) {
      transformed = this.contractSentences(transformed, -lengthDiff);
    }

    // Adjust vocabulary
    transformed = this.transferVocabulary(transformed, vocabDiff);

    return transformed;
  }

  private adjustSentenceLength(sentence: string, style: StyleProfile): string {
    const words = sentence.split(/\s+/);
    const currentLength = words.length;

    if (currentLength < style.sentenceLength.min) {
      // Expand
      return sentence + ' ' + this.generateFiller(style.sentenceLength.min - currentLength);
    } else if (currentLength > style.sentenceLength.max) {
      // Contract
      return words.slice(0, style.sentenceLength.max).join(' ') + '.';
    }

    return sentence;
  }

  private adjustVocabulary(sentence: string, style: StyleProfile): string {
    // Replace words based on style bias
    const words = sentence.split(/\s+/);
    return words.map(w => {
      const bias = style.vocabularyBias.get(w.toLowerCase());
      if (bias && bias < 0.3) {
        // Replace with preferred synonym
        return this.findSynonym(w, style);
      }
      return w;
    }).join(' ');
  }

  private adjustPronouns(sentence: string, style: StyleProfile): string {
    // Adjust pronoun frequency
    const pronouns = ['he', 'she', 'it', 'they', 'him', 'her', 'them'];
    const words = sentence.split(/\s+/);
    const pronounCount = words.filter(w => pronouns.includes(w.toLowerCase())).length;
    const pronounRatio = pronounCount / words.length;

    if (pronounRatio < style.pronounFrequency) {
      // Add pronouns
      return this.addPronouns(sentence, style.pronounFrequency - pronounRatio);
    } else if (pronounRatio > style.pronounFrequency) {
      // Remove pronouns
      return this.removePronouns(sentence, pronounRatio - style.pronounFrequency);
    }

    return sentence;
  }

  private generateFiller(count: number): string {
    const fillers = ['indeed', 'certainly', 'without doubt', 'in fact', 'truly'];
    return fillers.slice(0, count).join(' ');
  }

  private findSynonym(word: string, style: StyleProfile): string {
    // Would use thesaurus/embedding lookup
    return word;
  }

  private addPronouns(text: string, ratio: number): string {
    return text; // Simplified
  }

  private removePronouns(text: string, ratio: number): string {
    return text; // Simplified
  }

  private expandSentences(text: string, diff: number): string {
    return text; // Simplified
  }

  private contractSentences(text: string, diff: number): string {
    return text; // Simplified
  }

  private transferVocabulary(text: string, diff: Map<string, number>): string {
    return text; // Simplified
  }

  private computeVocabDifference(source: StyleProfile, target: StyleProfile): Map<string, number> {
    const diff = new Map<string, number>();

    for (const [word, targetWeight] of target.vocabularyBias) {
      const sourceWeight = source.vocabularyBias.get(word) || 0.5;
      diff.set(word, targetWeight - sourceWeight);
    }

    return diff;
  }
}

export interface NovelWriterConfig {
  universe?: SemanticNetwork;
  messy?: MESSY;
  autoling?: AUTOLING;
  diseminer?: DISEMINER;
}

export interface StoryConfig {
  title?: string;
  genre: string;
  setting: string;
  characters: Array<{
    id: string;
    name: string;
    role?: 'protagonist' | 'antagonist' | 'supporting' | 'foil';
    traits?: string[];
    goals?: string[];
    fears?: string[];
  }>;
  themes?: string[];
  moral?: string;
  style: StyleProfile;
  length: number; // Target word count
}
