# Recursive Five-Dimensional Grammar × 64-State Research Report

## Executive result

The strongest functional mapping found is:

| Linguistic function | Structural dimension | Why |
|---|---|---|
| Phonology | **Movement** | realizes/transmits distinctions through ordered contrast and temporal/signal pattern |
| Morphology | **Evolution** | builds and transforms forms; smaller units become larger units and may change category/function |
| Syntax | **Design** | specifies positional, hierarchical, dependency, compatibility, and recursion architecture |
| Semantics | **Being** | stabilizes what a configuration denotes/construes as its content or identity |
| Pragmatics | **Space** | supplies the contextual field—speaker, goal, environment, discourse state, perspective—within which meaning resolves |

This is a **proposed synthesis derived from established linguistic functions**, not an existing five-dimensional theory in linguistics.

## 1. Five-dimensional linguistic definition

**Phonology** governs contrastive sound-pattern organization. At fine scale it uses features and phonemes; at larger prosodic scales it organizes syllables, feet, words, phrases, and intonation. Its invariants are contrast systems and well-formed realization constraints; its variables are feature values, segmental sequences, stress, tone, and prosodic grouping.

**Morphology** governs the internal formation and transformation of words and word-like units from morphemes, roots, stems, and affixes. It includes composition, inflection, derivation, allomorphy, category constraints, and ordering.

**Syntax** governs relational organization: constituency, dependency, order, hierarchy, agreement, binding, movement, substitution, and recursion. Syntax is therefore best abstracted as the design/relational dimension.

**Semantics** governs encoded/construed meaning: reference, predication, composition, entailment, roles, scope, and lexical/constructional meaning.

**Pragmatics** governs interpretation in use: context, speaker/hearer assumptions, goals, discourse state, deixis, implicature, relevance, and perspective.

## 2. Cross-scale mapping

The mapping remains coherent only if the five labels are treated as **functions**, not literal domains.

| Scale | Movement / Phonology-function | Evolution / Morphology-function | Design / Syntax-function | Being / Semantics-function | Space / Pragmatics-function |
|---|---|---|---|---|---|
| binary distinction | contrast/change 0↔1 | pairings become features | positional bit relation | current value identity | encoding/context |
| feature | feature opposition | bundle formation | compatibility/dependency | feature contribution | environment selecting interpretation |
| grapheme/letter | discriminable symbol pattern | letters combine into orthographic units | legal adjacency/order | symbol identity/value | script/language context |
| phoneme | contrast/sequencing | phonemes compose syllables/morphs | phonotactic relations | lexical distinctions enabled | speaker/listener context |
| morpheme | allomorphic realization | stem/affix composition | attachment/order constraints | grammatical/lexical meaning | construction/context |
| syllable | onset-rime/prosody | syllables compose larger forms | phonotactic hierarchy | lexical contrast contribution | speech/register context |
| word | phonological realization | derivation/inflection | category/dependency slots | lexical/constructional meaning | discourse use |
| phrase/clause | prosody/information flow | construction expansion | hierarchy/dependency/binding | compositional proposition | discourse/speaker context |
| sentence | intonation/linear realization | clause combination | sentence architecture | proposition | utterance force/context |
| discourse | rhythm/turn sequencing | discourse units accumulate | coherence/dependency graph | discourse model | social/interpersonal situation |
| six-bit state | bit contrast/boundaries | lines→trigrams→hexagram | six ordered slots/relations | exact state identity | neighborhood/operator/context |
| state sequence | transition rhythm | states compose chains | legal transition syntax | sequence-level interpretation | task/environment |
| superstate | boundary signal between units | sequences become atoms | recursive graph/hierarchy | superstate identity | embedding field |

## 3. Atomic hierarchy

There is no universal single "smallest linguistic atom." Atomicity is relative to the theory and scale.

- **Bit/binary distinction**: minimal formal distinction.
- **Distinctive feature**: subphonemic contrastive component.
- **Phone**: concrete speech realization.
- **Phoneme**: contrastive sound category.
- **Grapheme/letter**: writing-system units; not universal to language.
- **Morpheme**: common candidate for smallest meaningful grammatical unit, though morphology is not always perfectly segmentable.
- **Syllable**: prosodic unit, not necessarily meaningful.
- **Lexeme/word/token**: lexical or occurrence-level atoms depending on analysis.
- **Semantic feature/primitive**: theory-dependent representational units.
- **Constituent/relation**: syntactic atoms may be nodes, categories, dependency arcs, or feature structures.

Thus the recursive rule is viable as an architectural abstraction:
`A_(n+1) = stabilize(F(A_n^1 ... A_n^k; M,E,B,D,S))`.
But linguistics does not establish one universal atomization across all levels.

## 4. Grammar theories as operators/representations

See `grammar_theory_taxonomy.csv`. The central result is that grammar theories are not extra dimensions. They specify different **representations, constraints, composition operations, transition rules, contextual mechanisms, and processing assumptions** over the same material.

## 5. Five-dimensional rule set

### Movement / phonological function
- Distinction: units must remain discriminable where the system requires contrast.
- Sequencing: realization occurs in an ordered channel.
- Boundary: changes in value or prosodic grouping create detectable boundaries.
- Transformation: realization may vary while higher identity remains stable.
- Invariant: contrastive function can survive changes of physical realization.

