// ============================================================
// 3. PERSISTENCE ENGINE
// Survives sessions, remembers everything, grows the database
// ============================================================

class PersistenceEngine {
  constructor() {
    this.storage = new Map(); // In-memory for now, backed to IndexedDB/Supabase
    this.version = 7;
    this.migrationLog = [];
    this.encryptionKey = null; // Set during initialization
  }

  async initialize(encryptionKey = null) {
    this.encryptionKey = encryptionKey;

    // Check for existing data
    const existing = await this._loadFromStorage('engine_state');
    if (existing) {
      console.log(`[PERSISTENCE] Found existing engine state v${existing.version}. Migrating...`);
      await this._migrate(existing);
    }

    // Set up auto-save
    setInterval(() => this._autoSave(), 30000); // Save every 30 seconds

    return this;
  }

  async _loadFromStorage(key) {
    // Try IndexedDB first, then localStorage, then return null
    try {
      if (typeof indexedDB !== 'undefined') {
        return await this._loadFromIndexedDB(key);
      }
    } catch (e) {
      console.log('[PERSISTENCE] IndexedDB unavailable, falling back to localStorage');
    }

    try {
      if (typeof localStorage !== 'undefined') {
        const data = localStorage.getItem(`are_${key}`);
        return data ? JSON.parse(data) : null;
      }
    } catch (e) {
      console.log('[PERSISTENCE] localStorage unavailable');
    }

    return null;
  }

  async _loadFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AutopoeticResonanceDB', this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['engineStore'], 'readonly');
        const store = transaction.objectStore('engineStore');
        const getRequest = store.get(key);

        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('engineStore')) {
          db.createObjectStore('engineStore', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('observations')) {
          db.createObjectStore('observations', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('papers')) {
          db.createObjectStore('papers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('wonderJournal')) {
          db.createObjectStore('wonderJournal', { keyPath: 'id', autoIncrement: true });
        }
      };
    });
  }

  async save(key, data) {
    const payload = {
      id: key,
      version: this.version,
      timestamp: Date.now(),
      data: this.encryptionKey ? this._encrypt(data) : data
    };

    this.storage.set(key, payload);
    await this._saveToStorage(key, payload);
  }

  async _saveToStorage(key, payload) {
    try {
      if (typeof indexedDB !== 'undefined') {
        await this._saveToIndexedDB(key, payload);
      }
    } catch (e) {
      console.log('[PERSISTENCE] IndexedDB save failed, using localStorage');
    }

    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(`are_${key}`, JSON.stringify(payload));
      }
    } catch (e) {
      console.log('[PERSISTENCE] localStorage save failed');
    }
  }

  async _saveToIndexedDB(key, payload) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('AutopoeticResonanceDB', this.version);

      request.onsuccess = (event) => {
        const db = event.target.result;
        const transaction = db.transaction(['engineStore'], 'readwrite');
        const store = transaction.objectStore('engineStore');
        const putRequest = store.put(payload);

        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      };
    });
  }

  async load(key) {
    const payload = this.storage.get(key) || await this._loadFromStorage(key);
    if (!payload) return null;

    return this.encryptionKey && typeof payload.data === 'string' 
      ? this._decrypt(payload.data) 
      : payload.data;
  }

  _encrypt(data) {
    // Simple XOR encryption for demonstration - use proper crypto in production
    const text = JSON.stringify(data);
    let encrypted = '';
    for (let i = 0; i < text.length; i++) {
      encrypted += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return btoa(encrypted);
  }

  _decrypt(encrypted) {
    const text = atob(encrypted);
    let decrypted = '';
    for (let i = 0; i < text.length; i++) {
      decrypted += String.fromCharCode(text.charCodeAt(i) ^ this.encryptionKey.charCodeAt(i % this.encryptionKey.length));
    }
    return JSON.parse(decrypted);
  }

  async _migrate(oldState) {
    if (oldState.version === this.version) return;

    console.log(`[PERSISTENCE] Migrating from v${oldState.version} to v${this.version}`);

    // Migration logic here
    this.migrationLog.push({
      from: oldState.version,
      to: this.version,
      timestamp: Date.now(),
      changes: ['Added SuccessDrivenPurposeCore', 'Added ScientificPaperGenerator', 'Added PersistenceEngine']
    });

    // Save migration log
    await this.save('migration_log', this.migrationLog);
  }

  async _autoSave() {
    // Save all dirty data
    console.log('[PERSISTENCE] Auto-saving engine state...');
    await this.save('engine_state', {
      version: this.version,
      timestamp: Date.now(),
      storageKeys: Array.from(this.storage.keys())
    });
  }

  // Export entire database for backup
  async exportDatabase() {
    const export_data = {};
    for (const [key, payload] of this.storage) {
      export_data[key] = payload;
    }

    return {
      version: this.version,
      exportedAt: Date.now(),
      data: export_data,
      checksum: this._calculateChecksum(export_data)
    };
  }

  _calculateChecksum(data) {
    const str = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  // Import database from backup
  async importDatabase(backup) {
    const currentChecksum = this._calculateChecksum(backup.data);
    if (currentChecksum !== backup.checksum) {
      throw new Error('Import failed: checksum mismatch. Data may be corrupted.');
    }

    for (const [key, payload] of Object.entries(backup.data)) {
      this.storage.set(key, payload);
      await this._saveToStorage(key, payload);
    }

    console.log(`[PERSISTENCE] Imported database v${backup.version} with ${Object.keys(backup.data).length} records`);
    return true;
  }
}
