
/**
 * Transduction Engine: Pattern Recognition Compiler Output Layer
 * 
 * Maps locked gate states to 5 output modalities:
 * 1. Story (Narrative archetypes)
 * 2. Code (Functional blocks)
 * 3. Image (Visual composition descriptors)
 * 4. Video (Scene sequence descriptors)
 * 5. Game (Interactive mechanics)
 * 
 * Each gate activation triggers a specific transduction rule
 * that compiles the resonance state into the target language.
 */

import { MeshAddressingSystem, MeshAddress, HEXAGRAM_MAP } from './mesh-addressing-system';
import { InterrogationManifest } from './wh-interrogative-core';

export type OutputModality = 'story' | 'code' | 'image' | 'video' | 'game';

export interface TransductionRule {
  gateId: number;
  modality: OutputModality;
  template: string;
  parameters: Record<string, string>;
  requiredDimensions: number[];
}

export interface CompiledArtifact {
  modality: OutputModality;
  gateId: number;
  gateName: string;
  hexagram: string;
  dimension: string;
  content: string;
  metadata: {
    confidence: number;
    resonanceField: Map<number, number>;
    lines: number[];
    colors: string[];
    tones: string[];
  };
}

// Gate names from Human Design
const GATE_NAMES: Record<number, string> = {
  1: 'The Creative', 2: 'The Receptive', 3: 'Difficulty at the Beginning',
  4: 'Youthful Folly', 5: 'Waiting', 6: 'Conflict', 7: 'The Army',
  8: 'Holding Together', 9: 'The Taming Power of the Small', 10: 'Treading',
  11: 'Peace', 12: 'Standstill', 13: 'Fellowship', 14: 'Possession in Great Measure',
  15: 'Modesty', 16: 'Enthusiasm', 17: 'Following', 18: 'Work on What Has Been Spoiled',
  19: 'Approach', 20: 'Contemplation', 21: 'Biting Through', 22: 'Grace',
  23: 'Splitting Apart', 24: 'Return', 25: 'Innocence', 26: 'The Taming Power of the Great',
  27: 'The Corners of the Mouth', 28: 'Preponderance of the Great', 29: 'The Abysmal',
  30: 'The Clinging Fire', 31: 'Influence', 32: 'Duration', 33: 'Retreat',
  34: 'The Power of the Great', 35: 'Progress', 36: 'Darkening of the Light',
  37: 'The Family', 38: 'Opposition', 39: 'Obstruction', 40: 'Deliverance',
  41: 'Decrease', 42: 'Increase', 43: 'Breakthrough', 44: 'Coming to Meet',
  45: 'Gathering Together', 46: 'Pushing Upward', 47: 'Oppression', 48: 'The Well',
  49: 'Revolution', 50: 'The Cauldron', 51: 'The Arousing', 52: 'Keeping Still',
  53: 'Development', 54: 'The Marrying Maiden', 55: 'Abundance', 56: 'The Wanderer',
  57: 'The Gentle', 58: 'The Joyous', 59: 'Dispersion', 60: 'Limitation',
  61: 'Inner Truth', 62: 'Preponderance of the Small', 63: 'After Completion',
  64: 'Before Completion'
};

// Color mapping
const COLOR_NAMES = ['Fear', 'Hope', 'Desire', 'Pain', 'Guilt', 'Anger'];
const TONE_NAMES = ['Passive', 'Neutral', 'Active', 'Reactive', 'Obsessive', 'Projected'];

