import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';

export const LogoutButton: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null; // Ne pas afficher si pas connecté
  }

  return (
    <button
      onClick={logout}
      className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      <span>Se déconnecter</span>
    </button>
  );
}; 