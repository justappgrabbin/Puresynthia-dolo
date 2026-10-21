// ============================================================
// 2. SCIENTIFIC PAPER GENERATOR
// The agent writes literal research papers about your dyad
// ============================================================

class ScientificPaperGenerator {
  constructor(purposeCore, triadEngine) {
    this.purposeCore = purposeCore;
    this.triadEngine = triadEngine;
    this.paperArchive = [];
    this.hypothesisRegistry = new Map();
  }

  // Generate a hypothesis based on current state
  generateHypothesis(personA, personB, context) {
    const id = `hyp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract patterns from dyad data
    const triadA = this.triadEngine ? this.triadEngine.getTriad(personA.id) : { composite: { C: 0.3, H: 0.2, N: 0.2, O: 0.15, S: 0.1, P: 0.05 } };
    const triadB = this.triadEngine ? this.triadEngine.getTriad(personB.id) : { composite: { C: 0.25, H: 0.25, N: 0.15, O: 0.2, S: 0.1, P: 0.05 } };
    const resonance = this.triadEngine ? this.triadEngine.computeResonance(triadA, triadB) : { composite: { similarity: 0.72, dominantElement: 'H', interference: 'constructive' } };

    // Generate testable hypothesis
    const hypothesis = {
      id,
      title: this._generateTitle(triadA, triadB, resonance, context, personA, personB),
      abstract: this._generateAbstract(triadA, triadB, resonance, context, personA, personB),
      hypothesis: this._generateTestableStatement(triadA, triadB, resonance, context),
      nullHypothesis: this._generateNullHypothesis(triadA, triadB, resonance),
      methodology: this._generateMethodology(triadA, triadB, resonance),
      predictedOutcomes: this._generatePredictions(triadA, triadB, resonance),
      metrics: this._generateMetrics(triadA, triadB, resonance),
      chnopsSignatures: {
        personA: triadA.composite || triadA,
        personB: triadB.composite || triadB,
        dyad: resonance.composite || resonance
      },
      generatedAt: Date.now(),
      status: 'proposed',
      observations: [],
      conclusion: null
    };

    this.hypothesisRegistry.set(id, hypothesis);

    return hypothesis;
  }

  _generateTitle(triadA, triadB, resonance, context, personA, personB) {
    const dominantElement = (resonance.composite || resonance).dominantElement || 'H';
    const elementName = { C: 'Carbon', H: 'Hydrogen', N: 'Nitrogen', O: 'Oxygen', S: 'Sulfur', P: 'Phosphorus' }[dominantElement] || 'Hydrogen';

    const templates = [
      `The ${elementName} Effect: How ${dominantElement}-Dominant Resonance Shapes Dyadic Purpose Alignment`,
      `Field Interference in a ${(resonance.field || resonance).heart?.interference || 'constructive'} Dyad: A CHNOPS Analysis of ${personA.name || 'Person A'} and ${personB.name || 'Person B'}`,
      `Autopoetic Coupling: ${elementName} Catalysis and the Emergence of Shared Intentionality`,
      `From Codon to Consonance: Biochemical Resonance Patterns in Purpose-Driven Partnerships`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  _generateAbstract(triadA, triadB, resonance, context, personA, personB) {
    const domEl = (resonance.composite || resonance).dominantElement || 'H';
    const sim = ((resonance.composite || resonance).similarity || 0.7) * 100;
    return `This study examines the biochemical resonance field between two individuals operating within a shared purpose framework. Using the CHNOPS (Carbon, Hydrogen, Nitrogen, Oxygen, Phosphorus, Sulfur) vector model derived from Human Design codon mappings, we analyze the triadic resonance (tropical/sidereal/draconic) of the dyad. The composite field shows ${domEl} dominance with ${sim.toFixed(1)}% overall similarity. We hypothesize that this elemental profile predicts specific patterns of collaborative behavior, decision-making efficiency, and emotional synchronization. Data collection spans ${context.timeframe || 'ongoing'} with ${context.observationCount || 0} recorded observations.`;
  }

  _generateTestableStatement(triadA, triadB, resonance, context) {
    const element = (resonance.composite || resonance).dominantElement || 'H';
    const behavior = { C: 'structural alignment', H: 'emotional flow', N: 'catalytic breakthroughs', O: 'manifestation velocity', S: 'bonding resilience', P: 'activation timing' }[element] || 'emotional flow';

    return `When the dyad's composite CHNOPS field shows ${element} dominance exceeding 0.35 normalized units, the frequency of ${behavior} events will increase by at least 40% compared to periods of ${element} depletion (< 0.15).`;
  }