// Story archetypes per gate
const STORY_ARCHETYPES: Record<number, string> = {
  1: 'The Creator awakens. A new form emerges from the void, carrying the spark of originality.',
  2: 'The Receptive opens. What was resisted now flows through, guided by the magnetic pull of acceptance.',
  3: 'Chaos births order. The struggle of beginnings forges the pattern that will endure.',
  4: 'The student stumbles. Through error and confusion, the seed of understanding takes root.',
  5: 'Patience becomes power. In the waiting, the pattern crystallizes.',
  6: 'Conflict reveals truth. The clash of forces exposes what was hidden.',
  7: 'The collective moves. Leadership emerges not from command but from the rhythm of the group.',
  8: 'Union transforms. What binds together becomes stronger than the sum.',
  9: 'Small forces accumulate. The gentle persistence that moves mountains.',
  10: 'The path is walked. Each step a choice, each choice a destiny.',
  11: 'Harmony arrives. The peace that follows the storm of becoming.',
  12: 'Stillness speaks. In the pause, the pattern reorganizes itself.',
  13: 'The fellowship forms. Souls recognize each other across the distance.',
  14: 'Wealth of spirit. The abundance that comes from aligned purpose.',
  15: 'Humility opens doors. The modest heart finds what the proud eye misses.',
  16: 'Enthusiasm ignites. The spark that leaps from soul to soul.',
  17: 'Following the flow. The wisdom of knowing when to lead and when to follow.',
  18: 'Repair and renewal. The work of healing what time has worn.',
  19: 'Approach with care. The moment before contact, charged with potential.',
  20: 'Contemplation deepens. The witness observes without intervening.',
  21: 'Biting through. The determination that breaks through resistance.',
  22: 'Grace descends. Beauty that transforms without force.',
  23: 'Splitting apart. The necessary dissolution that makes space for the new.',
  24: 'Return. The cycle completes, and the beginning is recognized in the end.',
  25: 'Innocence restored. The purity that survives every test.',
  26: 'The great taming. Power channeled through discipline becomes art.',
  27: 'Nourishment. The corners of the mouth receive what sustains.',
  28: 'Preponderance of the great. The weight that shapes the world.',
  29: 'The abyss. Depth that reveals what surface cannot hold.',
  30: 'The clinging fire. Desire that illuminates and consumes.',
  31: 'Influence spreads. The ripple that becomes the wave.',
  32: 'Duration endures. The pattern that outlasts the noise.',
  33: 'Retreat. The wisdom of knowing when to withdraw.',
  34: 'The power of the great. Strength that serves rather than dominates.',
  35: 'Progress. The forward movement that carries all with it.',
  36: 'Darkening of the light. The shadow that teaches the value of illumination.',
  37: 'The family. The bonds that shape and are shaped by love.',
  38: 'Opposition. The tension that creates the spark of new understanding.',
  39: 'Obstruction. The barrier that forces the discovery of new paths.',
  40: 'Deliverance. The release that comes when the pattern breaks.',
  41: 'Decrease. The letting go that makes room for increase.',
  42: 'Increase. The growth that comes from aligned effort.',
  43: 'Breakthrough. The moment when the dam breaks and the flood flows.',
  44: 'Coming to meet. The encounter that changes everything.',
  45: 'Gathering together. The collective that becomes more than the sum.',
  46: 'Pushing upward. The ascent that comes from persistent effort.',
  47: 'Oppression. The weight that tests the resilience of the spirit.',
  48: 'The well. The source that never runs dry.',
  49: 'Revolution. The transformation that sweeps away the old.',
  50: 'The cauldron. The vessel that transforms raw into refined.',
  51: 'The arousing. The shock that awakens from sleep.',
  52: 'Keeping still. The mountain that teaches the value of pause.',
  53: 'Development. The gradual growth that builds what sudden force cannot.',
  54: 'The marrying maiden. The union that transforms both parties.',
  55: 'Abundance. The fullness that comes from aligned generosity.',
  56: 'The wanderer. The journey that becomes the destination.',
  57: 'The gentle. The wind that shapes stone through persistence.',
  58: 'The joyous. The lake that reflects the sky in its depths.',
  59: 'Dispersion. The scattering that makes room for new gathering.',
  60: 'Limitation. The boundary that gives form to the infinite.',
  61: 'Inner truth. The certainty that needs no external validation.',
  62: 'Preponderance of the small. The detail that holds the whole together.',
  63: 'After completion. The rest that comes when the work is done.',
  64: 'Before completion. The threshold where all potential lives.'
};

