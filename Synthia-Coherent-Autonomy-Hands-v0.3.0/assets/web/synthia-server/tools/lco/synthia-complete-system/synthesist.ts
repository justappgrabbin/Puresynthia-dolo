// ============================================================
// HUB 5: SYNTHESIST - Research Synthesizer
// Based on Sheldon Klein's evidence synthesis methodology
// Systematic review automation, claim verification, knowledge graph construction
// Modernized: Evidence synthesis, claim verification, knowledge graph construction
// ============================================================

export interface ResearchCorpus {
  id: string;
  title: string;
  documents: ResearchDocument[];
  metadata: CorpusMetadata;
  knowledgeGraph: KnowledgeGraph;
  synthesis: SynthesisResult;
}

export interface ResearchDocument {
  id: string;
  title: string;
  authors: string[];
  year: number;
  abstract: string;
  fullText: string;
  claims: DocumentClaim[];
  methodology: string;
  sampleSize?: number;
  effectSize?: number;
  confidenceInterval?: [number, number];
  pValue?: number;
  quality: number;  // 0-1 quality score
  citations: string[];
  citedBy: string[];
  domain: string;
  keywords: string[];
}

export interface DocumentClaim {
  id: string;
  text: string;
  type: 'finding' | 'hypothesis' | 'conclusion' | 'methodology' | 'limitation';
  confidence: number;
  evidence: string[];
  contradictions: string[];
  supports: string[];
  sourceParagraph: number;
  statisticalSupport?: {
    test: string;
    statistic: number;
    pValue: number;
    effectSize: number;
  };
}

export interface KnowledgeGraph {
  nodes: Map<string, KnowledgeNode>;
  edges: KnowledgeEdge[];
  clusters: string[][];  // Connected components
  centralities: Map<string, number>;
  communities: Map<string, string[]>;  // community -> node ids
}

export interface KnowledgeNode {
  id: string;
  label: string;
  type: 'claim' | 'concept' | 'method' | 'author' | 'domain' | 'evidence';
  properties: Record<string, any>;
  confidence: number;
  frequency: number;
  embeddings: number[];
}

export interface KnowledgeEdge {
  id: string;
  from: string;
  to: string;
  type: 'supports' | 'contradicts' | 'cites' | 'related_to' | 'part_of' | 'specializes' | 'generalizes';
  weight: number;
  evidence: string[];
  confidence: number;
}

export interface SynthesisResult {
  summary: string;
  keyFindings: string[];
  consensusAreas: string[];
  controversyAreas: string[];
  gaps: string[];
  recommendations: string[];
  confidence: number;
  methodology: string;
  limitations: string[];
}

export interface ClaimVerification {
  claimId: string;
  claimText: string;
  verdict: 'verified' | 'partially_verified' | 'unverified' | 'contradicted' | 'inconclusive';
  evidence: VerificationEvidence[];
  confidence: number;
  supportingDocuments: string[];
  contradictingDocuments: string[];
  reasoning: string;
}

export interface VerificationEvidence {
  documentId: string;
  documentTitle: string;
  relevantText: string;
  relevanceScore: number;
  direction: 'support' | 'contradict' | 'neutral';
  quality: number;
}

// ============================================================
// SYNTHESIST ENGINE - Research Synthesis
// ============================================================

export class SynthesistEngine {
  private corpora: Map<string, ResearchCorpus> = new Map();
  private documents: Map<string, ResearchDocument> = new Map();
  private knowledgeGraphs: Map<string, KnowledgeGraph> = new Map();
  private verifications: Map<string, ClaimVerification> = new Map();
  private synthesisHistory: SynthesisResult[] = [];

  // Quality thresholds
  private qualityThreshold = 0.3;
  private confidenceThreshold = 0.5;

  constructor() {
    console.log('[SYNTHESIST] Initialized - Research Synthesizer');
  }

  // ============================================================
  // CORPUS INGESTION
  // ============================================================

