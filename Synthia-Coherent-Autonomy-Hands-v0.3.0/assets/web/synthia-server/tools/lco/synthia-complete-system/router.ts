/**
 * RAG Router — Intelligently routes queries to the right source(s)
 * Can query single source, multiple sources, or all sources with fusion
 */
import { RAGSource, RAGQuery, RAGResult, RAGDocument } from './base.js';
import { GitHubRAG } from './github.js';
import { ArxivRAG } from './arxiv.js';
import { PubMedRAG } from './pubmed.js';

export class RAGRouter {
  private sources: Map<string, RAGSource> = new Map();
  private initialized = false;

  constructor() {
    this.sources.set('github', new GitHubRAG());
    this.sources.set('arxiv', new ArxivRAG());
    this.sources.set('pubmed', new PubMedRAG());
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    for (const [name, source] of this.sources) {
      const available = await source.isAvailable().catch(() => false);
      if (!available) {
        console.log(`[RAG] ${name} not available, skipping`);
      } else {
        console.log(`[RAG] ${name} ready`);
      }
    }
    this.initialized = true;
  }

  async query(text: string, options: {
    domain?: 'code' | 'research' | 'medical' | 'general';
    topK?: number;
    sources?: string[];
    fusion?: 'single' | 'multi' | 'auto';
  } = {}): Promise<RAGResult> {
    await this.init();

    const query: RAGQuery = {
      text,
      intent: this.inferIntent(text),
      domain: options.domain || this.inferDomain(text),
      topK: options.topK || 5,
    };

    const requestedSources = options.sources || [];
    const fusionMode = options.fusion || 'auto';

    // Determine which sources to query
    let activeSources: RAGSource[] = [];

    if (requestedSources.length > 0) {
      // User specified sources
      activeSources = requestedSources
        .map(s => this.sources.get(s))
        .filter((s): s is RAGSource => s !== undefined);
    } else if (fusionMode === 'auto') {
      // Auto-select based on relevance scoring
      const scores = await Promise.all(
        Array.from(this.sources.values()).map(async s => ({
          source: s,
          score: s.scoreRelevance(query),
          available: await s.isAvailable().catch(() => false),
        }))
      );

      // Sort by score, take top 2 or all above threshold
      const sorted = scores.filter(s => s.available).sort((a, b) => b.score - a.score);
      const threshold = 0.3;
      activeSources = sorted.filter(s => s.score >= threshold).map(s => s.source);
      if (activeSources.length === 0) activeSources = sorted.slice(0, 1).map(s => s.source);
    } else if (fusionMode === 'multi') {
      // Query all available sources
      activeSources = Array.from(this.sources.values()).filter(s => {
        return s.isAvailable().catch(() => false);
      });
    } else {
      // Single — best matching source
      const scores = await Promise.all(
        Array.from(this.sources.values()).map(async s => ({
          source: s,
          score: s.scoreRelevance(query),
          available: await s.isAvailable().catch(() => false),
        }))
      );
      const best = scores.filter(s => s.available).sort((a, b) => b.score - a.score)[0];
      if (best) activeSources = [best.source];
    }

    if (activeSources.length === 0) {
      return {
        documents: [],
        synthesized: 'No RAG sources available. Check your internet connection or source configuration.',
        sources: [],
        confidence: 0,
        queryTime: 0,
      };
    }

    // Query selected sources in parallel
    const results = await Promise.all(
      activeSources.map(s => s.query(query).catch(err => {
        console.error(`[RAG] ${s.name} query failed:`, err.message);
        return null;
      }))
    );

    const validResults = results.filter((r): r is RAGResult => r !== null);

    if (validResults.length === 1) {
      return validResults[0];
    }

    // Fuse multiple results
    return this.fuseResults(validResults, query);
  }

