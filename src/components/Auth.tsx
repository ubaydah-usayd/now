import React from 'react';
import { useAuth } from '../hooks/useAuth';

export const Auth: React.FC = () => {
  const { user, loading, signInWithGoogle, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Chargement...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-8">NOW</h1>
            <div className="max-w-xs mx-auto rounded-lg mb-8 bg-gray-700 p-8 flex items-center justify-center" style={{ maxHeight: '200px' }}>
              <span className="text-4xl font-bold text-white">NOW</span>
            </div>
            <p className="text-gray-300 mb-6">
              Connectez-vous pour accéder à votre gestionnaire de temps
            </p>
            <button
              onClick={signInWithGoogle}
              className="w-full bg-white text-gray-900 py-3 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center space-x-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Se connecter avec Google</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">NOW</h1>
                      <div className="mb-6">
              <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-gray-700 flex items-center justify-center">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </span>
                )}
              </div>
            <p className="text-white font-semibold">{user.displayName}</p>
            <p className="text-gray-400 text-sm">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}; 