// Code templates per gate
const CODE_TEMPLATES: Record<number, string> = {
  1: `function create(seed) { return new Form(seed); }`,
  2: `function receive(signal) { return this.buffer.push(signal); }`,
  3: `function resolve(chaos) { return Pattern.from(chaos).stabilize(); }`,
  4: `function learn(error) { return this.knowledge.absorb(error); }`,
  5: `function wait(condition) { return this.patience.until(condition); }`,
  6: `function confront(opposition) { return Truth.from(opposition); }`,
  7: `function lead(group) { return group.harmonize(this.rhythm); }`,
  8: `function bind(entities) { return Union.of(entities); }`,
  9: `function accumulate(force) { return Force.sum(force); }`,
  10: `function step(direction) { return Path.walk(direction); }`,
  11: `function harmonize() { return Peace.emerge(); }`,
  12: `function pause() { return Stillness.observe(); }`,
  13: `function fellowship(souls) { return Circle.form(souls); }`,
  14: `function abundance() { return Wealth.of(this.purpose); }`,
  15: `function humble() { return Modesty.open(this.vision); }`,
  16: `function ignite(spark) { return Enthusiasm.spread(spark); }`,
  17: `function follow(flow) { return Flow.align(this, flow); }`,
  18: `function repair(damage) { return Healing.restore(damage); }`,
  19: `function approach(target) { return Contact.prepare(this, target); }`,
  20: `function witness(event) { return Observer.record(event); }`,
  21: `function bite(resistance) { return Determination.break(resistance); }`,
  22: `function grace(surface) { return Beauty.transform(surface); }`,
  23: `function split(structure) { return Dissolution.create(structure); }`,
  24: `function return() { return Cycle.complete(); }`,
  25: `function purify() { return Innocence.restore(); }`,
  26: `function tame(power) { return Discipline.channel(power); }`,
  27: `function nourish() { return Sustenance.receive(); }`,
  28: `function bear(weight) { return Strength.carry(weight); }`,
  29: `function descend() { return Depth.reveal(); }`,
  30: `function desire() { return Fire.cling(); }`,
  31: `function influence(field) { return Ripple.spread(field); }`,
  32: `function endure() { return Duration.persist(); }`,
  33: `function retreat() { return Withdrawal.wisdom(); }`,
  34: `function empower() { return Strength.serve(); }`,
  35: `function progress() { return Forward.move(); }`,
  36: `function shadow() { return Darkness.teach(); }`,
  37: `function family() { return Bond.shape(); }`,
  38: `function oppose() { return Tension.spark(); }`,
  39: `function obstruct() { return Barrier.redirect(); }`,
  40: `function deliver() { return Release.break(); }`,
  41: `function decrease() { return Letting.go(); }`,
  42: `function increase() { return Growth.align(); }`,
  43: `function breakthrough() { return Dam.break(); }`,
  44: `function meet() { return Encounter.transform(); }`,
  45: `function gather() { return Collective.form(); }`,
  46: `function ascend() { return Climb.persist(); }`,
  47: `function oppress() { return Weight.test(); }`,
  48: `function source() { return Well.draw(); }`,
  49: `function revolution() { return Transform.sweep(); }`,
  50: `function refine() { return Cauldron.transform(); }`,
  51: `function shock() { return Awaken.jolt(); }`,
  52: `function still() { return Mountain.pause(); }`,
  53: `function develop() { return Gradual.build(); }`,
  54: `function marry() { return Union.transform(); }`,
  55: `function abound() { return Fullness.give(); }`,
  56: `function wander() { return Journey.become(); }`,
  57: `function gentle() { return Wind.shape(); }`,
  58: `function joy() { return Lake.reflect(); }`,
  59: `function disperse() { return Scatter.make(); }`,
  60: `function limit() { return Boundary.form(); }`,
  61: `function truth() { return Certainty.inner(); }`,
  62: `function detail() { return Small.hold(); }`,
  63: `function complete() { return Work.rest(); }`,
  64: `function begin() { return Threshold.potential(); }`
};

