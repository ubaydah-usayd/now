import { useEffect, useRef, useCallback } from 'react';
import { useNowStore } from '../store';
import { Session } from '../types';
import { soundManager } from '../utils/sounds';

const SESSION_DURATION = 50 * 60; // 50 minutes

export const useTimer = () => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isSwitchingProjectRef = useRef<boolean>(false);
  const { timer, isInitialized } = useNowStore();

  const startTimer = useCallback((projectId: string) => {
    const currentState = useNowStore.getState();
    
    // Marquer qu'on est en train de switcher de projet
    isSwitchingProjectRef.current = true;
    
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

  // Restaurer les sessions en cours au démarrage seulement
  useEffect(() => {
    if (isInitialized && !timer.isRunning) {
      // Vérifier s'il y a des sessions en cours à restaurer (projectSessionProgress)
      const sessionsInProgress = Object.entries(timer.projectSessionProgress)
        .filter(([projectId, timeRemaining]) => timeRemaining > 0 && timeRemaining < SESSION_DURATION)
        .sort(([, a], [, b]) => b - a); // Trier par temps restant décroissant
      
      if (sessionsInProgress.length > 0) {
        const [projectId, timeRemaining] = sessionsInProgress[0];
        console.log(`🔄 Restauration de la session en cours pour le projet ${projectId} (${timeRemaining}s restantes)`);
        
        // Restaurer la session la plus récente
        const elapsedTime = SESSION_DURATION - timeRemaining;
        const sessionStartTime = new Date(Date.now() - (elapsedTime * 1000));
        
        useNowStore.setState((state) => ({
          timer: {
            ...state.timer,
            isRunning: true,
            isPaused: false,
            currentProjectId: projectId,
            timeRemaining: timeRemaining,
            totalTime: SESSION_DURATION,
            sessionStartTime: sessionStartTime,
            pauseStartTime: null,
          },
          activeSessionStart: sessionStartTime,
        }));
      }
    }
  }, [isInitialized]); // Seulement au démarrage

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
          
          // Sauvegarder périodiquement le temps écoulé (toutes les 30 secondes)
          const currentTime = Date.now();
          const lastSave = currentState.lastTimerSync || 0;
          if (currentTime - lastSave > 30000) { // 30 secondes
            // Sauvegarder la progression de la session en cours
            const currentProjectId = currentState.timer.currentProjectId;
            
            if (currentProjectId) {
              useNowStore.setState((state) => ({
                timer: {
                  ...state.timer,
                  projectSessionProgress: {
                    ...state.timer.projectSessionProgress,
                    [currentProjectId]: newTimeRemaining
                  }
                }
              }));
              
              // Sauvegarder immédiatement
              setTimeout(() => {
                const { saveState } = useNowStore.getState();
                saveState();
              }, 100);
            }
          }
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