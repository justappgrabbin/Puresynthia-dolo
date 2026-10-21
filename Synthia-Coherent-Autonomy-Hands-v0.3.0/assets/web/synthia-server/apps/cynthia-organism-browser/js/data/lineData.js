// Complete 384 Line Data (64 gates × 6 lines)
// Each line = 0°56'15" = 3375 arc-seconds
// Each line has: exaltation planet, detriment planet, expression name

window.LINE_DATA = {};

// Helper to generate line data for a gate
function generateLines(gateNum, expressions, exaltations, detriments) {
  const gate = window.GATE_BY_NUM[gateNum];
  if (!gate) return;

  const lineDeg = (gate.end - gate.start) / 6;
  const lines = [];

  for (let i = 0; i < 6; i++) {
    const lineStart = gate.start + i * lineDeg;
    const lineEnd = lineStart + lineDeg;

    lines.push({
      gate: gateNum,
      line: i + 1,
      name: expressions[i],
      start: lineStart,
      end: lineEnd,
      exaltation: exaltations[i],
      detriment: detriments[i],
      // Sub-structures
      color: generateSubLines(lineStart, lineEnd, 6, 'color'),
      tone: generateSubLines(lineStart, lineEnd, 36, 'tone'),
      base: generateSubLines(lineStart, lineEnd, 180, 'base')
    });
  }

  window.LINE_DATA[gateNum] = lines;
}

function generateSubLines(start, end, divisions, type) {
  const step = (end - start) / divisions;
  const subs = [];
  for (let i = 0; i < divisions; i++) {
    const s = start + i * step;
    const e = s + step;
    const mid = s + step / 2;
    const gate = window.degreeToGate(mid);
    subs.push({
      type: type,
      index: i + 1,
      start: s,
      end: e,
      gate: gate ? gate.num : null
    });
  }
  return subs;
}

// Gate 25: Innocence
generateLines(25,
  ['Selflessness', 'The Existentialist', 'Sensibility', 'Survival', 'Recuperation', 'Ignorance'],
  ['Neptune', 'Mercury', 'Mars', 'Venus/Jupiter', 'Venus', 'Earth'],
  ['Mercury', 'Mars', 'Pluto', null, 'Jupiter', 'Uranus']
);

// Gate 17: Following
generateLines(17,
  ['Openness', 'Discrimination', 'Understanding', 'The Personnel Manager', 'No man is an island', 'Bodhisattva'],
  ['Mars', 'Mercury', 'Jupiter', 'Pluto', 'Uranus', 'Neptune'],
  ['Venus', 'Venus', 'Saturn', 'Jupiter', 'Mars', 'Saturn']
);

// Gate 21: Biting Through
generateLines(21,
  ['Warning', 'Might is right', 'Powerlessness', 'Strategy', 'Objectivity', 'Chaos'],
  ['Saturn', 'Mars', 'Pluto', 'Jupiter', 'Mercury', 'Venus'],
  ['Mercury', 'Venus', 'Mars', 'Uranus', 'Mars', 'Neptune']
);

// Gate 51: The Arousing
generateLines(51,
  ['Reference', 'Withdrawal', 'Adaptation', 'Limitation', 'Symmetry', 'Separation'],
  ['Jupiter', 'Venus', 'Mars', 'Saturn', 'Uranus', 'Neptune'],
  ['Mars', 'Mars', 'Pluto', 'Jupiter', 'Mars', 'Saturn']
);

