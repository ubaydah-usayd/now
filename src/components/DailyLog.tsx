import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { DailyLogEntry } from '../utils/localStorage';
import { DayCalendar } from './DayCalendar.tsx';
import { DayNavigator } from './DayNavigator';
import { WeeklyView } from './WeeklyView';

type TabType = 'logs' | 'calendar';

export const DailyLog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('calendar');
  const [dailyLog, setDailyLog] = useState<DailyLogEntry[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isWeeklyViewOpen, setIsWeeklyViewOpen] = useState(false);
  const { projects, addLogEntry } = useNowStore();

  useEffect(() => {
    loadLogForDate(currentDate);
    
    // Écouter l'événement de nouveau log ajouté
    const handleLogAdded = () => {
      loadLogForDate(currentDate);
    };
    
    window.addEventListener('logAdded', handleLogAdded);
    
    // Recharger le log toutes les 10 secondes comme fallback
    const interval = setInterval(() => loadLogForDate(currentDate), 10000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('logAdded', handleLogAdded);
    };
  }, [currentDate]);

  // Raccourci clavier pour ouvrir la vue hebdomadaire
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'w') {
        event.preventDefault();
        handleOpenWeeklyView();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const loadLogForDate = async (date: Date) => {
    try {
      // Utiliser directement firebaseManager pour charger les logs
      const { firebaseManager } = await import('../utils/firebaseManager');
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 5, 0, 0); // 5h du matin
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 4, 59, 59); // 4h59 du lendemain
      
      const log = await firebaseManager.getLogsBetweenDates(startOfDay, endOfDay);
      setDailyLog(log);
    } catch (error) {
      console.error('Erreur lors du chargement du log:', error);
    }
  };

  const loadTodayLog = async () => {
    try {
      const { firebaseManager } = await import('../utils/firebaseManager');
      const log = await firebaseManager.getTodayLog();
      setDailyLog(log);
    } catch (error) {
      console.error('Erreur lors du chargement du log:', error);
    }
  };

  const resetDailyLog = async () => {
    try {
      // Ajouter d'abord le log de réinitialisation
      await addLogEntry('daily_reset', 'Tous les logs ont été supprimés');
      
      // Attendre un peu pour que le log soit ajouté
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Supprimer tous les logs via Firebase
      const { firebaseManager } = await import('../utils/firebaseManager');
      await firebaseManager.deleteAllLogs();
      
      // Vider complètement les logs dans l'état local
      setDailyLog([]);
      
      // Déclencher un événement pour réinitialiser le calendrier
      window.dispatchEvent(new CustomEvent('logsReset'));
      
      // Recharger le log pour afficher le log de réinitialisation
      setTimeout(() => {
        loadTodayLog();
      }, 50);
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du log:', error);
    }
  };

  const formatTime = (date: Date): string => {
    return new Date(date).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const getProjectName = (projectId?: string): string => {
    if (!projectId) return '';
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : '';
  };

  const getLogIcon = (type: DailyLogEntry['type']): string => {
    switch (type) {
      case 'session_interval': return '⏱️';
      case 'break_interval': return '☕';
      case 'task_complete': return '🎯';
      case 'task_create': return '➕';
      case 'task_update': return '✏️';
      case 'task_delete': return '🗑️';
      case 'task_move': return '📋';
      case 'project_create': return '🏗️';
      case 'project_update': return '🔧';
      case 'project_delete': return '💥';
      case 'daily_reset': return '🔄';
      default: return '📝';
    }
  };

  const handleDateChange = (date: Date) => {
    setCurrentDate(date);
  };

  const handleOpenWeeklyView = () => {
    setIsWeeklyViewOpen(true);
  };

  const handleCloseWeeklyView = () => {
    setIsWeeklyViewOpen(false);
  };

  const handleSelectDateFromWeekly = (date: Date) => {
    setCurrentDate(date);
    setIsWeeklyViewOpen(false);
  };

  const getLogColor = (type: DailyLogEntry['type']): string => {
    switch (type) {
      case 'session_interval': return 'text-blue-400';
      case 'break_interval': return 'text-orange-400';
      case 'task_complete': return 'text-purple-400';
      case 'task_create': return 'text-emerald-400';
      case 'task_update': return 'text-cyan-400';
      case 'task_delete': return 'text-red-400';
      case 'task_move': return 'text-indigo-400';
      case 'project_create': return 'text-lime-400';
      case 'project_update': return 'text-amber-400';
      case 'project_delete': return 'text-rose-400';
      case 'daily_reset': return 'text-slate-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Navigation entre les jours */}
      <DayNavigator 
        currentDate={currentDate}
        onDateChange={handleDateChange}
        onOpenWeeklyView={handleOpenWeeklyView}
      />
      
      {/* Onglets */}
      <div className="flex mb-4">
        <button
          onClick={() => setActiveTab('logs')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg transition-colors ${
            activeTab === 'logs'
              ? 'bg-white bg-opacity-20 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-15'
          }`}
        >
          LOGS
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg transition-colors ${
            activeTab === 'calendar'
              ? 'bg-white bg-opacity-20 text-white'
              : 'bg-white bg-opacity-10 text-gray-300 hover:bg-opacity-15'
          }`}
        >
          CALENDRIER
        </button>
      </div>

      {/* Contenu des onglets */}
      {activeTab === 'logs' ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">PROGRAMME DU JOUR</h2>
            {dailyLog.length > 0 && (
              <button
                onClick={resetDailyLog}
                className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                title="Réinitialiser le log quotidien"
              >
                Reset Log
              </button>
            )}
          </div>
      
          <div className="flex-1 overflow-y-auto">
            {dailyLog.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm">Aucune activité aujourd'hui</p>
                <p className="text-gray-500 text-xs mt-2">Commencez une session pour voir votre programme</p>
              </div>
            ) : (
              <div className="space-y-2">
                {dailyLog.slice().reverse().map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-2 p-2 bg-white bg-opacity-5 rounded">
                    <span className="text-sm">{getLogIcon(entry.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-medium ${getLogColor(entry.type)}`}>
                          {formatTime(entry.timestamp)}
                        </span>
                        {entry.projectId && (
                          <span className="text-xs text-gray-400">
                            {getProjectName(entry.projectId)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {entry.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      
          <div className="mt-4 pt-4 border-t border-white border-opacity-10">
            <div className="text-center">
              <p className="text-xs text-gray-400">
                {dailyLog.length} activité{dailyLog.length > 1 ? 's' : ''} aujourd'hui
              </p>
            </div>
          </div>
        </>
      ) : (
        <DayCalendar date={currentDate} />
      )}

      {/* Vue hebdomadaire */}
      <WeeklyView 
        isOpen={isWeeklyViewOpen}
        onClose={handleCloseWeeklyView}
        onSelectDate={handleSelectDateFromWeekly}
      />
    </div>
  );
}; 