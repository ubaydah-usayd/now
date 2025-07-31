import { create } from 'zustand';
import { Project, Task, Session, AppState } from '../types';
import { DailyLogEntry, saveProjectsToLocalStorage, saveTasksToLocalStorage, saveSessionsToLocalStorage, saveTimerToLocalStorage, saveAppStateToLocalStorage } from '../utils/localStorage';
import { firebaseManager } from '../utils/firebaseManager';
import { auth } from '../firebase/config';

const SESSION_DURATION = 50 * 60; // 50 minutes

interface NowStore extends AppState {
  // Actions pour les projets
  addProject: (project: Omit<Project, 'id' | 'completedSessions'>) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  // Actions pour les tâches
  addTask: (task: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, newDate: 'today' | 'tomorrow') => void;
  
  // Actions pour le timer
  startTimer: (projectId: string) => void;
  pauseTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
  
  // Actions pour les sessions
  completeSession: (taskId: string, taskCompleted: boolean) => void;
  completeMultipleTasks: (taskUpdates: Array<{taskId: string, completed: boolean}>) => void;
  skipBreak: () => void;
  startBreak: () => void;
  
  // Actions pour la gestion des jours
  checkAndPerformDailyReset: () => void;
  getLogsForDate: (date: Date) => Promise<DailyLogEntry[]>;
  getAvailableDates: () => Promise<Date[]>;
  
  // Actions pour les modales
  showSessionModalAction: () => void;
  hideSessionModalAction: () => void;
  
  // Utilitaires
  getProjectById: (id: string) => Project | undefined;
  getTasksForProject: (projectId: string) => Task[];
  getTasksForDate: (date: 'today' | 'tomorrow') => Task[];
  getRemainingTasksForProject: (projectId: string) => number;

  // Initialisation de la base de données
  initDatabase: () => Promise<void>;
  addLogEntry: (type: 'session_interval' | 'break_interval' | 'task_complete' | 'task_create' | 'task_update' | 'task_delete' | 'task_move' | 'project_create' | 'project_update' | 'project_delete' | 'daily_reset', message: string, projectId?: string, taskId?: string, startTime?: Date, endTime?: Date, completedTasks?: string[]) => Promise<void>;
  saveState: () => Promise<void>;
  syncTimerState: () => Promise<void>;
  syncActiveSession: () => Promise<void>;
  forceSync: () => Promise<void>;
  
  // État pour suivre les sessions en cours
  activeSessionStart: Date | null;
  activeBreakStart: Date | null;
  
  // État de synchronisation
  isInitialized: boolean;
  isSyncing: boolean;
  lastTimerSync: number | null;
  
  // Fonctions helper pour la sauvegarde
  _saveTasks: (tasks: Task[]) => void;
  _saveProjects: (projects: Project[]) => void;
  _saveSessionProgress: () => void;
}

