import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { useNowStore } from '../store';
import { firebaseManager } from '../utils/firebaseManager';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
              if (user) {
          // Utilisateur connecté - synchroniser avec Firebase
          console.log('🔄 Synchronisation des données pour l\'utilisateur:', user.uid);
          try {
            firebaseManager.init(user.uid);
            await useNowStore.getState().initDatabase();
          } catch (error) {
            console.error('Erreur lors de la synchronisation:', error);
          }
        } else {
          // Utilisateur déconnecté - nettoyer les listeners
          console.log('🧹 Nettoyage des listeners');
          firebaseManager.cleanup();
        }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      throw error;
    }
  };

  return {
    user,
    loading,
    signInWithGoogle,
    logout
  };
}; 