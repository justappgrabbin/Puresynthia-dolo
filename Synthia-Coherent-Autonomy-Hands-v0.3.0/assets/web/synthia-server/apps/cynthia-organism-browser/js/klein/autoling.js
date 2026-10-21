// AUTOLING: Translation and Transmission Engine
// Machine translation / NL interface

const AUTOLING = {
  name: 'AUTOLING',
  description: 'Translation between symbolic and natural language',

  process(signal, gateA, gateB, state) {
    const translation = this.translate(signal, gateA, gateB);

    return {
      type: 'translation',
      content: translation,
      source: 'AUTOLING',
      gateA: gateA.num,
      gateB: gateB.num
    };
  },

  translate(signal, gateA, gateB) {
    // Translate between gate languages
    const langA = this.gateLanguage(gateA);
    const langB = this.gateLanguage(gateB);

    // Generate translation
    const translated = this.transform(signal.content, langA, langB);

    return `Translation: "${signal.content}" [${langA}] → "${translated}" [${langB}]. ` +
           `Bridge: Gate ${gateA.num} (${gateA.name}) to Gate ${gateB.num} (${gateB.name}).`;
  },

  gateLanguage(gate) {
    const languages = {
      'Understanding': 'logic',
      'Sensing': 'experience',
      'Knowing': 'intuition',
      'Centering': 'action',
      'Ego/Defense': 'boundary'
    };
    return languages[gate.circuit] || 'unknown';
  },

  transform(content, fromLang, toLang) {
    const transforms = {
      'logic→experience': content.replace(/because/g, 'I felt that'),
      'experience→logic': content.replace(/I felt/g, 'It follows that'),
      'intuition→action': content.replace(/I see/g, 'I will'),
      'action→boundary': content.replace(/I will/g, 'I must protect'),
      'boundary→intuition': content.replace(/I must/g, 'I sense')
    };

    const key = `${fromLang}→${toLang}`;
    return transforms[key] || `[${toLang}]: ${content}`;
  },

  aggregate(signals, centerName) {
    const translations = signals.map(s => s.content).join(' | ');
    return {
      type: 'transmission',
      content: `${centerName} transmissions: ${translations}`,
      source: 'AUTOLING'
    };
  }
};

window.KLEIN_TOOLS.autoling = AUTOLING;