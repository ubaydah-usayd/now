import React, { useState, useEffect } from 'react';
import { useNowStore } from '../store';
import { firebaseManager } from '../utils/firebaseManager';
import { auth } from '../firebase/config';
import { clearLocalStorage } from '../utils/localStorage';

export const DebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [firebaseData, setFirebaseData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { projects, tasks, sessions, timer, isInitialized, isSyncing } = useNowStore();

  const loadFirebaseData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const data = await firebaseManager.loadAllData();
      setFirebaseData(data);
      console.log('🔍 Données Firebase chargées:', data);
    } catch (error) {
      console.error('Erreur chargement données Firebase:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      console.log('🧹 Nettoyage complet des données...');

      // Supprimer toutes les données
      await firebaseManager.saveProjects([]);
      await firebaseManager.saveTasks([]);
      await firebaseManager.saveSessions([]);
      await firebaseManager.saveAppState({
        timer: {
          isRunning: false,
          isPaused: false,
          currentProjectId: null,
          timeRemaining: 50 * 60,
          totalTime: 50 * 60,
          sessionStartTime: null,
          pauseStartTime: null,
          projectSessions: {},
          projectSessionProgress: {},
        },
        showSessionModal: false,
        currentSession: null,
        activeSessionStart: null,
        activeBreakStart: null,
        lastResetDate: undefined,
      });
      await firebaseManager.deleteAllLogs();

      console.log('✅ Données nettoyées avec succès');
      
      // Recharger les données
      await loadFirebaseData();
      
      // Forcer la mise à jour du store
      window.location.reload();
    } catch (error) {
      console.error('Erreur suppression données:', error);
    } finally {
      setLoading(false);
    }
  };

  const forceSync = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      console.log('🔄 Synchronisation forcée...');
      
      // Forcer la sauvegarde de l'état actuel
      await firebaseManager.saveAllData({
        projects,
        tasks,
        sessions,
        timer,
        showSessionModal: false,
        currentSession: null,
        activeSessionStart: null,
        activeBreakStart: null,
        lastResetDate: undefined,
      });

      console.log('✅ Synchronisation terminée');
      
      // Recharger les données
      await loadFirebaseData();
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFirebaseData();
  }, []);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full z-50"
        title="Debug Panel"
      >
        🐛
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2 text-xs">
        <div>
          <strong>Store State:</strong>
          <div>Initialisé: {isInitialized ? 'Oui' : 'Non'}</div>
          <div>Synchronisation: {isSyncing ? 'En cours' : 'Terminée'}</div>
          <div>Projets: {projects.length}</div>
          <div>Tâches: {tasks.length}</div>
          <div>Sessions: {sessions.length}</div>
          <div>Timer Running: {timer.isRunning ? 'Oui' : 'Non'}</div>
          <div>Timer Paused: {timer.isPaused ? 'Oui' : 'Non'}</div>
          <div>Current Project: {timer.currentProjectId || 'Aucun'}</div>
        </div>

        <div>
          <strong>Firebase Data:</strong>
          <div>Projets: {firebaseData?.projects?.length || 0}</div>
          <div>Tâches: {firebaseData?.tasks?.length || 0}</div>
          <div>Sessions: {firebaseData?.sessions?.length || 0}</div>
          <div>Timer Running: {firebaseData?.timer?.isRunning ? 'Oui' : 'Non'}</div>
        </div>

        {firebaseData?.projects?.length > 0 && (
          <div>
            <strong>Projets Firebase:</strong>
            {firebaseData.projects.map((p: any) => (
              <div key={p.id} className="text-yellow-400">
                - {p.name} (ID: {p.id})
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 space-y-1">
          <button
            onClick={loadFirebaseData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs mr-2 w-full"
          >
            {loading ? 'Chargement...' : 'Recharger'}
          </button>
          <button
            onClick={forceSync}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs mr-2 w-full"
          >
            {loading ? 'Synchronisation...' : 'Synchroniser'}
          </button>
          <button
            onClick={() => {
              clearLocalStorage();
              window.location.reload();
            }}
            className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs mr-2 w-full"
          >
            Nettoyer localStorage
          </button>
          <button
            onClick={clearAllData}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-2 py-1 rounded text-xs w-full"
          >
            {loading ? 'Nettoyage...' : 'Nettoyer tout'}
          </button>
        </div>
      </div>
    </div>
  );
}; 