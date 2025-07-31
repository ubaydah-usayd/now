import { useEffect, useRef, useCallback } from 'react';
import { useNowStore } from '../store';
import { Session } from '../types';
import { soundManager } from '../utils/sounds';

const SESSION_DURATION = 50 * 60; // 50 minutes

export const useTimer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSwitchingProjectRef = useRef<boolean>(false);
  const { timer } = useNowStore();

  const startTimer = useCallback((projectId: string) => {
    const currentState = useNowStore.getState();
    
    // Marquer qu'on est en train de switcher de projet
    isSwitchingProjectRef.current = true;
    
    // Si un projet est déjà en cours ET différent du nouveau projet, sauvegarder le temps passé
    if (currentState.timer.currentProjectId && 
        currentState.timer.currentProjectId !== projectId && 
        currentState.timer.currentProjectId !== null) {
      // Sauvegarder le temps restant du projet actuel
      useNowStore.setState((state) => ({
        timer: {
          ...state.timer,
          projectSessionProgress: {
            ...state.timer.projectSessionProgress,
            [currentState.timer.currentProjectId!]: currentState.timer.timeRemaining
          }
        }
      }));
    }
    
    // Nettoyer l'interval avant de démarrer une nouvelle session
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Toujours appeler startTimer du store
    const { startTimer } = useNowStore.getState();
    startTimer(projectId);
    
    // Jouer le son de début de session
    soundManager.play('start');
    
    // Réinitialiser le flag après un court délai
    setTimeout(() => {
      isSwitchingProjectRef.current = false;
    }, 100);
  }, []);

  const pauseTimer = useCallback(() => {
    const { pauseTimer } = useNowStore.getState();
    pauseTimer();
  }, []);

  const stopTimer = useCallback(() => {
    const { stopTimer } = useNowStore.getState();
    stopTimer();
  }, []);

  const skipBreak = useCallback(() => {
    const { skipBreak } = useNowStore.getState();
    skipBreak();
  }, []);

  // Fonction pour calculer le temps restant basé sur sessionStartTime
  const calculateTimeRemaining = useCallback(() => {
    // Si le timer est en pause, retourner la valeur actuelle sans recalculer
    if (timer.isPaused) {
      return timer.timeRemaining;
    }
    
    if (!timer.sessionStartTime || !timer.isRunning) {
      return timer.timeRemaining;
    }
    
    const elapsedTime = Math.floor((Date.now() - timer.sessionStartTime.getTime()) / 1000);
    
    // Si c'est une pause (currentProjectId est null), utiliser BREAK_DURATION
    if (!timer.currentProjectId) {
      const BREAK_DURATION = 10 * 60; // 10 minutes
      const timeRemaining = Math.max(0, BREAK_DURATION - elapsedTime);
      return timeRemaining;
    }
    
    // Sinon, c'est une session normale
    const timeRemaining = Math.max(0, SESSION_DURATION - elapsedTime);
    return timeRemaining;
  }, [timer.sessionStartTime, timer.isRunning, timer.isPaused, timer.currentProjectId, timer.timeRemaining]);

  // Gestion du countdown basé sur le temps réel
  useEffect(() => {
    // Nettoyer l'interval précédent
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Démarrer un nouvel interval seulement si le timer est actif, pas en pause ET qu'il reste du temps
    console.log('⏱️ État du timer:', {
      isRunning: timer.isRunning,
      isPaused: timer.isPaused,
      timeRemaining: timer.timeRemaining,
      currentProjectId: timer.currentProjectId
    });
    
    if (timer.isRunning && !timer.isPaused && timer.timeRemaining > 0) {
      const intervalId = setInterval(() => {
        // Protection supplémentaire : vérifier que le timer n'est pas en pause
        const currentState = useNowStore.getState();
        if (currentState.timer.isPaused) {
          return; // Ne pas continuer si le timer est en pause
        }
        
        const newTimeRemaining = calculateTimeRemaining();
        
        if (newTimeRemaining > 0) {
          useNowStore.setState((state) => ({
            timer: {
              ...state.timer,
              timeRemaining: newTimeRemaining
            }
          }));
          
          // Synchroniser l'état du timer en temps réel
          useNowStore.getState().syncTimerState();
        } else {
          // Session terminée - afficher le modal
          if (intervalId) {
            clearInterval(intervalId);
          }
          
          // Protection : ne pas déclencher la fin de session si on vient de switcher de projet
          if (isSwitchingProjectRef.current) {
            return;
          }
          
          // Jouer le son de fin de session
          soundManager.play('end-session');
          
          // Afficher le modal de session terminée
          const currentState = useNowStore.getState();
          const projectId = currentState.timer.currentProjectId;
          
          if (!projectId) {
            return;
          }
          
          const session: Session = {
            id: Date.now().toString(),
            projectId: projectId,
            taskId: '',
            startTime: currentState.timer.sessionStartTime || new Date(),
            endTime: new Date(),
            duration: currentState.timer.totalTime,
            completed: true,
            taskWorkedOn: '',
            taskCompleted: false,
          };
          
          // Forcer l'affichage du modal et incrémenter le compteur de sessions
          useNowStore.setState((state) => {
            // Incrémenter le compteur de sessions complétées pour le projet
            const updatedProjects = state.projects.map(project => {
              if (project.id === projectId) {
                return { ...project, completedSessions: project.completedSessions + 1 };
              }
              return project;
            });

            const newProjectSessions = {
              ...state.timer.projectSessions,
              [projectId]: (state.timer.projectSessions[projectId] || 0) + currentState.timer.totalTime
            };

            return {
              projects: updatedProjects,
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
                projectSessionProgress: {
                  ...state.timer.projectSessionProgress,
                  [projectId]: 0 // Session terminée, remettre à 0
                }
              },
              showSessionModal: true,
              currentSession: session
            };
          });
        }
      }, 1000);
      
      intervalRef.current = intervalId;
    }

    // Gérer le cas où timeRemaining est 0 et le timer est encore en cours
    if (timer.timeRemaining === 0 && timer.isRunning && !timer.isPaused && !isSwitchingProjectRef.current) {
      // Jouer le son de fin de session
      soundManager.play('end-session');
      
      const currentState = useNowStore.getState();
      const projectId = currentState.timer.currentProjectId;
      
      if (projectId) {
        const session: Session = {
          id: Date.now().toString(),
          projectId: projectId,
          taskId: '',
          startTime: currentState.timer.sessionStartTime || new Date(),
          endTime: new Date(),
          duration: currentState.timer.totalTime,
          completed: true,
          taskWorkedOn: '',
          taskCompleted: false,
        };
        
        // Forcer l'affichage du modal et incrémenter le compteur de sessions
        useNowStore.setState((state) => {
          // Incrémenter le compteur de sessions complétées pour le projet
          const updatedProjects = state.projects.map(project => {
            if (project.id === projectId) {
              return { ...project, completedSessions: project.completedSessions + 1 };
            }
            return project;
          });

          const newProjectSessions = {
            ...state.timer.projectSessions,
            [projectId]: (state.timer.projectSessions[projectId] || 0) + currentState.timer.totalTime
          };

          return {
            projects: updatedProjects,
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
              projectSessionProgress: {
                ...state.timer.projectSessionProgress,
                [projectId]: 0 // Session terminée, remettre à 0
              }
            },
            showSessionModal: true,
            currentSession: session
          };
        });
      }
    }

    // Gérer la fin d'une pause
    if (timer.isRunning && !timer.currentProjectId && timer.timeRemaining === 0) {
      // Jouer le son de fin de pause
      soundManager.play('end-pause');
      
      const startTime = useNowStore.getState().activeBreakStart;
      const endTime = new Date();
      
      // Créer un intervalle de pause
      if (startTime) {
        const formatTime = (date: Date) => date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false });
        const message = `Pause de ${formatTime(startTime)} à ${formatTime(endTime)}`;
        
        useNowStore.getState().addLogEntry('break_interval', message, undefined, undefined, startTime, endTime);
      }
      
      useNowStore.setState((state) => ({
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
        activeBreakStart: null, // Réinitialiser le début de pause
      }));
    }

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timer.isRunning, timer.isPaused, timer.timeRemaining, calculateTimeRemaining]);

  return {
    startTimer,
    pauseTimer,
    stopTimer,
    skipBreak,
    timer
  };
}; 