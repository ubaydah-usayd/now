import { ref, set, get, push, remove, onValue, off, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';
import { Project, Task, Session, TimerState } from '../types';
import { DailyLogEntry } from '../utils/localStorage';

interface AppData {
  projects: Project[];
  tasks: Task[];
  sessions: Session[];
  timer: TimerState;
  showSessionModal: boolean;
  currentSession: Session | null;
  activeSessionStart: Date | null;
  activeBreakStart: Date | null;
  lastResetDate?: string;
}

class FirebaseManager {
  private userId: string | null = null;

  init(userId: string) {
    this.userId = userId;
    console.log('🔥 Firebase Manager initialisé pour l\'utilisateur:', userId);
  }

  private getUserRef() {
    if (!this.userId) {
      throw new Error('Firebase Manager non initialisé. Appelez init() d\'abord.');
    }
    return ref(database, `users/${this.userId}`);
  }

  private getUserRefString() {
    if (!this.userId) {
      throw new Error('Firebase Manager non initialisé. Appelez init() d\'abord.');
    }
    return `users/${this.userId}`;
  }

  // === PROJETS ===
  async saveProjects(projects: Project[]): Promise<void> {
    try {
      // Nettoyer les projets avant sauvegarde
      const cleanProjects = projects.map(project => ({
        id: project.id,
        name: project.name,
        color: project.color,
        dailyHours: project.dailyHours,
        completedSessions: project.completedSessions || 0,
        tasks: project.tasks || []
      }));
      
      await set(ref(database, `${this.getUserRefString()}/projects`), cleanProjects);
      console.log('✅ Projets sauvegardés:', cleanProjects.length);
    } catch (error) {
      console.error('❌ Erreur sauvegarde projets:', error);
      throw error;
    }
  }

  async getProjects(): Promise<Project[]> {
    try {
      const snapshot = await get(ref(database, `${this.getUserRefString()}/projects`));
      const projects = snapshot.val() || [];
      console.log('📥 Projets chargés:', projects.length);
      return projects;
    } catch (error) {
      console.error('❌ Erreur chargement projets:', error);
      return [];
    }
  }

  onProjectsChange(callback: (projects: Project[]) => void): () => void {
    const projectsRef = ref(database, `${this.getUserRefString()}/projects`);
    
    const handleChange = (snapshot: any) => {
      const projects = snapshot.val() || [];
      callback(projects);
    };

    onValue(projectsRef, handleChange);
    
    return () => {
      off(projectsRef, 'value', handleChange);
    };
  }

  // === TÂCHES ===
  async saveTasks(tasks: Task[]): Promise<void> {
    try {
      // Nettoyer les tâches avant sauvegarde
      const cleanTasks = tasks.map(task => ({
        id: task.id,
        name: task.name,
        projectId: task.projectId,
        assignedDate: task.assignedDate,
        status: task.status || 'pending',
        timeSpent: task.timeSpent || 0
      }));
      
      await set(ref(database, `${this.getUserRefString()}/tasks`), cleanTasks);
      console.log('✅ Tâches sauvegardées:', cleanTasks.length);
    } catch (error) {
      console.error('❌ Erreur sauvegarde tâches:', error);
      throw error;
    }
  }

  async getTasks(): Promise<Task[]> {
    try {
      const snapshot = await get(ref(database, `${this.getUserRefString()}/tasks`));
      const tasks = snapshot.val() || [];
      console.log('📥 Tâches chargées:', tasks.length);
      return tasks;
    } catch (error) {
      console.error('❌ Erreur chargement tâches:', error);
      return [];
    }
  }

  onTasksChange(callback: (tasks: Task[]) => void): () => void {
    const tasksRef = ref(database, `${this.getUserRefString()}/tasks`);
    
    const handleChange = (snapshot: any) => {
      const tasks = snapshot.val() || [];
      callback(tasks);
    };

    onValue(tasksRef, handleChange);
    
    return () => {
      off(tasksRef, 'value', handleChange);
    };
  }

  // === SESSIONS ===
  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      await set(ref(database, `${this.getUserRefString()}/sessions`), sessions);
      console.log('✅ Sessions sauvegardées:', sessions.length);
    } catch (error) {
      console.error('❌ Erreur sauvegarde sessions:', error);
      throw error;
    }
  }

  async getSessions(): Promise<Session[]> {
    try {
      const snapshot = await get(ref(database, `${this.getUserRefString()}/sessions`));
      const sessions = snapshot.val() || [];
      console.log('📥 Sessions chargées:', sessions.length);
      return sessions;
    } catch (error) {
      console.error('❌ Erreur chargement sessions:', error);
      return [];
    }
  }

  onSessionsChange(callback: (sessions: Session[]) => void): () => void {
    const sessionsRef = ref(database, `${this.getUserRefString()}/sessions`);
    
    const handleChange = (snapshot: any) => {
      const sessions = snapshot.val() || [];
      callback(sessions);
    };

    onValue(sessionsRef, handleChange);
    
    return () => {
      off(sessionsRef, 'value', handleChange);
    };
  }

  // === ÉTAT DE L'APPLICATION ===
  async saveAppState(appState: Partial<AppData>): Promise<void> {
    try {
      await set(ref(database, `${this.getUserRefString()}/appState`), appState);
      console.log('✅ État de l\'app sauvegardé');
    } catch (error) {
      console.error('❌ Erreur sauvegarde état app:', error);
      throw error;
    }
  }

  async getAppState(): Promise<Partial<AppData>> {
    try {
      const snapshot = await get(ref(database, `${this.getUserRefString()}/appState`));
      const appState = snapshot.val() || {};
      console.log('📥 État de l\'app chargé');
      return appState;
    } catch (error) {
      console.error('❌ Erreur chargement état app:', error);
      return {};
    }
  }

  // Nouveau: Listener en temps réel pour l'état de l'application
  onAppStateChange(callback: (appState: Partial<AppData>) => void): () => void {
    const appStateRef = ref(database, `${this.getUserRefString()}/appState`);
    
    const handleChange = (snapshot: any) => {
      const appState = snapshot.val() || {};
      callback(appState);
    };

    onValue(appStateRef, handleChange);
    
    return () => {
      off(appStateRef, 'value', handleChange);
    };
  }

  // === LOGS QUOTIDIENS ===
  async addDailyLogEntry(entry: Omit<DailyLogEntry, 'id'>): Promise<void> {
    try {
      const logsRef = ref(database, `${this.getUserRefString()}/dailyLogs`);
      const newLogRef = push(logsRef);
      
      // Nettoyer les valeurs undefined avant de sauvegarder
      const cleanEntry = {
        timestamp: entry.timestamp,
        type: entry.type,
        message: entry.message,
        projectId: entry.projectId || null,
        taskId: entry.taskId || null,
        startTime: entry.startTime || null,
        endTime: entry.endTime || null,
        completedTasks: entry.completedTasks || null,
        id: newLogRef.key!
      };
      
      await set(newLogRef, cleanEntry);
      console.log('📝 Log ajouté:', cleanEntry);
    } catch (error) {
      console.error('❌ Erreur ajout log:', error);
      throw error;
    }
  }

  async getTodayLog(): Promise<DailyLogEntry[]> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const logsRef = ref(database, `${this.getUserRefString()}/dailyLogs`);
      const todayQuery = query(
        logsRef,
        orderByChild('timestamp'),
        equalTo(today.toISOString())
      );

      const snapshot = await get(todayQuery);
      const logs: DailyLogEntry[] = [];
      
      snapshot.forEach((childSnapshot) => {
        logs.push(childSnapshot.val());
      });

      console.log('📥 Logs d\'aujourd\'hui chargés:', logs.length);
      return logs;
    } catch (error) {
      console.error('❌ Erreur chargement logs aujourd\'hui:', error);
      return [];
    }
  }

  async getLogsBetweenDates(startDate: Date, endDate: Date): Promise<DailyLogEntry[]> {
    try {
      const logsRef = ref(database, `${this.getUserRefString()}/dailyLogs`);
      const snapshot = await get(logsRef);
      const logs: DailyLogEntry[] = [];
      
      snapshot.forEach((childSnapshot) => {
        const log = childSnapshot.val();
        const logDate = new Date(log.timestamp);
        if (logDate >= startDate && logDate <= endDate) {
          logs.push(log);
        }
      });

      console.log('📥 Logs entre dates chargés:', logs.length);
      return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    } catch (error) {
      console.error('❌ Erreur chargement logs entre dates:', error);
      return [];
    }
  }

  async deleteAllLogs(): Promise<void> {
    try {
      await remove(ref(database, `${this.getUserRefString()}/dailyLogs`));
      console.log('🗑️ Tous les logs supprimés');
    } catch (error) {
      console.error('❌ Erreur suppression logs:', error);
      throw error;
    }
  }

  // === SAUVEGARDE COMPLÈTE ===
  async saveAllData(data: AppData): Promise<void> {
    try {
      await set(this.getUserRef(), data);
      console.log('✅ Toutes les données sauvegardées');
    } catch (error) {
      console.error('❌ Erreur sauvegarde complète:', error);
      throw error;
    }
  }

  async loadAllData(): Promise<AppData> {
    try {
      console.log('🔍 Tentative de chargement des données pour l\'utilisateur:', this.userId);
      const userRef = this.getUserRef();
      console.log('📍 Référence utilisateur:', userRef.toString());
      
      const snapshot = await get(userRef);
      console.log('📊 Snapshot reçu:', snapshot.exists(), 'valeurs:', snapshot.val());
      
      const defaultData = {
        projects: [],
        tasks: [],
        sessions: [],
        timer: {
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
        showSessionModal: false,
        currentSession: null,
        activeSessionStart: null,
        activeBreakStart: null,
        lastResetDate: undefined,
      };

      const data = snapshot.val() || defaultData;
      
      // S'assurer que toutes les propriétés du timer existent
      if (!data.timer) {
        data.timer = defaultData.timer;
      } else {
        // Fusionner avec les valeurs par défaut pour s'assurer que toutes les propriétés existent
        data.timer = {
          ...defaultData.timer,
          ...data.timer,
          projectSessions: data.timer.projectSessions || {},
          projectSessionProgress: data.timer.projectSessionProgress || {},
        };
      }
      
      console.log('📥 Toutes les données chargées:', {
        projectsCount: data.projects?.length || 0,
        tasksCount: data.tasks?.length || 0,
        sessionsCount: data.sessions?.length || 0
      });
      return data;
    } catch (error) {
      console.error('❌ Erreur chargement complet:', error);
      throw error;
    }
  }

  // === NETTOYAGE ===
  cleanup(): void {
    // Firebase Realtime Database gère automatiquement les listeners
    console.log('🧹 Firebase Manager nettoyé');
  }
}

export const firebaseManager = new FirebaseManager(); 