  async ingestCorpus(documents: ResearchDocument[], metadata: CorpusMetadata): Promise<ResearchCorpus> {
    console.log(`[SYNTHESIST] Ingesting corpus: ${documents.length} documents`);

    // Process each document
    for (const doc of documents) {
      await this.processDocument(doc);
    }

    // Build knowledge graph
    const knowledgeGraph = await this.buildKnowledgeGraph(documents);

    // Perform synthesis
    const synthesis = await this.synthesize(documents, knowledgeGraph);

    const corpus: ResearchCorpus = {
      id: `corpus_${Date.now()}`,
      title: metadata.title,
      documents,
      metadata,
      knowledgeGraph,
      synthesis
    };

    this.corpora.set(corpus.id, corpus);
    this.knowledgeGraphs.set(corpus.id, knowledgeGraph);

    console.log(`[SYNTHESIST] Corpus ingested: ${corpus.id}`);
    return corpus;
  }

  private async processDocument(doc: ResearchDocument): Promise<void> {
    // Extract claims from document
    doc.claims = await this.extractClaims(doc);

    // Calculate quality score
    doc.quality = this.calculateDocumentQuality(doc);

    // Store
    this.documents.set(doc.id, doc);
  }

  private async extractClaims(doc: ResearchDocument): Promise<DocumentClaim[]> {
    const claims: DocumentClaim[] = [];

    // Split into paragraphs
    const paragraphs = doc.fullText.split(/\n\n+/);

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      // Identify claim sentences
      const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 20);