### Evolution / morphological function
- Composition: smaller stable units combine into larger units.
- Derivation: composition may create a new type/category.
- Inflection: state may change while core lexical identity persists.
- Decomposition: larger units expose internal constituents.
- Invariant: provenance of components is recoverable in a lossless formal model.

### Design / syntactic function
- Position and dependency are distinct from mere adjacency.
- Composition is typed: not every unit can combine in every slot.
- Hierarchy supports recursion and embedding.
- Substitution is legal only under compatibility conditions.
- A structural transformation must preserve whichever invariants the grammar declares.

### Being / semantic function
- A state has a stable identity at a chosen scale.
- Composition may yield meaning not reducible to concatenation alone.
- Multiple forms may map to related meanings and vice versa.
- Interpretation must distinguish encoded content from contextual enrichment.

### Space / pragmatic function
- Context selects among otherwise compatible interpretations/actions.
- Perspective may change interpretation while leaving structure unchanged.
- Discourse history becomes part of the state-selection field.
- Context change and physical state change are separate operators.

## 6. Recursive composition model

Let `U_n` be a typed unit at scale n.

`Compose_n(U_n^1...U_n^k, C) -> U_(n+1)`

`Decompose_(n+1)(U_(n+1)) -> {U_n^1...U_n^k, relations}`

Required invariants:
1. scale/type metadata survives;
2. child relations are recoverable when decomposition is intended to be lossless;
3. context is stored separately from intrinsic structure;
4. a superunit can be treated atomically without destroying its internal graph;
5. interpretation and structural mutation remain distinct.

## 7. The 64-state layer

A six-binary-position system is exactly the vertex set `{0,1}^6`, containing 64 states. The cleanest primitive transition grammar is the six-dimensional hypercube **Q6**:

`T_i(x) = x XOR 2^i`, for i = 0..5.

Every state has exactly six primitive neighbors. Compound operators include:

- complement `C(x)=x XOR 63`;
- reversal `R`, reversing line order;
- trigram decomposition;
- trigram recomposition;
- arbitrary multi-line change represented as composition of primitive flips.

This creates a mathematically complete transition graph without importing semantic claims.

## 8. Hexagrams

Every six-bit configuration corresponds structurally to one six-line yin/yang pattern. The attached corpus maps all 64 binary configurations to King Wen hexagram identities while keeping **binary structure** separate from **traditional semantic interpretation**.

## 9. Codons

The genetic code also has 64 states, but for a different combinatorial reason: three positions × four nucleotide choices = `4^3=64`. A codon↔hexagram bijection can be manufactured by assigning each nucleotide a two-bit code, but there are multiple possible assignments. Therefore:

- same cardinality: **established**;
- state-space isomorphism after chosen encoding: **derived**;
- unique natural codon↔hexagram pairing: **unsupported**;
- shared semantics: **unsupported/speculative**.

## 10. Do the 64 states form a language?

**Not by cardinality alone.** The 64 states are an alphabet/state set plus a primitive transition graph. A language requires additional sequence constraints or generative rules.

The current model therefore distinguishes:
- **state grammar**: legal internal six-bit configurations — all 64 are well formed;
- **transition grammar**: primitive one-line moves — Q6 edges;
- **sequence grammar**: not established until independent rules/corpus define which state chains are licensed;
- **context grammar**: an interpretation layer that may change readings without changing state.

This prevents the common error of mistaking a state inventory for a generative language.

## 11. Cross-scale invariants that survived

Strongest recurrent candidates:
- distinction/opposition;
- adjacency;
- ordered position;
- composition/decomposition;
- containment;
- dependency;
- compatibility/exclusion;
- boundary formation;
- substitution under type constraints;
- transformation with invariants;
- recursion;
- complement/inversion where defined;
- context resolution;
- structure/context separation.

These recur widely enough to support the recursive architecture, though their concrete realization differs by scale.

## 12. Machine-readable implementation

Files:
- `states_64.json` — complete individually instantiated states.
- `states_64.csv` — compact state table.
- `transitions_Q6.csv` — all 384 directed primitive transitions (192 undirected edges).
- `grammar_theory_taxonomy.csv`.
- `provenance.json`.
- `generative_tests.json`.
- `contradiction_register.md`.

## 13. Final recursive grammar

The strongest defensible conclusion is **yes, as a formal synthesis, not yet as a discovered universal law of language**.

One coherent recursive architecture can use the five functions:

`X^(n) = (Movement, Evolution, Being, Design, Space)`

with:
- Movement = distinguish/realize/sequence,
- Evolution = compose/transform/decompose,
- Being = stabilize identity/meaning,
- Design = constrain relations/architecture,
- Space = contextualize/select/resolve.

A stabilized result can become an atom at the next scale. That recursion is compatible with many established linguistic phenomena—feature bundles, morpheme composition, constituency, discourse organization, and formal state systems—but the claim that these five functions are *the* universal ontology remains a proposed synthesis requiring further empirical testing.

The 64-state layer is therefore best treated as a **test bed**: mathematically exact, recursively decomposable, composition-ready, and strict enough to expose where analogy ends and evidence begins.
