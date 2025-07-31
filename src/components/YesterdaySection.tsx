import React from 'react';

export const YesterdaySection: React.FC = () => {
  return (
    <div className="w-64 p-6">
      <h2 className="text-2xl font-bold text-white mb-6">YESTERDAY</h2>
      
      <div className="bg-white bg-opacity-10 rounded-lg p-4">
        <p className="text-gray-300 text-sm">
          Analyse hebdomadaire en cours de développement...
        </p>
        
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Productivité</span>
            <span className="text-now-green">85%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Sessions</span>
            <span className="text-white">12</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Tâches terminées</span>
            <span className="text-white">8</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 