      for (const sentence of sentences) {
        const claimType = this.classifyClaimType(sentence);

        if (claimType) {
          const claim: DocumentClaim = {
            id: `claim_${doc.id}_${claims.length}`,
            text: sentence.trim(),
            type: claimType,
            confidence: this.estimateClaimConfidence(sentence, doc),
            evidence: [],
            contradictions: [],
            supports: [],
            sourceParagraph: i,
            statisticalSupport: this.extractStatisticalSupport(sentence)
          };

          claims.push(claim);
        }
      }
    }

    return claims;
  }

  private classifyClaimType(sentence: string): DocumentClaim['type'] | null {
    const lower = sentence.toLowerCase();

    // Finding indicators
    if (/\b(found|observed|discovered|showed|demonstrated|revealed)\b/.test(lower)) {
      return 'finding';
    }

    // Hypothesis indicators
    if (/\b(hypothesize|propose|suggest|may|might|could|possibly)\b/.test(lower)) {
      return 'hypothesis';
    }

    // Conclusion indicators
    if (/\b(conclude|conclusion|therefore|thus|in summary|overall)\b/.test(lower)) {
      return 'conclusion';
    }

    // Methodology indicators
    if (/\b(method|approach|procedure|technique|used|employed)\b/.test(lower)) {
      return 'methodology';
    }

    // Limitation indicators
    if (/\b(limitation|limited|constraint|caveat|future work|further research)\b/.test(lower)) {
      return 'limitation';
    }

    return null;
  }

  private estimateClaimConfidence(sentence: string, doc: ResearchDocument): number {
    let confidence = 0.5;

    // Strong language = higher confidence
    if (/\b(definitely|certainly|clearly|strongly|significantly|robustly)\b/i.test(sentence)) {
      confidence += 0.2;
    }

    // Tentative language = lower confidence
    if (/\b(possibly|maybe|perhaps|might|could|suggest)\b/i.test(sentence)) {
      confidence -= 0.2;
    }

    // Statistical support increases confidence
    if (doc.pValue && doc.pValue < 0.05) {
      confidence += 0.1;
    }

    // Sample size affects confidence
    if (doc.sampleSize && doc.sampleSize > 100) {
      confidence += 0.1;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  private extractStatisticalSupport(sentence: string): DocumentClaim['statisticalSupport'] | undefined {
    // Extract statistical information from sentence
    const pValueMatch = sentence.match(/p\s*[<>=]\s*([0-9.]+)/i);
    const effectSizeMatch = sentence.match(/d\s*[=:]\s*([0-9.]+)/i);
    const testMatch = sentence.match(/(t-test|ANOVA|regression|chi-square|correlation)/i);

    if (pValueMatch || effectSizeMatch) {
      return {
        test: testMatch ? testMatch[0] : 'unspecified',
        statistic: 0,
        pValue: pValueMatch ? parseFloat(pValueMatch[1]) : 1.0,
        effectSize: effectSizeMatch ? parseFloat(effectSizeMatch[1]) : 0
      };
    }

    return undefined;
  }

  private calculateDocumentQuality(doc: ResearchDocument): number {
    let quality = 0.5;

    // Has abstract
    if (doc.abstract && doc.abstract.length > 50) quality += 0.1;

    // Has methodology
    if (doc.methodology && doc.methodology.length > 20) quality += 0.1;

    // Has sample size
    if (doc.sampleSize && doc.sampleSize > 0) quality += 0.1;

    // Has effect size
    if (doc.effectSize !== undefined) quality += 0.1;

    // Has p-value
    if (doc.pValue !== undefined) quality += 0.05;

    // Citations
    if (doc.citations.length > 0) quality += 0.05;

    // Recent (within 10 years)
    if (doc.year > new Date().getFullYear() - 10) quality += 0.05;

    return Math.min(1, quality);
  }

  // ============================================================
  // KNOWLEDGE GRAPH CONSTRUCTION
  // ============================================================

  private async buildKnowledgeGraph(documents: ResearchDocument[]): Promise<KnowledgeGraph> {
    console.log(`[SYNTHESIST] Building knowledge graph from ${documents.length} documents`);

    const nodes = new Map<string, KnowledgeNode>();
    const edges: KnowledgeEdge[] = [];

    // Create claim nodes
    for (const doc of documents) {
      for (const claim of doc.claims) {
        const node: KnowledgeNode = {
          id: claim.id,
          label: claim.text.substring(0, 100),
          type: 'claim',
          properties: {
            documentId: doc.id,
            confidence: claim.confidence,
            claimType: claim.type
          },
          confidence: claim.confidence,
          frequency: 1,
          embeddings: [] // Would be filled by embedding model
        };

        nodes.set(node.id, node);
      }

      // Create author nodes
      for (const author of doc.authors) {
        const authorId = `author_${author.replace(/\s+/g, '_')}`;
        if (!nodes.has(authorId)) {
          nodes.set(authorId, {
            id: authorId,
            label: author,
            type: 'author',
            properties: {},
            confidence: 1.0,
            frequency: 1,
            embeddings: []
          });
        }
      }

      // Create domain nodes
      if (!nodes.has(`domain_${doc.domain}`)) {
        nodes.set(`domain_${doc.domain}`, {
          id: `domain_${doc.domain}`,
          label: doc.domain,
          type: 'domain',
          properties: {},
          confidence: 1.0,
          frequency: 1,
          embeddings: []
        });
      }
    }

    // Create edges
    for (const doc of documents) {
      for (const claim of doc.claims) {
        // Link claim to author
        for (const author of doc.authors) {
          const authorId = `author_${author.replace(/\s+/g, '_')}`;
          edges.push({
            id: `edge_${edges.length}`,
            from: claim.id,
            to: authorId,
            type: 'cites',
            weight: 1.0,
            evidence: [doc.id],
            confidence: 1.0
          });
        }

        // Link claim to domain
        edges.push({
          id: `edge_${edges.length}`,
          from: claim.id,
          to: `domain_${doc.domain}`,
          type: 'part_of',
          weight: 1.0,
          evidence: [doc.id],
          confidence: 1.0
        });

        // Cross-document links (support/contradict)
        for (const otherDoc of documents) {
          if (otherDoc.id === doc.id) continue;

          for (const otherClaim of otherDoc.claims) {
            const relationship = this.determineClaimRelationship(claim, otherClaim);
            if (relationship) {
              edges.push({
                id: `edge_${edges.length}`,
                from: claim.id,
                to: otherClaim.id,
                type: relationship,
                weight: this.calculateRelationshipStrength(claim, otherClaim),
                evidence: [doc.id, otherDoc.id],
                confidence: Math.min(claim.confidence, otherClaim.confidence)
              });
            }
          }
        }
      }
    }

    // Calculate clusters and centralities
    const clusters = this.findClusters(nodes, edges);
    const centralities = this.calculateCentralities(nodes, edges);
    const communities = this.detectCommunities(nodes, edges);

    return {
      nodes,
      edges,
      clusters,
      centralities,
      communities
    };
  }

  private determineClaimRelationship(a: DocumentClaim, b: DocumentClaim): KnowledgeEdge['type'] | null {
    // Check for semantic similarity
    const similarity = this.calculateSemanticSimilarity(a.text, b.text);

    if (similarity > 0.8) {
      // Very similar - check if they agree or disagree
      const agreement = this.checkAgreement(a, b);
      return agreement ? 'supports' : 'contradicts';
    }

    if (similarity > 0.5) {
      return 'related_to';
    }

    return null;
  }

  private calculateSemanticSimilarity(textA: string, textB: string): number {
    // Simple word overlap similarity
    const wordsA = new Set(textA.toLowerCase().split(/\s+/));
    const wordsB = new Set(textB.toLowerCase().split(/\s+/));

    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);

    return intersection.size / union.size;
  }

  private checkAgreement(a: DocumentClaim, b: DocumentClaim): boolean {
    // Check if claims agree or contradict
    // Simple heuristic: check for negation words
    const aNegated = /\b(not|no|never|none|without|against|contradict|refute)\b/i.test(a.text);
    const bNegated = /\b(not|no|never|none|without|against|contradict|refute)\b/i.test(b.text);

    // If both negated or both not negated, they agree
    return aNegated === bNegated;
  }

  private calculateRelationshipStrength(a: DocumentClaim, b: DocumentClaim): number {
    const similarity = this.calculateSemanticSimilarity(a.text, b.text);
    const confidenceProduct = a.confidence * b.confidence;
    return similarity * confidenceProduct;
  }

  private findClusters(nodes: Map<string, KnowledgeNode>, edges: KnowledgeEdge[]): string[][] {
    // Union-find for connected components
    const parent = new Map<string, string>();

    for (const id of nodes.keys()) {
      parent.set(id, id);
    }

    const find = (x: string): string => {
      if (parent.get(x) !== x) {
        parent.set(x, find(parent.get(x)!));
      }
      return parent.get(x)!;
    };

    const union = (x: string, y: string) => {
      parent.set(find(x), find(y));
    };

    for (const edge of edges) {
      union(edge.from, edge.to);
    }

    const clusters = new Map<string, string[]>();
    for (const id of nodes.keys()) {
      const root = find(id);
      if (!clusters.has(root)) clusters.set(root, []);
      clusters.get(root)!.push(id);
    }

    return Array.from(clusters.values());
  }

  private calculateCentralities(nodes: Map<string, KnowledgeNode>, edges: KnowledgeEdge[]): Map<string, number> {
    // Degree centrality
    const centrality = new Map<string, number>();

    for (const [id] of nodes) {
      centrality.set(id, 0);
    }

    for (const edge of edges) {
      centrality.set(edge.from, (centrality.get(edge.from) || 0) + edge.weight);
      centrality.set(edge.to, (centrality.get(edge.to) || 0) + edge.weight);
    }

    // Normalize
    const maxCentrality = Math.max(...centrality.values());
    if (maxCentrality > 0) {
      for (const [id, value] of centrality) {
        centrality.set(id, value / maxCentrality);
      }
    }

    return centrality;
  }

  private detectCommunities(nodes: Map<string, KnowledgeNode>, edges: KnowledgeEdge[]): Map<string, string[]> {
    // Simple community detection by domain
    const communities = new Map<string, string[]>();

    for (const [id, node] of nodes) {
      if (node.type === 'claim') {
        const domain = node.properties.documentId || 'unknown';
        if (!communities.has(domain)) communities.set(domain, []);
        communities.get(domain)!.push(id);
      }
    }

    return communities;
  }

  // ============================================================
  // SYNTHESIS
  // ============================================================

  private async synthesize(documents: ResearchDocument[], knowledgeGraph: KnowledgeGraph): Promise<SynthesisResult> {
    console.log(`[SYNTHESIST] Synthesizing ${documents.length} documents`);

    // Extract key findings
    const keyFindings = this.extractKeyFindings(documents, knowledgeGraph);

    // Find consensus areas
    const consensusAreas = this.findConsensusAreas(documents, knowledgeGraph);

    // Find controversy areas
    const controversyAreas = this.findControversyAreas(knowledgeGraph);

    // Identify gaps
    const gaps = this.identifyGaps(documents, knowledgeGraph);

    // Generate recommendations
    const recommendations = this.generateRecommendations(gaps, controversyAreas);

    // Calculate overall confidence
    const confidence = this.calculateSynthesisConfidence(documents);

    const synthesis: SynthesisResult = {
      summary: this.generateSummary(keyFindings, consensusAreas, controversyAreas),
      keyFindings,
      consensusAreas,
      controversyAreas,
      gaps,
      recommendations,
      confidence,
      methodology: 'Systematic review with knowledge graph construction',
      limitations: [
        'Automated claim extraction may miss nuanced arguments',
        'Semantic similarity based on word overlap is limited',
        'Quality assessment is heuristic-based'
      ]
    };

    this.synthesisHistory.push(synthesis);
    return synthesis;
  }

  private extractKeyFindings(documents: ResearchDocument[], knowledgeGraph: KnowledgeGraph): string[] {
    const findings: string[] = [];

    // Find high-confidence claims with strong support
    for (const [id, node] of knowledgeGraph.nodes) {
      if (node.type === 'claim' && node.confidence > 0.7) {
        const supportingEdges = knowledgeGraph.edges.filter(e => 
          e.to === id && e.type === 'supports'
        );

        if (supportingEdges.length >= 2) {
          findings.push(node.label);
        }
      }
    }

    // Deduplicate
    return [...new Set(findings)].slice(0, 10);
  }

  private findConsensusAreas(documents: ResearchDocument[], knowledgeGraph: KnowledgeGraph): string[] {
    const consensus: string[] = [];

    // Find clusters where most claims agree
    for (const cluster of knowledgeGraph.clusters) {
      const claims = cluster.filter(id => knowledgeGraph.nodes.get(id)?.type === 'claim');
      if (claims.length < 3) continue;

      const contradictingEdges = knowledgeGraph.edges.filter(e =>
        claims.includes(e.from) && claims.includes(e.to) && e.type === 'contradicts'
      );

      const agreementRatio = 1 - (contradictingEdges.length / (claims.length * (claims.length - 1) / 2));

      if (agreementRatio > 0.8) {
        const representative = knowledgeGraph.nodes.get(claims[0]);
        if (representative) {
          consensus.push(representative.label);
        }
      }
    }

    return consensus;
  }

  private findControversyAreas(knowledgeGraph: KnowledgeGraph): string[] {
    const controversies: string[] = [];

    // Find areas with many contradicting edges
    const edgeCounts = new Map<string, number>();

    for (const edge of knowledgeGraph.edges) {
      if (edge.type === 'contradicts') {
        const key = `${edge.from}-${edge.to}`;
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
    }

    // Find nodes involved in most contradictions
    const contradictionCounts = new Map<string, number>();
    for (const [key, count] of edgeCounts) {
      const [from, to] = key.split('-');
      contradictionCounts.set(from, (contradictionCounts.get(from) || 0) + count);
      contradictionCounts.set(to, (contradictionCounts.get(to) || 0) + count);
    }

    const sorted = [...contradictionCounts.entries()].sort((a, b) => b[1] - a[1]);

    for (const [nodeId] of sorted.slice(0, 5)) {
      const node = knowledgeGraph.nodes.get(nodeId);
      if (node) {
        controversies.push(node.label);
      }
    }

    return controversies;
  }

  private identifyGaps(documents: ResearchDocument[], knowledgeGraph: KnowledgeGraph): string[] {
    const gaps: string[] = [];

    // Check for underrepresented domains
    const domainCounts = new Map<string, number>();
    for (const doc of documents) {
      domainCounts.set(doc.domain, (domainCounts.get(doc.domain) || 0) + 1);
    }

    for (const [domain, count] of domainCounts) {
      if (count < documents.length * 0.1) {
        gaps.push(`Limited research in ${domain} (${count} documents)`);
      }
    }

    // Check for methodological gaps
    const methods = new Set(documents.map(d => d.methodology));
    if (methods.size < 3) {
      gaps.push('Limited methodological diversity');
    }

    // Check for temporal gaps
    const years = documents.map(d => d.year).sort((a, b) => a - b);
    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i - 1] > 5) {
        gaps.push(`Research gap between ${years[i - 1]} and ${years[i]}`);
      }
    }

    return gaps;
  }

  private generateRecommendations(gaps: string[], controversies: string[]): string[] {
    const recommendations: string[] = [];

    for (const gap of gaps) {
      if (gap.includes('Limited research')) {
        recommendations.push(`Conduct more research in underrepresented areas`);
      }
      if (gap.includes('methodological')) {
        recommendations.push(`Employ diverse methodological approaches`);
      }
    }

    for (const controversy of controversies) {
      recommendations.push(`Resolve controversy: ${controversy.substring(0, 50)}...`);
    }

    return [...new Set(recommendations)];
  }

  private calculateSynthesisConfidence(documents: ResearchDocument[]): number {
    if (documents.length === 0) return 0;

    const avgQuality = documents.reduce((sum, d) => sum + d.quality, 0) / documents.length;
    const avgClaimConfidence = documents.reduce((sum, d) => 
      sum + d.claims.reduce((s, c) => s + c.confidence, 0) / (d.claims.length || 1), 0
    ) / documents.length;

    return (avgQuality + avgClaimConfidence) / 2;
  }

  private generateSummary(findings: string[], consensus: string[], controversies: string[]): string {
    let summary = `This synthesis of research identified ${findings.length} key findings. `;

    if (consensus.length > 0) {
      summary += `There is strong consensus on ${consensus.length} areas. `;
    }

    if (controversies.length > 0) {
      summary += `However, ${controversies.length} areas remain controversial. `;
    }

    summary += 'Further research is needed to resolve outstanding questions.';

    return summary;
  }

  // ============================================================
  // CLAIM VERIFICATION
  // ============================================================

  async verifyClaim(claimText: string, corpusId: string): Promise<ClaimVerification> {
    console.log(`[SYNTHESIST] Verifying claim: "${claimText}"`);

    const corpus = this.corpora.get(corpusId);
    if (!corpus) {
      throw new Error(`Corpus not found: ${corpusId}`);
    }

    const evidence: VerificationEvidence[] = [];
    const supportingDocs: string[] = [];
    const contradictingDocs: string[] = [];

    for (const doc of corpus.documents) {
      for (const claim of doc.claims) {
        const similarity = this.calculateSemanticSimilarity(claimText, claim.text);

        if (similarity > 0.6) {
          const direction = this.checkAgreement({text: claimText, confidence: 0.5, type: 'finding', evidence: [], contradictions: [], supports: [], id: '', sourceParagraph: 0} as any, claim) 
            ? 'support' : 'contradict';

          evidence.push({
            documentId: doc.id,
            documentTitle: doc.title,
            relevantText: claim.text,
            relevanceScore: similarity,
            direction,
            quality: doc.quality
          });

          if (direction === 'support') {
            supportingDocs.push(doc.id);
          } else {
            contradictingDocs.push(doc.id);
          }
        }
      }
    }

    // Determine verdict
    let verdict: ClaimVerification['verdict'];
    const supportWeight = evidence.filter(e => e.direction === 'support').reduce((sum, e) => sum + e.relevanceScore * e.quality, 0);
    const contradictWeight = evidence.filter(e => e.direction === 'contradict').reduce((sum, e) => sum + e.relevanceScore * e.quality, 0);

    if (supportingDocs.length > 0 && contradictingDocs.length === 0) {
      verdict = 'verified';
    } else if (supportingDocs.length > 0 && contradictingDocs.length > 0) {
      verdict = supportWeight > contradictWeight * 2 ? 'partially_verified' : 'inconclusive';
    } else if (contradictingDocs.length > 0 && supportingDocs.length === 0) {
      verdict = 'contradicted';
    } else {
      verdict = 'unverified';
    }

    const confidence = evidence.length > 0 
      ? evidence.reduce((sum, e) => sum + e.relevanceScore * e.quality, 0) / evidence.length
      : 0;

    const verification: ClaimVerification = {
      claimId: `verify_${Date.now()}`,
      claimText,
      verdict,
      evidence,
      confidence,
      supportingDocuments: supportingDocs,
      contradictingDocuments: contradictingDocs,
      reasoning: this.generateVerificationReasoning(verdict, evidence, supportWeight, contradictWeight)
    };

    this.verifications.set(verification.claimId, verification);

    console.log(`[SYNTHESIST] Verification result: ${verdict} (confidence: ${confidence.toFixed(2)})`);
    return verification;
  }

  private generateVerificationReasoning(verdict: string, evidence: VerificationEvidence[], supportWeight: number, contradictWeight: number): string {
    const supportCount = evidence.filter(e => e.direction === 'support').length;
    const contradictCount = evidence.filter(e => e.direction === 'contradict').length;

    return `Based on ${evidence.length} pieces of evidence: ${supportCount} supporting (weight: ${supportWeight.toFixed(2)}), ${contradictCount} contradicting (weight: ${contradictWeight.toFixed(2)}). Verdict: ${verdict}.`;
  }

  // ============================================================
  // API INTERFACE
  // ============================================================

  async handleMessage(message: any): Promise<any> {
    const { type, payload } = message;

    switch (type) {
      case 'ingest':
        return await this.ingestCorpus(payload.documents, payload.metadata);

      case 'verify':
        return await this.verifyClaim(payload.claimText, payload.corpusId);

      case 'get_corpus':
        return this.corpora.get(payload.corpusId);

      case 'get_graph':
        return this.knowledgeGraphs.get(payload.corpusId);

      case 'get_synthesis':
        return this.corpora.get(payload.corpusId)?.synthesis;

      case 'search':
        return this.searchDocuments(payload.query, payload.corpusId);

      case 'stats':
        return {
          corpora: this.corpora.size,
          documents: this.documents.size,
          knowledgeGraphs: this.knowledgeGraphs.size,
          verifications: this.verifications.size,
          syntheses: this.synthesisHistory.length
        };

      default:
        return { error: `Unknown message type: ${type}` };
    }
  }

  private searchDocuments(query: string, corpusId: string): ResearchDocument[] {
    const corpus = this.corpora.get(corpusId);
    if (!corpus) return [];

    const queryWords = new Set(query.toLowerCase().split(/\s+/));

    return corpus.documents.filter(doc => {
      const docWords = new Set([
        ...doc.title.toLowerCase().split(/\s+/),
        ...doc.abstract.toLowerCase().split(/\s+/),
        ...doc.keywords.map(k => k.toLowerCase())
      ]);

      const intersection = new Set([...queryWords].filter(x => docWords.has(x)));
      return intersection.size > 0;
    });
  }
}

export default SynthesistEngine;
