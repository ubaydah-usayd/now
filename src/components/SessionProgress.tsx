import React from 'react';
import { useNowStore } from '../store';
import { Clock, Play, Pause } from 'lucide-react';

export const SessionProgress: React.FC = () => {
  const { timer, projects } = useNowStore();

  const getCurrentProject = () => {
    if (!timer.currentProjectId) return null;
    return projects.find(p => p.id === timer.currentProjectId);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    if (timer.totalTime === 0) return 0;
    return ((timer.totalTime - timer.timeRemaining) / timer.totalTime) * 100;
  };

  const getStatusInfo = () => {
    if (!timer.isRunning) {
      return {
        icon: <Play className="w-4 h-4" />,
        text: 'START',
        color: 'text-green-500',
        bgColor: 'bg-green-500/20'
      };
    }

    if (timer.isPaused) {
      return {
        icon: <Pause className="w-4 h-4" />,
        text: 'PAUSE',
        color: 'text-yellow-500',
        bgColor: 'bg-yellow-500/20'
      };
    }

    return {
      icon: <Clock className="w-4 h-4" />,
      text: formatTime(timer.timeRemaining),
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/20'
    };
  };

  const currentProject = getCurrentProject();
  const status = getStatusInfo();
  const progressPercentage = getProgressPercentage();

  return (
    <div className="fixed top-4 left-4 z-50">
      <div className={`flex items-center space-x-3 px-4 py-3 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 ${status.bgColor}`}>
        {status.icon}
        <div className="flex flex-col">
          <span className={`text-lg font-bold ${status.color}`}>
            {status.text}
          </span>
          {currentProject && (
            <span className="text-sm text-gray-300">
              {currentProject.name}
            </span>
          )}
        </div>
        
        {timer.isRunning && (
          <div className="ml-4">
            <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {Math.round(progressPercentage)}% complété
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 