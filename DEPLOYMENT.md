# Déploiement sur Firebase

## Étapes de configuration

### 1. Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Créer un projet"
3. Donnez un nom à votre projet (ex: "now-time-management")
4. Suivez les étapes de configuration

### 2. Activer l'authentification Google

1. Dans la console Firebase, allez dans "Authentication"
2. Cliquez sur "Get started"
3. Dans l'onglet "Sign-in method", activez "Google"
4. Configurez le provider Google avec votre domaine autorisé

### 3. Activer Firestore (optionnel)

1. Dans la console Firebase, allez dans "Firestore Database"
2. Cliquez sur "Create database"
3. Choisissez "Start in test mode" pour commencer

### 4. Obtenir les clés de configuration

1. Dans la console Firebase, allez dans "Project settings" (icône engrenage)
2. Dans l'onglet "General", faites défiler jusqu'à "Your apps"
3. Cliquez sur l'icône Web (</>) pour ajouter une app web
4. Donnez un nom à votre app et cliquez sur "Register app"
5. Copiez la configuration Firebase

### 5. Configurer l'application

1. Remplacez les valeurs dans `src/firebase/config.ts` :
   ```typescript
   const firebaseConfig = {
     apiKey: "VOTRE_API_KEY",
     authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
     projectId: "VOTRE_PROJECT_ID",
     storageBucket: "VOTRE_PROJECT_ID.appspot.com",
     messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
     appId: "VOTRE_APP_ID"
   };
   ```

2. Remplacez `YOUR_PROJECT_ID` dans `.firebaserc` par votre ID de projet

### 6. Se connecter à Firebase

```bash
firebase login
```

### 7. Initialiser le projet Firebase

```bash
firebase init hosting
```

Répondez aux questions :
- Sélectionnez votre projet
- Public directory: `dist`
- Configure as single-page app: `Yes`
- Overwrite index.html: `No`

### 8. Construire et déployer

```bash
# Construire l'application
npm run build

# Déployer sur Firebase
firebase deploy
```

## Variables d'environnement (optionnel)

Pour plus de sécurité, vous pouvez utiliser des variables d'environnement :

1. Créez un fichier `.env.local` :
```
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_messaging_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

2. Modifiez `src/firebase/config.ts` :
```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

## URL de déploiement

Après le déploiement, votre application sera accessible à :
`https://VOTRE_PROJECT_ID.web.app`

## Commandes utiles

```bash
# Développement local
npm run dev

# Construction pour production
npm run build

# Prévisualisation de la build
npm run preview

# Déploiement sur Firebase
firebase deploy

# Déploiement uniquement de l'hosting
firebase deploy --only hosting
``` 