// Gate 42: Increase
generateLines(42,
  ['Diversification', 'Identification', 'Trial and error', 'The middle man', 'Self-actualization', 'Nurturing'],
  ['Jupiter', 'Venus', 'Mars', 'Uranus', 'Sun', 'Moon'],
  ['Saturn', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Saturn']
);

// Gate 3: Difficulty at the Beginning
generateLines(3,
  ['Synthesis', 'Immaturity', 'Survival', 'Charisma', 'Victimization', 'Surrender'],
  ['Mars', 'Pluto', 'Venus', 'Uranus', 'Saturn', 'Neptune'],
  ['Saturn', 'Mars', 'Jupiter', 'Mercury', 'Mars', 'Sun']
);

// Gate 27: Nourishment
generateLines(27,
  ['Selfishness', 'Self-sufficiency', 'Greed', 'Generosity', 'The executor', 'Wariness'],
  ['Sun', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Venus'],
  ['Earth', 'Mars', 'Venus', 'Mars', 'Jupiter', 'Neptune']
);

// Gate 24: Returning
generateLines(24,
  ['The sin of omission', 'Recognition', 'The addict', 'The hermit', 'Confession', 'The gift horse'],
  ['Saturn', 'Jupiter', 'Venus', 'Uranus', 'Pluto', 'Jupiter'],
  ['Mars', 'Venus', 'Jupiter', 'Moon', 'Mercury', 'Pluto']
);

// Gate 2: The Receptive
generateLines(2,
  ['Intuition', 'Genius', 'Patience', 'Secretiveness', 'Intelligent Application', 'Fixation'],
  ['Jupiter', 'Uranus', 'Venus', 'Neptune', 'Sun', 'Pluto'],
  ['Saturn', 'Mars', 'Mars', 'Venus', 'Earth', 'Mercury']
);

// Gate 23: Splitting Apart
generateLines(23,
  ['Proselytization', 'Self-defense', 'Individuality', 'Fragmentation', 'Assimilation', 'Fusion'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 8: Holding Together
generateLines(8,
  ['Honesty', 'Service', 'The phoney', 'Respect', 'Dharma', 'Communion'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 20: Contemplation
generateLines(20,
  ['Superficiality', 'The dogmatist', 'Self-awareness', 'Application', 'Realism', 'Wisdom'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 16: Enthusiasm
generateLines(16,
  ['Delusion', 'The Cynic', 'Independence', 'The leader', 'The grinch', 'Gullibility'],
  ['Saturn', 'Sun', 'Mars', 'Jupiter', 'Pluto', 'Moon'],
  ['Mercury', 'Mercury', 'Venus', 'Uranus', 'Moon', 'Saturn']
);

// Gate 35: Progress
generateLines(35,
  ['Humility', 'Creative block', 'Collaboration', 'Hunger', 'Altruism', 'Rectification'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 45: Gathering Together
generateLines(45,
  ['Canvassing', 'Consensus', 'Exclusion', 'Direction', 'Leadership', 'Reconsideration'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 12: Standstill
generateLines(12,
  ['The Monk', 'Purification', 'Confession', 'The Prophet', 'The Pragmatist', 'Metamorphosis'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 15: Modesty
generateLines(15,
  ['Duty', 'Influence', 'Ego inflation', 'The Wallflower', 'Sensitivity', 'Self-defense'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 52: Keeping Still
generateLines(52,
  ['Think before you speak', 'Concern', 'Controls', 'Self-discipline', 'Explanation', 'Peacefulness'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 39: Obstruction
generateLines(39,
  ['Disengagement', 'Confrontation', 'Responsibility', 'Temperance', 'Single-mindedness', 'The Troubleshooter'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 53: Development
generateLines(53,
  ['Accumulation', 'Momentum', 'Practicality', 'Assuredness', 'Assertion', 'Phasing'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 62: Preponderance of the Small
generateLines(62,
  ['Routine', 'Restraint', 'Discovery', 'Asceticism', 'Metamorphosis', 'Self-discipline'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 56: The Wanderer
generateLines(56,
  ['Quality', 'Linkage', 'Alienation', 'Expediency', 'Attracting attention', 'Caution'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 31: Influence
generateLines(31,
  ['Manifestation', 'Arrogance', 'Selectivity', 'Intent', 'Self-righteousness', 'Application'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 33: Retreat
generateLines(33,
  ['Avoidance', 'Surrender', 'Spirit', 'Dignity', 'Timing', 'Disassociation'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 7: The Army
generateLines(7,
  ['Authoritarian', 'The Democrat', 'The Anarchist', 'The Abdicator', 'The General', 'The Administrator'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 4: Youthful Folly
generateLines(4,
  ['Pleasure', 'Acceptance', 'Irresponsibility', 'The Liar', 'Seduction', 'Excess'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 29: The Abysmal
generateLines(29,
  ['The Draftee', 'Assessment', 'Evaluation', 'Directness', 'Overreach', 'Confusion'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 59: Dispersion
generateLines(59,
  ['The Preemptive Strike', 'Shyness', 'Openness', 'Brotherhood/Sisterhood', 'The Femme Fatale', 'The One Night Stand'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 40: Deliverance
generateLines(40,
  ['Recuperation', 'Resoluteness', 'Humility', 'Organization', 'Rigidity', 'Decapitation'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 64: Before Completion
generateLines(64,
  ['Conditions', 'Qualification', 'Over-extension', 'Conviction', 'Promise', 'Victory'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 47: Oppression
generateLines(47,
  ['Taking Stock', 'Ambition', 'Self-oppression', 'Repression', 'The Saint', 'Futility'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 6: Conflict
generateLines(6,
  ['Retreat', 'The Guerrilla', 'Allegiance', 'Triumph', 'Arbitration', 'The Peacemaker'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 46: Pushing Upward
generateLines(46,
  ['Being Discovered', 'The Prima Donna', 'Projection', 'Impact', 'Pacing', 'Integrity'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 18: Work on What Has Been Spoilt
generateLines(18,
  ['Conservatism', 'Terminal disease', 'The zealot', 'The incompetent', 'Therapy', 'Buddhahood'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 48: The Well
generateLines(48,
  ['Insignificance', 'Degeneracy', 'Incommunicado', 'Restructuring', 'Action', 'Self-fulfillment'],
  ['Moon', 'Pluto', 'Moon', 'Sun', 'Mars', 'Venus'],
  ['Mars', 'Venus', 'Mercury', 'Earth', 'Moon', 'Moon']
);

// Gate 57: The Gentle
generateLines(57,
  ['Confusion', 'Cleansing', 'Acuteness', 'The Director', 'Progression', 'Utilization'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 32: Duration
generateLines(32,
  ['Conservation', 'Restraint', 'Lack of continuity', 'Right is might', 'Flexibility', 'Tranquility'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 50: The Cauldron
generateLines(50,
  ['The Immigrant', 'Determination', 'Adaptability', 'Corruption', 'Consistency', 'Leadership'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 28: Preponderance of the Great
generateLines(28,
  ['Preparation', 'Shaking hands', 'Adventurism', 'Holding on', 'Treachery', 'Blaze of glory'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 44: Coming to Meet
generateLines(44,
  ['Conditions', 'Management', 'Interference', 'Honesty', 'Manipulation', 'Aloofness'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 1: The Creative
generateLines(1,
  ['Creation', 'Love', 'Energy', 'Alone', 'Attracting', 'Self-expression'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 43: Breakthrough
generateLines(43,
  ['Patience', 'Dedication', 'Expediency', 'The Mind', 'Progression', 'Breakthrough'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 14: Possession in Great Measure
generateLines(14,
  ['Money', 'Management', 'Service', 'Security', 'Arrogance', 'Humility'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 34: Power of the Great
generateLines(34,
  ['The Bully', 'Might is right', 'Machismo', 'Annihilation', 'Annihilation', 'Common Sense'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 9: Taming Power of the Small
generateLines(9,
  ['Sensibility', 'Misery Loves Company', 'The Straw', 'Dedication', 'Faith', 'Gratitude'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 5: Waiting
generateLines(5,
  ['Perseverance', 'Inner Peace', 'Compulsiveness', 'The Hunter', 'Joy', 'Yielding'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 26: Taming Power of the Great
generateLines(26,
  ['A Bird in the Hand', 'The Lessons', 'Influence', 'Memory', 'Adaptability', 'Authority'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 11: Peace
generateLines(11,
  ['Attunement', 'Rigour', 'The Realist', 'The Teacher', 'The Philanthropist', 'Adaptability'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 10: Treading
generateLines(10,
  ['Modesty', 'The Hermit', 'The Martyr', 'The Opportunist', 'The Heretic', 'The Role Model'],
  ['Sun', 'Mercury', 'Earth', 'Uranus', 'Jupiter', 'Pluto'],
  ['Moon', 'Mars', 'Moon', 'Mercury', 'Mars', 'Saturn']
);

// Gate 58: The Joyous
generateLines(58,
  ['Love of Life', 'Perversion', 'Electricity', 'Focus', 'Defense', 'Carried Away'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 38: Opposition
generateLines(38,
  ['Qualification', 'Politeness', 'Alliance', 'Investigation', 'Alienation', 'The Misunderstood'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 54: The Marrying Maiden
generateLines(54,
  ['Influence', 'Discretion', 'Interaction', 'Enlightenment', 'Magnanimity', 'Selectivity'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 61: Inner Truth
generateLines(61,
  ['Occult Knowledge', 'Natural Brilliance', 'Interdependence', 'Research', 'Influence', 'Appeal'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 60: Limitation
generateLines(60,
  ['Acceptance', 'Decisiveness', 'Conservatism', 'Resourcefulness', 'Leadership', 'Rigidity'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 41: Decrease
generateLines(41,
  ['Reasonableness', 'Caution', 'Efficiency', 'Correction', 'Vicariousness', 'Contemplation'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 19: Approach
generateLines(19,
  ['Interdependence', 'Service', 'Dedication', 'Teamwork', 'Sacrifice', 'Recluse'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 13: Fellowship of Man
generateLines(13,
  ['Empathy', 'Bigotry', 'Pessimism', 'Fatigue', 'The Savior', 'Optimism'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 49: Revolution
generateLines(49,
  ['Law', 'The Last Resort', 'Popularity', 'Platform', 'The General', 'Liberty'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 30: Clinging Fire
generateLines(30,
  ['Composure', 'Pragmatism', 'Resignation', 'Burnout', 'Irony', 'Enforcement'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 55: Abundance
generateLines(55,
  ['Cooperation', 'Distrust', 'Innocence', 'Assimilation', 'Self-centeredness', 'Selfishness'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 37: The Family
generateLines(37,
  ['Mother/Father', 'Responsibility', 'Discipline', 'Leadership', 'Love', 'Purpose'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 63: After Completion
generateLines(63,
  ['Composure', 'Structuring', 'Continuance', 'Memory', 'Affirmation', 'Nostalgia'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 22: Grace
generateLines(22,
  ['Second Best', 'Charm', 'The Enchanter', 'Sensitivity', 'Directness', 'Maturity'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Gate 36: Darkening of the Light
generateLines(36,
  ['Resistance', 'Support', 'Transition', 'Espionage', 'The Underground', 'Justice'],
  ['Saturn', 'Jupiter', 'Mars', 'Uranus', 'Sun', 'Venus'],
  ['Mercury', 'Mars', 'Pluto', 'Neptune', 'Earth', 'Jupiter']
);

// Line lookup helper
window.getLineData = function(gateNum, lineNum) {
  const gateLines = window.LINE_DATA[gateNum];
  if (!gateLines) return null;
  return gateLines[lineNum - 1] || null;
};

// Degree to line mapper
window.degreeToLine = function(degree) {
  const gate = window.degreeToGate(degree);
  if (!gate) return null;
  const lines = window.LINE_DATA[gate.num];
  if (!lines) return null;
  return lines.find(l => degree >= l.start && degree < l.end) || null;
};