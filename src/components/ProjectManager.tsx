import React, { useState } from 'react';
import { useNowStore } from '../store';
import { Plus, Trash2, Edit3, Palette } from 'lucide-react';
import { PROJECT_COLORS } from '../utils/colors';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose }) => {
  const { projects, addProject, updateProject, deleteProject } = useNowStore();
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0].value);
  const [newProjectHours, setNewProjectHours] = useState(5);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editHours, setEditHours] = useState(5);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      addProject({
        name: newProjectName.trim(),
        color: newProjectColor,
        dailyHours: newProjectHours,
        tasks: [],
      });
      setNewProjectName('');
      setNewProjectColor(PROJECT_COLORS[0].value);
      setNewProjectHours(5);
    }
  };

  const handleStartEdit = (project: any) => {
    setEditingProject(project.id);
    setEditName(project.name);
    setEditColor(project.color);
    setEditHours(project.dailyHours);
  };

  const handleSaveEdit = () => {
    if (editingProject && editName.trim()) {
      updateProject(editingProject, {
        name: editName.trim(),
        color: editColor,
        dailyHours: editHours,
      });
      setEditingProject(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) {
      deleteProject(projectId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 text-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Gestion des Projets</h2>
          <button
            onClick={onClose}
            className="text-gray-300 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Formulaire de création */}
        <div className="mb-6 p-4 bg-gray-700 rounded-lg">
          <h3 className="font-semibold mb-3 flex items-center text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Projet
          </h3>
          
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nom du projet"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full p-2 border border-gray-600 rounded bg-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center text-white">
                <Palette className="w-4 h-4 mr-2" />
                Couleur
              </label>
              <div className="grid grid-cols-5 gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setNewProjectColor(color.value)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      newProjectColor === color.value
                        ? 'border-gray-800'
                        : 'border-gray-300'
                    } ${color.value}`}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Heures quotidiennes
              </label>
              <input
                type="number"
                min="1"
                max="24"
                value={newProjectHours}
                onChange={(e) => setNewProjectHours(Number(e.target.value))}
                className="w-full p-2 border border-gray-600 rounded bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Créer le projet
            </button>
          </div>
        </div>

        {/* Liste des projets existants */}
        <div>
          <h3 className="font-semibold mb-3 text-white">Projets existants</h3>
          <div className="space-y-2">
            {projects.map((project) => (
              <div
                key={project.id}
                className="border border-gray-600 rounded-lg p-3 bg-gray-700"
              >
                {editingProject === project.id ? (
                  // Mode édition
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full p-2 border border-gray-600 rounded bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div>
                      <label className="block text-sm font-medium mb-1 text-white">Couleur</label>
                      <div className="grid grid-cols-5 gap-2">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => setEditColor(color.value)}
                            className={`w-6 h-6 rounded-full border-2 ${
                              editColor === color.value
                                ? 'border-gray-800'
                                : 'border-gray-300'
                            } ${color.value}`}
                            title={color.name}
                          />
                        ))}
                      </div>
                    </div>
                    
                    <input
                      type="number"
                      min="1"
                      max="24"
                      value={editHours}
                      onChange={(e) => setEditHours(Number(e.target.value))}
                      className="w-full p-2 border border-gray-600 rounded bg-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex-1 bg-green-500 text-white py-1 px-3 rounded text-sm hover:bg-green-600"
                      >
                        Sauvegarder
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-500 text-white py-1 px-3 rounded text-sm hover:bg-gray-600"
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${project.color}`} />
                      <div>
                        <div className="font-medium">{project.name}</div>
                        <div className="text-sm text-gray-500">
                          {project.dailyHours}h/jour
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleStartEdit(project)}
                        className="p-1 text-gray-500 hover:text-blue-500"
                        title="Modifier"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="p-1 text-gray-500 hover:text-red-500"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            
            {projects.length === 0 && (
              <div className="text-center text-gray-400 py-8">
                Aucun projet créé
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 