// Image composition descriptors
const IMAGE_TEMPLATES: Record<number, string> = {
  1: 'A single point of light emerging from absolute darkness, radiating six primary rays in a hexagonal pattern.',
  2: 'An open vessel receiving a stream of liquid light, the surface perfectly still and reflective.',
  3: 'Chaotic lines intersecting and resolving into a spiral pattern, colors shifting from red to gold.',
  4: 'A young tree growing through cracked stone, roots visible and reaching downward.',
  5: 'A figure standing at the edge of a vast plain, watching clouds gather on the horizon.',
  6: 'Two rivers meeting at a sharp angle, their waters different colors, creating a visible line of tension.',
  7: 'A formation of birds in flight, moving as a single organism against a twilight sky.',
  8: 'Interlocking geometric shapes forming a stable structure, each piece a different translucent color.',
  9: 'Small particles of light accumulating into a visible stream, like dust motes in a sunbeam.',
  10: 'A single footprint in wet sand, with the tide approaching but not yet reaching it.',
  11: 'A landscape of perfect balance: equal parts mountain and valley, light and shadow.',
  12: 'A frozen moment: a drop of water suspended in air, perfectly spherical and reflecting the world.',
  13: 'Three circles overlapping to form a vesica piscis at the center, each circle a different hue.',
  14: 'A cornucopia overflowing with geometric forms rather than fruit, each form glowing.',
  15: 'A low horizon line with a vast sky above, the colors muted and soft, suggesting humility.',
  16: 'A flame that splits into multiple smaller flames, each moving in a different direction.',
  17: 'A path winding through a forest, with footprints visible but the traveler out of sight.',
  18: 'A broken ceramic vessel being repaired with gold, the cracks visible and beautiful.',
  19: 'A hand reaching toward another hand, fingertips almost touching, with light between them.',
  20: 'An eye reflected in a still pool, the reflection clearer than the eye itself.',
  21: 'Teeth marks in a solid metal surface, the indentation precise and deliberate.',
  22: 'A surface covered in delicate frost patterns, each crystal unique and interconnected.',
  23: 'A wall with a single brick removed, light streaming through the gap.',
  24: 'A spiral that returns to its starting point but at a different depth, creating a helix.',
  25: 'A white flower growing in a dark environment, its petals glowing softly.',
  26: 'A wild river being channeled into a series of pools, each pool perfectly circular.',
  27: 'An open mouth receiving nourishment from above, the food depicted as light.',
  28: 'A massive structure balanced on a single point, the weight creating visible stress lines.',
  29: 'A deep well with water visible at the bottom, the walls reflecting the sky above.',
  30: 'A flame that clings to a surface, the surface itself becoming part of the fire.',
  31: 'A stone dropped in water, the ripples extending outward in perfect concentric circles.',
  32: 'A tree with visible rings, each ring a different color representing different eras.',
  33: 'A figure walking away from a burning city, the figure small against the flames.',
  34: 'A mountain being moved by a single persistent stream of water, erosion visible.',
  35: 'A sunrise over a landscape, the light moving visibly across the terrain.',
  36: 'A candle in a dark room, the flame small but the shadows it casts are enormous.',
  37: 'A house with light in every window, each window a different warm color.',
  38: 'Two mirrors facing each other, creating an infinite regression of reflections.',
  39: 'A river blocked by a dam, the water rising and finding a new path around the obstacle.',
  40: 'A chain breaking, the links separating and each link becoming a different element.',
  41: 'A vessel being emptied, the contents flowing out and becoming part of the landscape.',
  42: 'A seed germinating, the roots and shoot visible in cross-section.',
  43: 'A dam breaking, the water rushing through in a single powerful surge.',
  44: 'Two paths crossing at a point that glows, the intersection brighter than the paths.',
  45: 'A circle of figures holding hands, each figure a different color, the center empty.',
  46: 'A staircase ascending into clouds, each step a different material.',
  47: 'A figure under a heavy weight, the weight depicted as a geometric solid.',
  48: 'A well with a bucket, the bucket reflecting the sky even though it is underground.',
  49: 'A landscape being transformed, half the image old and half new, the boundary sharp.',
  50: 'A cauldron over fire, the contents visible through the translucent metal.',
  51: 'A lightning bolt striking a tower, the tower cracking but not falling.',
  52: 'A mountain perfectly still, with a single bird circling it in a perfect orbit.',
  53: 'A tree growing in stages, each stage visible simultaneously in a composite image.',
  54: 'Two figures becoming one, the transition depicted as a gradient of forms.',
  55: 'A field of flowers in full bloom, each flower a different size and color.',
  56: 'A figure walking on a road that extends to the horizon, the road changing material.',
  57: 'Wind shaping sand into a pattern that resembles a written language.',
  58: 'A lake reflecting a perfect sky, the reflection more vivid than the sky itself.',
  59: 'Particles dispersing from a central point, each particle a different color and speed.',
  60: 'A frame around an infinite space, the frame decorated with repeating patterns.',
  61: 'A heart visible through transparent skin, the heart glowing with its own light.',
  62: 'A structure held together by a single small detail, the detail highlighted.',
  63: 'A completed puzzle with one piece missing, the missing piece visible nearby.',
  64: 'A threshold with light on one side and darkness on the other, a foot on the threshold.'
};

