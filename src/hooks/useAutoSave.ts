import { useEffect, useRef } from 'react';
import { useNowStore } from '../store';
import { firebaseManager } from '../utils/firebaseManager';
import { useAuth } from './useAuth';

export const useAutoSave = () => {
  const { saveState, syncTimerState } = useNowStore();
  const { user } = useAuth();
  const saveTimeoutRef = useRef<number | null>(null);

  // Fonction pour sauvegarder avec debounce
  const debouncedSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    saveTimeoutRef.current = window.setTimeout(() => {
      saveState();
    }, 1000); // Sauvegarder après 1 seconde d'inactivité
  };

  // Écouter les changements en temps réel de l'état de l'application (seulement si connecté)
  useEffect(() => {
    if (!user?.uid) {
      console.log('🔄 Pas d\'utilisateur connecté, synchronisation locale uniquement');
      return;
    }

    console.log('🔄 Initialisation de l\'écoute en temps réel pour l\'utilisateur:', user.uid);
    
    // Écouter les changements de l'état de l'application
    const unsubscribeAppState = firebaseManager.onAppStateChange((appState) => {
      console.log('📡 Changement d\'état reçu:', appState);
      
      // Écouter les changements d'état d'avancement depuis Firebase
      // mais éviter les boucles de synchronisation
      if (appState.timer) {
        const currentState = useNowStore.getState();
        
        // Ne mettre à jour que les données d'avancement importantes
        // sans toucher au timer en cours d'exécution
        const shouldUpdate = 
          currentState.timer.projectSessions !== (appState.timer?.projectSessions || {}) ||
          currentState.timer.projectSessionProgress !== (appState.timer?.projectSessionProgress || {}) ||
          currentState.timer.currentProjectId !== appState.timer?.currentProjectId;
        
        if (shouldUpdate && !currentState.timer.isRunning && appState.timer) {
          console.log('📡 Mise à jour de l\'état d\'avancement depuis Firebase');
          useNowStore.setState((state) => ({
            timer: {
              ...state.timer,
              projectSessions: appState.timer!.projectSessions || state.timer.projectSessions,
              // Fusionner les sessions sauvegardées au lieu de les écraser
              projectSessionProgress: {
                ...state.timer.projectSessionProgress,
                ...appState.timer!.projectSessionProgress
              },
              currentProjectId: appState.timer!.currentProjectId || state.timer.currentProjectId
            },
            activeSessionStart: appState.activeSessionStart || state.activeSessionStart,
            activeBreakStart: appState.activeBreakStart || state.activeBreakStart
          }));
        }
      }
    });

    // Écouter les changements des projets
    const unsubscribeProjects = firebaseManager.onProjectsChange((projects) => {
      console.log('📡 Changement de projets reçu:', projects.length);
      useNowStore.setState({ projects });
    });

    // Écouter les changements des tâches
    const unsubscribeTasks = firebaseManager.onTasksChange((tasks) => {
      console.log('📡 Changement de tâches reçu:', tasks.length);
      useNowStore.setState({ tasks });
    });

    // Écouter les changements des sessions
    const unsubscribeSessions = firebaseManager.onSessionsChange((sessions) => {
      console.log('📡 Changement de sessions reçu:', sessions.length);
      useNowStore.setState({ sessions });
    });

    return () => {
      console.log('🔄 Nettoyage des listeners en temps réel');
      unsubscribeAppState();
      unsubscribeProjects();
      unsubscribeTasks();
      unsubscribeSessions();
    };
  }, [user?.uid]);

  // Sauvegarder quand l'utilisateur quitte la page
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('💾 Sauvegarde avant fermeture de la page');
      const currentState = useNowStore.getState();
      
      // Sauvegarder immédiatement l'état actuel
      if (currentState.timer.isRunning && currentState.timer.currentProjectId) {
        // Sauvegarder la progression de la session en cours
        const updatedTimer = {
          ...currentState.timer,
          projectSessionProgress: {
            ...currentState.timer.projectSessionProgress,
            [currentState.timer.currentProjectId]: currentState.timer.timeRemaining
          }
        };
        
        // Sauvegarder dans localStorage
        localStorage.setItem('timer', JSON.stringify(updatedTimer));
        localStorage.setItem('projectSessionProgress', JSON.stringify(updatedTimer.projectSessionProgress));
      }
      
      saveState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('💾 Sauvegarde lors du changement de visibilité');
        const currentState = useNowStore.getState();
        
        // Sauvegarder la progression de la session en cours
        if (currentState.timer.isRunning && currentState.timer.currentProjectId) {
          const updatedTimer = {
            ...currentState.timer,
            projectSessionProgress: {
              ...currentState.timer.projectSessionProgress,
              [currentState.timer.currentProjectId]: currentState.timer.timeRemaining
            }
          };
          
          // Sauvegarder dans localStorage
          localStorage.setItem('timer', JSON.stringify(updatedTimer));
          localStorage.setItem('projectSessionProgress', JSON.stringify(updatedTimer.projectSessionProgress));
        }
        
        saveState();
      }
    };

    // Sauvegarder périodiquement les sessions en cours
    const periodicSaveInterval = setInterval(() => {
      const currentState = useNowStore.getState();
      if (currentState.timer.isRunning && currentState.timer.currentProjectId) {
        // Sauvegarder la session en cours toutes les 10 secondes
        console.log('💾 Sauvegarde périodique de la session en cours');
        
        // Mettre à jour la progression de la session
        const updatedTimer = {
          ...currentState.timer,
          projectSessionProgress: {
            ...currentState.timer.projectSessionProgress,
            [currentState.timer.currentProjectId]: currentState.timer.timeRemaining
          }
        };
        
        // Sauvegarder dans localStorage
        localStorage.setItem('timer', JSON.stringify(updatedTimer));
        localStorage.setItem('projectSessionProgress', JSON.stringify(updatedTimer.projectSessionProgress));
        
        saveState();
      }
    }, 10000); // 10 secondes

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(periodicSaveInterval);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveState]);

  return { debouncedSave, saveState, syncTimerState };
}; 