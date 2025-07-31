import React, { useState } from 'react';
import { Download, Upload, Database } from 'lucide-react';
import { useNowStore } from '../store';
import { dbManager } from '../utils/database';

export const DataManager: React.FC = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { projects, tasks, sessions } = useNowStore();

  const exportData = async () => {
    setIsExporting(true);
    try {
      // Récupérer toutes les données
      const allData = {
        projects,
        tasks,
        sessions,
        dailyLog: await dbManager.getTodayLog(),
        timestamp: new Date().toISOString(),
        version: '1.0'
      };

      // Créer le fichier de sauvegarde
      const dataStr = JSON.stringify(allData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      // Télécharger le fichier
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `now-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✅ Données exportées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'export:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Vérifier la structure des données
      if (!data.projects || !data.tasks || !data.sessions) {
        throw new Error('Format de fichier invalide');
      }

      // Importer les données
      await dbManager.saveProjects(data.projects);
      await dbManager.saveTasks(data.tasks);
      await dbManager.saveSessions(data.sessions);

      // Mettre à jour le store
      useNowStore.setState({
        projects: data.projects,
        tasks: data.tasks,
        sessions: data.sessions,
      });

      // Recharger la page pour appliquer les changements
      window.location.reload();

      console.log('✅ Données importées avec succès');
    } catch (error) {
      console.error('❌ Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'import des données. Vérifiez le format du fichier.');
    } finally {
      setIsImporting(false);
      // Réinitialiser l'input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* Export */}
      <button
        onClick={exportData}
        disabled={isExporting}
        className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-now-blue to-now-purple text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold disabled:opacity-50"
      >
        <Download className="w-5 h-5 mr-2" />
        {isExporting ? 'Export...' : 'Exporter Données'}
      </button>

      {/* Import */}
      <div className="relative">
        <input
          type="file"
          accept=".json"
          onChange={importData}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isImporting}
        />
        <button
          disabled={isImporting}
          className="flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-now-green to-now-teal text-white rounded-lg hover:opacity-90 transition-all duration-200 font-semibold disabled:opacity-50"
        >
          <Upload className="w-5 h-5 mr-2" />
          {isImporting ? 'Import...' : 'Importer Données'}
        </button>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 text-center">
        <Database className="w-4 h-4 mx-auto mb-1" />
        {projects.length} projets, {tasks.length} tâches, {sessions.length} sessions
      </div>
    </div>
  );
}; 