// Video scene sequences
const VIDEO_TEMPLATES: Record<number, string[]> = {
  1: ['Dark frame', 'Point of light appears', 'Light expands radially', 'Six rays emerge', 'Full illumination'],
  2: ['Empty vessel', 'Stream approaches', 'Liquid enters', 'Surface stills', 'Reflection stabilizes'],
  3: ['Chaos of lines', 'Intersections multiply', 'Pattern emerges', 'Spiral forms', 'Order from chaos'],
  4: ['Cracked stone', 'Seed appears', 'Root growth', 'Shoot emerges', 'Tree established'],
  5: ['Figure at edge', 'Clouds gather', 'Waiting posture', 'Horizon shifts', 'Movement begins'],
  6: ['Two rivers', 'Approach', 'Meeting point', 'Tension visible', 'Resolution or divergence'],
  7: ['Single bird', 'Others join', 'Formation emerges', 'Synchronized flight', 'Collective movement'],
  8: ['Scattered pieces', 'Approach', 'Interlock', 'Structure forms', 'Stability achieved'],
  9: ['Empty space', 'Particles appear', 'Accumulation', 'Stream forms', 'Visible flow'],
  10: ['Wet sand', 'Foot approaches', 'Impression', 'Tide approaches', 'Moment held'],
  11: ['Uneven landscape', 'Adjustment', 'Balance emerges', 'Harmony', 'Stable state'],
  12: ['Motion', 'Freeze frame', 'Suspended drop', 'Reflection', 'Stillness'],
  13: ['Single circle', 'Second overlaps', 'Third completes', 'Vesica piscis', 'Unity'],
  14: ['Empty cornucopia', 'Forms appear', 'Overflow begins', 'Abundance', 'Generosity'],
  15: ['High horizon', 'Lowering', 'Vast sky', 'Muted colors', 'Humility'],
  16: ['Single flame', 'Split', 'Multiple flames', 'Spread', 'Enthusiasm'],
  17: ['Forest path', 'Footprints appear', 'Path winds', 'Traveler out of frame', 'Following'],
  18: ['Broken vessel', 'Gold appears', 'Repair begins', 'Cracks visible', 'Beauty in repair'],
  19: ['Two hands', 'Approach', 'Almost touch', 'Light between', 'Connection'],
  20: ['Eye', 'Pool', 'Reflection', 'Clarity', 'Witness'],
  21: ['Solid surface', 'Approach', 'Bite mark', 'Indentation', 'Determination'],
  22: ['Plain surface', 'Frost spreads', 'Patterns form', 'Crystals', 'Grace'],
  23: ['Solid wall', 'Brick loosens', 'Removal', 'Light streams', 'Opening'],
  24: ['Spiral begins', 'Journey', 'Return point', 'Different depth', 'Cycle complete'],
  25: ['Dark environment', 'Seed appears', 'Growth', 'White flower', 'Innocence'],
  26: ['Wild river', 'Channeling', 'Pools form', 'Circularity', 'Discipline'],
  27: ['Open mouth', 'Nourishment descends', 'Receiving', 'Sustenance', 'Nourishment'],
  28: ['Structure', 'Single point', 'Balance', 'Stress lines', 'Weight borne'],
  29: ['Deep well', 'Water visible', 'Reflection', 'Depth', 'Source'],
  30: ['Surface', 'Flame approaches', 'Clinging', 'Surface transforms', 'Fire'],
  31: ['Still water', 'Stone drops', 'Ripple', 'Concentric circles', 'Influence'],
  32: ['Tree cross-section', 'Rings visible', 'Different colors', 'Time layers', 'Duration'],
  33: ['Burning city', 'Figure appears', 'Walking away', 'Small against flames', 'Retreat'],
  34: ['Mountain', 'Stream appears', 'Persistence', 'Erosion', 'Power'],
  35: ['Dark landscape', 'Sunrise', 'Light spreads', 'Terrain revealed', 'Progress'],
  36: ['Dark room', 'Candle lit', 'Flame small', 'Shadows grow', 'Illumination'],
  37: ['House', 'Windows light', 'Different colors', 'Warmth', 'Family'],
  38: ['Single mirror', 'Second appears', 'Facing', 'Infinite regression', 'Opposition'],
  39: ['Flowing river', 'Dam appears', 'Blockage', 'Water rises', 'New path'],
  40: ['Chain', 'Tension', 'Breaking point', 'Separation', 'Deliverance'],
  41: ['Full vessel', 'Emptying', 'Contents flow', 'Landscape absorbs', 'Decrease'],
  42: ['Seed', 'Germination', 'Roots', 'Shoot', 'Increase'],
  43: ['Dam', 'Pressure builds', 'Crack', 'Break', 'Flood'],
  44: ['Two paths', 'Approach', 'Crossing', 'Glow at intersection', 'Meeting'],
  45: ['Scattered figures', 'Approach', 'Circle forms', 'Holding hands', 'Gathering'],
  46: ['Base', 'Staircase', 'Ascending', 'Clouds', 'Upward'],
  47: ['Figure', 'Weight descends', 'Bearing', 'Stress', 'Oppression'],
  48: ['Well', 'Bucket', 'Drawing', 'Reflection', 'Source'],
  49: ['Old landscape', 'Transformation', 'New emerges', 'Boundary sharp', 'Revolution'],
  50: ['Cauldron', 'Fire beneath', 'Contents', 'Transformation', 'Refinement'],
  51: ['Tower', 'Clouds gather', 'Lightning', 'Strike', 'Arousal'],
  52: ['Mountain', 'Stillness', 'Bird circles', 'Orbit', 'Keeping still'],
  53: ['Seed', 'Sprout', 'Sapling', 'Tree', 'Development'],
  54: ['Two figures', 'Approach', 'Merge', 'Gradient', 'Union'],
  55: ['Field', 'Buds', 'Bloom', 'Fullness', 'Abundance'],
  56: ['Road', 'Figure', 'Walking', 'Horizon', 'Wandering'],
  57: ['Sand', 'Wind', 'Shaping', 'Pattern', 'Gentle'],
  58: ['Lake', 'Sky', 'Reflection', 'Vivid', 'Joy'],
  59: ['Particles', 'Central point', 'Dispersal', 'Different speeds', 'Dispersion'],
  60: ['Infinite space', 'Frame appears', 'Decoration', 'Boundary', 'Limitation'],
  61: ['Figure', 'Transparency', 'Heart visible', 'Glow', 'Inner truth'],
  62: ['Structure', 'Detail highlighted', 'Small holds', 'Integrity', 'Preponderance'],
  63: ['Puzzle', 'Completion', 'Missing piece', 'Piece nearby', 'After completion'],
  64: ['Threshold', 'Foot', 'Light one side', 'Dark other', 'Before completion']
};

