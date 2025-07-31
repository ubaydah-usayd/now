import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/sounds';

export const SoundControl: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    // Synchroniser l'état avec le soundManager
    setIsEnabled(soundManager.isSoundEnabled());
  }, []);

  const toggleSound = () => {
    const newState = !isEnabled;
    setIsEnabled(newState);
    
    if (newState) {
      soundManager.enable();
    } else {
      soundManager.disable();
    }
  };

  return (
    <button
      onClick={toggleSound}
      className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-now-teal to-now-green text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold"
    >
      {isEnabled ? (
        <>
          <Volume2 className="w-5 h-5 mr-2" />
          Sons Activés
        </>
      ) : (
        <>
          <VolumeX className="w-5 h-5 mr-2" />
          Sons Désactivés
        </>
      )}
    </button>
  );
}; 