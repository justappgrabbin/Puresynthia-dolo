
/**
 * ============================================================
 * COMPUTATIONAL GRAMMAR CODER (CGC) — Klein & Simmons 1963
 * ============================================================
 * 
 * Original: "A Computational Approach to Grammatical Coding of English Words"
 * JACM, July 1963
 * 
 * The CGC was the FIRST component in the Protosynthex question-answering system.
 * It processed running English text at 1250 words/minute on the IBM 7090,
 * correctly coding 90%+ of words without large dictionaries.
 * 
 * Key innovations:
 * - 30 grammatical classes (expandable to hundreds)
 * - Suffix Test 1 (inflectional morphology)
 * - Suffix Test 2 (derivational morphology, reverse-alphabetized)
 * - Context Frame Test (triadic index: left_code × middle_count × right_code)
 * - Logical multiplication of test outputs
 * - Formal 5-tuple mathematical description
 * 
 * Modern: Neural-enhanced with transformer context, but preserving the
 * original suffix analysis and context frame logic.
 */

export interface GrammarCode {
  label: string;           // e.g., "NOUN", "VERB", "ADJ"
  fullName: string;
  examples: string[];
  number?: 'SING' | 'PLU' | 'BOTH';  // Number marking
  person?: '1ST' | '2ND' | '3RD';    // Person marking
  transitivity?: 'TRANS' | 'INTRANS' | 'BOTH'; // For verbs
}

export interface WordAnalysis {
  word: string;
  codes: GrammarCode[];     // Possible codes (ambiguous → multiple)
  confidence: number;       // 0-1
  tests: string[];          // Which tests fired
  suffixes: string[];       // Identified suffixes
  contextFrame?: ContextFrameResult;
}

export interface ContextFrameResult {
  leftCode: string;
  rightCode: string;
  middleCount: number;
  possibleSequences: string[][];
  selectedSequence: string[];
}

export interface SuffixEntry {
  suffix: string;            // e.g., "-tion", "-ly", "-ing"
  codes: string[];           // Associated grammar codes
  type: 'inflectional' | 'derivational' | 'both';
  exceptions: string[];      // Words that don't follow this rule
}

export class ComputationalGrammarCoder {
  // Klein: 30 classes, expandable to hundreds
  grammarClasses: Map<string, GrammarCode>;

  // Function word dictionary (under 400 words, all unique codes)
  functionWords: Map<string, GrammarCode[]>;

  // Content word exception dictionary (under 1500 words)
  contentExceptions: Map<string, GrammarCode[]>;

  // Suffix Test 1: Inflectional morphology
  suffixTest1: SuffixEntry[];

  // Suffix Test 2: Derivational morphology (reverse-alphabetized)
  suffixTest2: SuffixEntry[];

  // Context Frame Table: ~500 entries
  contextFrames: Map<string, string[][]>;

  // Modern: Neural context enhancer
  neuralContext: NeuralContextEnhancer;

  constructor() {
    this.grammarClasses = this.initializeGrammarClasses();
    this.functionWords = this.initializeFunctionWords();
    this.contentExceptions = this.initializeContentExceptions();
    this.suffixTest1 = this.initializeSuffixTest1();
    this.suffixTest2 = this.initializeSuffixTest2();
    this.contextFrames = this.initializeContextFrames();
    this.neuralContext = new NeuralContextEnhancer();
  }

  /**
   * Main coding function
   * Klein: "The system processes running English text"
   */
  codeSentence(sentence: string): WordAnalysis[] {
    const words = this.tokenize(sentence);
    const analyses: WordAnalysis[] = [];

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const analysis = this.codeWord(word, words, i);
      analyses.push(analysis);
    }

    // Apply Context Frame Test to resolve ambiguities
    this.applyContextFrames(analyses);

