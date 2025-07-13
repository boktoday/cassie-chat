export interface UserContext {
  id: string;
  childName: string;
  goals: string;
  individualEducationPlan: string;
  functionalAssessment: string;
  ndisplan: string;
  otherInformation: string;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sessionId: string;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
}

class IndexedDBManager {
  private dbName = 'JiyuuChatDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // User Context Store
        if (!db.objectStoreNames.contains('userContext')) {
          const contextStore = db.createObjectStore('userContext', { keyPath: 'id' });
          contextStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Chat Messages Store
        if (!db.objectStoreNames.contains('chatMessages')) {
          const messagesStore = db.createObjectStore('chatMessages', { keyPath: 'id' });
          messagesStore.createIndex('sessionId', 'sessionId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Chat Sessions Store
        if (!db.objectStoreNames.contains('chatSessions')) {
          const sessionsStore = db.createObjectStore('chatSessions', { keyPath: 'id' });
          sessionsStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
      };
    });
  }

  // User Context Methods
  async saveUserContext(context: Omit<UserContext, 'id' | 'updatedAt'>): Promise<void> {
    if (!this.db) await this.init();

    const userContext: UserContext = {
      id: 'user-context',
      ...context,
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readwrite');
      const store = transaction.objectStore('userContext');
      const request = store.put(userContext);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getUserContext(): Promise<UserContext | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userContext'], 'readonly');
      const store = transaction.objectStore('userContext');
      const request = store.get('user-context');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  // Chat Session Methods
  async createChatSession(title: string = 'New Chat'): Promise<string> {
    if (!this.db) await this.init();

    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const session: ChatSession = {
      id: sessionId,
      title,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatSessions'], 'readwrite');
      const store = transaction.objectStore('chatSessions');
      const request = store.put(session);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(sessionId);
    });
  }

  async getChatSessions(): Promise<ChatSession[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatSessions'], 'readonly');
      const store = transaction.objectStore('chatSessions');
      const index = store.index('createdAt');
      const request = index.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const sessions = request.result.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        resolve(sessions);
      };
    });
  }

  // Chat Messages Methods
  async saveChatMessage(message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<void> {
    if (!this.db) await this.init();

    const chatMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message,
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatMessages'], 'readwrite');
      const store = transaction.objectStore('chatMessages');
      const request = store.put(chatMessage);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatMessages'], 'readonly');
      const store = transaction.objectStore('chatMessages');
      const index = store.index('sessionId');
      const request = index.getAll(sessionId);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(messages);
      };
    });
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatSessions', 'chatMessages'], 'readwrite');
      
      // Delete session
      const sessionStore = transaction.objectStore('chatSessions');
      sessionStore.delete(sessionId);

      // Delete all messages for this session
      const messageStore = transaction.objectStore('chatMessages');
      const index = messageStore.index('sessionId');
      const request = index.openCursor(sessionId);

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  // Cleanup old messages (older than 7 days)
  async cleanupOldMessages(): Promise<void> {
    if (!this.db) await this.init();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['chatMessages', 'chatSessions'], 'readwrite');
      
      // Clean up old messages
      const messageStore = transaction.objectStore('chatMessages');
      const messageIndex = messageStore.index('timestamp');
      const messageRequest = messageIndex.openCursor(IDBKeyRange.upperBound(sevenDaysAgo));

      messageRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      // Clean up old sessions
      const sessionStore = transaction.objectStore('chatSessions');
      const sessionIndex = sessionStore.index('createdAt');
      const sessionRequest = sessionIndex.openCursor(IDBKeyRange.upperBound(sevenDaysAgo));

      sessionRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

export const dbManager = new IndexedDBManager();