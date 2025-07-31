import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DayNavigatorProps {
  onDateChange: (date: Date) => void;
  currentDate: Date;
  onOpenWeeklyView: () => void;
}

export const DayNavigator: React.FC<DayNavigatorProps> = ({ onDateChange, currentDate, onOpenWeeklyView }) => {
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const { getAvailableDates, checkAndPerformDailyReset } = useNowStore();

  useEffect(() => {
    loadAvailableDates();
    // Vérifier la réinitialisation quotidienne au chargement
    checkAndPerformDailyReset();
  }, []);

  const loadAvailableDates = async () => {
    try {
      const dates = await getAvailableDates();
      setAvailableDates(dates);
    } catch (error) {
      console.error('Erreur lors du chargement des dates:', error);
    }
  };



  const goToPreviousDay = () => {
    const currentIndex = availableDates.findIndex(date => 
      date.toDateString() === currentDate.toDateString()
    );
    
    if (currentIndex < availableDates.length - 1) {
      const previousDate = availableDates[currentIndex + 1];
      onDateChange(previousDate);
    }
  };

  const goToNextDay = () => {
    const currentIndex = availableDates.findIndex(date => 
      date.toDateString() === currentDate.toDateString()
    );
    
    if (currentIndex > 0) {
      const nextDate = availableDates[currentIndex - 1];
      onDateChange(nextDate);
    }
  };


  const canGoPrevious = availableDates.some(date => 
    date.toDateString() === currentDate.toDateString()
  ) && availableDates.findIndex(date => 
    date.toDateString() === currentDate.toDateString()
  ) < availableDates.length - 1;
  
  const canGoNext = availableDates.some(date => 
    date.toDateString() === currentDate.toDateString()
  ) && availableDates.findIndex(date => 
    date.toDateString() === currentDate.toDateString()
  ) > 0;

  return (
    <div className="flex items-center justify-between bg-gray-800 bg-opacity-50 rounded-lg p-3 mb-4">
      <button
        onClick={goToPreviousDay}
        disabled={!canGoPrevious}
        className={`p-2 rounded-lg transition-colors ${
          canGoPrevious 
            ? 'text-white hover:bg-gray-700' 
            : 'text-gray-500 cursor-not-allowed'
        }`}
        title="Jour précédent"
      >
        <ChevronLeft size={20} />
      </button>

      <div className="flex items-center space-x-2">
        <Calendar size={16} className="text-gray-400" />
        <button
          onClick={onOpenWeeklyView}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm font-medium transition-colors"
          title="Vue hebdomadaire (Ctrl+W)"
        >
          Calendrier
        </button>
      </div>

      <button
        onClick={goToNextDay}
        disabled={!canGoNext}
        className={`p-2 rounded-lg transition-colors ${
          canGoNext 
            ? 'text-white hover:bg-gray-700' 
            : 'text-gray-500 cursor-not-allowed'
        }`}
        title="Jour suivant"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );
}; 