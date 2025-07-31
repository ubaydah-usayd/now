import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { X, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { DailyLogEntry } from '../utils/localStorage';

interface WeeklyViewProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDate?: (date: Date) => void;
}

interface DayData {
  date: Date;
  logs: DailyLogEntry[];
  sessions: number;
  totalTime: number;
}

export const WeeklyView: React.FC<WeeklyViewProps> = ({ isOpen, onClose, onSelectDate }) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [weekData, setWeekData] = useState<DayData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getLogsForDate, projects } = useNowStore();

  useEffect(() => {
    if (isOpen) {
      loadWeekData();
    }
  }, [isOpen, currentWeekStart]);

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Dimanche = 0, mais on veut dimanche à 5h
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(5, 0, 0, 0); // 5h du matin
    return weekStart;
  }

  const loadWeekData = async () => {
    setIsLoading(true);
    try {
      const weekDays: DayData[] = [];
      
      for (let i = 0; i < 7; i++) {
        const dayDate = new Date(currentWeekStart);
        dayDate.setDate(currentWeekStart.getDate() + i);
        
        const logs = await getLogsForDate(dayDate);
        const sessions = logs.filter(log => log.type === 'session_interval').length;
        const totalTime = logs
          .filter(log => log.type === 'session_interval' && log.startTime && log.endTime)
          .reduce((total, log) => {
            if (log.startTime && log.endTime) {
              const startTime = new Date(log.startTime);
              const endTime = new Date(log.endTime);
              const duration = endTime.getTime() - startTime.getTime();
              return total + Math.floor(duration / (1000 * 60)); // Convertir en minutes
            }
            return total;
          }, 0);
        
        weekDays.push({
          date: dayDate,
          logs,
          sessions,
          totalTime
        });
      }
      
      setWeekData(weekDays);
    } catch (error) {
      console.error('Erreur lors du chargement des données hebdomadaires:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const goToPreviousWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newWeekStart);
  };

  const goToNextWeek = () => {
    const newWeekStart = new Date(currentWeekStart);
    newWeekStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newWeekStart);
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    });
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const getDayStatus = (dayData: DayData): string => {
    if (dayData.sessions === 0) return 'empty';
    if (dayData.sessions >= 10) return 'excellent';
    if (dayData.sessions >= 7) return 'good';
    if (dayData.sessions >= 4) return 'average';
    return 'low';
  };

  const getWeeklyStats = () => {
    const totalSessions = weekData.reduce((total, day) => total + day.sessions, 0);
    const totalTime = weekData.reduce((total, day) => total + day.totalTime, 0);
    const averageSessionsPerDay = totalSessions / 7;
    const workingDays = weekData.filter(day => day.sessions > 0).length;
    
    return {
      totalSessions,
      totalTime,
      averageSessionsPerDay,
      workingDays
    };
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'excellent': return 'bg-green-600';
      case 'good': return 'bg-blue-600';
      case 'average': return 'bg-yellow-600';
      case 'low': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  const getProjectColor = (projectId?: string): string => {
    if (!projectId) return '#6b7280';
    const project = projects.find(p => p.id === projectId);
    return project?.color || '#6b7280';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-gray-900 rounded-lg shadow-xl w-[95vw] h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div className="flex items-center space-x-4">
            <Calendar size={24} className="text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Vue Hebdomadaire</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            
            <span className="text-white font-medium">
              Semaine du {currentWeekStart.toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </span>
            
            <button
              onClick={goToNextWeek}
              className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <ChevronRight size={20} className="text-white" />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white">Chargement...</div>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-6">
              {weekData.map((dayData, index) => {
                const status = getDayStatus(dayData);
                const isToday = dayData.date.toDateString() === new Date().toDateString();
                
                return (
                  <div
                    key={index}
                    className={`bg-gray-800 rounded-lg p-6 border-2 cursor-pointer hover:bg-gray-700 transition-colors ${
                      isToday ? 'border-blue-500' : dayData.sessions > 0 ? 'border-green-500' : 'border-gray-700'
                    }`}
                    onClick={() => onSelectDate && onSelectDate(dayData.date)}
                  >
                    {/* Day Header */}
                    <div className="text-center mb-4">
                      <div className={`text-lg font-medium ${isToday ? 'text-blue-400' : 'text-gray-300'}`}>
                        {formatDate(dayData.date)}
                      </div>
                      {isToday && (
                        <div className="text-sm bg-blue-600 text-white px-3 py-1 rounded-full mt-2 inline-block">
                          AUJOURD'HUI
                        </div>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="space-y-3 mb-5">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Sessions:</span>
                        <span className="text-base font-medium text-white">
                          {dayData.sessions}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-400">Temps:</span>
                        <span className="text-base font-medium text-white">
                          {formatTime(dayData.totalTime)}
                        </span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className={`w-full h-3 rounded-full ${getStatusColor(status)} mb-4`} />

                    {/* Sessions Preview */}
                    <div className="space-y-2">
                      {dayData.logs
                        .filter(log => log.type === 'session_interval')
                        .slice(0, 3)
                        .map((log, logIndex) => (
                          <div
                            key={logIndex}
                            className="flex items-center space-x-3"
                          >
                            <div
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: getProjectColor(log.projectId) }}
                            />
                            <span className="text-sm text-gray-300 truncate">
                              {log.message.split(' - ')[0]}
                            </span>
                          </div>
                        ))}
                      
                      {dayData.logs.filter(log => log.type === 'session_interval').length > 3 && (
                        <div className="text-sm text-gray-500 text-center">
                          +{dayData.logs.filter(log => log.type === 'session_interval').length - 3} autres
                        </div>
                      )}
                    </div>

                    {/* Empty State */}
                    {dayData.sessions === 0 && (
                      <div className="text-center py-6">
                        <div className="text-gray-500 text-sm">
                          Aucune session
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          {weekData.length > 0 && (
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-gray-400">Total sessions</div>
                <div className="text-white font-semibold">{getWeeklyStats().totalSessions}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Temps total</div>
                <div className="text-white font-semibold">{formatTime(getWeeklyStats().totalTime)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Moyenne/jour</div>
                <div className="text-white font-semibold">{getWeeklyStats().averageSessionsPerDay.toFixed(1)}</div>
              </div>
              <div className="text-center">
                <div className="text-gray-400">Jours travaillés</div>
                <div className="text-white font-semibold">{getWeeklyStats().workingDays}/7</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 