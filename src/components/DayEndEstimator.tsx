import React from 'react';
import { useNowStore } from '../store';

export const DayEndEstimator: React.FC = () => {
  const { projects } = useNowStore();

  const calculateEndTime = () => {
    const now = new Date();
    let totalSessionsRemaining = 0;
    
    // Calculer le nombre total de sessions restantes pour tous les projets
    projects.forEach(project => {
      const sessionsCompleted = project.completedSessions;
      const sessionsNeeded = project.dailyHours;
      const sessionsRemaining = Math.max(0, sessionsNeeded - sessionsCompleted);
      totalSessionsRemaining += sessionsRemaining;
    });

    if (totalSessionsRemaining === 0) {
      return null; // Toutes les sessions sont terminées
    }

    // Calculer le temps total nécessaire
    const SESSION_DURATION = 50; // minutes
    const BREAK_DURATION = 10; // minutes
    
    // Temps total = sessions restantes * (durée session + pause) - dernière pause
    const totalMinutes = (totalSessionsRemaining * (SESSION_DURATION + BREAK_DURATION)) - BREAK_DURATION;
    
    // Ajouter le temps à l'heure actuelle
    const endTime = new Date(now.getTime() + totalMinutes * 60 * 1000);
    
    return endTime;
  };

  const endTime = calculateEndTime();
  
  // Vérifier s'il y a des heures supplémentaires
  const hasExtraHours = projects.some(project => project.completedSessions > project.dailyHours);
  const totalExtraSessions = projects.reduce((total, project) => {
    return total + Math.max(0, project.completedSessions - project.dailyHours);
  }, 0);

  if (!endTime) {
    return (
      <div className="bg-green-600 bg-opacity-20 border border-green-400 rounded-lg p-4 text-center">
        <div className="text-green-400 font-semibold text-sm mb-1">
          🎉 JOURNÉE TERMINÉE
        </div>
        <div className="text-green-300 text-xs">
          Toutes les sessions sont accomplies !
        </div>
        {hasExtraHours && (
          <div className="text-yellow-300 text-xs mt-1">
            +{totalExtraSessions} session{totalExtraSessions > 1 ? 's' : ''} supplémentaire{totalExtraSessions > 1 ? 's' : ''}
          </div>
        )}
      </div>
    );
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit', 
      hour12: false 
    });
  };

  const getStatusColor = () => {
    return 'bg-blue-600 bg-opacity-20 border-blue-400 text-blue-300';
  };

  const getStatusIcon = () => {
    return '⏰';
  };

  const getStatusText = () => {
    return 'FIN ESTIMÉE';
  };

  return (
    <div className={`border rounded-lg p-4 text-center ${getStatusColor()}`}>
      <div className="font-semibold text-sm mb-1">
        {getStatusIcon()} {getStatusText()}
      </div>
      <div className="text-lg font-bold mb-1">
        {formatTime(endTime)}
      </div>
      <div className="text-xs opacity-80">
        Basé sur les sessions restantes
      </div>
    </div>
  );
}; 