# NOW - Gestionnaire de Temps Intelligent

Une application web moderne pour la gestion de projets et la productivité basée sur la technique Pomodoro.

## 🚀 Fonctionnalités

- **⏱️ Timer Pomodoro** : Sessions de 50 minutes avec pauses
- **📋 Gestion de Projets** : Création et organisation de projets avec codes couleur
- **✅ Gestion de Tâches** : Ajout, modification et suivi des tâches par projet
- **📊 Suivi de Progression** : Visualisation de l'avancement quotidien et hebdomadaire
- **☁️ Synchronisation Cloud** : Sauvegarde automatique avec Firebase
- **🔒 Mode Hors-ligne** : Fonctionnement local avec localStorage
- **🎵 Notifications Audio** : Sons pour les transitions de sessions
- **📱 Interface Responsive** : Optimisée pour desktop et mobile

## 🛠️ Technologies

- **Frontend** : React 18 + TypeScript + Vite
- **Styling** : Tailwind CSS
- **State Management** : Zustand
- **Backend** : Firebase (Authentication + Realtime Database)
- **Déploiement** : Firebase Hosting

## 📦 Installation

### Prérequis
- Node.js (version 16 ou supérieure)
- npm ou yarn
- Compte Firebase (optionnel pour la synchronisation cloud)

### Installation locale

1. **Cloner le repository**
   ```bash
   git clone https://github.com/votre-username/NOW.git
   cd NOW
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configuration Firebase (optionnel)**
   - Créer un projet Firebase
   - Activer Authentication et Realtime Database
   - Copier les clés de configuration dans `src/firebase/config.ts`

4. **Lancer en mode développement**
   ```bash
   npm run dev
   ```

5. **Ouvrir l'application**
   - Naviguer vers `http://localhost:5173`

## 🚀 Déploiement

### Build de production
```bash
npm run build
```

### Déploiement Firebase
```bash
firebase deploy
```

## 📁 Structure du Projet

```
NOW/
├── src/
│   ├── components/          # Composants React
│   │   ├── Timer.tsx       # Timer principal
│   │   ├── ProjectManager.tsx
│   │   ├── TaskList.tsx
│   │   └── ...
│   ├── hooks/              # Hooks personnalisés
│   │   ├── useTimer.ts
│   │   ├── useAuth.ts
│   │   └── useAutoSave.ts
│   ├── store/              # État global (Zustand)
│   │   └── index.ts
│   ├── utils/              # Utilitaires
│   │   ├── firebaseManager.ts
│   │   ├── localStorage.ts
│   │   └── ...
│   ├── firebase/           # Configuration Firebase
│   │   └── config.ts
│   └── types/              # Types TypeScript
│       └── index.ts
├── public/                 # Assets statiques
├── dist/                   # Build de production
└── package.json
```

## 🎯 Utilisation

### Mode Local (Recommandé pour commencer)
1. L'application fonctionne immédiatement sans configuration
2. Les données sont sauvegardées localement
3. Parfait pour tester et utiliser l'application

### Mode Cloud (Synchronisation multi-appareils)
1. Se connecter avec un compte Google
2. Les données se synchronisent automatiquement
3. Accès depuis n'importe quel appareil

### Fonctionnalités principales
- **Démarrer une session** : Cliquer sur START
- **Mettre en pause** : Utiliser le bouton PAUSE
- **Ajouter un projet** : Bouton "+" dans la section projets
- **Ajouter une tâche** : Bouton "+" dans la section tâches
- **Voir les statistiques** : Onglet "Vue Hebdomadaire"

## 🔧 Configuration

### Variables d'environnement
Créer un fichier `.env.local` :
```env
VITE_FIREBASE_API_KEY=votre_api_key
VITE_FIREBASE_AUTH_DOMAIN=votre_auth_domain
VITE_FIREBASE_PROJECT_ID=votre_project_id
VITE_FIREBASE_STORAGE_BUCKET=votre_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=votre_app_id
```

## 🐛 Debug

L'application inclut un panneau de debug accessible via le bouton 🐛 :
- État du store
- Données Firebase
- Nettoyage localStorage
- Synchronisation forcée

## 📝 Scripts Disponibles

- `npm run dev` - Lancement en mode développement
- `npm run build` - Build de production
- `npm run preview` - Prévisualisation du build
- `npm run lint` - Vérification du code

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- Technique Pomodoro pour la méthode de productivité
- Firebase pour l'infrastructure cloud
- React et la communauté open source

---

**Développé avec ❤️ pour améliorer la productivité** 