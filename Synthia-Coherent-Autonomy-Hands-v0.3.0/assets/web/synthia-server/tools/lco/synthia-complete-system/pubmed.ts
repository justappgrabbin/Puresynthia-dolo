/**
 * PubMed RAG Source — Medical literature retrieval
 * Uses NCBI E-utilities API + local abstract caching
 */
import { RAGSource, RAGQuery, RAGResult, RAGDocument } from './base.js';
import { runShell } from '../utils/shell.js';
import { readFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = `${process.env.HOME}/.cache/synthia-kiosk/rag/pubmed`;
const NCBI_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

interface PubMedArticle {
  uid: string;
  title: string;
  abstract: string;
  authors: string[];
  journal: string;
  year: string;
  doi: string;
  meshTerms: string[];
}

export class PubMedRAG extends RAGSource {
  readonly name = 'pubmed';
  readonly domains = ['medical', 'general'];
  readonly priority = 3;

  private docCount = 0;
  private cachedArticles: Set<string> = new Set();
  private apiKey: string | null = null;

  async isAvailable(): Promise<boolean> {
    const result = await runShell(
      `curl -s "${NCBI_API}/esearch.fcgi?db=pubmed&term=test&retmax=1&retmode=json" | head -1`,
      { timeout: 10000, logOutput: false }
    );
    return result.stdout.includes('{') || result.stdout.includes('esearchresult');
  }

  async query(q: RAGQuery): Promise<RAGResult> {
    const start = Date.now();
    const docs: RAGDocument[] = [];

    // 1. Search PubMed via E-utilities
    const apiResults = await this.searchPubMed(q.text, q.topK);
    docs.push(...apiResults);

    // 2. Search cached articles
    const cachedResults = await this.searchCached(q.text, q.topK);
    docs.push(...cachedResults);

    // Sort and deduplicate
    docs.sort((a, b) => b.score - a.score);
    const unique = new Map<string, RAGDocument>();
    docs.forEach(d => { if (!unique.has(d.id)) unique.set(d.id, d); });
    const finalDocs = Array.from(unique.values()).slice(0, q.topK);

    const synthesized = this.synthesize(finalDocs, q);

    return {
      documents: finalDocs,
      synthesized,
      sources: [...new Set(finalDocs.map(d => d.source))],
      confidence: finalDocs.length > 0 ? Math.min(finalDocs.reduce((a, d) => a + d.score, 0) / finalDocs.length, 1) : 0,
      queryTime: Date.now() - start,
    };
  }

  private async searchPubMed(query: string, topK: number): Promise<RAGDocument[]> {
    const keyParam = this.apiKey ? `&api_key=${this.apiKey}` : '';

    // Step 1: Search for PMIDs
    const searchResult = await runShell(
      `curl -s "${NCBI_API}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${topK}&retmode=json${keyParam}"`,
      { timeout: 15000, logOutput: false }
    );

    if (searchResult.exitCode !== 0) return [];

    let pmids: string[] = [];
    try {
      const data = JSON.parse(searchResult.stdout);
      pmids = data.esearchresult?.idlist || [];
    } catch {
      return [];
    }

    if (pmids.length === 0) return [];

    // Step 2: Fetch article details
    const summaryResult = await runShell(
      `curl -s "${NCBI_API}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json${keyParam}"`,
      { timeout: 15000, logOutput: false }
    );

    if (summaryResult.exitCode !== 0) return [];

    return this.parsePubMedSummary(summaryResult.stdout, pmids);
  }

  private parsePubMedSummary(json: string, pmids: string[]): RAGDocument[] {
    const docs: RAGDocument[] = [];

    try {
      const data = JSON.parse(json);
      const results = data.result || {};

      for (const pmid of pmids) {
        const article = results[pmid];
        if (!article || typeof article !== 'object') continue;

        const title = article.title || 'Untitled';
        const authors = (article.authors || []).map((a: any) => a.name || a.fullname || 'Unknown');
        const journal = article.fulljournalname || article.source || 'Unknown Journal';
        const year = article.pubdate || article.sortdate || '';
        const doi = article.articleids?.find((id: any) => id.idtype === 'doi')?.value || '';

        // Fetch abstract separately for quality
        const abstract = this.fetchAbstract(pmid);

        docs.push({
          id: `pubmed:${pmid}`,
          title: title.replace(/\[.*?\]/g, '').trim(),
          content: `${abstract}\n\nJournal: ${journal}\nYear: ${year}\nAuthors: ${authors.join(', ')}\nDOI: ${doi}`,
          url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          source: 'pubmed',
          score: this.scoreArticle(title, journal, year),
          metadata: { type: 'article', pmid, journal, year, doi, authors },
          timestamp: Date.now(),
        });
      }
    } catch {
      // Parse error
    }

    return docs;
  }

  private fetchAbstract(pmid: string): string {
    // Best effort — abstracts require separate efetch call
    // For now, return placeholder; can be enhanced with async fetch
    return '';
  }

  private scoreArticle(title: string, journal: string, year: string): number {
    let score = 0.5;
    const highImpactJournals = ['Nature', 'Science', 'Cell', 'NEJM', 'Lancet', 'JAMA', 'BMJ', 'PNAS'];
    if (highImpactJournals.some(j => journal.toLowerCase().includes(j.toLowerCase()))) score += 0.2;
    const yearNum = parseInt(year);
    if (!isNaN(yearNum) && yearNum >= 2020) score += 0.15;
    if (title.toLowerCase().includes('randomized') || title.toLowerCase().includes('trial')) score += 0.1;
    return Math.min(score, 0.95);
  }

  private async searchCached(query: string, topK: number): Promise<RAGDocument[]> {
    try {
      await mkdir(CACHE_DIR, { recursive: true });
      const entries = await readdir(CACHE_DIR).catch(() => []);
      const results: RAGDocument[] = [];

      for (const entry of entries) {
        if (!entry.endsWith('.txt')) continue;
        const content = await readFile(join(CACHE_DIR, entry), 'utf-8').catch(() => '');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          const lines = content.split('\n');
          const title = lines[0] || entry;
          results.push({
            id: `pubmed:cached:${entry}`,
            title,
            content: content.substring(0, 2000),
            url: `file://${join(CACHE_DIR, entry)}`,
            source: 'pubmed',
            score: 0.75,
            metadata: { type: 'cached', filename: entry },
            timestamp: Date.now(),
          });
        }
      }

      return results.slice(0, topK);
    } catch {
      return [];
    }
  }

  private synthesize(docs: RAGDocument[], query: RAGQuery): string {
    if (docs.length === 0) return `No PubMed results found for "${query.text}". Try a more specific medical query.`;

    let synth = `## PubMed Medical Literature for "${query.text}"\n\n`;

    docs.forEach((d, i) => {
      synth += `### ${i + 1}. ${d.title}\n`;
      synth += `- **Authors:** ${d.metadata.authors?.join(', ') || 'Unknown'}\n`;
      synth += `- **Journal:** ${d.metadata.journal || 'N/A'}\n`;
      synth += `- **Year:** ${d.metadata.year || 'N/A'}\n`;
      synth += `- **DOI:** ${d.metadata.doi || 'N/A'}\n`;
      synth += `- **URL:** ${d.url}\n\n`;

      const contentParts = d.content.split('\n\n');
      const abstractPart = contentParts.find(p => p.length > 50 && !p.startsWith('Journal:') && !p.startsWith('Year:'));
      if (abstractPart) {
        synth += `${abstractPart.substring(0, 600)}...\n\n`;
      }
    });

    return synth;
  }

  async index(doc: RAGDocument): Promise<void> {
    if (doc.metadata.pmid) {
      await this.cacheArticle(doc.metadata.pmid, doc.title, doc.content);
    }
    this.docCount++;
  }

  async cacheArticle(pmid: string, title: string, content: string): Promise<void> {
    const safeId = pmid.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (this.cachedArticles.has(safeId)) return;

    await mkdir(CACHE_DIR, { recursive: true });
    const path = join(CACHE_DIR, `${safeId}.txt`);
    await runShell(`echo "${title.replace(/"/g, '\"')}\n\n${content.replace(/"/g, '\"').substring(0, 5000)}" > "${path}"`, { logOutput: false });
    this.cachedArticles.add(safeId);
  }

  async getStats(): Promise<{ documents: number; lastIndex: number }> {
    return { documents: this.docCount, lastIndex: Date.now() };
  }

  setApiKey(key: string) {
    this.apiKey = key;
  }
}
