import { Project, Task, Session } from '../types';

interface AppData {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  timer: any;
  showSessionModal: boolean;
  currentSession: Session | null;
  activeSessionStart: Date | null;
  activeBreakStart: Date | null;
  lastResetDate?: string;
}

export interface DailyLogEntry {
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

class LocalStorageManager {
  private userId: string | null = null;

  // Initialiser avec l'utilisateur
  init(userId: string | null): void {
    this.userId = userId;
    console.log('🔄 LocalStorageManager initialisé:', { userId });
  }

  // Obtenir la clé de stockage
  private getStorageKey(key: string): string {
    return this.userId ? `now_${this.userId}_${key}` : `now_${key}`;
  }

  // Sauvegarder dans localStorage
  private saveToLocal(key: string, data: any): void {
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(data));
      console.log('💾 Données sauvegardées localement:', key, data);
    } catch (error) {
      console.error('❌ Erreur sauvegarde locale:', error);
    }
  }

  // Charger depuis localStorage
  private loadFromLocal<T>(key: string, defaultValue: T): T {
    try {
      const storageKey = this.getStorageKey(key);
      const data = localStorage.getItem(storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        console.log('📂 Données chargées localement:', key, parsed);
        return parsed;
      }
    } catch (error) {
      console.error('❌ Erreur chargement local:', error);
    }
    return defaultValue;
  }

  // Méthodes pour les projets
  async saveProjects(projects: Project[]): Promise<void> {
    this.saveToLocal('projects', projects);
  }

  async getProjects(): Promise<Project[]> {
    return this.loadFromLocal('projects', []);
  }

  onProjectsChange(_callback: (projects: Project[]) => void): () => void {
    // Pas de temps réel pour l'instant
    return () => {};
  }

  // Méthodes pour les tâches
  async saveTasks(tasks: Task[]): Promise<void> {
    this.saveToLocal('tasks', tasks);
  }

  async getTasks(): Promise<Task[]> {
    return this.loadFromLocal('tasks', []);
  }

  onTasksChange(_callback: (tasks: Task[]) => void): () => void {
    // Pas de temps réel pour l'instant
    return () => {};
  }

  // Méthodes pour les sessions
  async saveSessions(sessions: Session[]): Promise<void> {
    this.saveToLocal('sessions', sessions);
  }

  async getSessions(): Promise<Session[]> {
    return this.loadFromLocal('sessions', []);
  }

  onSessionsChange(_callback: (sessions: Session[]) => void): () => void {
    // Pas de temps réel pour l'instant
    return () => {};
  }

  // Méthodes pour l'état de l'application
  async saveAppState(appState: any): Promise<void> {
    this.saveToLocal('appState', appState);
  }

  async getAppState(): Promise<any> {
    return this.loadFromLocal('appState', null);
  }

  // Méthodes pour le timer
  async saveTimerState(timerState: any): Promise<void> {
    this.saveToLocal('timerState', timerState);
  }

  async getTimerState(): Promise<any> {
    return this.loadFromLocal('timerState', null);
  }

  // Méthodes pour les logs
  async addDailyLogEntry(entry: Omit<DailyLogEntry, 'id'>): Promise<void> {
    const logs: DailyLogEntry[] = this.loadFromLocal('dailyLogs', []);
    const newLog: DailyLogEntry = { ...entry, id: Date.now().toString() };
    logs.push(newLog);
    
    // Garder seulement les 1000 derniers logs
    if (logs.length > 1000) {
      logs.splice(0, logs.length - 1000);
    }
    
    this.saveToLocal('dailyLogs', logs);
    console.log('📝 Log ajouté:', newLog);
  }

  async getTodayLog(): Promise<DailyLogEntry[]> {
    const logs: DailyLogEntry[] = this.loadFromLocal('dailyLogs', []);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= today && logDate < tomorrow;
    });
  }

  async getLogsBetweenDates(startDate: Date, endDate: Date): Promise<DailyLogEntry[]> {
    const logs: DailyLogEntry[] = this.loadFromLocal('dailyLogs', []);
    return logs.filter(log => {
      const logDate = new Date(log.timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  // Nettoyer les listeners
  cleanup(): void {
    // Rien à nettoyer pour localStorage
  }

  // Sauvegarder tout l'état
  async saveAllData(data: AppData): Promise<void> {
    console.log('💾 Sauvegarde complète des données...');
    
    await Promise.all([
      this.saveProjects(data.projects),
      this.saveTasks(data.tasks),
      this.saveSessions(data.sessions),
      this.saveTimerState(data.timer),
      this.saveAppState({
        showSessionModal: data.showSessionModal,
        currentSession: data.currentSession,
        activeSessionStart: data.activeSessionStart,
        activeBreakStart: data.activeBreakStart,
        lastResetDate: data.lastResetDate
      })
    ]);
    
    console.log('✅ Sauvegarde complète terminée');
  }

  // Charger tout l'état
  async loadAllData(): Promise<AppData> {
    console.log('📂 Chargement complet des données...');
    
    const [projects, tasks, sessions, timer, appState] = await Promise.all([
      this.getProjects(),
      this.getTasks(),
      this.getSessions(),
      this.getTimerState(),
      this.getAppState()
    ]);
    
    const data: AppData = {
      projects: projects || [],
      tasks: tasks || [],
      sessions: sessions || [],
      timer: timer || {
        isRunning: false,
        isPaused: false,
        currentProjectId: null,
        timeRemaining: 50 * 60,
        totalTime: 50 * 60,
        sessionStartTime: null,
        pauseStartTime: null,
        projectSessions: {},
        projectSessionProgress: {},
      },
      showSessionModal: appState?.showSessionModal ?? false,
      currentSession: appState?.currentSession ?? null,
      activeSessionStart: appState?.activeSessionStart ?? null,
      activeBreakStart: appState?.activeBreakStart ?? null,
      lastResetDate: appState?.lastResetDate
    };
    
    console.log('✅ Chargement complet terminé:', data);
    return data;
  }
}

export const localStorageManager = new LocalStorageManager(); 

// Fonctions de sauvegarde pour les projets et tâches
export const saveProjectsToLocalStorage = (projects: any[]) => {
  localStorage.setItem('projects', JSON.stringify(projects));
};

export const saveTasksToLocalStorage = (tasks: any[]) => {
  localStorage.setItem('tasks', JSON.stringify(tasks));
};

export const saveSessionsToLocalStorage = (sessions: any[]) => {
  localStorage.setItem('sessions', JSON.stringify(sessions));
};

export const saveTimerToLocalStorage = (timer: any) => {
  localStorage.setItem('timer', JSON.stringify(timer));
};

export const saveAppStateToLocalStorage = (appState: any) => {
  Object.keys(appState).forEach(key => {
    if (appState[key] !== undefined && appState[key] !== null) {
      localStorage.setItem(key, JSON.stringify(appState[key]));
    }
  });
};

// Fonction pour nettoyer complètement le localStorage
export const clearLocalStorage = () => {
  // Supprimer toutes les données liées au timer
  localStorage.removeItem('timer');
  localStorage.removeItem('sessionProgress');
  localStorage.removeItem('activeSessionStart');
  localStorage.removeItem('activeBreakStart');
  localStorage.removeItem('currentSession');
  localStorage.removeItem('showSessionModal');
  
  // Supprimer aussi les données de l'état de l'application
  localStorage.removeItem('appState');
  localStorage.removeItem('lastResetDate');
  
  // Supprimer les données de progression des sessions
  localStorage.removeItem('projectSessions');
  localStorage.removeItem('projectSessionProgress');
  
  // Supprimer les données de synchronisation
  localStorage.removeItem('syncState');
  localStorage.removeItem('lastSync');
  
  console.log('🧹 localStorage complètement nettoyé');
}; 