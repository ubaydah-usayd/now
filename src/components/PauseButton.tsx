import React from 'react';
import { Pause, Play, Square, SkipForward } from 'lucide-react';
import { useNowStore } from '../store';
import { useTimer } from '../hooks/useTimer';

export const PauseButton: React.FC = () => {
  const { timer } = useNowStore();
  const { pauseTimer, stopTimer, skipBreak } = useTimer();

  const handlePauseClick = () => {
    if (timer.isRunning) {
      if (timer.isPaused) {
        pauseTimer(); // Reprendre
      } else {
        pauseTimer(); // Mettre en pause
      }
    } else {
      stopTimer(); // Arrêter complètement
    }
  };

  const handleNextClick = () => {
    // Skip la pause et aller directement à l'état START
    skipBreak();
  };

  const getPauseIcon = () => {
    if (!timer.isRunning) {
      return <Square size={24} />;
    }
    return timer.isPaused ? <Play size={24} /> : <Pause size={24} />;
  };

  const getPauseTooltip = () => {
    if (!timer.isRunning) {
      return 'Arrêter le timer';
    }
    return timer.isPaused ? 'Reprendre' : 'Mettre en pause';
  };

  // Afficher le bouton Next seulement pendant une pause
  const showNextButton = timer.isRunning && !timer.currentProjectId;

  return (
    <div className="flex space-x-2">
      <button
        onClick={handlePauseClick}
        className="pause-button"
        title={getPauseTooltip()}
      >
        {getPauseIcon()}
      </button>
      
      {showNextButton && (
        <button
          onClick={handleNextClick}
          className="next-button"
          title="Sauter la pause"
        >
          <SkipForward size={24} />
        </button>
      )}
    </div>
  );
}; 