export const useNowStore = create<NowStore>((set, get) => ({
  // === ÉTAT INITIAL ===
  projects: [],
  tasks: [],
  sessions: [],
  timer: {
    isRunning: false,
    isPaused: false,
    currentProjectId: null,
    timeRemaining: SESSION_DURATION,
    totalTime: SESSION_DURATION,
    sessionStartTime: null,
    pauseStartTime: null,
    projectSessions: {},
    projectSessionProgress: {},
  },
  showSessionModal: false,
  currentSession: null,
  activeSessionStart: null as Date | null,
  activeBreakStart: null as Date | null,
  lastResetDate: undefined as string | undefined,
  isInitialized: false,
  isSyncing: false,
  lastTimerSync: null,

  // Fonction helper pour sauvegarder les tâches
  _saveTasks: (tasks: Task[]) => {
    const user = auth.currentUser;
    if (user?.uid) {
      firebaseManager.saveTasks(tasks);
    } else {
      saveTasksToLocalStorage(tasks);
    }
  },

  // Fonction helper pour sauvegarder les projets
  _saveProjects: (projects: Project[]) => {
    const user = auth.currentUser;
    if (user?.uid) {
      firebaseManager.saveProjects(projects);
    } else {
      saveProjectsToLocalStorage(projects);
    }
  },

  // === INITIALISATION ===
  initDatabase: async () => {
    try {
      const user = auth.currentUser;
      console.log('🔄 Initialisation du DataManager pour l\'utilisateur:', user?.uid || 'non connecté');
      
      // Marquer comme en cours de synchronisation
      set({ isSyncing: true });
      
      if (!user?.uid) {
        console.log('⚠️ Aucun utilisateur connecté, utilisation du localStorage');
        
        // Charger les données depuis le localStorage
        const localStorageData = {
          projects: JSON.parse(localStorage.getItem('projects') || '[]'),
          tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
          sessions: JSON.parse(localStorage.getItem('sessions') || '[]'),
          showSessionModal: JSON.parse(localStorage.getItem('showSessionModal') || 'false'),
          currentSession: JSON.parse(localStorage.getItem('currentSession') || 'null'),
          lastResetDate: localStorage.getItem('lastResetDate') || undefined,
        };

        // Synchroniser les projets avec les sessions complétées
        const projectSessions = JSON.parse(localStorage.getItem('projectSessions') || '{}');
        const synchronizedProjects = localStorageData.projects.map((project: any) => {
          const timeSpent = projectSessions[project.id] || 0;
          const completedSessions = Math.floor(timeSpent / SESSION_DURATION);
          return {
            ...project,
            completedSessions: Math.max(project.completedSessions || 0, completedSessions)
          };
        });

        // Timer avec préservation des sessions complétées ET en cours
        const cleanTimer = {
          isRunning: false,
          isPaused: false,
          currentProjectId: null,
          timeRemaining: SESSION_DURATION,
          totalTime: SESSION_DURATION,
          sessionStartTime: null,
          pauseStartTime: null,
          // PRÉSERVER les sessions complétées ET en cours depuis localStorage
          projectSessions: JSON.parse(localStorage.getItem('projectSessions') || '{}'),
          projectSessionProgress: JSON.parse(localStorage.getItem('projectSessionProgress') || '{}'),
        };
        
        // Forcer la sauvegarde du timer propre
        localStorage.setItem('timer', JSON.stringify(cleanTimer));

        set(() => ({
          projects: synchronizedProjects,
          tasks: localStorageData.tasks,
          sessions: localStorageData.sessions,
          timer: cleanTimer,
          showSessionModal: localStorageData.showSessionModal,
          currentSession: localStorageData.currentSession,
          activeSessionStart: null,
          activeBreakStart: null,
          lastResetDate: localStorageData.lastResetDate,
          isInitialized: true,
          isSyncing: false
        }));
        
        console.log('✅ Initialisation localStorage terminée - Timer réinitialisé');
        return;
      }
      
      // Marquer comme en cours de synchronisation
      set({ isSyncing: true });
      
      if (!user?.uid) {
        console.log('⚠️ Aucun utilisateur connecté, utilisation du localStorage');
        
        // Charger les données depuis le localStorage
        const localStorageData = {
          projects: JSON.parse(localStorage.getItem('projects') || '[]'),
          tasks: JSON.parse(localStorage.getItem('tasks') || '[]'),
          sessions: JSON.parse(localStorage.getItem('sessions') || '[]'),
          showSessionModal: JSON.parse(localStorage.getItem('showSessionModal') || 'false'),
          currentSession: JSON.parse(localStorage.getItem('currentSession') || 'null'),
          lastResetDate: localStorage.getItem('lastResetDate') || undefined,
        };

        // Synchroniser les projets avec les sessions complétées
        const projectSessions = JSON.parse(localStorage.getItem('projectSessions') || '{}');
        const synchronizedProjects = localStorageData.projects.map((project: any) => {
          const timeSpent = projectSessions[project.id] || 0;
          const completedSessions = Math.floor(timeSpent / SESSION_DURATION);
          return {
            ...project,
            completedSessions: Math.max(project.completedSessions || 0, completedSessions)
          };
        });

              // Timer réinitialisé mais en préservant les sessions complétées ET en cours
      const cleanTimer = {
        isRunning: false,
        isPaused: false,
        currentProjectId: null,
        timeRemaining: SESSION_DURATION,
        totalTime: SESSION_DURATION,
        sessionStartTime: null,
        pauseStartTime: null,
        // PRÉSERVER les sessions complétées ET en cours depuis localStorage
        projectSessions: JSON.parse(localStorage.getItem('projectSessions') || '{}'),
        projectSessionProgress: JSON.parse(localStorage.getItem('projectSessionProgress') || '{}'),
      };
        
        // Forcer la sauvegarde du timer propre
        localStorage.setItem('timer', JSON.stringify(cleanTimer));

        set(() => ({
          projects: synchronizedProjects,
          tasks: localStorageData.tasks,
          sessions: localStorageData.sessions,
          timer: cleanTimer,
          showSessionModal: localStorageData.showSessionModal,
          currentSession: localStorageData.currentSession,
          activeSessionStart: null,
          activeBreakStart: null,
          lastResetDate: localStorageData.lastResetDate,
          isInitialized: true,
          isSyncing: false
        }));
        
        console.log('✅ Initialisation localStorage terminée - Timer réinitialisé');
        return;
      }

      // Utilisateur connecté - utiliser Firebase
      console.log('🔥 Initialisation Firebase Manager pour:', user.uid);
      firebaseManager.init(user.uid);
      
      console.log('📥 Chargement des données depuis Firebase...');
      const data = await firebaseManager.loadAllData();
      
      console.log('📂 Données chargées:', data);
      
      // Nettoyer et valider les données
      const cleanProjects = (data.projects || []).filter((project: any) => 
        project && project.id && project.name && project.color
      );
      
      const cleanTasks = (data.tasks || []).filter((task: any) => 
        task && task.id && task.name && task.projectId
      );
      
      const cleanSessions = (data.sessions || []).filter((session: any) => 
        session && session.id && session.projectId
      );
      
      console.log('🧹 Données nettoyées:', {
        projects: cleanProjects.length,
        tasks: cleanTasks.length,
        sessions: cleanSessions.length
      });
      
              // Timer réinitialisé mais en préservant les sessions complétées ET en cours
        const cleanTimer = {
          isRunning: false,
          isPaused: false,
          currentProjectId: null,
          timeRemaining: SESSION_DURATION,
          totalTime: SESSION_DURATION,
          sessionStartTime: null,
          pauseStartTime: null,
          // PRÉSERVER les sessions complétées ET en cours depuis localStorage
          projectSessions: JSON.parse(localStorage.getItem('projectSessions') || '{}'),
          projectSessionProgress: JSON.parse(localStorage.getItem('projectSessionProgress') || '{}'),
        };

      set(() => ({
        projects: cleanProjects,
        tasks: cleanTasks,
        sessions: cleanSessions,
        timer: cleanTimer,
        showSessionModal: data.showSessionModal || false,
        currentSession: data.currentSession || null,
        activeSessionStart: null,
        activeBreakStart: null,
        lastResetDate: data.lastResetDate,
        isInitialized: true,
        isSyncing: false
      }));
      
      console.log('✅ Initialisation Firebase terminée - Timer réinitialisé');
      
      // Émettre un événement pour notifier que les logs sont prêts
      window.dispatchEvent(new CustomEvent('logsReady'));
      window.dispatchEvent(new CustomEvent('logAdded'));
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
      set({ isSyncing: false });
    }
  },

  // === LOGS ===
  addLogEntry: async (type, message, projectId, taskId, startTime, endTime, completedTasks) => {
    try {
      console.log('📝 Ajout de log:', { type, message });
      
      const user = auth.currentUser;
      if (user?.uid) {
        await firebaseManager.addDailyLogEntry({
          timestamp: new Date(),
          type,
          projectId,
          taskId,
          startTime,
          endTime,
          completedTasks,
          message
        });
      } else {
        // Sauvegarder dans localStorage
        const logs = JSON.parse(localStorage.getItem('dailyLogs') || '[]');
        const newLog = {
          id: Date.now().toString(),
          timestamp: new Date(),
          type,
          projectId,
          taskId,
          startTime,
          endTime,
          completedTasks,
          message
        };
        logs.push(newLog);
        localStorage.setItem('dailyLogs', JSON.stringify(logs));
      }
      
      // Émettre un événement personnalisé pour notifier les composants
      window.dispatchEvent(new CustomEvent('logAdded'));
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du log:', error);
    }
  },

  saveState: async () => {
    try {
      const state = get();
      if (state.isSyncing) {
        console.log('⏳ Synchronisation en cours, sauvegarde ignorée');
        return;
      }
      
      console.log('💾 Sauvegarde de l\'état...');
      
      const user = auth.currentUser;
      
      if (!user?.uid) {
        // Sauvegarder dans le localStorage
        saveAppStateToLocalStorage({
          projects: state.projects,
          tasks: state.tasks,
          sessions: state.sessions,
          timer: state.timer,
          showSessionModal: state.showSessionModal,
          currentSession: state.currentSession,
          activeSessionStart: state.activeSessionStart,
          activeBreakStart: state.activeBreakStart,
          lastResetDate: state.lastResetDate
        });
        
        // Sauvegarder spécifiquement les sessions complétées et en cours
        localStorage.setItem('projectSessions', JSON.stringify(state.timer.projectSessions));
        localStorage.setItem('projectSessionProgress', JSON.stringify(state.timer.projectSessionProgress));
        
        console.log('✅ État sauvegardé dans localStorage');
      } else {
        // Sauvegarder l'état d'avancement en préservant les sessions sauvegardées
        const timerStateToSave = {
          ...state.timer,
          // Ne pas sauvegarder timeRemaining si le timer est en cours pour éviter les oscillations
          timeRemaining: state.timer.isRunning ? SESSION_DURATION : state.timer.timeRemaining,
          // Ne pas sauvegarder sessionStartTime si le timer est en cours
          sessionStartTime: state.timer.isRunning ? null : state.timer.sessionStartTime,
          // IMPORTANT: Préserver projectSessionProgress pour les sessions sauvegardées
          projectSessionProgress: state.timer.projectSessionProgress
        };
        
        await firebaseManager.saveAppState({
          timer: timerStateToSave,
          showSessionModal: state.showSessionModal,
          currentSession: state.currentSession,
          activeSessionStart: state.activeSessionStart,
          activeBreakStart: state.activeBreakStart,
          lastResetDate: state.lastResetDate
        });
        
        console.log('✅ État d\'avancement sauvegardé dans Firebase');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'état:', error);
    }
  },

  // Synchroniser l'état d'avancement du timer de manière intelligente
  syncTimerState: async () => {
    try {
      const state = get();
      if (state.isSyncing) {
        return;
      }
      
      const user = auth.currentUser;
      if (!user?.uid) {
        // Pas d'utilisateur connecté, sauvegarder dans localStorage
        saveTimerToLocalStorage(state.timer);
        localStorage.setItem('activeSessionStart', JSON.stringify(state.activeSessionStart));
        localStorage.setItem('activeBreakStart', JSON.stringify(state.activeBreakStart));
        return;
      }
      
      // Protection contre les synchronisations trop fréquentes
      const now = Date.now();
      const lastSync = state.lastTimerSync || 0;
      if (now - lastSync < 5000) { // Attendre au moins 5 secondes entre les syncs
        return;
      }
      
      console.log('🔄 Synchronisation état d\'avancement...');
      
      set({ isSyncing: true, lastTimerSync: now });
      
      // Sauvegarder l'état d'avancement en préservant les sessions sauvegardées
      const timerStateToSave = {
        ...state.timer,
        // Ne pas sauvegarder timeRemaining si le timer est en cours pour éviter les oscillations
        timeRemaining: state.timer.isRunning ? SESSION_DURATION : state.timer.timeRemaining,
        // Ne pas sauvegarder sessionStartTime si le timer est en cours
        sessionStartTime: state.timer.isRunning ? null : state.timer.sessionStartTime,
        // IMPORTANT: Préserver projectSessionProgress pour les sessions sauvegardées
        projectSessionProgress: state.timer.projectSessionProgress
      };
      
      await firebaseManager.saveAppState({
        timer: timerStateToSave,
        activeSessionStart: state.activeSessionStart,
        activeBreakStart: state.activeBreakStart
      });
      
      set({ isSyncing: false });
      console.log('✅ État d\'avancement synchronisé');
    } catch (error) {
      console.error('❌ Erreur synchronisation état d\'avancement:', error);
      set({ isSyncing: false });
    }
  },

  // Nouvelle fonction pour synchroniser les sessions en cours
  syncActiveSession: async () => {
    try {
      const state = get();
      if (state.isSyncing) {
        return;
      }
      
      const user = auth.currentUser;
      if (!user?.uid) {
        // Pas d'utilisateur connecté, sauvegarder dans localStorage
        saveTimerToLocalStorage(state.timer);
        localStorage.setItem('currentSession', JSON.stringify(state.currentSession));
        return;
      }
      
      console.log('🔄 Synchronisation session active...');
      
      // Si une session est en cours, sauvegarder son état
      if (state.timer.isRunning && state.timer.currentProjectId) {
        const sessionData = {
          projectId: state.timer.currentProjectId,
          startTime: state.timer.sessionStartTime,
          timeRemaining: state.timer.timeRemaining,
          isPaused: state.timer.isPaused,
          pauseStartTime: state.timer.pauseStartTime,
          projectSessionProgress: state.timer.projectSessionProgress
        };
        
        await firebaseManager.saveAppState({
          timer: state.timer,
          activeSessionStart: state.activeSessionStart,
          activeBreakStart: state.activeBreakStart,
          currentSession: sessionData as any
        });
        
        console.log('✅ Session active synchronisée');
      }
    } catch (error) {
      console.error('❌ Erreur synchronisation session active:', error);
    }
  },

  forceSync: async () => {
    try {
      const state = get();
      console.log('🔄 Synchronisation forcée...');
      
      set({ isSyncing: true });
      
      await firebaseManager.saveAllData({
        projects: state.projects,
        tasks: state.tasks,
        sessions: state.sessions,
        timer: state.timer,
        showSessionModal: state.showSessionModal,
        currentSession: state.currentSession,
        activeSessionStart: state.activeSessionStart,
        activeBreakStart: state.activeBreakStart,
        lastResetDate: state.lastResetDate
      });
      
      set({ isSyncing: false });
      console.log('✅ Synchronisation forcée terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la synchronisation forcée:', error);
      set({ isSyncing: false });
    }
  },

  // === PROJETS ===
  addProject: (project) => {
    const state = get();
    if (!state.isInitialized) {
      console.log('⚠️ Store non initialisé, projet non ajouté');
      return;
    }
    
    // Vérifier si le projet existe déjà
    const existingProject = state.projects.find(p => p.name === project.name);
    if (existingProject) {
      console.log('⚠️ Projet déjà existant:', project.name);
      return;
    }
    
    const newProject: Project = {
      ...project,
      id: Date.now().toString(),
      completedSessions: 0,
    };
    
    console.log('➕ Ajout du projet:', newProject);
    
    set((state) => ({
      projects: [...state.projects, newProject]
    }));
    
    // Sauvegarder immédiatement
    setTimeout(() => {
      get()._saveProjects([...get().projects]);
    }, 500);
    
    // Ajouter un log
    get().addLogEntry('project_create', `Nouveau projet créé: ${project.name}`, newProject.id);
  },

  updateProject: (id, updates) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const project = state.projects.find(p => p.id === id);
    
    set((state) => ({
      projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveProjects(get().projects);
    }, 500);
    
    // Ajouter un log
    if (project) {
      get().addLogEntry('project_update', `Projet modifié: ${project.name}`, id);
    }
  },

  deleteProject: (id) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const project = state.projects.find(p => p.id === id);
    
    set((state) => ({
      projects: state.projects.filter(p => p.id !== id),
      // Supprimer aussi les tâches associées
      tasks: state.tasks.filter(t => t.projectId !== id)
    }));
    
    // Sauvegarder
    setTimeout(() => {
      firebaseManager.saveProjects(get().projects);
      firebaseManager.saveTasks(get().tasks);
    }, 500);
    
    // Ajouter un log
    if (project) {
      get().addLogEntry('project_delete', `Projet supprimé: ${project.name}`, id);
    }
  },

  // === TÂCHES ===
  addTask: (task) => {
    const state = get();
    if (!state.isInitialized) return;
    
    // Vérifier si la tâche existe déjà
    const existingTask = state.tasks.find(t => t.name === task.name && t.projectId === task.projectId);
    if (existingTask) {
      console.log('⚠️ Tâche déjà existante:', task.name);
      return;
    }
    
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
    };
    
    console.log('➕ Ajout de la tâche:', newTask);
    
    set((state) => ({
      tasks: [...state.tasks, newTask]
    }));
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveTasks(get().tasks);
    }, 500);
    
    // Ajouter un log
    get().addLogEntry('task_create', `Nouvelle tâche créée: ${task.name}`, task.projectId, newTask.id);
  },

  updateTask: (id, updates) => {
    const state = get();
    if (!state.isInitialized) return;
    
    set((state) => {
      const updatedTasks = state.tasks.map(t => t.id === id ? { ...t, ...updates } : t);
      return { tasks: updatedTasks };
    });
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveTasks(get().tasks);
    }, 500);
    
    // Ajouter un log
    const task = get().tasks.find(t => t.id === id);
    if (task) {
      if (updates.status === 'completed') {
        get().addLogEntry('task_complete', `Tâche accomplie: ${task.name}`, task.projectId, id);
      } else {
        get().addLogEntry('task_update', `Tâche modifiée: ${task.name}`, task.projectId, id);
      }
    }
  },

  deleteTask: (id) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const task = state.tasks.find(t => t.id === id);
    
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== id)
    }));
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveTasks(get().tasks);
    }, 500);
    
    // Ajouter un log
    if (task) {
      get().addLogEntry('task_delete', `Tâche supprimée: ${task.name}`, task.projectId, id);
    }
  },

  moveTask: (taskId, newDate) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const task = state.tasks.find(t => t.id === taskId);
    const oldDate = task?.assignedDate;
    
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, assignedDate: newDate } : t
      )
    }));
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveTasks(get().tasks);
    }, 500);
    
    // Ajouter un log
    if (task && oldDate !== newDate) {
      get().addLogEntry('task_move', `Tâche déplacée: ${task.name} (${oldDate} → ${newDate})`, task.projectId, taskId);
    }
  },

  // === TIMER ===
  startTimer: (projectId) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const project = state.getProjectById(projectId);
    if (!project) return;

    // Vérifier s'il y a une session en cours pour ce projet
    const sessionInProgress = state.timer.projectSessionProgress[projectId];
    let timeRemaining: number;
    let sessionStartTime: Date;

    if (sessionInProgress && sessionInProgress > 0 && sessionInProgress < SESSION_DURATION) {
      // Reprendre une session en cours
      timeRemaining = sessionInProgress;
      const elapsedTime = SESSION_DURATION - timeRemaining;
      sessionStartTime = new Date(Date.now() - (elapsedTime * 1000));
      console.log(`🔄 Reprise de session en cours pour ${project.name} (${timeRemaining}s restantes)`);
    } else {
      // Nouvelle session
      timeRemaining = SESSION_DURATION;
      sessionStartTime = new Date();
      console.log(`🚀 Nouvelle session démarrée pour ${project.name}`);
    }

    set((state) => {
      const newTimerState = {
        ...state.timer,
        isRunning: true,
        isPaused: false,
        currentProjectId: projectId,
        timeRemaining: timeRemaining,
        totalTime: SESSION_DURATION,
        sessionStartTime: sessionStartTime,
      };
      
      console.log('🚀 Timer démarré:', {
        isRunning: newTimerState.isRunning,
        isPaused: newTimerState.isPaused,
        currentProjectId: newTimerState.currentProjectId,
        timeRemaining: newTimerState.timeRemaining
      });
      
      return {
        timer: newTimerState,
        activeSessionStart: sessionStartTime,
      };
    });

    // Ajouter un log
    const isNewSession = !sessionInProgress || sessionInProgress === 0;
    const logMessage = isNewSession 
      ? `Session démarrée pour ${project.name}` 
      : `Session reprise pour ${project.name}`;
    get().addLogEntry('session_interval', logMessage, projectId, undefined, sessionStartTime, undefined, undefined);

    // Synchroniser uniquement l'état général, pas le timer en cours d'exécution
    get().saveState();
  },

  pauseTimer: () => {
    const state = get();
    if (!state.isInitialized) return;
    
    set((state) => {
      const now = new Date();
      
      if (state.timer.isPaused) {
        // Reprendre la pause
        const pauseDuration = now.getTime() - (state.timer.pauseStartTime?.getTime() || now.getTime());
        const adjustedStartTime = new Date((state.timer.sessionStartTime?.getTime() || now.getTime()) + pauseDuration);
        
        // Ajouter un log
        if (state.timer.currentProjectId) {
          const project = get().getProjectById(state.timer.currentProjectId);
          const projectName = project?.name || 'Projet inconnu';
          get().addLogEntry('session_interval', `Session reprise pour ${projectName}`, state.timer.currentProjectId);
        }
        
        return {
          timer: {
            ...state.timer,
            isPaused: false,
            pauseStartTime: null,
            sessionStartTime: adjustedStartTime
          }
        };
      } else {
        // Mettre en pause
        if (state.timer.currentProjectId) {
          const project = get().getProjectById(state.timer.currentProjectId);
          const projectName = project?.name || 'Projet inconnu';
          get().addLogEntry('break_interval', `Pause interne pour ${projectName}`, state.timer.currentProjectId);
        }
        
        return {
          timer: {
            ...state.timer,
            isPaused: true,
            pauseStartTime: now
          }
        };
      }
    });
    // Synchroniser uniquement l'état général, pas le timer en cours d'exécution
    get().saveState();
  },

  stopTimer: () => {
    const state = get();
    const now = new Date();
    
    // Ajouter un log de fin de session
    if (state.timer.currentProjectId) {
      const project = get().getProjectById(state.timer.currentProjectId);
      const projectName = project?.name || 'Projet inconnu';
      const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      get().addLogEntry(
        'session_interval', 
        `Session arrêtée pour ${projectName} (${formatTime(state.timer.sessionStartTime || now)} - ${formatTime(now)})`, 
        state.timer.currentProjectId, 
        undefined, 
        state.timer.sessionStartTime || undefined, 
        now
      );
    }
    
    set((state) => ({
      timer: {
        ...state.timer,
        isRunning: false,
        isPaused: false,
        currentProjectId: null,
        timeRemaining: SESSION_DURATION,
        totalTime: SESSION_DURATION,
        sessionStartTime: null,
        pauseStartTime: null,
      },
      activeSessionStart: null,
    }));
    
    // Synchroniser uniquement l'état général, pas le timer en cours d'exécution
    get().saveState();
  },

  resetTimer: () => {
    set((state) => ({
              timer: {
          ...state.timer,
          isRunning: false,
          isPaused: false,
          currentProjectId: null,
          timeRemaining: SESSION_DURATION,
          totalTime: SESSION_DURATION,
          sessionStartTime: null,
          pauseStartTime: null,
          // SOLUTION RADICALE : Vider complètement projectSessionProgress
          projectSessionProgress: {},
        },
      activeSessionStart: null,
    }));
    
    // Synchroniser uniquement l'état général, pas le timer en cours d'exécution
    get().saveState();
  },

  // === SESSIONS ===
  completeSession: (taskId, taskCompleted) => {
    const state = get();
    if (!state.isInitialized) return;
    
    const now = new Date();
    
    if (!state.timer.currentProjectId) return;
    
    const project = state.getProjectById(state.timer.currentProjectId);
    if (!project) return;
    
    const task = state.tasks.find(t => t.id === taskId);
    const taskName = task?.name || 'Tâche inconnue';
    
    // Créer la session
    const session: Session = {
      id: Date.now().toString(),
      projectId: state.timer.currentProjectId,
      taskId: taskId,
      startTime: state.timer.sessionStartTime || now,
      endTime: now,
      duration: state.timer.totalTime - state.timer.timeRemaining,
      completed: true,
      taskWorkedOn: taskName,
      taskCompleted: taskCompleted,
    };
    
    // Mettre à jour l'état
    set((state) => {
      // Incrémenter le compteur de sessions complétées pour le projet
      const updatedProjects = state.projects.map(project => {
        if (project.id === state.timer.currentProjectId) {
          return { ...project, completedSessions: project.completedSessions + 1 };
        }
        return project;
      });

      const newProjectSessions = {
        ...state.timer.projectSessions,
        [state.timer.currentProjectId!]: (state.timer.projectSessions[state.timer.currentProjectId!] || 0) + (state.timer.totalTime - state.timer.timeRemaining)
      };

      return {
        projects: updatedProjects,
        sessions: [...state.sessions, session],
        timer: {
          ...state.timer,
          isRunning: false,
          isPaused: false,
          currentProjectId: null,
          timeRemaining: SESSION_DURATION,
          totalTime: SESSION_DURATION,
          sessionStartTime: null,
          pauseStartTime: null,
          projectSessions: newProjectSessions,
          // Ne vider que la session du projet actuel, pas toutes les sessions
          projectSessionProgress: {
            ...state.timer.projectSessionProgress,
            [state.timer.currentProjectId!]: 0 // Session terminée, remettre à 0
          }
        },
        showSessionModal: false,
        currentSession: null,
        activeSessionStart: null,
      };
    });
    
    // Synchroniser uniquement l'état général
    get().saveState();
    setTimeout(() => {
      const user = auth.currentUser;
      if (user?.uid) {
        firebaseManager.saveProjects(get().projects);
        firebaseManager.saveSessions(get().sessions);
      } else {
        saveProjectsToLocalStorage(get().projects);
        saveSessionsToLocalStorage(get().sessions);
        // SAUVEGARDER les sessions complétées et en cours dans localStorage
        localStorage.setItem('projectSessions', JSON.stringify(get().timer.projectSessions));
        localStorage.setItem('projectSessionProgress', JSON.stringify(get().timer.projectSessionProgress));
      }
    }, 100);
    
    // Ajouter un log
    const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
    get().addLogEntry(
      'session_interval', 
      `Session terminée pour ${project.name} - ${taskName} (${formatTime(session.startTime)} - ${formatTime(session.endTime || now)})`, 
      state.timer.currentProjectId, 
      taskId, 
      session.startTime, 
      session.endTime || now, 
      taskCompleted ? [taskId] : []
    );
  },

  completeMultipleTasks: (taskUpdates) => {
    const state = get();
    if (!state.isInitialized) return;
    
    set((state) => {
      const updatedTasks = state.tasks.map(task => {
        const update = taskUpdates.find(u => u.taskId === task.id);
        return update ? { ...task, status: update.completed ? 'completed' as const : 'pending' as const } : task;
      });
      
      return { tasks: updatedTasks };
    });
    
    // Sauvegarder
    setTimeout(() => {
      get()._saveTasks(get().tasks);
    }, 500);
    
    // Ajouter des logs
    taskUpdates.forEach(update => {
      const task = get().tasks.find(t => t.id === update.taskId);
      if (task) {
        get().addLogEntry(
          update.completed ? 'task_complete' : 'task_update',
          update.completed ? `Tâche accomplie: ${task.name}` : `Tâche modifiée: ${task.name}`,
          task.projectId,
          update.taskId
        );
      }
    });
  },

  skipBreak: () => set(() => {
    return {
      timer: {
        ...get().timer,
        isRunning: false,
        isPaused: false,
        currentProjectId: null,
        timeRemaining: SESSION_DURATION,
        totalTime: SESSION_DURATION,
        sessionStartTime: null,
        pauseStartTime: null,
      },
      showSessionModal: false,
      currentSession: null,
      activeSessionStart: null,
    };
  }),

  startBreak: () => set((state) => {
    const now = new Date();
    
    return {
      timer: {
        ...state.timer,
        isRunning: true,
        isPaused: false,
        currentProjectId: null,
        timeRemaining: 10 * 60, // 10 minutes
        totalTime: 10 * 60,
        sessionStartTime: now,
        pauseStartTime: null,
      },
      activeBreakStart: now,
    };
  }),

  // === GESTION DES JOURS ===
  checkAndPerformDailyReset: () => {
    const state = get();
    const today = new Date().toDateString();
    
    if (state.lastResetDate !== today) {
      // Réinitialisation quotidienne - NE PAS vider projectSessionProgress
      set(() => ({
        timer: {
          ...state.timer,
          projectSessions: {},
          // Garder projectSessionProgress pour les sessions en cours
          projectSessionProgress: state.timer.projectSessionProgress,
        },
        lastResetDate: today,
      }));
      
      // Ajouter un log de réinitialisation
      if (auth.currentUser) {
        get().addLogEntry('daily_reset', 'Réinitialisation quotidienne effectuée');
      }
      
      console.log('🔄 Réinitialisation quotidienne à 5h du matin');
    }
  },

  getLogsForDate: async (date) => {
    try {
      const { firebaseManager } = await import('../utils/firebaseManager');
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 5, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 4, 59, 59);
      
      return await firebaseManager.getLogsBetweenDates(startOfDay, endOfDay);
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
      return [];
    }
  },

  getAvailableDates: async () => {
    return [];
  },

  // === MODALES ===
  showSessionModalAction: () => set({ showSessionModal: true }),
  hideSessionModalAction: () => set({ showSessionModal: false }),

  // === UTILITAIRES ===
  getProjectById: (id) => get().projects.find(p => p.id === id),
  getTasksForProject: (projectId) => get().tasks.filter(t => t.projectId === projectId),
  getTasksForDate: (date) => get().tasks.filter(t => t.assignedDate === date),
  getRemainingTasksForProject: (projectId) => {
    return get().tasks.filter(t => t.projectId === projectId && t.status !== 'completed').length;
  },
  // Fonction simplifiée pour sauvegarder l'état d'avancement des sessions
  _saveSessionProgress: () => {
    const state = get();
    const user = auth.currentUser;
    
    // Sauvegarder seulement les sessions complétées, pas l'état en cours
    const sessionProgress = {
      timer: {
        ...state.timer,
        projectSessions: state.timer.projectSessions,
        projectSessionProgress: state.timer.projectSessionProgress,
      }
    };
    
    if (user?.uid) {
      // Sauvegarder dans Firebase
      firebaseManager.saveAppState(sessionProgress);
    } else {
      // Sauvegarder dans localStorage
      localStorage.setItem('sessionProgress', JSON.stringify(sessionProgress));
    }
    
    console.log('💾 Progression des sessions sauvegardée');
  },
})); 