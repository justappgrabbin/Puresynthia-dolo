// Lazy local book library. Full 1,100-page text is only loaded when requested.
export class BookLibrary {
  constructor() {
    this.cache = new Map();
  }

  async open(bookId = 'yijing-hatcher-word-by-word') {
    if (this.cache.has(bookId)) return this.cache.get(bookId);
    if (bookId !== 'yijing-hatcher-word-by-word') throw new Error(`Unknown bundled book: ${bookId}`);
    const mod = await import('./index/yijing_hatcher_index.mjs');
    const book = mod.YIJING_HATCHER;
    this.cache.set(bookId, book);
    return book;
  }

  async page(pageNumber, bookId) {
    const book = await this.open(bookId);
    const n = Number(pageNumber);
    if (!Number.isInteger(n) || n < 1 || n > book.meta.pageCount) {
      throw new Error(`Page must be 1..${book.meta.pageCount}, got ${pageNumber}`);
    }
    return book.pages[n - 1];
  }

  async search(query, { bookId, limit = 50, section = null } = {}) {
    const book = await this.open(bookId);
    const q = String(query || '').trim().toLowerCase();
    if (!q) return [];
    const out = [];
    for (const page of book.pages) {
      if (section && page.section !== section) continue;
      const hay = page.text.toLowerCase();
      const at = hay.indexOf(q);
      if (at < 0) continue;
      const start = Math.max(0, at - 90);
      const end = Math.min(page.text.length, at + q.length + 180);
      out.push({
        page: page.page,
        section: page.section,
        primaryGate: page.primaryGate,
        gateRefs: page.gateRefs,
        snippet: page.text.slice(start, end).replace(/\s+/g, ' ').trim(),
      });
      if (out.length >= limit) break;
    }
    return out;
  }
}

export const bundledBooks = new BookLibrary();
