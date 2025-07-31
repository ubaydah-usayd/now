import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { DailyLogEntry } from '../utils/localStorage';

interface CalendarEvent {
  id: string;
  type: 'session' | 'pause' | 'internal_pause';
  projectId?: string;
  projectName?: string;
  taskName?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  isCompleted?: boolean;
  color: string;
}

interface DayCalendarProps {
  date?: Date;
}

export const DayCalendar: React.FC<DayCalendarProps> = ({ date = new Date() }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const { projects, getLogsForDate } = useNowStore();

  useEffect(() => {
    loadCalendarEvents();
    
    // Écouter l'événement de nouveau log ajouté
    const handleLogAdded = () => {
      loadCalendarEvents();
    };
    
    // Écouter l'événement de réinitialisation des logs
    const handleLogsReset = () => {
      setEvents([]); // Vider immédiatement le calendrier
      loadCalendarEvents(); // Recharger les événements
    };
    
    window.addEventListener('logAdded', handleLogAdded);
    window.addEventListener('logsReset', handleLogsReset);
    
    return () => {
      window.removeEventListener('logAdded', handleLogAdded);
      window.removeEventListener('logsReset', handleLogsReset);
    };
  }, [date]);

  const loadCalendarEvents = async () => {
    try {
      const log = await getLogsForDate(date);
      const calendarEvents = processLogsToEvents(log);
      setEvents(calendarEvents);
    } catch (error) {
      console.error('Erreur lors du chargement du calendrier:', error);
    }
  };

  const processLogsToEvents = (logs: DailyLogEntry[]): CalendarEvent[] => {
    const events: CalendarEvent[] = [];
    
    logs.forEach((log) => {
      if (log.type === 'session_interval' && log.startTime && log.endTime) {
        // Session de travail
        const project = projects.find(p => p.id === log.projectId);
        const projectColor = project?.color || '#3b82f6';
        

        
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        
        events.push({
          id: log.id,
          type: 'session',
          projectId: log.projectId,
          projectName: project?.name || 'Projet inconnu',
          taskName: log.message.includes('Tâche') ? extractTaskName(log.message) : undefined,
          startTime: startTime,
          endTime: endTime,
          duration: Math.floor(duration / (1000 * 60)), // Convertir en minutes
          isCompleted: log.completedTasks && log.completedTasks.length > 0,
          color: projectColor
        });
      } else if (log.type === 'break_interval' && log.startTime && log.endTime) {
        // Pause
        const isInternalPause = log.message.includes('interne');
        
        const startTime = new Date(log.startTime);
        const endTime = new Date(log.endTime);
        const duration = endTime.getTime() - startTime.getTime();
        
        events.push({
          id: log.id,
          type: isInternalPause ? 'internal_pause' : 'pause',
          startTime: startTime,
          endTime: endTime,
          duration: Math.floor(duration / (1000 * 60)), // Convertir en minutes
          color: isInternalPause ? '#6b7280' : '#374151'
        });
      }
    });
    
    // Trier par heure de début
    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  };

  const extractTaskName = (message: string): string => {
    // Extraire le nom de la tâche du message
    const taskMatch = message.match(/Tâche (.+?) /);
    return taskMatch ? taskMatch[1] : '';
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const getEventStyle = (event: CalendarEvent) => {
    if (event.type === 'session') {
      const style = {
        backgroundColor: 'rgba(0, 0, 0, 0.3) !important',
        border: `2px solid ${event.color} !important`,
        borderRadius: '8px !important',
      };

      return style;
    }
    
    if (event.type === 'pause') {
      return {
        backgroundColor: '#374151',
        borderLeft: '4px solid #6b7280',
        borderRadius: '8px',
      };
    }
    
    if (event.type === 'internal_pause') {
      return {
        backgroundColor: '#6b7280',
        borderLeft: '4px solid #9ca3af',
        borderRadius: '8px',
      };
    }
    
    return {
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
    };
  };

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">CALENDRIER DU JOUR</h2>
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">Aucune activité aujourd'hui</p>
          <p className="text-gray-500 text-xs mt-2">Commencez une session pour voir votre calendrier</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">CALENDRIER DU JOUR</h2>
      <div className="flex-1 overflow-y-auto space-y-3 min-h-96">
        {events.map((event) => {
          const eventStyle = getEventStyle(event);
          return (
            <div
              key={event.id}
              className="rounded-lg p-4 text-white shadow-sm mb-3"
              style={eventStyle}
            >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base">
                  {event.type === 'session' ? event.projectName : 'PAUSE'}
                </span>
                {event.type === 'session' && event.isCompleted && (
                  <span className="text-green-400 text-lg">✓</span>
                )}
              </div>
              <div className="text-sm opacity-80">
                {formatTime(event.startTime)} - {formatTime(event.endTime)}
              </div>
            </div>
            
            {event.type === 'session' && event.taskName && (
              <div className="flex items-center justify-between">
                <span className="text-base opacity-90">
                  {event.isCompleted ? (
                    <span className="line-through">{event.taskName}</span>
                  ) : (
                    event.taskName
                  )}
                </span>
                <span className="text-sm opacity-70">
                  {formatDuration(event.duration)}
                </span>
              </div>
            )}
            
            {event.type === 'pause' && (
              <div className="text-right">
                <span className="text-sm opacity-70">
                  {formatDuration(event.duration)}
                </span>
              </div>
            )}
            
            {event.type === 'internal_pause' && (
              <div className="text-center">
                <span className="text-sm opacity-70">
                  Pause interne - {formatDuration(event.duration)}
                </span>
              </div>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}; 