// Game mechanics
const GAME_TEMPLATES: Record<number, string> = {
  1: 'CREATE: Player can generate new forms from void. Each creation costs energy and leaves a permanent mark.',
  2: 'RECEIVE: Player absorbs incoming signals. The more they receive, the more they can transmit.',
  3: 'RESOLVE: Chaos events spawn randomly. Player must find the pattern before time runs out.',
  4: 'LEARN: Mistakes grant XP. The more errors, the faster the learning curve.',
  5: 'WAIT: Certain doors only open after a set time. Patience is a resource.',
  6: 'CONFRONT: Encounters reveal hidden stats. Every conflict teaches something about the opponent.',
  7: 'LEAD: Group dynamics affect individual stats. The whole is stronger than the sum.',
  8: 'BIND: Combine two entities to create a third with emergent properties.',
  9: 'ACCUMULATE: Small actions build toward a threshold. The trigger is invisible until reached.',
  10: 'WALK: Each step is a choice. The path behind you disappears.',
  11: 'HARMONIZE: Balance scales in real-time. Too much of anything destabilizes.',
  12: 'PAUSE: Time stops. The world continues in the background. What you observe changes.',
  13: 'FELLOWSHIP: NPCs remember every interaction. Trust is a currency.',
  14: 'ABUNDANCE: Resources multiply when shared. Hoarding causes decay.',
  15: 'HUMBLE: Lower stats reveal hidden paths. Pride blocks secret passages.',
  16: 'IGNITE: Enthusiasm spreads to nearby entities. Chain reactions possible.',
  17: 'FOLLOW: Sometimes the best move is to let the environment lead.',
  18: 'REPAIR: Broken objects can be restored. The repair is visible and beautiful.',
  19: 'APPROACH: Proximity triggers events. The space between matters.',
  20: 'WITNESS: Observation changes outcomes. The act of watching is participation.',
  21: 'BITE: Direct confrontation. High risk, high reward. Some barriers require force.',
  22: 'GRACE: Beauty transforms hostile entities. Aesthetic choices have mechanical effects.',
  23: 'SPLIT: Remove a piece to reveal what was hidden. Destruction as discovery.',
  24: 'RETURN: The map loops. What you left behind has changed.',
  25: 'PURIFY: Remove corruption. The clean state is more powerful than the augmented one.',
  26: 'TAME: Raw power must be channeled. Uncontrolled strength damages the user.',
  27: 'NOURISH: Feed others to grow. The well-fed become allies.',
  28: 'BEAR: Carry weight to gain strength. The burden is the blessing.',
  29: 'DESCEND: Go deeper to find what surface cannot hold. Depth reveals truth.',
  30: 'DESIRE: What you want shapes the world. Be careful what you wish for.',
  31: 'INFLUENCE: Actions ripple outward. The effect is delayed and amplified.',
  32: 'ENDURE: Persistence grants bonuses. Quitting resets progress.',
  33: 'RETREAT: Sometimes the win is leaving. The scoreboard does not show everything.',
  34: 'EMPOWER: Strength used to serve multiplies. Strength used to dominate diminishes.',
  35: 'PROGRESS: Forward movement is automatic. The direction is the choice.',
  36: 'SHADOW: Darkness teaches. What you cannot see, you must feel.',
  37: 'FAMILY: Bonds create shared stats. Separation weakens both.',
  38: 'OPPOSE: Tension creates energy. The clash is the source.',
  39: 'OBSTRUCT: Barriers force creativity. The blocked path reveals the true way.',
  40: 'DELIVER: Breaking free grants momentum. The escape is the beginning.',
  41: 'DECREASE: Letting go makes room. The empty hand can receive.',
  42: 'INCREASE: Growth requires alignment. Misaligned growth is cancer.',
  43: 'BREAKTHROUGH: The dam breaks. The flood carries everything.',
  44: 'MEET: Encounters change both parties. No interaction is neutral.',
  45: 'GATHER: The collective has stats the individual lacks. Together, more is possible.',
  46: 'ASCEND: Climbing requires effort. The view is worth it.',
  47: 'OPPRESS: The weight tests you. Survive, and you are stronger.',
  48: 'SOURCE: The well never runs dry. Return to it.',
  49: 'REVOLUTION: Transformation sweeps away the old. The new is built on the ashes.',
  50: 'REFINE: Raw materials become valuable. The process is the game.',
  51: 'SHOCK: The unexpected resets everything. Adapt or die.',
  52: 'STILL: In the pause, the pattern becomes visible. Wait, and you will see.',
  53: 'DEVELOP: Gradual growth builds what sudden force cannot. Slow is smooth, smooth is fast.',
  54: 'MARRY: Union transforms both. The combined entity is neither and both.',
  55: 'ABOUND: Fullness overflows. Share, or burst.',
  56: 'WANDER: The journey is the destination. The road teaches what the map cannot.',
  57: 'GENTLE: Persistence wears down resistance. The soft overcomes the hard.',
  58: 'JOY: The lake reflects the sky. Joy is the mirror of reality.',
  59: 'DISPERSE: Scattering makes room. The empty space is potential.',
  60: 'LIMIT: Boundaries give form. The frame makes the picture.',
  61: 'TRUTH: Inner certainty needs no proof. The knowing is the evidence.',
  62: 'DETAIL: The small holds the large. The detail is the whole.',
  63: 'COMPLETE: The work is done. Rest is the reward.',
  64: 'BEGIN: The threshold is where all potential lives. Step across.'
};

