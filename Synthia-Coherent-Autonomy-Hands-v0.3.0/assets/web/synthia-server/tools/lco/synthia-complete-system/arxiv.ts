/**
 * arXiv RAG Source — Research paper retrieval and synthesis
 * Uses arXiv API + local PDF caching for deep paper understanding
 */
import { RAGSource, RAGQuery, RAGResult, RAGDocument } from './base.js';
import { runShell } from '../utils/shell.js';
import { readFile, readdir, mkdir } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = `${process.env.HOME}/.cache/synthia-kiosk/rag/arxiv`;
const ARXIV_API = 'http://export.arxiv.org/api/query';

interface ArxivEntry {
  id: string;
  title: string;
  summary: string;
  authors: string[];
  published: string;
  primary_category: string;
  pdf_url: string;
}

export class ArxivRAG extends RAGSource {
  readonly name = 'arxiv';
  readonly domains = ['research', 'general'];
  readonly priority = 2;

  private docCount = 0;
  private cachedPapers: Set<string> = new Set();

  async isAvailable(): Promise<boolean> {
    const result = await runShell(`curl -sI ${ARXIV_API}?search_query=all:test&max_results=1 | head -1`, { timeout: 10000, logOutput: false });
    return result.stdout.includes('200');
  }

  async query(q: RAGQuery): Promise<RAGResult> {
    const start = Date.now();
    const docs: RAGDocument[] = [];

    // 1. Search arXiv API
    const apiResults = await this.searchArxiv(q.text, q.topK);
    docs.push(...apiResults);

    // 2. Search cached papers
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

  private async searchArxiv(query: string, topK: number): Promise<RAGDocument[]> {
    const searchQuery = encodeURIComponent(query);
    const result = await runShell(
      `curl -s "${ARXIV_API}?search_query=all:${searchQuery}&start=0&max_results=${topK}&sortBy=relevance&sortOrder=descending"`,
      { timeout: 15000, logOutput: false }
    );

    if (result.exitCode !== 0) return [];

    return this.parseArxivXml(result.stdout, topK);
  }

  private parseArxivXml(xml: string, topK: number): RAGDocument[] {
    const docs: RAGDocument[] = [];
    const entries = xml.split('<entry>');

    for (let i = 1; i < entries.length && i <= topK; i++) {
      const entry = entries[i];
      try {
        const id = this.extractXmlTag(entry, 'id') || '';
        const title = this.extractXmlTag(entry, 'title') || '';
        const summary = this.extractXmlTag(entry, 'summary') || '';
        const published = this.extractXmlTag(entry, 'published') || '';
        const category = entry.match(/<arxiv:primary_category[^>]*term="([^"]+)"/)?.[1] || '';
        const pdfUrl = id.replace('abs', 'pdf') + '.pdf';

        const authors = [...entry.matchAll(/<name>([^<]+)<\/name>/g)].map(m => m[1]);

        docs.push({
          id: `arxiv:${id}`,
          title: title.trim(),
          content: `${summary.trim().substring(0, 1000)}\n\nAuthors: ${authors.join(', ')}\nCategory: ${category}\nPublished: ${published}`,
          url: id,
          source: 'arxiv',
          score: this.scorePaper(title, summary, category),
          metadata: { type: 'paper', category, authors, published, pdfUrl },
          timestamp: Date.now(),
        });
      } catch {
        // Skip malformed entries
      }
    }

    return docs;
  }

  private extractXmlTag(xml: string, tag: string): string | null {
    const match = xml.match(new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`));
    return match ? match[1].trim() : null;
  }

  private scorePaper(title: string, summary: string, category: string): number {
    let score = 0.5;
    // Boost recent papers, high-citation categories, etc.
    const highImpactCats = ['cs.AI', 'cs.LG', 'cs.CL', 'stat.ML', 'q-bio.BM'];
    if (highImpactCats.includes(category)) score += 0.2;
    if (title.toLowerCase().includes('transformer') || title.toLowerCase().includes('llm')) score += 0.1;
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
            id: `arxiv:cached:${entry}`,
            title,
            content: content.substring(0, 2000),
            url: `file://${join(CACHE_DIR, entry)}`,
            source: 'arxiv',
            score: 0.8,
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
    if (docs.length === 0) return `No arXiv results found for "${query.text}". Try a more specific research query.`;

    let synth = `## arXiv Research Results for "${query.text}"\n\n`;

    docs.forEach((d, i) => {
      synth += `### ${i + 1}. ${d.title}\n`;
      synth += `- **Authors:** ${d.metadata.authors?.join(', ') || 'Unknown'}\n`;
      synth += `- **Category:** ${d.metadata.category || 'N/A'}\n`;
      synth += `- **Published:** ${d.metadata.published || 'N/A'}\n`;
      synth += `- **URL:** ${d.url}\n`;
      synth += `- **PDF:** ${d.metadata.pdfUrl}\n\n`;
      synth += `${d.content.substring(0, 500)}...\n\n`;
    });

    return synth;
  }

  async index(doc: RAGDocument): Promise<void> {
    if (doc.metadata.pdfUrl) {
      await this.downloadPaper(doc.metadata.pdfUrl, doc.id);
    }
    this.docCount++;
  }

  async downloadPaper(pdfUrl: string, paperId: string): Promise<void> {
    const safeId = paperId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const txtPath = join(CACHE_DIR, `${safeId}.txt`);

    if (this.cachedPapers.has(safeId)) return;

    await mkdir(CACHE_DIR, { recursive: true });

    // Download PDF and extract text (if pdftotext is available)
    const pdfPath = join(CACHE_DIR, `${safeId}.pdf`);
    await runShell(`curl -sL "${pdfUrl}" -o "${pdfPath}"`, { timeout: 60000, logOutput: false });

    const hasPdftotext = await runShell('command -v pdftotext', { logOutput: false }).then(r => r.exitCode === 0);
    if (hasPdftotext) {
      await runShell(`pdftotext "${pdfPath}" "${txtPath}"`, { timeout: 30000, logOutput: false });
    } else {
      // Fallback: save metadata as text
      await runShell(`echo "Paper: ${paperId}\nURL: ${pdfUrl}" > "${txtPath}"`, { logOutput: false });
    }

    this.cachedPapers.add(safeId);
  }

  async getStats(): Promise<{ documents: number; lastIndex: number }> {
    return { documents: this.docCount, lastIndex: Date.now() };
  }
}