  private fuseResults(results: RAGResult[], query: RAGQuery): RAGResult {
    const allDocs: RAGDocument[] = [];
    const allSources: string[] = [];
    let totalTime = 0;

    results.forEach(r => {
      allDocs.push(...r.documents);
      allSources.push(...r.sources);
      totalTime += r.queryTime;
    });

    // Re-rank by source diversity + score
    allDocs.sort((a, b) => {
      // Boost documents from different sources for diversity
      const sourceBonus = (d: RAGDocument) => {
        const sourceCount = allDocs.filter(ad => ad.source === d.source).length;
        return sourceCount > 0 ? 1 / sourceCount : 0;
      };
      const scoreA = a.score + sourceBonus(a) * 0.1;
      const scoreB = b.score + sourceBonus(b) * 0.1;
      return scoreB - scoreA;
    });

    const uniqueDocs = allDocs.slice(0, query.topK);
    const uniqueSources = [...new Set(allSources)];

    const synthesized = this.fuseSynthesis(uniqueDocs, results, query);

    return {
      documents: uniqueDocs,
      synthesized,
      sources: uniqueSources,
      confidence: uniqueDocs.length > 0 ? Math.min(uniqueDocs.reduce((a, d) => a + d.score, 0) / uniqueDocs.length, 1) : 0,
      queryTime: totalTime,
    };
  }

  private fuseSynthesis(docs: RAGDocument[], results: RAGResult[], query: RAGQuery): string {
    let synth = `## Multi-Source Results for "${query.text}"\n\n`;

    // Group by source
    const bySource = new Map<string, RAGDocument[]>();
    docs.forEach(d => {
      if (!bySource.has(d.source)) bySource.set(d.source, []);
      bySource.get(d.source)!.push(d);
    });

    bySource.forEach((sourceDocs, source) => {
      synth += `### ${source.toUpperCase()} (${sourceDocs.length} results)\n`;
      sourceDocs.forEach(d => {
        synth += `- **${d.title}** [score: ${d.score.toFixed(2)}]\n`;
        synth += `  ${d.content.substring(0, 200)}...\n`;
      });
      synth += `\n`;
    });

    synth += `---\n\n**Sources queried:** ${results.map(r => r.sources.join(', ')).join('; ')}\n`;
    synth += `**Total documents:** ${docs.length}\n`;
    synth += `**Query time:** ${results.reduce((a, r) => a + r.queryTime, 0)}ms\n`;

    return synth;
  }

  private inferDomain(text: string): 'code' | 'research' | 'medical' | 'general' {
    const lower = text.toLowerCase();

    const codeKeywords = ['github', 'repo', 'code', 'function', 'class', 'api', 'javascript', 'python', 'typescript', 'rust', 'implementation', 'library', 'bug', 'fix', 'commit'];
    const researchKeywords = ['paper', 'arxiv', 'research', 'algorithm', 'model', 'neural', 'transformer', 'dataset', 'benchmark', 'theorem', 'survey'];
    const medicalKeywords = ['medical', 'clinical', 'patient', 'disease', 'treatment', 'drug', 'symptom', 'diagnosis', 'therapy', 'pubmed', 'biomarker', 'trial'];

    const codeScore = codeKeywords.filter(k => lower.includes(k)).length;
    const researchScore = researchKeywords.filter(k => lower.includes(k)).length;
    const medicalScore = medicalKeywords.filter(k => lower.includes(k)).length;

    if (medicalScore > codeScore && medicalScore > researchScore) return 'medical';
    if (codeScore > researchScore && codeScore > medicalScore) return 'code';
    if (researchScore > codeScore && researchScore > medicalScore) return 'research';
    return 'general';
  }

  private inferIntent(text: string): string {
    const lower = text.toLowerCase();
    if (lower.includes('how to') || lower.includes('implement') || lower.includes('build')) return 'implementation';
    if (lower.includes('what is') || lower.includes('explain')) return 'explanation';
    if (lower.includes('compare') || lower.includes('vs')) return 'comparison';
    if (lower.includes('latest') || lower.includes('recent')) return 'recent_research';
    if (lower.includes('treatment') || lower.includes('therapy')) return 'treatment';
    return 'general_query';
  }

  getSource(name: string): RAGSource | undefined {
    return this.sources.get(name);
  }

  listSources(): string[] {
    return Array.from(this.sources.keys());
  }

  async getAllStats(): Promise<Record<string, { documents: number; lastIndex: number; available: boolean }>> {
    await this.init();
    const stats: Record<string, any> = {};
    for (const [name, source] of this.sources) {
      stats[name] = {
        ...(await source.getStats().catch(() => ({ documents: 0, lastIndex: 0 }))),
        available: await source.isAvailable().catch(() => false),
      };
    }
    return stats;
  }
}
