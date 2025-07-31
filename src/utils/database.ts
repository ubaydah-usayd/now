import { Project, Task, Session } from '../types';

const DB_NAME = 'NOW_Database';
const DB_VERSION = 1;

/*
interface DatabaseSchema {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  dailyLog: DailyLogEntry[];
}
*/

interface DailyLogEntry {
  id: string;
  timestamp: Date;
  type: 'session_interval' | 'break_interval' | 'task_complete' | 'task_create' | 'task_update' | 'task_delete' | 'task_move' | 'project_create' | 'project_update' | 'project_delete' | 'daily_reset';
  projectId?: string;
  taskId?: string;
  startTime?: Date;
  endTime?: Date;
  completedTasks?: string[];
  message: string;
}

interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  currentProjectId: string | null;
  timeRemaining: number;
  totalTime: number;
  sessionStartTime: Date | null;
  pauseStartTime: Date | null; // Moment où la pause a commencé
  projectSessions: Record<string, number>;
  projectSessionProgress: Record<string, number>;
}

interface AppState {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  showSessionModal: boolean;
  currentSession: Session | null;
  activeSessionStart: Date | null;
  activeBreakStart: Date | null;
}

class DatabaseManager {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Créer les stores
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('name', 'name', { unique: false });
        }

        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('projectId', 'projectId', { unique: false });
          taskStore.createIndex('assignedDate', 'assignedDate', { unique: false });
        }

        if (!db.objectStoreNames.contains('sessions')) {
          const sessionStore = db.createObjectStore('sessions', { keyPath: 'id' });
          sessionStore.createIndex('projectId', 'projectId', { unique: false });
          sessionStore.createIndex('startTime', 'startTime', { unique: false });
        }

        if (!db.objectStoreNames.contains('dailyLog')) {
          const logStore = db.createObjectStore('dailyLog', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('timerState')) {
          db.createObjectStore('timerState', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('appState')) {
          db.createObjectStore('appState', { keyPath: 'id' });
        }
      };
    });
  }

  // Méthodes pour les projets
  async saveProjects(projects: Project[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['projects'], 'readwrite');
    const store = transaction.objectStore('projects');
    
    // Vider le store
    await this.clearStore(store);
    
    // Ajouter tous les projets
    for (const project of projects) {
      store.add(project);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getProjects(): Promise<Project[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['projects'], 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Méthodes pour les tâches
  async saveTasks(tasks: Task[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readwrite');
    const store = transaction.objectStore('tasks');
    
    // Vider le store
    await this.clearStore(store);
    
    // Ajouter toutes les tâches
    for (const task of tasks) {
      store.add(task);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTasks(): Promise<Task[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['tasks'], 'readonly');
    const store = transaction.objectStore('tasks');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Méthodes pour les sessions
  async saveSessions(sessions: Session[]): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['sessions'], 'readwrite');
    const store = transaction.objectStore('sessions');
    
    // Vider le store
    await this.clearStore(store);
    
    // Ajouter toutes les sessions
    for (const session of sessions) {
      store.add(session);
    }
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getSessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['sessions'], 'readonly');
    const store = transaction.objectStore('sessions');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Méthodes pour le log quotidien
  async addDailyLogEntry(entry: Omit<DailyLogEntry, 'id'>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailyLog'], 'readwrite');
    const store = transaction.objectStore('dailyLog');
    
    const logEntry: DailyLogEntry = {
      ...entry,
      id: Date.now().toString(),
    };
    
    store.add(logEntry);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTodayLog(): Promise<DailyLogEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const transaction = this.db.transaction(['dailyLog'], 'readonly');
    const store = transaction.objectStore('dailyLog');
    const index = store.index('timestamp');
    const request = index.getAll(IDBKeyRange.lowerBound(today));
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const entries = request.result.sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        resolve(entries);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Méthodes pour l'état du timer
  async saveTimerState(timerState: TimerState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['timerState'], 'readwrite');
    const store = transaction.objectStore('timerState');
    
    // Convertir les dates en strings pour la sérialisation
    const serializedState = {
      id: 'current',
      ...timerState,
      sessionStartTime: timerState.sessionStartTime?.toISOString() || null
    };
    
    store.put(serializedState);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getTimerState(): Promise<TimerState | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['timerState'], 'readonly');
    const store = transaction.objectStore('timerState');
    const request = store.get('current');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          // Convertir les dates strings en objets Date
          const timerState = {
            ...request.result,
            sessionStartTime: request.result.sessionStartTime ? new Date(request.result.sessionStartTime) : null
          };
          resolve(timerState);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Méthodes pour l'état de l'application
  async saveAppState(appState: AppState): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['appState'], 'readwrite');
    const store = transaction.objectStore('appState');
    
    // Convertir les dates en strings pour la sérialisation
    const serializedState = {
      id: 'current',
      ...appState,
      activeSessionStart: appState.activeSessionStart?.toISOString() || null,
      activeBreakStart: appState.activeBreakStart?.toISOString() || null,
      currentSession: appState.currentSession ? {
        ...appState.currentSession,
        startTime: appState.currentSession.startTime.toISOString(),
        endTime: appState.currentSession.endTime?.toISOString() || new Date().toISOString()
      } : null
    };
    
    store.put(serializedState);
    
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAppState(): Promise<AppState | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['appState'], 'readonly');
    const store = transaction.objectStore('appState');
    const request = store.get('current');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        if (request.result) {
          // Convertir les dates strings en objets Date
          const appState = {
            ...request.result,
            activeSessionStart: request.result.activeSessionStart ? new Date(request.result.activeSessionStart) : null,
            activeBreakStart: request.result.activeBreakStart ? new Date(request.result.activeBreakStart) : null,
            currentSession: request.result.currentSession ? {
              ...request.result.currentSession,
              startTime: new Date(request.result.currentSession.startTime),
              endTime: new Date(request.result.currentSession.endTime)
            } : null
          };
          resolve(appState);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  private async clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  // Nouvelles méthodes pour la gestion des jours
  async getLogsBetweenDates(startDate: Date, endDate: Date): Promise<DailyLogEntry[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailyLog'], 'readonly');
    const store = transaction.objectStore('dailyLog');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allLogs = request.result || [];
        const filteredLogs = allLogs.filter((log: any) => {
          const logDate = new Date(log.timestamp);
          return logDate >= startDate && logDate <= endDate;
        });
        
        // Convertir les dates strings en objets Date
        const logsWithDates = filteredLogs.map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp),
          startTime: log.startTime ? new Date(log.startTime) : undefined,
          endTime: log.endTime ? new Date(log.endTime) : undefined,
        }));
        
        resolve(logsWithDates);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getAvailableDates(): Promise<Date[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction(['dailyLog'], 'readonly');
    const store = transaction.objectStore('dailyLog');
    const request = store.getAll();
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const allLogs = request.result || [];
        const dates = new Set<string>();
        
        allLogs.forEach((log: any) => {
          const logDate = new Date(log.timestamp);
          const dateKey = logDate.toISOString().split('T')[0]; // YYYY-MM-DD
          dates.add(dateKey);
        });
        
        const uniqueDates = Array.from(dates)
          .map(dateStr => new Date(dateStr))
          .sort((a, b) => b.getTime() - a.getTime()); // Plus récent en premier
        
        resolve(uniqueDates);
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const dbManager = new DatabaseManager();
export type { DailyLogEntry, TimerState, AppState }; 