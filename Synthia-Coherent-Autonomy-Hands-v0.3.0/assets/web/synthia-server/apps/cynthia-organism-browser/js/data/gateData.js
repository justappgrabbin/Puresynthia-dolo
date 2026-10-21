// Complete 64-Gate Human Design Mandala
// True Rave Mandala order (NOT linear 1-64)
// Each gate = 5°37'30" = 20250 arc-seconds
// Each line = 0°56'15" = 3375 arc-seconds
// Fu Xi sequence with 4 variations

window.MANDALA = [
  // Gate 25: Innocence - 0° Aries start
  { num: 25, name: 'Innocence', sign: 'Pis/Ari', start: 0.000, end: 5.625, 
    upper: 'qian', lower: 'kun', center: 'G', biology: 'Liver', harmonic: 51,
    astrological: ['Openness', 'Desire/Will', 'Courage'] },

  // Gate 17: Following
  { num: 17, name: 'Following', sign: 'Aries', start: 5.625, end: 11.250,
    upper: 'qian', lower: 'dui', center: 'Ajna', biology: 'Pituitary', harmonic: 62,
    astrological: ['Desire', 'Will', 'Impulse/Courage'] },

  // Gate 21: Biting Through
  { num: 21, name: 'Biting Through', sign: 'Aries', start: 11.250, end: 16.875,
    upper: 'li', lower: 'zhen', center: 'Heart', biology: 'Thymus', harmonic: 45,
    astrological: ['Desire', 'Will', 'Impulse/Courage'] },

  // Gate 51: The Arousing
  { num: 51, name: 'The Arousing', sign: 'Aries', start: 16.875, end: 22.500,
    upper: 'zhen', lower: 'kan', center: 'Heart', biology: 'Thymus', harmonic: 25,
    astrological: ['Desire', 'Will', 'Impulse/Courage'] },

  // Gate 42: Increase
  { num: 42, name: 'Increase', sign: 'Aries', start: 22.500, end: 28.125,
    upper: 'xun', lower: 'zhen', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 53,
    astrological: ['Desire', 'Will', 'Impulse/Courage'] },

  // Gate 3: Difficulty at the Beginning
  { num: 3, name: 'Difficulty at the Beginning', sign: 'Aries/Tau', start: 28.125, end: 33.750,
    upper: 'zhen', lower: 'kan', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 60,
    astrological: ['Desire/Will', 'Impulse', 'Materialism'] },

  // Gate 27: Nourishment
  { num: 27, name: 'Nourishment', sign: 'Taurus', start: 33.750, end: 39.375,
    upper: 'xun', lower: 'dui', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 50,
    astrological: ['Materialism', 'Practicality', 'Inertia'] },

  // Gate 24: Returning
  { num: 24, name: 'Returning', sign: 'Taurus', start: 39.375, end: 45.000,
    upper: 'kun', lower: 'zhen', center: 'Ajna', biology: 'Pituitary', harmonic: 61,
    astrological: ['Materialism', 'Practicality', 'Inertia'] },

  // Gate 2: The Receptive
  { num: 2, name: 'The Receptive', sign: 'Taurus', start: 45.000, end: 50.625,
    upper: 'kun', lower: 'kun', center: 'G', biology: 'Liver', harmonic: 14,
    astrological: ['Materialism', 'Practicality', 'Inertia'] },

  // Gate 23: Splitting Apart
  { num: 23, name: 'Splitting Apart', sign: 'Taurus', start: 50.625, end: 56.250,
    upper: 'kun', lower: 'gen', center: 'Throat', biology: 'Thyroid', harmonic: 43,
    astrological: ['Materialism', 'Practicality', 'Inertia'] },

  // Gate 8: Holding Together
  { num: 8, name: 'Holding Together', sign: 'Tau/Gem', start: 56.250, end: 61.875,
    upper: 'kun', lower: 'dui', center: 'Throat', biology: 'Thyroid', harmonic: 1,
    astrological: ['Materialism', 'Changeability', 'Expansion'] },

  // Gate 20: Contemplation
  { num: 20, name: 'Contemplation', sign: 'Gemini', start: 61.875, end: 67.500,
    upper: 'xun', lower: 'qian', center: 'Throat', biology: 'Thyroid', harmonic: [10, 34, 57],
    astrological: ['Changeability', 'Duality', 'Expansion'] },

  // Gate 16: Enthusiasm
  { num: 16, name: 'Enthusiasm', sign: 'Gemini', start: 67.500, end: 73.125,
    upper: 'kun', lower: 'zhen', center: 'Throat', biology: 'Thyroid', harmonic: 48,
    astrological: ['Changeability', 'Duality', 'Expansion'] },

  // Gate 35: Progress
  { num: 35, name: 'Progress', sign: 'Gemini', start: 73.125, end: 78.750,
    upper: 'li', lower: 'kun', center: 'Throat', biology: 'Thyroid', harmonic: 36,
    astrological: ['Changeability', 'Duality', 'Expansion'] },

  // Gate 45: Gathering Together
  { num: 45, name: 'Gathering Together', sign: 'Gemini', start: 78.750, end: 84.375,
    upper: 'dui', lower: 'kun', center: 'Throat', biology: 'Thyroid', harmonic: 21,
    astrological: ['Changeability', 'Duality', 'Expansion'] },

  // Gate 12: Standstill
  { num: 12, name: 'Standstill', sign: 'Gemini', start: 84.375, end: 90.000,
    upper: 'qian', lower: 'kun', center: 'Throat', biology: 'Thyroid', harmonic: 22,
    astrological: ['Changeability', 'Duality', 'Expansion'] },

  // Gate 15: Modesty
  { num: 15, name: 'Modesty', sign: 'Gem/Can', start: 90.000, end: 95.625,
    upper: 'qian', lower: 'kun', center: 'G', biology: 'Liver', harmonic: 5,
    astrological: ['Changeability', 'Sensitivity', 'Home/Family'] },

  // Gate 52: Keeping Still
  { num: 52, name: 'Keeping Still', sign: 'Cancer', start: 95.625, end: 101.250,
    upper: 'gen', lower: 'gen', center: 'Root', biology: 'Adrenals', harmonic: 9,
    astrological: ['Receptivity', 'Sensitivity', 'Home/Family'] },

  // Gate 39: Obstruction
  { num: 39, name: 'Obstruction', sign: 'Cancer', start: 101.250, end: 106.875,
    upper: 'kan', lower: 'gen', center: 'Root', biology: 'Adrenals', harmonic: 55,
    astrological: ['Receptivity', 'Sensitivity', 'Home/Family'] },

  // Gate 53: Development
  { num: 53, name: 'Development', sign: 'Cancer', start: 106.875, end: 112.500,
    upper: 'xun', lower: 'gen', center: 'Root', biology: 'Adrenals', harmonic: 42,
    astrological: ['Receptivity', 'Sensitivity', 'Home/Family'] },

  // Gate 62: Preponderance of the Small
  { num: 62, name: 'Preponderance of the Small', sign: 'Cancer', start: 112.500, end: 118.125,
    upper: 'dui', lower: 'zhen', center: 'Throat', biology: 'Thyroid', harmonic: 17,
    astrological: ['Receptivity', 'Sensitivity', 'Home/Family'] },

  // Gate 56: The Wanderer
  { num: 56, name: 'The Wanderer', sign: 'Can/Leo', start: 118.125, end: 123.750,
    upper: 'li', lower: 'gen', center: 'Throat', biology: 'Thyroid', harmonic: 11,
    astrological: ['Sensitivity', 'Self-expression', 'Pleasure'] },

  // Gate 31: Influence
  { num: 31, name: 'Influence', sign: 'Leo', start: 123.750, end: 129.375,
    upper: 'xun', lower: 'dui', center: 'Throat', biology: 'Thyroid', harmonic: 7,
    astrological: ['Self-expression', 'Pleasure', 'Authority'] },

  // Gate 33: Retreat
  { num: 33, name: 'Retreat', sign: 'Leo', start: 129.375, end: 135.000,
    upper: 'qian', lower: 'dui', center: 'Throat', biology: 'Thyroid', harmonic: 13,
    astrological: ['Self-expression', 'Pleasure', 'Authority'] },

  // Gate 7: The Army
  { num: 7, name: 'The Army', sign: 'Leo', start: 135.000, end: 140.625,
    upper: 'dui', lower: 'kun', center: 'G', biology: 'Liver', harmonic: 31,
    astrological: ['Self-expression', 'Pleasure', 'Authority'] },

  // Gate 4: Youthful Folly
  { num: 4, name: 'Youthful Folly', sign: 'Leo', start: 140.625, end: 146.250,
    upper: 'zhen', lower: 'kan', center: 'Ajna', biology: 'Pituitary', harmonic: 63,
    astrological: ['Self-expression', 'Pleasure', 'Authority'] },

  // Gate 29: The Abysmal
  { num: 29, name: 'The Abysmal', sign: 'Leo/Vir', start: 146.250, end: 151.875,
    upper: 'kan', lower: 'xun', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 46,
    astrological: ['Self-expression', 'Service', 'Judgment'] },

  // Gate 59: Dispersion
  { num: 59, name: 'Dispersion', sign: 'Virgo', start: 151.875, end: 157.500,
    upper: 'xun', lower: 'kan', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 6,
    astrological: ['Mental Detail', 'Service', 'Judgment'] },

  // Gate 40: Deliverance
  { num: 40, name: 'Deliverance', sign: 'Virgo', start: 157.500, end: 163.125,
    upper: 'kan', lower: 'zhen', center: 'Heart', biology: 'Thymus', harmonic: 37,
    astrological: ['Mental Detail', 'Service', 'Judgment'] },

  // Gate 64: Before Completion
  { num: 64, name: 'Before Completion', sign: 'Virgo', start: 163.125, end: 168.750,
    upper: 'kan', lower: 'li', center: 'Head', biology: 'Pineal', harmonic: 47,
    astrological: ['Mental Detail', 'Service', 'Judgment'] },

  // Gate 47: Oppression
  { num: 47, name: 'Oppression', sign: 'Virgo', start: 168.750, end: 174.375,
    upper: 'dui', lower: 'kan', center: 'Ajna', biology: 'Pituitary', harmonic: 64,
    astrological: ['Mental Detail', 'Service', 'Judgment'] },

  // Gate 6: Conflict
  { num: 6, name: 'Conflict', sign: 'Virgo', start: 174.375, end: 180.000,
    upper: 'kan', lower: 'qian', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 59,
    astrological: ['Mental Detail', 'Service', 'Judgment'] },

  // Gate 46: Pushing Upward
  { num: 46, name: 'Pushing Upward', sign: 'Vir/Lib', start: 180.000, end: 185.625,
    upper: 'xun', lower: 'kun', center: 'G', biology: 'Liver', harmonic: 29,
    astrological: ['Service', 'Comparison', 'Appreciation'] },

  // Gate 18: Work on What Has Been Spoilt
  { num: 18, name: 'Work on What Has Been Spoilt', sign: 'Libra', start: 185.625, end: 191.250,
    upper: 'gen', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 58,
    astrological: ['Comparison', 'Appreciation', 'Evaluation'] },

  // Gate 48: The Well
  { num: 48, name: 'The Well', sign: 'Libra', start: 191.250, end: 196.875,
    upper: 'kan', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 16,
    astrological: ['Comparison', 'Appreciation', 'Evaluation'] },

  // Gate 57: The Gentle
  { num: 57, name: 'The Gentle', sign: 'Libra', start: 196.875, end: 202.500,
    upper: 'xun', lower: 'dui', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: [10, 20, 34],
    astrological: ['Comparison', 'Appreciation', 'Evaluation'] },

  // Gate 32: Duration
  { num: 32, name: 'Duration', sign: 'Libra', start: 202.500, end: 208.125,
    upper: 'zhen', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 54,
    astrological: ['Comparison', 'Appreciation', 'Evaluation'] },

  // Gate 50: The Cauldron
  { num: 50, name: 'The Cauldron', sign: 'Lib/Sco', start: 208.125, end: 213.750,
    upper: 'dui', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 27,
    astrological: ['Comparison', 'Transcendence', 'Sex'] },

  // Gate 28: Preponderance of the Great
  { num: 28, name: 'Preponderance of the Great', sign: 'Scorpio', start: 213.750, end: 219.375,
    upper: 'dui', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 38,
    astrological: ['Transcendence', 'Sex', 'Death/Regeneration'] },

  // Gate 44: Coming to Meet
  { num: 44, name: 'Coming to Meet', sign: 'Scorpio', start: 219.375, end: 225.000,
    upper: 'qian', lower: 'xun', center: 'Splenic', biology: 'Spleen/Lymph', harmonic: 26,
    astrological: ['Transcendence', 'Sex', 'Death/Regeneration'] },

  // Gate 1: The Creative
  { num: 1, name: 'The Creative', sign: 'Scorpio', start: 225.000, end: 230.625,
    upper: 'qian', lower: 'qian', center: 'G', biology: 'Liver', harmonic: 8,
    astrological: ['Transcendence', 'Sex', 'Death/Regeneration'] },

  // Gate 43: Breakthrough
  { num: 43, name: 'Breakthrough', sign: 'Scorpio', start: 230.625, end: 236.250,
    upper: 'qian', lower: 'dui', center: 'Ajna', biology: 'Pituitary', harmonic: 23,
    astrological: ['Transcendence', 'Sex', 'Death/Regeneration'] },

  // Gate 14: Possession in Great Measure
  { num: 14, name: 'Possession in Great Measure', sign: 'Sco/Sag', start: 236.250, end: 241.875,
    upper: 'qian', lower: 'dui', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 2,
    astrological: ['Transcendence', 'Philosophy', 'Idealism'] },

  // Gate 34: Power of the Great
  { num: 34, name: 'Power of the Great', sign: 'Sagittarius', start: 241.875, end: 247.500,
    upper: 'qian', lower: 'zhen', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: [10, 20, 57],
    astrological: ['Philosophy', 'Religion', 'Idealism'] },

  // Gate 9: Taming Power of the Small
  { num: 9, name: 'Taming Power of the Small', sign: 'Sagittarius', start: 247.500, end: 253.125,
    upper: 'xun', lower: 'qian', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 52,
    astrological: ['Philosophy', 'Religion', 'Idealism'] },

  // Gate 5: Waiting
  { num: 5, name: 'Waiting', sign: 'Sagittarius', start: 253.125, end: 258.750,
    upper: 'xun', lower: 'qian', center: 'Sacral', biology: 'Ovaries/Testes', harmonic: 15,
    astrological: ['Philosophy', 'Religion', 'Idealism'] },

  // Gate 26: Taming Power of the Great
  { num: 26, name: 'Taming Power of the Great', sign: 'Sagittarius', start: 258.750, end: 264.375,
    upper: 'dui', lower: 'qian', center: 'Heart', biology: 'Thymus', harmonic: 44,
    astrological: ['Philosophy', 'Religion', 'Idealism'] },

  // Gate 11: Peace
  { num: 11, name: 'Peace', sign: 'Sagittarius', start: 264.375, end: 270.000,
    upper: 'qian', lower: 'kun', center: 'Ajna', biology: 'Pituitary', harmonic: 56,
    astrological: ['Philosophy', 'Religion', 'Idealism'] },

  // Gate 10: Treading
  { num: 10, name: 'Treading', sign: 'Sag/Cap', start: 270.000, end: 275.625,
    upper: 'qian', lower: 'dui', center: 'G', biology: 'Liver', harmonic: [20, 34, 57],
    astrological: ['Philosophy', 'Ambition', 'Status'] },

  // Gate 58: The Joyous
  { num: 58, name: 'The Joyous', sign: 'Capricorn', start: 275.625, end: 281.250,
    upper: 'dui', lower: 'dui', center: 'Root', biology: 'Adrenals', harmonic: 18,
    astrological: ['Ambition', 'Government', 'Status'] },

  // Gate 38: Opposition
  { num: 38, name: 'Opposition', sign: 'Capricorn', start: 281.250, end: 286.875,
    upper: 'dui', lower: 'gen', center: 'Root', biology: 'Adrenals', harmonic: 28,
    astrological: ['Ambition', 'Government', 'Status'] },

  // Gate 54: The Marrying Maiden
  { num: 54, name: 'The Marrying Maiden', sign: 'Capricorn', start: 286.875, end: 292.500,
    upper: 'dui', lower: 'zhen', center: 'Root', biology: 'Adrenals', harmonic: 32,
    astrological: ['Ambition', 'Government', 'Status'] },

  // Gate 61: Inner Truth
  { num: 61, name: 'Inner Truth', sign: 'Capricorn', start: 292.500, end: 298.125,
    upper: 'xun', lower: 'dui', center: 'Head', biology: 'Pineal', harmonic: 24,
    astrological: ['Ambition', 'Government', 'Status'] },

  // Gate 60: Limitation
  { num: 60, name: 'Limitation', sign: 'Cap/Aqu', start: 298.125, end: 303.750,
    upper: 'kan', lower: 'dui', center: 'Root', biology: 'Adrenals', harmonic: 3,
    astrological: ['Ambition', 'Science', 'Humanitarianism'] },

  // Gate 41: Decrease
  { num: 41, name: 'Decrease', sign: 'Aquarius', start: 303.750, end: 309.375,
    upper: 'shan', lower: 'zhen', center: 'Root', biology: 'Adrenals', harmonic: 30,
    astrological: ['Science', 'Humanitarianism', 'Music'] },

  // Gate 19: Approach
  { num: 19, name: 'Approach', sign: 'Aquarius', start: 309.375, end: 315.000,
    upper: 'dui', lower: 'kun', center: 'Root', biology: 'Adrenals', harmonic: 49,
    astrological: ['Science', 'Humanitarianism', 'Music'] },

  // Gate 13: Fellowship of Man
  { num: 13, name: 'Fellowship of Man', sign: 'Aquarius', start: 315.000, end: 320.625,
    upper: 'qian', lower: 'xun', center: 'G', biology: 'Liver', harmonic: 33,
    astrological: ['Science', 'Humanitarianism', 'Music'] },

  // Gate 49: Revolution
  { num: 49, name: 'Revolution', sign: 'Aquarius', start: 320.625, end: 326.250,
    upper: 'li', lower: 'dui', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 19,
    astrological: ['Science', 'Humanitarianism', 'Music'] },

  // Gate 30: Clinging Fire
  { num: 30, name: 'Clinging Fire', sign: 'Aqu/Pis', start: 326.250, end: 331.875,
    upper: 'li', lower: 'xun', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 41,
    astrological: ['Science', 'Openness', 'Devotion'] },

  // Gate 55: Abundance
  { num: 55, name: 'Abundance', sign: 'Pisces', start: 331.875, end: 337.500,
    upper: 'zhen', lower: 'xun', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 39,
    astrological: ['Openness', 'Devotion', 'Conflict'] },

  // Gate 37: The Family
  { num: 37, name: 'The Family', sign: 'Pisces', start: 337.500, end: 343.125,
    upper: 'xun', lower: 'li', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 40,
    astrological: ['Openness', 'Devotion', 'Conflict'] },

  // Gate 63: After Completion
  { num: 63, name: 'After Completion', sign: 'Pisces', start: 343.125, end: 348.750,
    upper: 'kan', lower: 'li', center: 'Head', biology: 'Pineal', harmonic: 4,
    astrological: ['Openness', 'Devotion', 'Conflict'] },

  // Gate 22: Grace
  { num: 22, name: 'Grace', sign: 'Pisces', start: 348.750, end: 354.375,
    upper: 'xun', lower: 'li', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 12,
    astrological: ['Openness', 'Devotion', 'Conflict'] },

  // Gate 36: Darkening of the Light
  { num: 36, name: 'Darkening of the Light', sign: 'Pisces', start: 354.375, end: 360.000,
    upper: 'ming', lower: 'kun', center: 'Solar', biology: 'Kidney/Pancreas', harmonic: 35,
    astrological: ['Openness', 'Devotion', 'Conflict'] }
];

// Gate lookup by number
window.GATE_BY_NUM = {};
window.MANDALA.forEach(g => window.GATE_BY_NUM[g.num] = g);

// Degree to gate mapper
window.degreeToGate = function(degree) {
  const d = ((degree % 360) + 360) % 360;
  return window.MANDALA.find(g => d >= g.start && d < g.end);
};