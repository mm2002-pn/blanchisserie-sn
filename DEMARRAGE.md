# Guide de démarrage rapide

## ✅ Corrections apportées

1. **Expo Router configuré** : L'ancien App.tsx a été remplacé par le système de routing Expo Router
2. **index.ts mis à jour** : Utilise maintenant `expo-router/entry`
3. **app.json configuré** : Ajout du plugin expo-router et du scheme

## 🚀 Comment lancer l'application

### Option 1 : Ligne de commande
```bash
cd C:\xampp\htdocs\blanchisserie-sn
npx expo start --clear
```

Si le port 8081 est occupé, utilisez:
```bash
npx expo start --clear --port 8082
```

### Option 2 : Via npm
```bash
npm start
```

## 📱 Comment ouvrir sur votre appareil

Une fois le serveur lancé, vous verrez :
- Un QR code dans le terminal
- Des options de clavier :
  - Appuyez sur `a` pour Android
  - Appuyez sur `i` pour iOS
  - Appuyez sur `w` pour le navigateur Web

### Sur téléphone physique
1. Installez l'app **Expo Go** depuis le Play Store (Android) ou App Store (iOS)
2. Ouvrez Expo Go
3. Scannez le QR code affiché dans le terminal

### Sur émulateur
- **Android** : Lancez Android Studio et un émulateur, puis appuyez sur `a`
- **iOS** : Lancez Xcode Simulator (Mac uniquement), puis appuyez sur `i`

## 🔑 Connexion

Une fois l'app lancée, utilisez ces identifiants :

### Profil Hôtel (recommandé pour commencer)
- Email: `hotel@test.com`
- Mot de passe: `password`

### Profil Chauffeur
- Email: `driver@test.com`
- Mot de passe: `password`

### Profil Superviseur
- Email: `supervisor@test.com`
- Mot de passe: `password`

## 🎯 Ce que vous verrez

### Profil Hôtel (Fonctionnel)
Après connexion avec hotel@test.com :
1. **Dashboard** avec :
   - 4 cartes de statistiques
   - Boutons d'actions rapides
   - Liste des 3 dernières commandes
   - Bouton de déconnexion

2. **Navigation bottom tabs** :
   - 🏠 Accueil (Dashboard)
   - 📦 Commandes (placeholder)
   - 💵 Factures (placeholder)
   - 👤 Profil (placeholder)

### Profils Chauffeur et Superviseur (Placeholders)
- Affichent juste un message "À venir"
- Bouton de déconnexion fonctionnel

## 🛠 Résolution de problèmes

### Le serveur ne démarre pas
```bash
# Nettoyez le cache et redémarrez
npx expo start --clear
```

### Port déjà utilisé
```bash
# Utilisez un autre port
npx expo start --port 8082
```

### Erreur "Cannot find module"
```bash
# Réinstallez les dépendances
rm -rf node_modules
npm install
```

### L'app affiche une page blanche
1. Arrêtez le serveur (Ctrl+C)
2. Redémarrez avec cache vidé : `npx expo start --clear`
3. Rechargez l'app (secouer le téléphone et choisir "Reload")

## 📋 Vérifications

Si vous voyez l'écran de connexion avec :
- Logo 🧺 et texte "LaundryKing"
- Formulaire avec email et mot de passe
- Bouton "Se connecter"
- Infos sur les comptes de test

**✅ L'application fonctionne correctement !**

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
1. Node.js est installé : `node --version`
2. Les dépendances sont installées : vérifiez le dossier `node_modules`
3. Le terminal n'affiche pas d'erreurs de compilation

## 🔄 Prochaine fois

Pour relancer l'app :
```bash
cd C:\xampp\htdocs\blanchisserie-sn
npm start
```

Puis ouvrez sur votre appareil/émulateur.
