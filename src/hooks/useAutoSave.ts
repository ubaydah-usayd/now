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
      
      // Mettre à jour l'état local si nécessaire
      if (appState.timer) {
        useNowStore.setState((state) => ({
          timer: {
            ...state.timer,
            ...appState.timer
          },
          activeSessionStart: appState.activeSessionStart || state.activeSessionStart,
          activeBreakStart: appState.activeBreakStart || state.activeBreakStart
        }));
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
      saveState();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveState();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveState]);

  return { debouncedSave, saveState, syncTimerState };
}; 