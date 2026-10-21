/**
 * GitHub RAG Source — Code retrieval, repo analysis, pattern learning
 * Uses GitHub API + local git clone for deep code understanding
 */
import { RAGSource, RAGQuery, RAGResult, RAGDocument } from './base.js';
import { runShell } from '../utils/shell.js';
import { readFile, readdir, stat } from 'fs/promises';
import { join } from 'path';

const CACHE_DIR = `${process.env.HOME}/.cache/synthia-kiosk/rag/github`;
const GITHUB_API = 'https://api.github.com';

interface GitHubRepo {
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  updated_at: string;
}

export class GitHubRAG extends RAGSource {
  readonly name = 'github';
  readonly domains = ['code', 'general'];
  readonly priority = 1;

  private token: string | null = null;
  private indexedRepos: Set<string> = new Set();
  private docCount = 0;

  async isAvailable(): Promise<boolean> {
    // Check if we can reach GitHub API
    const result = await runShell(`curl -sI ${GITHUB_API}/rate_limit | head -1`, { timeout: 10000, logOutput: false });
    return result.stdout.includes('200') || result.stdout.includes('403'); // 403 means API exists but rate limited
  }

  async query(q: RAGQuery): Promise<RAGResult> {
    const start = Date.now();

    // Route: search repos, search code, or query indexed repos
    const docs: RAGDocument[] = [];

    // 1. Search GitHub repos
    const repoResults = await this.searchRepos(q.text, q.topK);
    docs.push(...repoResults);

    // 2. Search GitHub code
    const codeResults = await this.searchCode(q.text, q.topK);
    docs.push(...codeResults);

    // 3. Search indexed local repos
    const localResults = await this.searchLocal(q.text, q.topK);
    docs.push(...localResults);

    // Sort by score and deduplicate
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

  private async searchRepos(query: string, topK: number): Promise<RAGDocument[]> {
    const q = encodeURIComponent(query + ' in:readme');
    const auth = this.token ? `-H "Authorization: token ${this.token}"` : '';
    const result = await runShell(
      `curl -s ${auth} "${GITHUB_API}/search/repositories?q=${q}&sort=stars&order=desc&per_page=${topK}"`,
      { timeout: 15000, logOutput: false }
    );

    if (result.exitCode !== 0) return [];

    try {
      const data = JSON.parse(result.stdout);
      return (data.items || []).map((repo: GitHubRepo) => ({
        id: `github:repo:${repo.full_name}`,
        title: repo.full_name,
        content: `${repo.description || ''}
Language: ${repo.language || 'Unknown'}
Stars: ${repo.stargazers_count}
URL: ${repo.html_url}`,
        url: repo.html_url,
        source: 'github',
        score: Math.min(repo.stargazers_count / 10000, 0.95) + 0.05,
        metadata: { type: 'repo', language: repo.language, stars: repo.stargazers_count, branch: repo.default_branch },
        timestamp: Date.now(),
      }));
    } catch {
      return [];
    }
  }

  private async searchCode(query: string, topK: number): Promise<RAGDocument[]> {
    const q = encodeURIComponent(query);
    const auth = this.token ? `-H "Authorization: token ${this.token}"` : '';
    const result = await runShell(
      `curl -s ${auth} "${GITHUB_API}/search/code?q=${q}&per_page=${topK}"`,
      { timeout: 15000, logOutput: false }
    );

    if (result.exitCode !== 0) return [];

    try {
      const data = JSON.parse(result.stdout);
      return (data.items || []).slice(0, topK).map((item: any) => ({
        id: `github:code:${item.repository.full_name}:${item.path}`,
        title: `${item.repository.full_name}/${item.path}`,
        content: `File: ${item.name}
Repository: ${item.repository.full_name}
URL: ${item.html_url}`,
        url: item.html_url,
        source: 'github',
        score: 0.7,
        metadata: { type: 'code', repo: item.repository.full_name, path: item.path },
        timestamp: Date.now(),
      }));
    } catch {
      return [];
    }
  }

  private async searchLocal(query: string, topK: number): Promise<RAGDocument[]> {
    // Search locally cloned repos
    try {
      const entries = await readdir(CACHE_DIR).catch(() => []);
      const results: RAGDocument[] = [];

      for (const entry of entries) {
        const repoPath = join(CACHE_DIR, entry);
        const repoStat = await stat(repoPath).catch(() => null);
        if (!repoStat || !repoStat.isDirectory()) continue;

        // Simple grep search in the repo
        const grepResult = await runShell(
          `cd "${repoPath}" && grep -ri "${query.replace(/"/g, '\"')}" --include="*.py" --include="*.js" --include="*.ts" --include="*.md" -l 2>/dev/null | head -${topK}`,
          { timeout: 10000, logOutput: false }
        );

        if (grepResult.exitCode === 0 && grepResult.stdout) {
          const files = grepResult.stdout.split('\n').filter(f => f);
          for (const file of files) {
            const content = await readFile(join(repoPath, file), 'utf-8').catch(() => '');
            const snippet = content.substring(0, 2000);
            results.push({
              id: `github:local:${entry}:${file}`,
              title: `${entry}/${file}`,
              content: snippet,
              url: `file://${repoPath}/${file}`,
              source: 'github',
              score: 0.85,
              metadata: { type: 'local', repo: entry, file },
              timestamp: Date.now(),
            });
          }
        }
      }

      return results.slice(0, topK);
    } catch {
      return [];
    }
  }

  private synthesize(docs: RAGDocument[], query: RAGQuery): string {
    if (docs.length === 0) return `No GitHub results found for "${query.text}". Try a more specific query or clone a repo first.`;

    const repos = docs.filter(d => d.metadata.type === 'repo');
    const code = docs.filter(d => d.metadata.type === 'code' || d.metadata.type === 'local');

    let synth = `## GitHub Results for "${query.text}"\n\n`;

    if (repos.length > 0) {
      synth += `### Top Repositories\n`;
      repos.forEach(r => {
        synth += `- **${r.title}** (${r.metadata.stars}⭐) — ${r.content.split('\n')[0]}\n`;
        synth += `  [${r.url}]\n`;
      });
      synth += `\n`;
    }

    if (code.length > 0) {
      synth += `### Relevant Code\n`;
      code.forEach(c => {
        synth += `- **${c.title}**\n`;
        synth += `  \`\`\`${c.metadata.language || ''}\n${c.content.substring(0, 300)}...\n\`\`\`\n`;
      });
    }

    return synth;
  }

  async index(doc: RAGDocument): Promise<void> {
    // For GitHub, indexing means cloning repos for local search
    if (doc.metadata.type === 'repo' && doc.metadata.clone_url) {
      await this.cloneRepo(doc.url, doc.title);
    }
    this.docCount++;
  }

  async cloneRepo(url: string, name: string): Promise<void> {
    if (this.indexedRepos.has(name)) return;

    await runShell(`mkdir -p "${CACHE_DIR}"`, { logOutput: false });
    const result = await runShell(
      `cd "${CACHE_DIR}" && git clone --depth 1 "${url}" "${name}" 2>/dev/null || echo "already exists or failed"`,
      { timeout: 120000, logOutput: false }
    );

    if (result.exitCode === 0 || result.stdout.includes('already exists')) {
      this.indexedRepos.add(name);
    }
  }

  async getStats(): Promise<{ documents: number; lastIndex: number }> {
    return { documents: this.docCount, lastIndex: Date.now() };
  }

  setToken(token: string) {
    this.token = token;
  }
}