export class TransductionEngine {
  private mesh: MeshAddressingSystem;

  constructor(mesh: MeshAddressingSystem) {
    this.mesh = mesh;
  }

  /**
   * Compile a locked gate state into the requested modality
   */
  compile(manifest: InterrogationManifest, modality: OutputModality): CompiledArtifact {
    if (!manifest.convergence.is_locked || !manifest.convergence.locked_gate_id) {
      throw new Error('Cannot compile: no gate lock achieved');
    }

    const gateId = manifest.convergence.locked_gate_id;
    const addr = manifest.convergence.locked_address!;
    const dimension = DIMENSIONS[addr.dimension] || 'Unknown';

    const hexagram = HEXAGRAM_MAP[gateId + 1] || '000000';
    const gateName = GATE_NAMES[gateId + 1] || `Gate ${gateId + 1}`;

    // Get resonance field
    const resonanceField = this.mesh.getResonanceField(
      this.mesh.pack({
        dimension: addr.dimension,
        gate: gateId,
        line: 0, color: 0, tone: 0, base: 0
      }),
      3
    );

    // Determine active lines (moving lines in I Ching terms)
    const lines = this.getActiveLines(gateId, addr);

    // Determine colors and tones
    const colors = [COLOR_NAMES[addr.color]];
    const tones = [TONE_NAMES[addr.tone]];

    let content: string;

    switch (modality) {
      case 'story':
        content = this.compileStory(gateId, dimension, lines, colors, tones);
        break;
      case 'code':
        content = this.compileCode(gateId, dimension, lines);
        break;
      case 'image':
        content = this.compileImage(gateId, dimension);
        break;
      case 'video':
        content = this.compileVideo(gateId, dimension);
        break;
      case 'game':
        content = this.compileGame(gateId, dimension);
        break;
      default:
        content = 'Unknown modality';
    }

    return {
      modality,
      gateId: gateId + 1,
      gateName,
      hexagram,
      dimension,
      content,
      metadata: {
        confidence: manifest.convergence.confidence_score,
        resonanceField,
        lines,
        colors,
        tones
      }
    };
  }