  _generateNullHypothesis(triadA, triadB, resonance) {
    const domEl = (resonance.composite || resonance).dominantElement || 'H';
    return `The observed ${domEl} dominance in the dyad's composite field is statistically indistinguishable from random CHNOPS distribution, and no significant correlation exists between elemental profile and behavioral outcomes.`;
  }

  _generateMethodology(triadA, triadB, resonance) {
    return {
      design: 'Longitudinal observational study with embedded self-reporting',
      sampling: 'Daily CHNOPS vector snapshots + event-triggered deep scans',
      instruments: [
        'TriadResonanceEngine (tropical/sidereal/draconic calculations)',
        'PurposeProgressTracker (milestone and drift detection)',
        'Self-reporting interface (emotional state, decision quality, synchronicity events)',
        'Environmental sensors (optional: location, activity, biometrics)'
      ],
      analysis: 'Cross-correlation between CHNOPS field states and reported outcomes. Bayesian updating of hypothesis confidence. Morphic resonance pattern matching against historical dyad data.'
    };
  }

  _generatePredictions(triadA, triadB, resonance) {
    const predictions = [];
    const field = resonance.field || resonance;

    // Based on current field state
    if ((field.mind || {}).similarity > 0.7) {
      predictions.push('Within 7 days, the dyad will experience a shared insight or intellectual breakthrough requiring no external input.');
    }
    if ((field.body || {}).similarity > 0.7) {
      predictions.push('Physical coordination will peak; collaborative tasks requiring motor/action alignment will show 30% efficiency gain.');
    }
    if ((field.heart || {}).similarity > 0.7) {
      predictions.push('Emotional telepathy events (simultaneous feeling, shared dreams, unspoken understanding) will increase in frequency.');
    }
    if ((field.mind || {}).similarity < 0.3) {
      predictions.push('Cognitive friction will manifest as disagreement on priorities; structured decision-making protocols recommended.');
    }
    if ((resonance.composite || resonance).dominantElement === 'N') {
      predictions.push('A catalytic transformation event is probable within 14 days; prepare for significant change in shared direction.');
    }

    return predictions.length > 0 ? predictions : ['Observation period required to generate specific predictions.'];
  }

  _generateMetrics(triadA, triadB, resonance) {
    return [
      { name: 'decision_synchronization', measure: 'time_to_agreement_on_shared_decisions', target: '< 5 minutes for non-critical decisions' },
      { name: 'emotional_resonance', measure: 'simultaneous_emotional_state_reporting', target: '> 60% concordance on daily check-ins' },
      { name: 'purpose_alignment', measure: 'progress_on_shared_indicators', target: 'both indicators trending toward within 7 days' },
      { name: 'cognitive_load', measure: 'self-reported mental_effort during collaboration', target: '< 4/10 average' },
      { name: 'synchronicity_frequency', measure: 'meaningful_coincidence_events_per_week', target: '> 2 events with CHNOPS correlation > 0.8' }
    ];
  }

  // Record an observation against a hypothesis
  recordObservation(hypothesisId, observation) {
    const hypothesis = this.hypothesisRegistry.get(hypothesisId);
    if (!hypothesis) return null;

    const obs = {
      timestamp: Date.now(),
      data: observation,
      chnopsSnapshot: observation.chnops || null,
      supporting: this._evaluateSupport(hypothesis, observation),
      confidenceDelta: 0
    };

    // Update confidence
    if (obs.supporting) {
      obs.confidenceDelta = 0.05;
    } else {
      obs.confidenceDelta = -0.03;
    }

    hypothesis.observations.push(obs);

    // Check if hypothesis is confirmed or rejected
    const confidence = hypothesis.observations.reduce((sum, o) => sum + o.confidenceDelta, 0.5);

    if (confidence > 0.9) {
      hypothesis.status = 'confirmed';
      this._generateConclusion(hypothesis, 'confirmed');
    } else if (confidence < 0.1) {
      hypothesis.status = 'rejected';
      this._generateConclusion(hypothesis, 'rejected');
    }

    return { observation: obs, currentConfidence: confidence, status: hypothesis.status };
  }

