import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const LogoutButton: React.FC = () => {
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <img 
            src={user.photoURL || '/verse.png'} 
            alt="Profile" 
            className="w-8 h-8 rounded-full"
          />
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user.displayName || user.email}
            </p>
            <p className="text-gray-400 text-xs truncate">
              {user.email}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-red-700 transition-colors text-sm"
        >
          Se déconnecter
        </button>
      </div>
    </div>
  );
}; 