  private compileStory(gateId: number, dimension: string, lines: number[], colors: string[], tones: string[]): string {
    const archetype = STORY_ARCHETYPES[gateId + 1] || 'The story unfolds...';

    let story = `${archetype}\n\n`;
    story += `In the dimension of ${dimension}, this gate speaks.\n`;

    if (lines.length > 0) {
      story += `\nThe moving lines reveal: ${lines.map(l => `Line ${l + 1}`).join(', ')}.\n`;
      for (const line of lines) {
        story += this.getLineMeaning(gateId, line) + '\n';
      }
    }

    story += `\nThe emotional texture is colored by ${colors.join(', ')}, `;
    story += `resonating in the ${tones.join(', ')} register.\n`;

    return story;
  }

  private compileCode(gateId: number, dimension: string, lines: number[]): string {
    const template = CODE_TEMPLATES[gateId + 1] || `function gate${gateId + 1}() { return true; }`;

    let code = `// Gate ${gateId + 1}: ${GATE_NAMES[gateId + 1] || 'Unknown'}\n`;
    code += `// Dimension: ${dimension}\n`;
    code += `// Hexagram: ${HEXAGRAM_MAP[gateId + 1] || '000000'}\n`;
    code += `// Moving lines: [${lines.join(', ')}]\n\n`;
    code += template + '\n';

    // Add dimensional context
    code += `\n// Dimensional context: ${dimension}\n`;
    code += `// This function operates in the ${dimension.toLowerCase()} base.\n`;

    return code;
  }

  private compileImage(gateId: number, dimension: string): string {
    const template = IMAGE_TEMPLATES[gateId + 1] || 'A visual representation of the gate state.';

    return `Visual Composition for Gate ${gateId + 1} (${dimension}):\n\n${template}\n\n` +
           `Color palette: ${COLOR_NAMES.join(', ')}\n` +
           `Mood: ${TONE_NAMES.join(', ')}`;
  }

  private compileVideo(gateId: number, dimension: string): string {
    const scenes = VIDEO_TEMPLATES[gateId + 1] || ['Scene 1', 'Scene 2', 'Scene 3'];

    let video = `Scene Sequence for Gate ${gateId + 1} (${dimension}):\n\n`;
    scenes.forEach((scene, i) => {
      video += `  [${(i + 1).toString().padStart(2, '0')}] ${scene}\n`;
    });

    video += `\nTotal duration: ${scenes.length * 3}s (3s per scene)\n`;
    video += `Transition style: ${dimension === 'Movement' ? 'Flow' : dimension === 'Space' ? 'Dissolve' : 'Cut'}`;

    return video;
  }

  private compileGame(gateId: number, dimension: string): string {
    const template = GAME_TEMPLATES[gateId + 1] || 'A game mechanic based on the gate state.';

    return `Game Mechanic: Gate ${gateId + 1} (${dimension})\n\n${template}\n\n` +
           `Implementation: Add this as a player ability or world rule.\n` +
           `Trigger: When the player encounters Gate ${gateId + 1} energy.\n` +
           `Cooldown: ${(gateId + 1) * 2}s`;
  }

  private getActiveLines(gateId: number, addr: MeshAddress): number[] {
    const active: number[] = [];
    const hex = HEXAGRAM_MAP[gateId + 1] || '000000';

    // A line is "moving" if it matches the current line state
    for (let i = 0; i < 6; i++) {
      const lineState = parseInt(hex[i]);
      if (lineState === 1 && addr.line === i) {
        active.push(i);
      }
    }

    return active;
  }

  private getLineMeaning(gateId: number, line: number): string {
    const meanings: Record<number, Record<number, string>> = {
      1: {
        0: 'The hidden dragon. Do not act.',
        1: 'The dragon appears in the field. It is beneficial to see the great man.',
        2: 'The superior man is active all day. At night his mind is still in danger.',
        3: 'He leaps over the abyss. No mistake.',
        4: 'The dragon flies in the sky. It is beneficial to see the great man.',
        5: 'The dragon exceeds its limit. There is regret.'
      }
    };

    return (meanings[gateId + 1] && meanings[gateId + 1][line]) 
      ? `Line ${line + 1}: ${meanings[gateId + 1][line]}`
      : `Line ${line + 1}: The line moves, changing the hexagram.`;
  }

  /**
   * Compile all modalities at once
   */
  compileAll(manifest: InterrogationManifest): Record<OutputModality, CompiledArtifact> {
    const modalities: OutputModality[] = ['story', 'code', 'image', 'video', 'game'];
    const result = {} as Record<OutputModality, CompiledArtifact>;

    for (const modality of modalities) {
      result[modality] = this.compile(manifest, modality);
    }

    return result;
  }
}

export default TransductionEngine;