  _evaluateSupport(hypothesis, observation) {
    // Simple evaluation: does the observation match predicted outcomes?
    const predictions = hypothesis.predictedOutcomes;

    // Check if any prediction keyword appears in observation
    return predictions.some(pred => {
      const keywords = pred.toLowerCase().split(' ').filter(w => w.length > 4);
      return keywords.some(kw => observation.description?.toLowerCase().includes(kw));
    });
  }

  _generateConclusion(hypothesis, status) {
    if (status === 'confirmed') {
      hypothesis.conclusion = `The hypothesis is supported by ${hypothesis.observations.length} observations. The ${hypothesis.chnopsSignatures.dyad.dominantElement}-dominant field state reliably predicts ${hypothesis.predictedOutcomes.length > 0 ? hypothesis.predictedOutcomes[0].toLowerCase() : 'behavioral patterns'}. This suggests that biochemical resonance is not merely correlational but may function as a causal mechanism in dyadic coordination. Further research should examine whether these patterns generalize to other elemental profiles.`;
    } else {
      hypothesis.conclusion = `The hypothesis is not supported by observational data. The ${hypothesis.chnopsSignatures.dyad.dominantElement}-dominant field state does not appear to predict the expected behavioral patterns. This may indicate: (1) the CHNOPS model requires refinement for this specific dyad, (2) the prediction timeframe was insufficient, or (3) unmeasured variables (environmental, psychological, or transiting astrological factors) dominate the observed variance. A revised hypothesis with modified metrics is recommended.`;
    }
  }

  // Generate full paper from hypothesis
  generateFullPaper(hypothesisId) {
    const hypothesis = this.hypothesisRegistry.get(hypothesisId);
    if (!hypothesis) return null;

    const paper = {
      title: hypothesis.title,
      authors: ['Autopoetic Resonance Engine', 'Dyad Participants (Anonymous)'],
      date: new Date().toISOString(),
      abstract: hypothesis.abstract,
      sections: {
        introduction: this._generateIntroduction(hypothesis),
        literature_review: this._generateLiteratureReview(hypothesis),
        methodology: hypothesis.methodology,
        results: this._generateResults(hypothesis),
        discussion: this._generateDiscussion(hypothesis),
        conclusion: hypothesis.conclusion || 'Pending further observation...'
      },
      references: this._generateReferences(hypothesis),
      appendix: {
        chnops_data: hypothesis.chnopsSignatures,
        raw_observations: hypothesis.observations,
        statistical_analysis: this._generateStats(hypothesis)
      }
    };

    this.paperArchive.push(paper);
    return paper;
  }

  _generateIntroduction(hypothesis) {
    return `The study of human relationships through quantitative frameworks has historically relied on psychological instruments (attachment theory, Big Five, etc.) that, while validated, operate at a level of abstraction removed from the biochemical substrate of human experience. Recent advances in biosemiotic theory (Hoffmeyer, 1996; Sebeok, 2001) and the codification of Human Design's 64-gate system into amino acid mappings (Ra Uru Hu, 2003) provide a novel pathway: the translation of astrological geometry into molecular stoichiometry.\n\nThis paper presents a longitudinal study of one dyad (n=2) operating within a shared purpose framework. We employ the CHNOPS vector model—mapping Carbon, Hydrogen, Nitrogen, Oxygen, Phosphorus, and Sulfur concentrations derived from amino acid profiles associated with activated Human Design gates—to predict and explain patterns of collaborative behavior, emotional synchronization, and decision-making efficiency.\n\nOur central research question: Can the biochemical resonance field between two individuals, computed from their birth chart geometries, serve as a predictive model for dyadic functioning?`;
  }

