import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useNowStore } from '../store';
import { AddTaskButton } from './AddTaskButton';

// Composant TaskItem sans mémorisation pour une meilleure réactivité
const TaskItem: React.FC<{ 
  task: any; 
  onToggle: () => void; 
  onMove: () => void; 
  onDelete: () => void;
  isCurrentProject: boolean;
}> = ({ task, onToggle, onMove, onDelete, isCurrentProject }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggle = () => {
    if (task.status !== 'completed') {
      setIsCompleting(true);
      setTimeout(() => {
        onToggle();
        setIsCompleting(false);
      }, 300);
    } else {
      onToggle();
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  return (
    <div className={`task-item ${task.status === 'completed' ? 'completed' : ''} ${isDeleting ? 'deleting' : ''} ${isCompleting ? 'completing' : ''} ${isCurrentProject ? 'border-l-2 border-now-blue' : ''}`}>
      <button
        onClick={handleToggle}
        className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
          task.status === 'completed' 
            ? 'bg-now-green border-now-green scale-110' 
            : 'border-gray-400 hover:border-white hover:scale-110'
        }`}
      />
      <span className={`flex-1 transition-all duration-300 ${task.status === 'completed' ? 'line-through opacity-60' : ''}`}>
        {task.name}
      </span>
      <div className="flex items-center space-x-1">
        <button
          onClick={onMove}
          className="text-xs text-white/60 hover:text-white transition-all duration-200 p-1 hover:scale-110"
          title={`Déplacer vers ${task.assignedDate === 'today' ? 'demain' : 'aujourd\'hui'}`}
        >
          {task.assignedDate === 'today' ? '→' : '←'}
        </button>
        <button
          onClick={handleDelete}
          className="text-xs text-white/60 hover:text-now-red transition-all duration-200 p-1 hover:scale-110"
          title="Supprimer la tâche"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

interface TaskListProps {
  projectId: string;
  assignedDate: 'today' | 'tomorrow';
}

export const TaskList: React.FC<TaskListProps> = ({ projectId, assignedDate }) => {
  // S'assurer que le composant se met à jour quand les tâches changent
  const { 
    projects,
    timer,
    tasks, // Ajouter tasks directement pour forcer la réactivité
 
    updateTask, 
    moveTask,
    deleteTask
  } = useNowStore();

  // Debug: vérifier que les tâches se mettent à jour
  useEffect(() => {
    console.log(`TaskList ${projectId} - ${assignedDate} updated. Total tasks:`, tasks.length);
  }, [tasks, projectId, assignedDate]);

  // Mémoriser les données pour éviter les re-renders
  const project = useMemo(() => 
    projects.find(p => p.id === projectId),
    [projectId, projects]
  );
  
  // Filtrer les tâches directement depuis le store pour une meilleure réactivité
  const projectTasks = useMemo(() => 
    tasks.filter(task => task.projectId === projectId),
    [tasks, projectId]
  );
  
  const tasksForDate = useMemo(() => {
    const filtered = projectTasks.filter(task => task.assignedDate === assignedDate);
    console.log(`Tasks for ${projectId} - ${assignedDate}:`, filtered);
    return filtered;
  }, [projectTasks, assignedDate, projectId]);

  // Vérifier si c'est le projet actuellement sélectionné
  const isCurrentProject = timer.currentProjectId === projectId;

  // Callbacks mémorisés pour éviter les re-renders
  const handleToggleTask = useCallback((taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    console.log(`Toggling task ${taskId} from ${currentStatus} to ${newStatus}`);
    updateTask(taskId, { status: newStatus as 'pending' | 'completed' });
  }, [updateTask]);

  const handleMoveTask = useCallback((taskId: string, newDate: 'today' | 'tomorrow') => {
    moveTask(taskId, newDate);
  }, [moveTask]);

  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);

  if (!project) {
    return (
      <div className="text-center text-white/60 text-sm">
        <p>Projet non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Tâches pour cette date */}
      {tasksForDate.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={() => handleToggleTask(task.id, task.status)}
          onMove={() => handleMoveTask(task.id, task.assignedDate === 'today' ? 'tomorrow' : 'today')}
          onDelete={() => handleDeleteTask(task.id)}
          isCurrentProject={isCurrentProject}
        />
      ))}
      
      {/* Message si aucune tâche */}
      {tasksForDate.length === 0 && (
        <div className="text-white/50 text-sm italic text-center py-2">
          Aucune tâche
        </div>
      )}
      
      {/* Bouton d'ajout */}
      <div className="pt-2">
        <AddTaskButton projectId={projectId} assignedDate={assignedDate} />
      </div>
    </div>
  );
}; 