import React from 'react';
import { useNowStore } from '../store';

export const DebugInfo: React.FC = () => {
  const { timer, projects } = useNowStore();
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Calculer le nombre total de sessions complétées
  const totalCompletedSessions = Object.values(timer.projectSessions).reduce((total, time) => {
    return total + Math.floor(time / (50 * 60)); // 50 minutes par session
  }, 0);

  // Filtrer les sessions en cours (avec du temps restant)
  const activeSessions = Object.entries(timer.projectSessionProgress)
    .filter(([projectId, timeRemaining]) => timeRemaining > 0 && timeRemaining < 50 * 60)
    .map(([projectId, timeRemaining]) => {
      const project = projects.find(p => p.id === projectId);
      return {
        projectName: project?.name || 'Projet inconnu',
        timeRemaining,
        projectId
      };
    });

  return (
    <div className="inline-block bg-black bg-opacity-60 text-white p-3 rounded-lg text-sm font-mono">
      <div className="font-bold mb-2 text-green-400">📊 Sessions</div>
      
      {/* Nombre total de sessions */}
      <div className="mb-2">
        <span className="text-gray-300">Total: </span>
        <span className="text-white font-bold">{totalCompletedSessions} sessions</span>
      </div>
      
      {/* Sessions en cours */}
      {activeSessions.length > 0 ? (
        <div>
          <div className="text-gray-300 mb-1">En cours:</div>
          {activeSessions.map((session) => (
            <div key={session.projectId} className="text-xs ml-2 mb-1">
              <span className="text-green-400">▶️</span> {session.projectName}: {formatTime(session.timeRemaining)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-gray-400 text-xs">Aucune session en cours</div>
      )}
    </div>
  );
}; 