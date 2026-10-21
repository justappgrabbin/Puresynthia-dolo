// NOVEL WRITER: Automatic Narrative Generation
// Klein 1973 - Story generation from structural patterns

const NOVEL_WRITER = {
  name: 'NovelWriter',
  description: 'Automatic narrative generation from field state',

  process(signal, gateA, gateB, state) {
    const story = this.generateStory(gateA, gateB, signal);

    return {
      type: 'story',
      content: story,
      genre: this.identifyGenre(gateA, gateB),
      source: 'NovelWriter',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  generateStory(gateA, gateB, signal) {
    // Character archetypes from gates
    const characters = this.getCharacters(gateA, gateB);
    const setting = this.getSetting(gateA, gateB);
    const plot = this.getPlot(gateA, gateB, signal);

    return `Story: In ${setting}, ${characters.protagonist} seeks ${signal.content}. ` +
           `${characters.antagonist} opposes through ${plot.obstacle}. ` +
           `Resolution: ${plot.resolution}. ` +
           `Theme: ${characters.theme}.`;
  },

  getCharacters(gateA, gateB) {
    const archetypes = {
      'Understanding': { pro: 'The Analyst', ant: 'The Confusion', theme: 'Truth through logic' },
      'Sensing': { pro: 'The Wanderer', ant: 'The Stagnation', theme: 'Growth through experience' },
      'Knowing': { pro: 'The Seer', ant: 'The Blindness', theme: 'Vision through mutation' },
      'Centering': { pro: 'The Catalyst', ant: 'The Inertia', theme: 'Action through being' },
      'Ego/Defense': { pro: 'The Protector', ant: 'The Invader', theme: 'Safety through boundaries' }
    };

    const circuitA = archetypes[gateA.circuit] || archetypes['Understanding'];
    const circuitB = archetypes[gateB.circuit] || archetypes['Sensing'];

    return {
      protagonist: circuitA.pro,
      antagonist: circuitB.ant,
      theme: `${circuitA.theme} meets ${circuitB.theme}`
    };
  },

  getSetting(gateA, gateB) {
    const settings = {
      'Head': 'the library of infinite questions',
      'Ajna': 'the hall of mirrors',
      'Throat': 'the marketplace of words',
      'G': 'the temple of self',
      'Heart': 'the forge of will',
      'Solar': 'the ocean of feeling',
      'Sacral': 'the garden of creation',
      'Splenic': 'the forest of instinct',
      'Root': 'the mountain of pressure'
    };

    return `${settings[gateA.center] || 'unknown'} and ${settings[gateB.center] || 'unknown'}`;
  },

  getPlot(gateA, gateB, signal) {
    const tension = (gateA.state.tension + gateB.state.tension) / 2;
    return {
      obstacle: tension > 0.5 ? 'direct confrontation' : 'subtle manipulation',
      resolution: tension > 0.8 ? 'transformation' : 'integration'
    };
  },

  identifyGenre(gateA, gateB) {
    const genres = {
      'Understanding': 'mystery',
      'Sensing': 'bildungsroman',
      'Knowing': 'science fiction',
      'Centering': 'epic',
      'Ego/Defense': 'thriller'
    };
    return `${genres[gateA.circuit] || 'general'}_${genres[gateB.circuit] || 'fiction'}`;
  },

  aggregate(signals, centerName) {
    const stories = signals.map(s => s.content).join(' || ');
    return {
      type: 'narrative',
      content: `${centerName} stories: ${stories}`,
      source: 'NovelWriter'
    };
  }
};

window.KLEIN_TOOLS.novelWriter = NOVEL_WRITER;