import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useNowStore } from '../store';

interface AddTaskButtonProps {
  projectId: string;
  assignedDate: 'today' | 'tomorrow';
}

export const AddTaskButton: React.FC<AddTaskButtonProps> = ({ projectId, assignedDate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [taskName, setTaskName] = useState('');
  const { addTask } = useNowStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim()) {
      addTask({
        name: taskName.trim(),
        projectId,
        status: 'pending',
        assignedDate,
        timeSpent: 0,
      });
      setTaskName('');
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (taskName.trim()) {
        addTask({
          name: taskName.trim(),
          projectId,
          status: 'pending',
          assignedDate,
          timeSpent: 0,
        });
        setTaskName('');
        setIsAdding(false);
      }
    }
  };

  const handleCancel = () => {
    setTaskName('');
    setIsAdding(false);
  };

  if (isAdding) {
    return (
      <form onSubmit={handleSubmit} className="flex items-center space-x-2">
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nouvelle tâche..."
          className="flex-1 px-3 py-1 bg-now-darker border border-gray-600 rounded text-white text-sm focus:border-now-teal focus:outline-none"
          autoFocus
        />
        <button
          type="submit"
          className="p-1 text-now-green hover:bg-now-green hover:bg-opacity-20 rounded transition-colors"
        >
          <Plus size={16} />
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="p-1 text-white/60 hover:text-white hover:bg-white hover:bg-opacity-10 rounded transition-colors"
        >
          <X size={16} />
        </button>
      </form>
    );
  }

  return (
    <button
      onClick={() => setIsAdding(true)}
      className="p-1 text-white/60 hover:text-white hover:bg-white hover:bg-opacity-10 rounded transition-colors"
      title={`Ajouter une tâche pour ${assignedDate === 'today' ? 'aujourd\'hui' : 'demain'}`}
    >
      <Plus size={16} />
    </button>
  );
}; 