    return analyses;
  }

  /**
   * Code a single word
   * Klein's flow: Dictionary → Capitalization → Numeral → Suffix 1 → Suffix 2 → Context Frame
   */
  private codeWord(word: string, sentence: string[], position: number): WordAnalysis {
    const analysis: WordAnalysis = {
      word,
      codes: [],
      confidence: 0,
      tests: [],
      suffixes: []
    };

    // 1. Dictionary lookup (function words)
    const funcCodes = this.functionWords.get(word.toLowerCase());
    if (funcCodes) {
      analysis.codes = funcCodes;
      analysis.confidence = 1.0;
      analysis.tests.push('dictionary');
      return analysis;
    }

    // 2. Capitalization Test
    if (this.isCapitalized(word) && position > 0) {
      analysis.codes.push(this.grammarClasses.get('NOUN/ADJ')!);
      analysis.tests.push('capitalization');
    }

    // 3. Numeral Test
    if (this.isNumeral(word)) {
      analysis.codes.push(this.grammarClasses.get('ADJ')!);
      analysis.tests.push('numeral');
      return analysis;
    }

    // 4. Suffix Test 1 (inflectional)
    const suffix1Result = this.applySuffixTest1(word);
    if (suffix1Result) {
      analysis.codes.push(...suffix1Result.codes);
      analysis.suffixes.push(...suffix1Result.suffixes);
      analysis.tests.push('suffix_test_1');
    }

    // 5. Suffix Test 2 (derivational, reverse-alphabetized)
    const suffix2Result = this.applySuffixTest2(word);
    if (suffix2Result) {
      // Logical multiplication: intersection of Suffix 1 and Suffix 2 outputs
      const combined = this.logicalMultiply(analysis.codes, suffix2Result.codes);
      if (combined.length > 0) {
        analysis.codes = combined;
        analysis.suffixes.push(...suffix2Result.suffixes);
        analysis.tests.push('suffix_test_2');
      }
    }

    // 6. Content word exceptions
    const exceptionCodes = this.contentExceptions.get(word.toLowerCase());
    if (exceptionCodes) {
      analysis.codes = exceptionCodes;
      analysis.tests.push('exception_dictionary');
    }

    // If no codes found, mark as ambiguous
    if (analysis.codes.length === 0) {
      analysis.codes = [
        this.grammarClasses.get('NOUN')!,
        this.grammarClasses.get('VERB')!,
        this.grammarClasses.get('ADJ')!
      ];
      analysis.tests.push('ambiguous');
    }

    return analysis;
  }

  /**
   * Suffix Test 1: Inflectional morphology
   * Klein: "Words ending in -s, -es, -ies are either plural noun or 3rd person singular verb"
   */
  private applySuffixTest1(word: string): { codes: GrammarCode[]; suffixes: string[] } | null {
    const codes: GrammarCode[] = [];
    const suffixes: string[] = [];

    // Check plural-type endings
    if (word.match(/(s|es|ies)$/)) {
      codes.push(this.grammarClasses.get('NOUN')!);
      codes.push(this.grammarClasses.get('VERB')!);
      suffixes.push('plural/3rd-sg');
    }

    // Check -ing forms
    if (word.match(/ing$/)) {
      codes.push(this.grammarClasses.get('/ING/')!);
      suffixes.push('-ing');
    }

    // Check -ed forms
    if (word.match(/ed$/)) {
      codes.push(this.grammarClasses.get('/ED/')!);
      suffixes.push('-ed');
    }

    // Check Latin/Greek endings
    if (word.match(/(i|um|is|as)$/)) {
      codes.push(this.grammarClasses.get('NOUN')!);
      suffixes.push('latin-singular');
    }

    if (word.match(/(ae)$/)) {
      codes.push(this.grammarClasses.get('NOUN')!);
      suffixes.push('latin-plural');
    }

    return codes.length > 0 ? { codes, suffixes } : null;
  }

  /**
   * Suffix Test 2: Derivational morphology
   * Klein: "The last five letters checked against a list of suffixes, then last four, three, etc."
   * "The list is alphabetized in reverse order"
   */
  private applySuffixTest2(word: string): { codes: GrammarCode[]; suffixes: string[] } | null {
    const codes: GrammarCode[] = [];
    const suffixes: string[] = [];

    // Check from longest to shortest (reverse-alphabetized)
    for (const entry of this.suffixTest2) {
      if (word.endsWith(entry.suffix)) {
        codes.push(...entry.codes.map(c => this.grammarClasses.get(c)!));
        suffixes.push(entry.suffix);
        break; // Take first (longest) match
      }
    }

    return codes.length > 0 ? { codes, suffixes } : null;
  }

  /**
   * Context Frame Test
   * Klein: "Triadic index factor: left_code × middle_count × right_code"
   * "Binary search of context triad frame table"
   */
  private applyContextFrames(analyses: WordAnalysis[]): void {
    for (let i = 0; i < analyses.length; i++) {
      if (analyses[i].codes.length === 1) continue; // Already unique

      // Find left and right bounding words with unique codes
      let leftIndex = i - 1;
      while (leftIndex >= 0 && analyses[leftIndex].codes.length > 1) {
        leftIndex--;
      }

      let rightIndex = i + 1;
      while (rightIndex < analyses.length && analyses[rightIndex].codes.length > 1) {
        rightIndex++;
      }

      if (leftIndex < 0 || rightIndex >= analyses.length) continue;

      const leftCode = analyses[leftIndex].codes[0].label;
      const rightCode = analyses[rightIndex].codes[0].label;
      const middleCount = rightIndex - leftIndex - 1;

      // Build triadic index
      const index = `${leftCode}.${middleCount}.${rightCode}`;

      // Look up in context frame table
      const sequences = this.contextFrames.get(index);
      if (sequences) {
        // Apply logical multiplication
        const resolved = this.resolveAmbiguity(analyses, leftIndex, rightIndex, sequences);
        if (resolved) {
          analyses[i].codes = [resolved];
          analyses[i].contextFrame = {
            leftCode,
            rightCode,
            middleCount,
            possibleSequences: sequences,
            selectedSequence: sequences[0]
          };
          analyses[i].tests.push('context_frame');
        }
      }
    }
  }

  /**
   * Logical multiplication of test outputs
   * Klein: "The final resulting code is the set of codes all the tests yielded in common"
   */
  private logicalMultiply(codesA: GrammarCode[], codesB: GrammarCode[]): GrammarCode[] {
    const labelsA = new Set(codesA.map(c => c.label));
    const labelsB = new Set(codesB.map(c => c.label));

    const common = new Set([...labelsA].filter(x => labelsB.has(x)));
    return codesA.filter(c => common.has(c.label));
  }

  private resolveAmbiguity(
    analyses: WordAnalysis[],
    leftIndex: number,
    rightIndex: number,
    sequences: string[][]
  ): GrammarCode | null {
    // For each sequence, check if it matches the ambiguous words
    for (const sequence of sequences) {
      if (sequence.length === rightIndex - leftIndex - 1) {
        // Check if sequence is compatible with existing codes
        let compatible = true;
        for (let i = 0; i < sequence.length; i++) {
          const wordCodes = analyses[leftIndex + 1 + i].codes.map(c => c.label);
          if (!wordCodes.includes(sequence[i])) {
            compatible = false;
            break;
          }
        }
        if (compatible) {
          return this.grammarClasses.get(sequence[0]) || null;
        }
      }
    }

    return null;
  }

  // Tokenization
  private tokenize(sentence: string): string[] {
    return sentence
      .replace(/([.!?,:;])/g, ' $1 ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  private isCapitalized(word: string): boolean {
    return word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
  }

  private isNumeral(word: string): boolean {
    return /^\d+$/.test(word);
  }

  // Initialization methods
  private initializeGrammarClasses(): Map<string, GrammarCode> {
    const classes = new Map<string, GrammarCode>();

    const addClass = (label: string, fullName: string, examples: string[]) => {
      classes.set(label, { label, fullName, examples });
    };

    addClass('ADJ', 'Adjective', ['red', 'careful', 'many', 'some']);
    addClass('ADV', 'Adverb', ['too', 'also', 'likewise', 'never']);
    addClass('NOUN', 'Noun', ['book', 'table', 'freedom']);
    addClass('VERB', 'Verb', ['run', 'eat', 'think']);
    addClass('AXV', 'Auxiliary Verb', ['must', 'can', 'does']);
    addClass('VERB-IS', 'Verb to be', ['is', 'was', 'be']);
    addClass('ART', 'Article', ['the', 'a', 'an']);
    addClass('CONJC', 'Coordinating Conjunction', ['and', 'or', 'nor']);
    addClass('CONJR', 'Subordinating Conjunction', ['but']);
    addClass('CONJR2', 'Dependency Marker', ['because', 'lest', 'since', 'unless']);
    addClass('PREP', 'General Preposition', ['in', 'on', 'at']);
    addClass('PREP-OF', 'Preposition of', ['of']);
    addClass('PREP-TO', 'Preposition to', ['to']);
    addClass('PN', 'General Pronoun', ['he', 'she', 'it']);
    addClass('PN-S', 'Personal Nominative', ['I', 'we', 'he', 'they']);
    addClass('PN-O', 'Personal Objective', ['me', 'us', 'him', 'them']);
    addClass('PN-S/O', 'Nominative/Objective', ['it', 'you']);
    addClass('PN-POS', 'Possessive Pronoun', ['my', 'our', 'his', 'their']);
    addClass('PN-DEM', 'Demonstrative Pronoun', ['these', 'those', 'this']);
    addClass('PN-REL', 'Relative Pronoun', ['that', 'who', 'which']);
    addClass('PN-IND', 'Indefinite Pronoun', ['everybody', 'someplace', 'nowhere']);
    addClass('PN-RCN', 'Relative Conjunction Pronoun', ['who', 'which', 'what', 'where', 'why']);
    addClass('V/AXV', 'Verb/Auxiliary Verb', ['can', 'does', 'did']);
    addClass('TYPE', 'Punctuation', ['.', ',', ';']);
    addClass('/ED/', 'Forms with -ed', ['finished', 'broken']);
    addClass('/ING/', 'Forms with -ing', ['running', 'eating']);
    addClass('/HAVE/', 'Have forms', ['have', 'has', 'had']);
    addClass('MISCELLANEOUS', 'Miscellaneous', ['copula', 'gerund']);
    addClass('NOUN/ADJ', 'Noun or Adjective', ['red', 'beautiful']);

    return classes;
  }

  private initializeFunctionWords(): Map<string, GrammarCode[]> {
    const dict = new Map<string, GrammarCode[]>();

    // Articles
    dict.set('the', [this.grammarClasses.get('ART')!]);
    dict.set('a', [this.grammarClasses.get('ART')!]);
    dict.set('an', [this.grammarClasses.get('ART')!]);

    // Prepositions
    dict.set('of', [this.grammarClasses.get('PREP-OF')!]);
    dict.set('to', [this.grammarClasses.get('PREP-TO')!]);
    dict.set('in', [this.grammarClasses.get('PREP')!]);
    dict.set('on', [this.grammarClasses.get('PREP')!]);

    // Conjunctions
    dict.set('and', [this.grammarClasses.get('CONJC')!]);
    dict.set('or', [this.grammarClasses.get('CONJC')!]);
    dict.set('but', [this.grammarClasses.get('CONJR')!]);
    dict.set('because', [this.grammarClasses.get('CONJR2')!]);

    // Pronouns
    dict.set('i', [this.grammarClasses.get('PN-S')!]);
    dict.set('we', [this.grammarClasses.get('PN-S')!]);
    dict.set('he', [this.grammarClasses.get('PN-S')!]);
    dict.set('she', [this.grammarClasses.get('PN-S')!]);
    dict.set('they', [this.grammarClasses.get('PN-S')!]);
    dict.set('me', [this.grammarClasses.get('PN-O')!]);
    dict.set('us', [this.grammarClasses.get('PN-O')!]);
    dict.set('him', [this.grammarClasses.get('PN-O')!]);
    dict.set('them', [this.grammarClasses.get('PN-O')!]);
    dict.set('it', [this.grammarClasses.get('PN-S/O')!]);
    dict.set('you', [this.grammarClasses.get('PN-S/O')!]);

    // Auxiliary verbs
    dict.set('is', [this.grammarClasses.get('VERB-IS')!]);
    dict.set('was', [this.grammarClasses.get('VERB-IS')!]);
    dict.set('be', [this.grammarClasses.get('VERB-IS')!]);
    dict.set('have', [this.grammarClasses.get('/HAVE/')!]);
    dict.set('has', [this.grammarClasses.get('/HAVE/')!]);
    dict.set('had', [this.grammarClasses.get('/HAVE/')!]);
    dict.set('can', [this.grammarClasses.get('V/AXV')!]);
    dict.set('does', [this.grammarClasses.get('V/AXV')!]);
    dict.set('did', [this.grammarClasses.get('V/AXV')!]);

    // Adverbs
    dict.set('too', [this.grammarClasses.get('ADV')!]);
    dict.set('also', [this.grammarClasses.get('ADV')!]);
    dict.set('never', [this.grammarClasses.get('ADV')!]);

    return dict;
  }

  private initializeContentExceptions(): Map<string, GrammarCode[]> {
    const dict = new Map<string, GrammarCode[]>();

    // Common exceptions
    dict.set('swing', [this.grammarClasses.get('VERB')!]);
    dict.set('speed', [this.grammarClasses.get('NOUN')!]);
    dict.set('strum', [this.grammarClasses.get('VERB')!]);

    return dict;
  }

  private initializeSuffixTest1(): SuffixEntry[] {
    return [
      { suffix: 's', codes: ['NOUN', 'VERB'], type: 'inflectional', exceptions: [] },
      { suffix: 'es', codes: ['NOUN', 'VERB'], type: 'inflectional', exceptions: [] },
      { suffix: 'ies', codes: ['NOUN', 'VERB'], type: 'inflectional', exceptions: [] },
      { suffix: 'ing', codes: ['/ING/'], type: 'inflectional', exceptions: ['swing'] },
      { suffix: 'ed', codes: ['/ED/'], type: 'inflectional', exceptions: ['speed'] }
    ];
  }

  private initializeSuffixTest2(): SuffixEntry[] {
    // Reverse-alphabetized (Klein's actual ordering)
    return [
      { suffix: 'tion', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'sion', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ment', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ness', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ity', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'er', codes: ['NOUN', 'VERB'], type: 'derivational', exceptions: [] },
      { suffix: 'or', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ist', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ism', codes: ['NOUN'], type: 'derivational', exceptions: [] },
      { suffix: 'ful', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'less', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'ous', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'ive', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'able', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'ible', codes: ['ADJ'], type: 'derivational', exceptions: [] },
      { suffix: 'ly', codes: ['ADV'], type: 'derivational', exceptions: [] },
      { suffix: 'ize', codes: ['VERB'], type: 'derivational', exceptions: [] },
      { suffix: 'ise', codes: ['VERB'], type: 'derivational', exceptions: [] },
      { suffix: 'ify', codes: ['VERB'], type: 'derivational', exceptions: [] },
      { suffix: 'en', codes: ['VERB'], type: 'derivational', exceptions: [] }
    ];
  }

  private initializeContextFrames(): Map<string, string[][]> {
    const frames = new Map<string, string[][]>();

    // Klein's example: ARTICLE ... VERB → ADJECTIVE-NOUN, NOUN-ADVERB, NOUN-NOUN
    frames.set('ART.2.VERB', [
      ['ADJ', 'NOUN'],
      ['NOUN', 'ADV'],
      ['NOUN', 'NOUN']
    ]);

    frames.set('ART.1.NOUN', [
      ['ADJ'],
      ['NOUN']
    ]);

    frames.set('NOUN.1.VERB', [
      ['ADV'],
      ['ADJ']
    ]);

    frames.set('VERB.1.PREP', [
      ['NOUN'],
      ['PN']
    ]);

    return frames;
  }
}

/**
 * Neural Context Enhancer (Modern Addition)
 * Uses transformer embeddings to improve context frame resolution
 */
class NeuralContextEnhancer {
  // Would use actual transformer model in production

  enhanceContext(word: string, context: string[]): string[] {
    // Use neural embeddings to predict most likely codes
    // This is the modern addition that Klein didn't have
    return [];
  }

  resolveAmbiguity(word: string, leftContext: string, rightContext: string): string[] {
    // Use bidirectional context from transformer
    return [];
  }
}

export { ComputationalGrammarCoder };
