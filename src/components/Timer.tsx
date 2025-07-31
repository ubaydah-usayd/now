import React from 'react';
import { useNowStore } from '../store';

export const Timer: React.FC = () => {
  const { timer } = useNowStore();
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100;
  
  // Déterminer si on est en pause (timer en cours mais pas de projet sélectionné)
  const isBreak = timer.isRunning && !timer.currentProjectId;
  
  // Déterminer si on est en attente de démarrage (timer arrêté et pas de projet sélectionné)
  const isWaitingToStart = !timer.isRunning && !timer.currentProjectId;
  
  // Déterminer si la pause est terminée (timeRemaining = 0 et on est en pause)
  const isBreakFinished = isBreak && timer.timeRemaining === 0;
  
  return (
    <div className="flex flex-col items-center space-y-6">
      {/* Affichage du timer */}
      <div className={`timer-display ${isBreak && !isBreakFinished ? 'text-green-400' : (isBreakFinished || isWaitingToStart) ? 'text-red-500' : 'text-white'} ${(isBreakFinished || isWaitingToStart) ? 'start-urgent' : ''}`}>
        {isBreakFinished ? 'START' : isBreak ? formatTime(timer.timeRemaining) : isWaitingToStart ? 'START' : formatTime(timer.timeRemaining)}
      </div>
      
      {/* Barre de progression */}
      <div className="progress-bar w-96">
        <div 
          className={`progress-fill ${isBreak && !isBreakFinished ? 'bg-green-400' : ''}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
}; 