/**
 * FrequencyCache - Serviço de cache inteligente usando IndexedDB
 * Mantém registro de frequência de uso para categorias e tags,
 * priorizando os mais usados na interface.
 */

const DB_NAME = 'cdf_frequency_cache';
const DB_VERSION = 1;

interface FrequencyRecord {
  id: string;
  type: 'category' | 'tag';
  count: number;
  lastUsed: number;
}

interface RecentItem {
  id: string;
  type: 'category' | 'tag';
  itemId: string;
  timestamp: number;
}

class FrequencyCacheService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('FrequencyCache: Failed to open IndexedDB');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Store para frequência de uso
        if (!db.objectStoreNames.contains('frequency')) {
          const frequencyStore = db.createObjectStore('frequency', { keyPath: 'id' });
          frequencyStore.createIndex('type', 'type', { unique: false });
          frequencyStore.createIndex('count', 'count', { unique: false });
          frequencyStore.createIndex('lastUsed', 'lastUsed', { unique: false });
        }

        // Store para itens recentes
        if (!db.objectStoreNames.contains('recent')) {
          const recentStore = db.createObjectStore('recent', { keyPath: 'id', autoIncrement: true });
          recentStore.createIndex('type', 'type', { unique: false });
          recentStore.createIndex('itemId', 'itemId', { unique: false });
          recentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  private async ensureInit(): Promise<IDBDatabase> {
    await this.init();
    if (!this.db) throw new Error('Database not initialized');
    return this.db;
  }

  /**
   * Incrementa o contador de uso de um item (categoria ou tag)
   */
  async trackUsage(itemId: string, type: 'category' | 'tag'): Promise<void> {
    const db = await this.ensureInit();
    const key = `${type}:${itemId}`;

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['frequency', 'recent'], 'readwrite');
      const frequencyStore = tx.objectStore('frequency');
      const recentStore = tx.objectStore('recent');

      // Atualizar frequência
      const getRequest = frequencyStore.get(key);
      getRequest.onsuccess = () => {
        const existing = getRequest.result as FrequencyRecord | undefined;
        const record: FrequencyRecord = {
          id: key,
          type,
          count: (existing?.count || 0) + 1,
          lastUsed: Date.now(),
        };
        frequencyStore.put(record);
      };

      // Adicionar aos recentes
      const recentItem: Omit<RecentItem, 'id'> = {
        type,
        itemId,
        timestamp: Date.now(),
      };
      recentStore.add(recentItem);

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Retorna os IDs mais frequentes de um tipo
   */
  async getMostFrequent(type: 'category' | 'tag', limit = 10): Promise<string[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('frequency', 'readonly');
      const store = tx.objectStore('frequency');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        const records = request.result as FrequencyRecord[];
        const sorted = records
          .sort((a, b) => {
            // Priorizar por contagem, desempate por uso recente
            if (b.count !== a.count) return b.count - a.count;
            return b.lastUsed - a.lastUsed;
          })
          .slice(0, limit)
          .map(r => r.id.replace(`${type}:`, ''));
        resolve(sorted);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retorna os IDs usados recentemente
   */
  async getRecent(type: 'category' | 'tag', limit = 5): Promise<string[]> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction('recent', 'readonly');
      const store = tx.objectStore('recent');
      const index = store.index('type');
      const request = index.getAll(type);

      request.onsuccess = () => {
        const records = request.result as RecentItem[];
        // Pegar únicos, ordenados por timestamp decrescente
        const seen = new Set<string>();
        const unique: string[] = [];
        
        records
          .sort((a, b) => b.timestamp - a.timestamp)
          .forEach(r => {
            if (!seen.has(r.itemId) && unique.length < limit) {
              seen.add(r.itemId);
              unique.push(r.itemId);
            }
          });

        resolve(unique);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Ordena uma lista de itens priorizando os mais usados
   */
  async sortByFrequency<T extends { id: string }>(
    items: T[],
    type: 'category' | 'tag'
  ): Promise<T[]> {
    const frequentIds = await this.getMostFrequent(type, 50);
    const frequencyMap = new Map(frequentIds.map((id, idx) => [id, idx]));

    return [...items].sort((a, b) => {
      const aFreq = frequencyMap.get(a.id) ?? Infinity;
      const bFreq = frequencyMap.get(b.id) ?? Infinity;
      return aFreq - bFreq;
    });
  }

  /**
   * Limpa registros antigos (mais de 90 dias)
   */
  async cleanup(): Promise<void> {
    const db = await this.ensureInit();
    const cutoff = Date.now() - (90 * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const tx = db.transaction('recent', 'readwrite');
      const store = tx.objectStore('recent');
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoff);
      const request = index.openCursor(range);

      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  /**
   * Reseta todo o cache
   */
  async clear(): Promise<void> {
    const db = await this.ensureInit();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(['frequency', 'recent'], 'readwrite');
      tx.objectStore('frequency').clear();
      tx.objectStore('recent').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const frequencyCache = new FrequencyCacheService();
