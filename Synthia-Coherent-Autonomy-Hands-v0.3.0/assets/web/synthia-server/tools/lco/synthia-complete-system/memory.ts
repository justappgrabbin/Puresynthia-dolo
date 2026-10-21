/**
 * Synthia Memory — Persistent learning storage
 */
import { readFile, writeFile, mkdir, access } from 'fs/promises';
import { join } from 'path';
import type { OutcomeRecord, MemoryEntry, ChatMessage } from '../types.js';

const MEMORY_DIR = `${process.env.HOME}/.local/share/synthia-kiosk`;
const OUTCOMES_FILE = join(MEMORY_DIR, 'outcomes.json');
const MEMORY_FILE = join(MEMORY_DIR, 'memory.json');
const CHAT_FILE = join(MEMORY_DIR, 'chat.json');

async function loadJson<T>(path: string, defaultVal: T): Promise<T> {
  try {
    await access(path);
    const data = await readFile(path, 'utf-8');
    return JSON.parse(data);
  } catch {
    return defaultVal;
  }
}

async function saveJson<T>(path: string, data: T): Promise<void> {
  await mkdir(MEMORY_DIR, { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2));
}

export class MemoryStore {
  private outcomes: OutcomeRecord[] = [];
  private memories: MemoryEntry[] = [];
  private chatHistory: ChatMessage[] = [];
  private loaded = false;

  async init(): Promise<void> {
    if (this.loaded) return;
    this.outcomes = await loadJson<OutcomeRecord[]>(OUTCOMES_FILE, []);
    this.memories = await loadJson<MemoryEntry[]>(MEMORY_FILE, []);
    this.chatHistory = await loadJson<ChatMessage[]>(CHAT_FILE, []);
    this.loaded = true;
  }

  async saveOutcome(record: OutcomeRecord): Promise<void> {
    await this.init();
    this.outcomes.push(record);
    if (this.outcomes.length > 1000) this.outcomes = this.outcomes.slice(-1000);
    await saveJson(OUTCOMES_FILE, this.outcomes);
  }

  async getRelevantOutcomes(intent: string, limit = 5): Promise<OutcomeRecord[]> {
    await this.init();
    const keywords = intent.toLowerCase().split(/\s+/);
    return this.outcomes
      .filter(o => keywords.some(k => o.intent.toLowerCase().includes(k)))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  async getSuccessPatterns(intentType: string): Promise<string[]> {
    await this.init();
    const relevant = this.outcomes.filter(
      o => o.intent.toLowerCase().includes(intentType.toLowerCase()) && o.success
    );
    const learnings = new Set<string>();
    relevant.forEach(o => o.learnings.forEach(l => learnings.add(l)));
    return Array.from(learnings);
  }

  async saveMemory(entry: MemoryEntry): Promise<void> {
    await this.init();
    this.memories.push(entry);
    await saveJson(MEMORY_FILE, this.memories);
  }

  async searchMemory(query: string): Promise<MemoryEntry[]> {
    await this.init();
    const q = query.toLowerCase();
    return this.memories
      .filter(m => m.title.toLowerCase().includes(q) || m.content.toLowerCase().includes(q) || m.tags.some(t => t.toLowerCase().includes(q)))
      .sort((a, b) => (b.lastAccessed || 0) - (a.lastAccessed || 0));
  }

  // Chat history
  async addChatMessage(msg: ChatMessage): Promise<void> {
    await this.init();
    this.chatHistory.push(msg);
    if (this.chatHistory.length > 500) this.chatHistory = this.chatHistory.slice(-500);
    await saveJson(CHAT_FILE, this.chatHistory);
  }

  async getChatHistory(limit = 50): Promise<ChatMessage[]> {
    await this.init();
    return this.chatHistory.slice(-limit);
  }

  async getStats(): Promise<{ outcomes: number; memories: number; messages: number }> {
    await this.init();
    return { outcomes: this.outcomes.length, memories: this.memories.length, messages: this.chatHistory.length };
  }
}
