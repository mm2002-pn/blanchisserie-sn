# ✅ Problèmes résolus

## Corrections apportées

### 1. ✅ Configuration TypeScript (`tsconfig.json`)
Ajouté les path aliases pour que TypeScript reconnaisse `@/`:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

### 2. ✅ Configuration Metro Bundler (`metro.config.js`)
Créé pour que Metro reconnaisse aussi l'alias `@/`:
```javascript
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname),
};
```

### 3. ✅ Dépendances manquantes installées
- expo-constants
- expo-linking
- react-native-webview

---

## 🚀 Comment démarrer PROPREMENT

### Étape 1: Fermer TOUS les processus Node
**IMPORTANT**: Il faut fermer tous les serveurs Expo en cours

**Méthode 1 - Fermer tous les terminaux**:
1. Fermez TOUS vos terminaux/CMD/PowerShell ouverts
2. Redémarrez votre éditeur de code (VS Code, etc.)

**Méthode 2 - Tuer les processus manuellement**:
```bash
# Windows (PowerShell en admin)
Get-Process -Name node | Stop-Process -Force

# Ou via le Gestionnaire des tâches
# Cherchez "Node.js" et terminez tous les processus
```

### Étape 2: Ouvrir UN SEUL terminal
1. Ouvrez un nouveau terminal
2. Naviguez vers le projet:
```bash
cd C:\xampp\htdocs\blanchisserie-sn
```

### Étape 3: Démarrer Expo
```bash
npx expo start --clear
```

**Que faire si un port est occupé?**
Le terminal vous demandera d'utiliser un autre port. Tapez `y` (yes) et appuyez sur Entrée.

### Étape 4: Ouvrir l'application
Une fois le serveur démarré (vous verrez un QR code), choisissez:
- Appuyez sur `a` pour Android
- Appuyez sur `i` pour iOS (Mac uniquement)
- Appuyez sur `w` pour Web
- Scannez le QR code avec Expo Go sur votre téléphone

---

## 🎯 Ce que vous DEVEZ voir

### 1. Terminal Expo
```
Starting Metro Bundler
Waiting on http://localhost:8081

› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or...

› Press a │ open Android
› Press w │ open web
```

### 2. Écran de connexion
L'application devrait afficher:
- 🧺 Logo et "LaundryKing"
- Champs Email et Mot de passe
- Bouton "Se connecter"
- Liste des comptes de test

### 3. Après connexion (hotel@test.com)
- Dashboard avec 4 cartes de stats
- Navigation bottom tabs (4 onglets)
- Bouton déconnexion en haut à droite

---

## ❌ Si ça ne marche TOUJOURS pas

### Problème: Erreur "Unable to resolve module @/..."
**Solution**: Redémarrez le serveur avec cache vidé
```bash
# Arrêtez le serveur (Ctrl+C)
npx expo start --clear
```

### Problème: "Port déjà utilisé"
**Solution**: Utilisez un autre port quand demandé, ou:
```bash
npx expo start --clear --port 8090
```

### Problème: Écran blanc ou erreur de compilation
**Solution**: Cache Metro corrompu
```bash
# Arrêtez le serveur
# Supprimez le cache
npx expo start --clear

# Si ça persiste, supprimez node_modules et réinstallez
rm -rf node_modules
npm install
npx expo start --clear
```

### Problème: "Cannot find module react-native-xxx"
**Solution**: Réinstallez les dépendances
```bash
npm install
```

---

## 📝 Commandes utiles

```bash
# Démarrer normalement
npm start

# Démarrer avec cache vidé
npx expo start --clear

# Démarrer sur un port spécifique
npx expo start --port 8090

# Vérifier la configuration Expo
npx expo-doctor

# Compiler TypeScript sans exécuter
npx tsc --noEmit
```

---

## ✅ Checklist avant de redémarrer

- [ ] Tous les terminaux sont fermés
- [ ] VS Code/éditeur redémarré
- [ ] Un seul terminal ouvert
- [ ] Vous êtes dans le bon dossier (`cd C:\xampp\htdocs\blanchisserie-sn`)
- [ ] Lancer `npx expo start --clear`
- [ ] Attendre le QR code
- [ ] Ouvrir sur appareil/émulateur

---

## 🎉 Test rapide

Pour vérifier que tout fonctionne:

1. ✅ Le serveur démarre sans erreur
2. ✅ Un QR code s'affiche
3. ✅ L'écran de connexion apparaît
4. ✅ Connexion avec `hotel@test.com` / `password` fonctionne
5. ✅ Le dashboard s'affiche avec les statistiques

**Si tout cela fonctionne → L'application est opérationnelle!** 🎊
