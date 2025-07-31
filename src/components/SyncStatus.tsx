import React from 'react';
import { useNowStore } from '../store';
import { useAuth } from '../hooks/useAuth';
import { WifiOff, CheckCircle, AlertCircle } from 'lucide-react';

export const SyncStatus: React.FC = () => {
  const { isSyncing, isInitialized } = useNowStore();
  const { user } = useAuth();

  const getStatusInfo = () => {
    if (!user?.uid) {
      return {
        icon: <CheckCircle className="w-4 h-4 text-blue-500" />,
        text: 'Mode local',
        color: 'text-blue-500'
      };
    }

    if (!isInitialized) {
      return {
        icon: <WifiOff className="w-4 h-4 text-gray-400" />,
        text: 'Non connecté',
        color: 'text-gray-400'
      };
    }

    if (isSyncing) {
      return {
        icon: <AlertCircle className="w-4 h-4 text-yellow-500 animate-pulse" />,
        text: 'Synchronisation...',
        color: 'text-yellow-500'
      };
    }

    return {
      icon: <CheckCircle className="w-4 h-4 text-green-500" />,
      text: 'Synchronisé',
      color: 'text-green-500'
    };
  };

  const status = getStatusInfo();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center space-x-2 px-3 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 ${status.color}`}>
        {status.icon}
        <span className="text-sm font-medium">{status.text}</span>
      </div>
    </div>
  );
}; 