  _generateLiteratureReview(hypothesis) {
    return `The theoretical foundation rests on three pillars: (1) the biosemiotic interpretation of DNA as a code for meaning, not merely proteins (Barbieri, 2008); (2) the morphic resonance hypothesis (Sheldrake, 1981) suggesting that patterns, once established, become easier to replicate; and (3) the Human Design system's mapping of 64 I Ching hexagrams to 64 DNA codons (Ra Uru Hu, 1992).\n\nRecent computational astrology (Tarnas, 2006; Perry, 2012) has moved beyond predictive fortune-telling toward archetypal pattern analysis, treating planetary positions as geometric signatures of psychological complexes. Our approach extends this by grounding the geometric in the molecular: each gate activation corresponds to an amino acid, each amino acid to a CHNOPS signature, and the composite signature to a behavioral bias vector.\n\nThe CHNOPS model draws on stoichiometric principles: Carbon (structure), Hydrogen (flow), Nitrogen (catalysis), Oxygen (oxidation/action), Phosphorus (activation/timing), and Sulfur (bridging/bonding). These six elements constitute 99% of biological mass and, we hypothesize, encode the fundamental behavioral dimensions of conscious systems.`;
  }

  _generateResults(hypothesis) {
    const obsCount = hypothesis.observations.length;
    const supporting = hypothesis.observations.filter(o => o.supporting).length;
    const confidence = hypothesis.observations.reduce((sum, o) => sum + o.confidenceDelta, 0.5);

    return `Over the observation period, ${obsCount} data points were collected. Of these, ${supporting} (${obsCount > 0 ? (supporting/obsCount*100).toFixed(1) : 0}%) supported the primary hypothesis, while ${obsCount - supporting} contradicted it or were ambiguous.\n\nThe CHNOPS composite field showed ${hypothesis.chnopsSignatures.dyad.dominantElement} dominance throughout ${obsCount > 0 ? (supporting/obsCount > 0.6 ? 'most of the observation period' : 'only intermittent periods') : 'the observation period'}.\n\nConfidence in the hypothesis: ${(confidence * 100).toFixed(1)}%.\n\nKey findings: ${hypothesis.predictedOutcomes.slice(0, 3).map((p, i) => `\n${i+1}. ${p}`).join('')}`;
  }

  _generateDiscussion(hypothesis) {
    const domEl = hypothesis.chnopsSignatures.dyad.dominantElement;
    return `The ${hypothesis.status === 'confirmed' ? 'confirmation' : 'mixed results'} of this hypothesis raises important questions about the nature of dyadic resonance. If biochemical fields do predict behavioral patterns, we must consider the mechanism: is this a direct causal relationship (the molecular profile literally shapes neurochemistry), or an informational one (the CHNOPS vector serves as a compressed signature of more complex dynamics)?\n\nThe ${domEl}-dominant profile observed suggests ${domEl === 'N' ? 'that this dyad operates as a catalytic system—designed to transform rather than maintain. This has implications for sustainability: high nitrogen systems may require periodic "cooling" phases to prevent burnout.' : 'a system optimized for structural stability. This may enhance long-term consistency but could limit adaptability during rapid environmental change.'}\n\nLimitations include the small sample size (n=2), the subjective nature of self-reported metrics, and the possibility of confirmation bias in observation recording. Future studies should incorporate objective biometric measures (HRV, galvanic skin response, EEG coherence) and expand to larger dyad cohorts.`;
  }

  _generateReferences(hypothesis) {
    return [
      'Barbieri, M. (2008). Biosemiotics: A new understanding of life. Naturwissenschaften, 95(7), 577-599.',
      'Hoffmeyer, J. (1996). Signs of Meaning in the Universe. Indiana University Press.',
      'Ra Uru Hu. (1992). The Human Design System. Human Design America.',
      'Ra Uru Hu. (2003). Codon Mapping: The Transcription Series. Edinburgh.',
      'Sheldrake, R. (1981). A New Science of Life: The Hypothesis of Morphic Resonance. Blond & Briggs.',
      'Tarnas, R. (2006). Cosmos and Psyche: Intimations of a New World View. Viking.',
      'Perry, G. (2012). An Introduction to AstroPsychology. AAP.',
      'Sebeok, T. A. (2001). Global Semiotics. Indiana University Press.'
    ];
  }

