import { useEffect, useState } from 'react';
import { Timer } from './components/Timer';
import { ProjectSelector } from './components/ProjectSelector';
import { TaskList } from './components/TaskList';
import { PauseButton } from './components/PauseButton';
import { SessionModal } from './components/SessionModal';

import { DailyLog } from './components/DailyLog';
import { SoundControl } from './components/SoundControl';
import { DataManager } from './components/DataManager';
import { DayEndEstimator } from './components/DayEndEstimator';
import { Auth } from './components/Auth';
import { useTimer } from './hooks/useTimer';
import { useNowStore } from './store';
import { useAutoSave } from './hooks/useAutoSave';
import { useAuth } from './hooks/useAuth';

import { ProjectManager } from './components/ProjectManager';
import { Settings } from 'lucide-react';
import { getProjectColor } from './utils/colors';
import { DebugPanel } from './components/DebugPanel';
import { SyncStatus } from './components/SyncStatus';
import { SessionProgress } from './components/SessionProgress';

// Fonction pour assombrir une couleur de 50%
function darkenColor(hex: string, percent: number = 50): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  
  const factor = (100 - percent) / 100;
  const newR = Math.round(r * factor);
  const newG = Math.round(g * factor);
  const newB = Math.round(b * factor);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function App() {
  // Initialiser l'authentification
  const { user, loading } = useAuth();
  
  // Initialiser le hook timer
  useTimer();
  
  // Initialiser la sauvegarde automatique
  useAutoSave();
  
  // Initialiser la base de données
  const { initDatabase, timer, checkAndPerformDailyReset, projects } = useNowStore();
  
  // État pour le gestionnaire de projets
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  
  // Déterminer le style de fond d'écran selon le projet sélectionné et l'état du timer
  const getBackgroundStyle = () => {
    // Déterminer si on est en pause (timer en cours mais pas de projet sélectionné)
    const isBreak = timer.isRunning && !timer.currentProjectId;
    
    // Déterminer si on est en attente de démarrage (timer arrêté et pas de projet sélectionné)
    const isWaitingToStart = !timer.isRunning && !timer.currentProjectId;
    
    // Déterminer si la pause est terminée (timeRemaining = 0 et on est en pause)
    const isBreakFinished = isBreak && timer.timeRemaining === 0;
    
    let baseColor = darkenColor('#1F2937', 50); // Gris foncé assombri par défaut
    
    // Si le timer est en pause (via le bouton pause), fond gris assombri
    if (timer.isPaused) {
      baseColor = darkenColor('#6B7280', 50);
    }
    
    // Si on est en pause (PAUSE affiché), fond gris assombri
    if (isBreak && !isBreakFinished) {
      baseColor = darkenColor('#6B7280', 50);
    }
    
    // Si c'est temps de reprendre (START affiché), fond gris assombri comme la pause
    if (isBreakFinished || isWaitingToStart) {
      baseColor = darkenColor('#6B7280', 50);
    }
    
    // Sinon, fond selon le projet sélectionné
    if (timer.currentProjectId) {
      const currentProject = projects.find(p => p.id === timer.currentProjectId);
      if (currentProject) {
        baseColor = getProjectColor(currentProject.color);
      }
    }
    
    return {
      background: `linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, ${baseColor} 50%, rgba(0, 0, 0, 0.6) 100%)`
    };
  };
  
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDatabase();
        // Vérifier la réinitialisation quotidienne au démarrage
        checkAndPerformDailyReset();
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la base de données:', error);
      }
    };
    
    initializeApp();
    
    // Vérifier la réinitialisation quotidienne toutes les heures
    const interval = setInterval(checkAndPerformDailyReset, 60 * 60 * 1000);
    
    return () => {
      clearInterval(interval);
    };
  }, [initDatabase, checkAndPerformDailyReset]);

  // Si l'utilisateur n'est pas connecté, afficher l'écran de connexion
  if (!loading && !user) {
    return <Auth />;
  }

  // Si en cours de chargement, afficher un écran de chargement
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white" style={getBackgroundStyle()}>
      <div className="flex min-h-screen">
        {/* Section YESTERDAY (Gauche) */}
        <div className="w-64 p-6">
          <DailyLog />
        </div>

        {/* Section NOW (Centre) */}
        <div className="flex-1 flex flex-col p-6">
          {/* Header NOW */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">NOW</h1>
            <img 
              src="/verse.png" 
              alt="Verse" 
              className="max-w-2xl mx-auto rounded-lg"
              style={{ maxHeight: '240px' }}
            />
          </div>

          {/* Timer */}
          <div className="text-center mb-8">
            <Timer />
          </div>

          {/* Projets avec leurs tâches */}
          <div className="flex justify-center w-full">
            {projects.length === 0 ? (
              <div className="text-center">
                <p className="text-xl mb-4">Aucun projet créé</p>
                <button
                  onClick={() => setIsProjectManagerOpen(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Créer votre premier projet
                </button>
              </div>
            ) : (
              <div className="flex space-x-10">
                {projects.map((project) => (
                  <div key={project.id} className="flex flex-col items-center w-64">
                    <ProjectSelector projectId={project.id} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-600 my-6"></div>

          {/* Section TODAY */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">TODAY</h3>
            <div className="flex justify-center w-full">
              {projects.length === 0 ? (
                <div className="text-center text-gray-300">
                  <p>Créez des projets pour voir les tâches d'aujourd'hui</p>
                </div>
              ) : (
                <div className="flex space-x-10">
                  {projects.map((project) => (
                    <div key={project.id} className="w-64">
                      <TaskList projectId={project.id} assignedDate="today" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Séparateur */}
          <div className="border-t border-gray-600 mb-6"></div>

          {/* Section TOMORROW */}
          <div className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 text-center">TOMORROW</h3>
            <div className="flex justify-center w-full">
              {projects.length === 0 ? (
                <div className="text-center text-gray-300">
                  <p>Créez des projets pour voir les tâches de demain</p>
                </div>
              ) : (
                <div className="flex space-x-10">
                  {projects.map((project) => (
                    <div key={project.id} className="w-64">
                      <TaskList projectId={project.id} assignedDate="tomorrow" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Section OPTIONS (Droite) */}
        <div className="w-64 p-6 flex flex-col items-center">
          <h2 className="text-xl font-bold text-white mb-8">OPTIONS</h2>
          <div className="space-y-4 w-full">
            <button
              onClick={() => setIsProjectManagerOpen(true)}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2"
            >
              <Settings className="w-4 h-4" />
              <span>Gérer les projets</span>
            </button>
            <DayEndEstimator />
            
            <SoundControl />
            <DataManager />
            <PauseButton />
          </div>
        </div>
      </div>

      {/* Modal de session */}
      <SessionModal />
      
      {/* Gestionnaire de projets */}
      <ProjectManager 
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
      />
      
      {/* Debug Panel */}
      <DebugPanel />
      
      {/* Statut de synchronisation */}
      <SyncStatus />
      
      {/* Progression des sessions */}
      <SessionProgress />
    </div>
  );
}

export default App; 