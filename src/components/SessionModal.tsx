import React, { useState } from 'react';
import { useNowStore } from '../store';
import { Task } from '../types';

export const SessionModal: React.FC = () => {
  const { 
    showSessionModal, 
    currentSession, 
    timer,
    tasks
  } = useNowStore();
  const { hideSessionModalAction, completeMultipleTasks, startBreak, addTask } = useNowStore();

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [takeBreak, setTakeBreak] = useState<boolean>(true);
  const [newTaskName, setNewTaskName] = useState<string>('');
  const [isAddingNewTask, setIsAddingNewTask] = useState<boolean>(false);

  if (!showSessionModal || !currentSession) {
    return null;
  }

  // Récupérer le projectId - essayer plusieurs sources
  let projectId: string | null = currentSession.projectId;
  if (!projectId) {
    projectId = timer.currentProjectId;
  }
  if (!projectId) {
    // Fallback: chercher dans les sessions récentes
    const recentSessions = useNowStore.getState().sessions;
    if (recentSessions.length > 0) {
      projectId = recentSessions[recentSessions.length - 1].projectId;
    }
  }
  
  // Filtrer les tâches pour ce projet
  const projectTasks = tasks.filter(task => task.projectId === projectId);

  // Filtrer les tâches d'aujourd'hui qui ne sont pas encore complétées
  const todayTasks = projectTasks.filter(task => 
    task.assignedDate === 'today' && task.status !== 'completed'
  );

  const handleTaskSelection = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter(id => id !== taskId));
      setCompletedTaskIds(completedTaskIds.filter(id => id !== taskId));
    } else {
      setSelectedTaskIds([...selectedTaskIds, taskId]);
    }
  };

  const handleTaskCompletion = (taskId: string, completed: boolean) => {
    if (completed) {
      setCompletedTaskIds([...completedTaskIds, taskId]);
    } else {
      setCompletedTaskIds(completedTaskIds.filter(id => id !== taskId));
    }
  };

  const handleSubmit = () => {
    // Préparer les mises à jour de toutes les tâches sélectionnées
    const taskUpdates = selectedTaskIds.map(taskId => ({
      taskId,
      completed: completedTaskIds.includes(taskId)
    }));
    
    // Traiter toutes les tâches en une seule fois
    completeMultipleTasks(taskUpdates);
    
    // Fermer le modal
    hideSessionModalAction();
    
    // Si on veut prendre une pause, la démarrer après un court délai
    if (takeBreak) {
      setTimeout(() => {
        startBreak();
      }, 100);
    }
    
    setSelectedTaskIds([]);
    setCompletedTaskIds([]);
    setTakeBreak(true);
  };

  const handleSkip = () => {
    hideSessionModalAction();
    setSelectedTaskIds([]);
    setCompletedTaskIds([]);
    setTakeBreak(true);
  };

  const handleAddNewTask = () => {
    if (newTaskName.trim() && projectId) {
      const newTask = {
        name: newTaskName.trim(),
        projectId: projectId,
        assignedDate: 'today' as const,
        status: 'pending' as const,
        timeSpent: 0,
      };
      
      addTask(newTask);
      setNewTaskName('');
      setIsAddingNewTask(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNewTask();
    } else if (e.key === 'Escape') {
      setIsAddingNewTask(false);
      setNewTaskName('');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-md">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-white mb-1">
            Session terminée ! 🎉
          </h2>
          <p className="text-gray-400 text-xs">
                                    Session de 50 minutes terminée
          </p>
        </div>
        
        <div className="space-y-4">
          {/* Question 1: Qu'ai-je fait ? */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              1. Sur quelles tâches avez-vous travaillé ?
            </label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {todayTasks.map((task) => (
                <label key={task.id} className="flex items-center p-2 bg-now-darker rounded hover:bg-opacity-80 transition-all duration-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(task.id)}
                    onChange={() => handleTaskSelection(task.id)}
                    className="mr-2 w-3 h-3 text-now-teal bg-now-darker border-gray-600 rounded focus:ring-now-teal focus:ring-1"
                  />
                  <span className="text-gray-300 text-xs">{task.name}</span>
                </label>
              ))}
              
              {/* Bouton pour ajouter une nouvelle tâche */}
              {!isAddingNewTask && (
                <button
                  onClick={() => setIsAddingNewTask(true)}
                  className="w-full flex items-center justify-center p-2 bg-now-darker rounded hover:bg-opacity-80 transition-all duration-200 border border-dashed border-now-teal border-opacity-30 hover:border-opacity-50 text-now-teal hover:text-opacity-80 text-xs"
                >
                  <span className="mr-1">+</span>
                  Ajouter une tâche
                </button>
              )}
              
              {/* Interface d'ajout de nouvelle tâche */}
              {isAddingNewTask && (
                <div className="flex items-center p-2 bg-now-darker rounded border border-now-teal border-opacity-30">
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nouvelle tâche..."
                    className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none text-xs"
                    autoFocus
                  />
                  <div className="flex space-x-1 ml-2">
                    <button
                      onClick={handleAddNewTask}
                      disabled={!newTaskName.trim()}
                      className="px-2 py-1 bg-now-teal text-white rounded text-xs hover:bg-opacity-80 disabled:opacity-50"
                    >
                      +
                    </button>
                    <button
                      onClick={() => {
                        setIsAddingNewTask(false);
                        setNewTaskName('');
                      }}
                      className="px-2 py-1 border border-gray-600 text-gray-400 rounded text-xs hover:bg-gray-700"
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              
              {todayTasks.length === 0 && !isAddingNewTask && (
                <div className="text-center py-2">
                  <p className="text-gray-400 text-xs mb-2">Aucune tâche disponible</p>
                  <button
                    onClick={() => setIsAddingNewTask(true)}
                    className="inline-flex items-center px-2 py-1 bg-now-teal bg-opacity-20 text-now-teal rounded hover:bg-opacity-30 transition-all duration-200 border border-now-teal border-opacity-30 text-xs"
                  >
                    <span className="mr-1">+</span>
                    Ajouter
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Question 2: Ai-je terminé des tâches ? */}
          {selectedTaskIds.length > 0 && (
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                2. Quelles tâches avez-vous terminées ?
              </label>
              <div className="space-y-1">
                {selectedTaskIds.map((taskId) => {
                  const task = todayTasks.find((t: Task) => t.id === taskId);
                  if (!task) return null;
                  
                  return (
                    <label key={taskId} className="flex items-center p-2 bg-now-darker rounded">
                      <input
                        type="checkbox"
                        checked={completedTaskIds.includes(taskId)}
                        onChange={(e) => handleTaskCompletion(taskId, e.target.checked)}
                        className="mr-2 w-3 h-3 text-now-green bg-now-darker border-gray-600 rounded focus:ring-now-green focus:ring-1"
                      />
                      <span className={`text-gray-300 text-xs ${completedTaskIds.includes(taskId) ? 'line-through opacity-60' : ''}`}>
                        {task.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question 3: Voulez-vous prendre une pause ? */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              3. Prendre une pause de 10 minutes ?
            </label>
            <div className="flex space-x-2">
              <label className="flex items-center p-2 bg-now-darker rounded cursor-pointer flex-1">
                <input
                  type="radio"
                  name="takeBreak"
                  value="true"
                  checked={takeBreak}
                  onChange={() => setTakeBreak(true)}
                  className="mr-2 w-3 h-3 text-now-teal bg-now-darker border-gray-600 focus:ring-now-teal focus:ring-1"
                />
                <span className="text-gray-300 text-xs">Oui</span>
              </label>
              <label className="flex items-center p-2 bg-now-darker rounded cursor-pointer flex-1">
                <input
                  type="radio"
                  name="takeBreak"
                  value="false"
                  checked={!takeBreak}
                  onChange={() => setTakeBreak(false)}
                  className="mr-2 w-3 h-3 text-now-teal bg-now-darker border-gray-600 focus:ring-now-teal focus:ring-1"
                />
                <span className="text-gray-300 text-xs">Non</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex space-x-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={selectedTaskIds.length === 0}
            className="flex-1 bg-gradient-to-r from-now-teal to-now-green text-white py-2 px-3 rounded font-semibold hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {takeBreak ? 'Confirmer + Pause' : 'Confirmer'}
          </button>
          <button
            onClick={handleSkip}
            className="px-3 py-2 border border-white border-opacity-20 text-gray-300 rounded hover:bg-white hover:bg-opacity-10 transition-all duration-200 text-xs"
          >
            Passer
          </button>
        </div>
      </div>
    </div>
  );
}; 