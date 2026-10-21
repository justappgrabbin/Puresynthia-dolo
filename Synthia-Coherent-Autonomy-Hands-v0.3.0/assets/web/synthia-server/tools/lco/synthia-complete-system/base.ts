/**
 * Base RAG Interface — All RAG sources implement this
 * Dimensional: D1=query(impulse), D2=source selection(polarity), D3=retrieval(witness), D4=context enrichment, D5=meaning synthesis
 */

export interface RAGDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  source: string;
  score: number;
  metadata: Record<string, any>;
  timestamp: number;
}

export interface RAGQuery {
  text: string;
  intent: string;
  domain: 'code' | 'research' | 'medical' | 'general';
  topK: number;
  filters?: Record<string, any>;
}

export interface RAGResult {
  documents: RAGDocument[];
  synthesized: string;
  sources: string[];
  confidence: number;
  queryTime: number;
}

export abstract class RAGSource {
  abstract readonly name: string;
  abstract readonly domains: string[];
  abstract readonly priority: number;

  abstract isAvailable(): Promise<boolean>;
  abstract query(q: RAGQuery): Promise<RAGResult>;
  abstract index(doc: RAGDocument): Promise<void>;
  abstract getStats(): Promise<{ documents: number; lastIndex: number }>;

  // Relevance scoring for query routing
  scoreRelevance(query: RAGQuery): number {
    let score = 0;
    if (this.domains.includes(query.domain)) score += 0.5;
    const domainKeywords: Record<string, string[]> = {
      code: ['github', 'repo', 'code', 'implementation', 'function', 'class', 'library', 'api', 'sdk', 'framework', 'bug', 'fix', 'commit', 'pull request', 'javascript', 'python', 'typescript', 'rust', 'go', 'java'],
      research: ['paper', 'arxiv', 'research', 'algorithm', 'model', 'neural', 'transformer', 'dataset', 'benchmark', 'theorem', 'proof', 'survey', 'review'],
      medical: ['medical', 'clinical', 'patient', 'disease', 'treatment', 'drug', 'symptom', 'diagnosis', 'therapy', 'pubmed', 'biomarker', 'trial', 'fda'],
    };
    const keywords = domainKeywords[query.domain] || [];
    const matches = keywords.filter(k => query.text.toLowerCase().includes(k)).length;
    score += Math.min(matches * 0.1, 0.5);
    return Math.min(score, 1);
  }
}
