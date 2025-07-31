import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { useTimer } from '../hooks/useTimer';
import { getProjectColor } from '../utils/colors';
import { auth } from '../firebase/config';

// Fonction pour assombrir une couleur
function darkenColor(hex: string, percent: number = 20): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const factor = (100 - percent) / 100;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

const SESSION_DURATION = 50 * 60; // 50 minutes

interface ProjectSelectorProps {
  projectId: string;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({ projectId }) => {
  const [contextMenu, setContextMenu] = useState<{
    show: boolean;
    x: number;
    y: number;
    sessionIndex: number;
  }>({ show: false, x: 0, y: 0, sessionIndex: 0 });
  
  const { 
    projects, 
    timer, 
    getRemainingTasksForProject 
  } = useNowStore();
  const { startTimer } = useTimer();

  const project = projects.find(p => p.id === projectId);
  if (!project) return null;

  const handleProjectClick = () => {
    // Permettre de changer de projet même si c'est le projet actuel
    // Cela permet de reprendre une session en cours ou de changer de projet
    startTimer(projectId);
  };

  const handleIndicatorRightClick = (e: React.MouseEvent, sessionIndex: number) => {
    e.preventDefault();
    setContextMenu({
      show: true,
      x: e.clientX,
      y: e.clientY,
      sessionIndex
    });
  };

  const handleValidateSession = () => {
    const { addLogEntry } = useNowStore.getState();
    
    // Créer un log de session validée manuellement
    const now = new Date();
    const startTime = new Date(now.getTime() - (50 * 60 * 1000)); // 50 minutes en arrière

    // Mettre à jour l'état du projet ET du timer pour incrémenter les sessions complétées
    useNowStore.setState((state) => {
      const updatedProjects = state.projects.map(p => {
        if (p.id === projectId) {
          return { ...p, completedSessions: p.completedSessions + 1 };
        }
        return p;
      });

      const newProjectSessions = {
        ...state.timer.projectSessions,
        [projectId]: (state.timer.projectSessions[projectId] || 0) + SESSION_DURATION
      };

      return {
        projects: updatedProjects,
        timer: {
          ...state.timer,
          projectSessions: newProjectSessions
        }
      };
    });

    // SAUVEGARDER IMMÉDIATEMENT après validation de session
    setTimeout(() => {
      const { saveState, _saveProjects } = useNowStore.getState();
      const user = auth.currentUser;
      
      if (user?.uid) {
        // Sauvegarder dans Firebase
        _saveProjects(useNowStore.getState().projects);
        saveState();
      } else {
        // Sauvegarder dans localStorage
        _saveProjects(useNowStore.getState().projects);
        localStorage.setItem('projectSessions', JSON.stringify(useNowStore.getState().timer.projectSessions));
      }
    }, 100);
    
    addLogEntry(
      'session_interval',
      `Session ${contextMenu.sessionIndex + 1} validée manuellement`,
      projectId,
      undefined,
      startTime,
      now,
      []
    );
    
    // Fermer le menu contextuel
    setContextMenu({ show: false, x: 0, y: 0, sessionIndex: 0 });
  };



  // Fermer le menu contextuel si on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.show) {
        setContextMenu({ show: false, x: 0, y: 0, sessionIndex: 0 });
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contextMenu.show]);

  const isSelected = timer.currentProjectId === project.id;
  const remainingTasks = getRemainingTasksForProject(project.id);
  
  // Utiliser project.completedSessions comme source de vérité pour éviter les désynchronisations
  const sessionsCompleted = project.completedSessions;
  
  // Suppression des useEffect qui causaient une boucle infinie
  // La synchronisation se fait maintenant de manière unidirectionnelle dans le store

  
  const isProjectCompleted = sessionsCompleted >= project.dailyHours;
  
  // Calculer le pourcentage de remplissage (peut dépasser 100% pour les heures supplémentaires)
  const fillPercentage = Math.min((sessionsCompleted / project.dailyHours) * 100, 100);
  
  // Calculer le nombre total d'indicateurs à afficher (sessions normales + supplémentaires)
  const totalIndicators = Math.max(project.dailyHours, sessionsCompleted);
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="relative w-full">
        <button
          className={`project-button ${isSelected ? 'selected' : ''} ${
            isProjectCompleted ? 'opacity-75' : ''
          } w-full h-16`}
          style={{
            '--fill-percentage': `${fillPercentage}%`,
            '--project-color': getProjectColor(project.color, false), // Couleur lumineuse pour le bouton
            '--project-color-dark': darkenColor(getProjectColor(project.color, false), 20)
          } as React.CSSProperties}
          onClick={handleProjectClick}
        >
          <span>{project.name}</span>
          {sessionsCompleted > project.dailyHours && (
            <span className="text-xs ml-2 bg-yellow-500 text-black px-1 rounded">
              +{sessionsCompleted - project.dailyHours}
            </span>
          )}
        </button>
        {remainingTasks > 0 && (
          <div className="badge">
            {remainingTasks}
          </div>
        )}
      </div>
      

      
      {/* Progrès de la session en cours */}
      {(() => {
        const sessionInProgress = timer.projectSessionProgress[project.id];
        const hasIncompleteSession = sessionInProgress && sessionInProgress > 0 && sessionInProgress < SESSION_DURATION;
        
        if (hasIncompleteSession) {
          const timeRemaining = sessionInProgress;
          return (
            <div className="text-xs text-now-green mt-1">
              {timer.currentProjectId === project.id && timer.isRunning ? (
                `Session en cours: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
              ) : (
                `Session sauvegardée: ${Math.floor(timeRemaining / 60)}:${(timeRemaining % 60).toString().padStart(2, '0')}`
              )}
            </div>
          );
        }
        return null;
      })()}
      
      {/* Indicateurs de progression */}
      <div className="flex space-x-1 mt-2">
        {Array.from({ length: totalIndicators }, (_, index) => {
          const isCompleted = index < sessionsCompleted;
          const isExtra = index >= project.dailyHours;
          
          return (
            <div
              key={index}
              className={`indicator-dot ${
                isCompleted ? 'completed' : 'pending'
              } ${isExtra ? 'extra-session' : ''}`}
              title={isExtra ? 'Session supplémentaire' : isCompleted ? 'Session terminée' : 'Clic droit pour valider'}
              onContextMenu={(e) => handleIndicatorRightClick(e, index)}
              style={{ cursor: 'pointer' }}
            />
          );
        })}
      </div>

      {/* Menu contextuel */}
      {contextMenu.show && (
        <div
          className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-lg py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
          }}
        >
          <button
            onClick={handleValidateSession}
            className="w-full px-4 py-2 text-sm text-white hover:bg-gray-700 transition-colors text-left"
          >
            ✅ Valider la session
          </button>
        </div>
      )}
    </div>
  );
}; 