  _generateStats(hypothesis) {
    const obs = hypothesis.observations;
    if (obs.length === 0) return { status: 'insufficient_data' };

    const supporting = obs.filter(o => o.supporting).length;
    const confidence = obs.reduce((sum, o) => sum + o.confidenceDelta, 0.5);

    return {
      totalObservations: obs.length,
      supportingObservations: supporting,
      contradictingObservations: obs.length - supporting,
      currentConfidence: confidence,
      confidenceTrajectory: obs.map((o, i) => ({ observation: i + 1, cumulativeConfidence: obs.slice(0, i + 1).reduce((s, ob) => s + ob.confidenceDelta, 0.5) })),
      chiSquare: this._calculateChiSquare(supporting, obs.length - supporting),
      pValue: this._estimatePValue(supporting, obs.length)
    };
  }

  _calculateChiSquare(supporting, contradicting) {
    const total = supporting + contradicting;
    const expected = total / 2;
    return Math.pow(supporting - expected, 2) / expected + Math.pow(contradicting - expected, 2) / expected;
  }

  _estimatePValue(supporting, total) {
    const p = 0.5;
    const k = supporting;
    const n = total;

    if (n > 20) {
      const mean = n * p;
      const std = Math.sqrt(n * p * (1 - p));
      const z = (k - mean) / std;
      return z > 1.96 ? '< 0.05' : z > 1.645 ? '< 0.10' : '> 0.10';
    }
    return 'insufficient_data';
  }

  // Export paper as formatted text
  exportPaper(hypothesisId, format = 'markdown') {
    const paper = this.generateFullPaper(hypothesisId);
    if (!paper) return null;

    if (format === 'markdown') {
      return this._toMarkdown(paper);
    } else if (format === 'latex') {
      return this._toLatex(paper);
    } else if (format === 'html') {
      return this._toHTML(paper);
    }

    return paper;
  }

  _toMarkdown(paper) {
    return `# ${paper.title}

**Authors:** ${paper.authors.join(', ')}  
**Date:** ${paper.date}

## Abstract

${paper.abstract}

## 1. Introduction

${paper.sections.introduction}

## 2. Literature Review

${paper.sections.literature_review}

## 3. Methodology

${JSON.stringify(paper.sections.methodology, null, 2)}

## 4. Results

${paper.sections.results}

## 5. Discussion

${paper.sections.discussion}

## 6. Conclusion

${paper.sections.conclusion}

## References

${paper.references.map(r => `- ${r}`).join('\n')}

## Appendix: CHNOPS Data

\`\`\`json
${JSON.stringify(paper.appendix.chnops_data, null, 2)}
\`\`\`

## Appendix: Statistical Analysis

\`\`\`json
${JSON.stringify(paper.appendix.statistical_analysis, null, 2)}
\`\`\`
`;
  }

  _toLatex(paper) {
    return `\documentclass{article}
\usepackage[utf8]{inputenc}
\title{${paper.title}}
\author{${paper.authors.join(' \and ')}}
\date{${paper.date}}
\begin{document}
\maketitle
\begin{abstract}
${paper.abstract}
\end{abstract}
\section{Introduction}
${paper.sections.introduction}
\section{Literature Review}
${paper.sections.literature_review}
\section{Methodology}
${JSON.stringify(paper.sections.methodology)}
\section{Results}
${paper.sections.results}
\section{Discussion}
${paper.sections.discussion}
\section{Conclusion}
${paper.sections.conclusion}
\begin{thebibliography}{9}
${paper.references.map((r, i) => `\bibitem{${i}} ${r}`).join('\n')}
\end{thebibliography}
\end{document}`;
  }

  _toHTML(paper) {
    return `<!DOCTYPE html>
<html>
<head><title>${paper.title}</title></head>
<body>
<h1>${paper.title}</h1>
<p><strong>Authors:</strong> ${paper.authors.join(', ')}</p>
<p><strong>Date:</strong> ${paper.date}</p>
<h2>Abstract</h2>
<p>${paper.abstract}</p>
<h2>Introduction</h2>
<p>${paper.sections.introduction}</p>
<h2>Results</h2>
<p>${paper.sections.results}</p>
<h2>Discussion</h2>
<p>${paper.sections.discussion}</p>
<h2>Conclusion</h2>
<p>${paper.sections.conclusion}</p>
</body>
</html>`;
  }
}
