import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Configuration Firebase - à remplacer par vos propres clés
const firebaseConfig = {
    apiKey: "AIzaSyARBI_wQuUDLgZMF3xY6khyv1vDKsdHce0",
    authDomain: "nowapp-60a9c.firebaseapp.com",
    projectId: "nowapp-60a9c",
    storageBucket: "nowapp-60a9c.firebasestorage.app",
    messagingSenderId: "830293373392",
    appId: "1:830293373392:web:a0a4efc7794eb50fdb09d5",
    measurementId: "G-QVYNWXNL9Y"
  };

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser les services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialiser Realtime Database avec l'URL correcte pour europe-west1
export const database = getDatabase(app, 'https://nowapp-60a9c-default-rtdb.europe-west1.firebasedatabase.app');

// Configuration du provider Google
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export default app; 