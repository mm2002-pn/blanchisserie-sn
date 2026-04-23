# Blanchisserie SN - Application Mobile

Application mobile de gestion de blanchisserie hôtelière avec 3 profils utilisateurs: Hôtel, Chauffeur et Superviseur.

## État d'avancement

### ✅ Phase 1 - Fondations (TERMINÉE)
- [x] Composants réutilisables copiés depuis Reactexpo
  - ThemedText, Colors, Shadows, useThemeColors
- [x] Dépendances installées
  - Navigation (@react-navigation, expo-router)
  - Camera & Scanner (expo-camera, expo-barcode-scanner)
  - Storage (@react-native-async-storage/async-storage)
  - UI (expo-linear-gradient, expo-blur)
  - Utilitaires (date-fns, react-native-signature-canvas, react-native-maps)
- [x] Constantes créées
  - Typography.ts (tailles de police, poids)
  - Spacing.ts (marges, paddings, border radius)
- [x] Types TypeScript
  - auth.types.ts (User, AuthContext)
  - order.types.ts (Order, OrderStatus, ServiceType)
  - user.types.ts (HotelProfile, DriverProfile, SupervisorProfile)
  - invoice.types.ts (Invoice, InvoiceStatus, PaymentMethod)
  - common.types.ts (ApiResponse, PaginatedResponse, Stats)
- [x] Mock Data
  - mock-users.ts (3 utilisateurs de test)
  - mock-orders.ts (6 commandes factices)
  - mock-invoices.ts (5 factures factices)

### ✅ Phase 2 - Authentification et Navigation (TERMINÉE)
- [x] AuthContext créé avec mock authentication
- [x] Écran de connexion (sign-in.tsx)
- [x] Navigation Expo Router configurée
- [x] Composants UI de base
  - Button.tsx (primaire, secondaire, outline)
  - Input.tsx (avec icônes, validation, password toggle)
  - Card.tsx (avec ombres)

### ✅ Phase 3 - Profil Hôtel (PARTIELLEMENT TERMINÉE)
- [x] Layout avec bottom tabs (Dashboard, Commandes, Factures, Profil)
- [x] Dashboard Hôtel fonctionnel
  - Statistiques (commandes en attente, en cours, factures impayées, montant total)
  - Actions rapides
  - Commandes récentes
  - Bouton de déconnexion
- [ ] Page Nouvelle Commande (À faire)
- [ ] Page Mes Commandes avec filtres (À faire)
- [ ] Page Planning Contractuel (À faire)
- [ ] Page Factures détaillée (À faire)
- [ ] Page Support & Réclamations (À faire)
- [ ] Page Profil Hôtel (À faire)

### 🚧 Phase 4 - Profil Chauffeur (PLACEHOLDER)
- [x] Layout de base créé
- [ ] Toutes les pages à développer

### 🚧 Phase 5 - Profil Superviseur (PLACEHOLDER)
- [x] Layout de base créé
- [ ] Toutes les pages à développer

## Démarrage

### Prérequis
- Node.js installé
- Expo CLI installé globalement: `npm install -g expo-cli`
- Un émulateur Android/iOS ou l'app Expo Go sur votre téléphone

### Installation
```bash
cd C:\xampp\htdocs\blanchisserie-sn
npm install
```

### Lancement
```bash
npm start
```

Ensuite:
- Appuyez sur `a` pour ouvrir sur Android
- Appuyez sur `i` pour ouvrir sur iOS
- Scannez le QR code avec Expo Go sur votre téléphone

## Comptes de test

### Hôtel
- Email: `hotel@test.com`
- Mot de passe: `password`
- Accès au dashboard hôtel avec statistiques et commandes

### Chauffeur
- Email: `driver@test.com`
- Mot de passe: `password`
- Accès au profil chauffeur (placeholder)

### Superviseur
- Email: `supervisor@test.com`
- Mot de passe: `password`
- Accès au profil superviseur (placeholder)

## Architecture

### Structure du projet
```
blanchisserie-sn/
├── app/                      # Screens Expo Router
│   ├── (auth)/              # Authentification
│   │   └── sign-in.tsx      # Écran de connexion
│   ├── (hotel)/             # Profil Hôtel
│   │   ├── dashboard.tsx    # Dashboard principal ✅
│   │   ├── orders.tsx       # Liste commandes 🚧
│   │   ├── invoices.tsx     # Liste factures 🚧
│   │   └── profile.tsx      # Profil hôtel 🚧
│   ├── (driver)/            # Profil Chauffeur 🚧
│   └── (supervisor)/        # Profil Superviseur 🚧
├── components/
│   └── ui/                  # Composants UI de base
│       ├── ThemedText.tsx   # Texte avec variantes
│       ├── Button.tsx       # Bouton réutilisable
│       ├── Input.tsx        # Input avec validation
│       └── Card.tsx         # Card avec ombres
├── constants/               # Constantes de design
│   ├── Colors.ts           # Palette de couleurs
│   ├── Shadows.ts          # Styles d'ombres
│   ├── Typography.ts       # Tailles de police
│   └── Spacing.ts          # Marges et paddings
├── contexts/
│   └── AuthContext.tsx     # Gestion authentification
├── data/                   # Mock data
│   ├── mock-users.ts       # Utilisateurs de test
│   ├── mock-orders.ts      # Commandes factices
│   └── mock-invoices.ts    # Factures factices
├── hooks/
│   └── useThemeColors.ts   # Hook de thèmes
└── types/                  # Types TypeScript
    ├── auth.types.ts
    ├── order.types.ts
    ├── user.types.ts
    ├── invoice.types.ts
    └── common.types.ts
```

### Choix techniques
- **Framework**: React Native + Expo
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Context API + AsyncStorage
- **Authentification**: Mock JWT avec mock data
- **Styling**: StyleSheet avec thème clair/sombre
- **Typage**: TypeScript strict

## Prochaines étapes

### Priorité 1 - Compléter le Profil Hôtel
1. Page Nouvelle Commande
   - Formulaire de sélection de services
   - Sélection de volume (S/M/L/XL)
   - Choix de date de collecte
   - Instructions optionnelles
   - Upload de photos

2. Page Mes Commandes
   - Liste de toutes les commandes
   - Filtres par statut
   - Détails de commande
   - Suivi en temps réel
   - Actions (modifier/annuler)

3. Page Planning Contractuel
   - Calendrier des collectes programmées
   - Modification des créneaux
   - Alertes

4. Page Factures
   - Liste des factures
   - Détails facture
   - Comparaison poids estimé/réel
   - Paiement en ligne
   - Historique

5. Page Support & Réclamations
   - Messagerie avec support
   - Formulaire réclamations
   - Suivi tickets
   - FAQ

6. Page Profil
   - Infos établissement
   - Préférences
   - Multi-utilisateurs
   - Paramètres notifications

### Priorité 2 - Profil Chauffeur
- Tournée du jour
- Interface de collecte avec scan QR
- Interface de livraison
- Navigation GPS (Leaflet.js)
- Communications

### Priorité 3 - Profil Superviseur
- Production temps réel
- Contrôle machines
- Contrôle qualité
- Gestion équipe
- Interventions
- Rapports

## Design

Le design s'inspire des templates fournis:
- Couleur primaire: #6366F1 (bleu/violet moderne)
- Background: #F8F9FA
- Cards: Blanches avec ombres légères
- Typographie: Titres en dark blue, texte secondaire en gris
- Boutons: Arrondis avec couleur primaire
- Inputs: Arrondis avec bordures fines

## Notes de développement

### Mock Data
Actuellement, l'application utilise des données factices stockées localement dans le dossier `/data`.
Pour passer à une vraie API:
1. Créer les services dans `/services` (api.ts, auth.service.ts, etc.)
2. Remplacer les appels mock par des appels axios
3. Gérer les erreurs réseau
4. Implémenter le mode hors-ligne avec queue de synchronisation

### Migration backend
L'architecture est modulaire pour faciliter la migration vers un backend réel:
- Les types TypeScript sont déjà définis
- Les services seront créés dans `/services`
- Le AuthContext pourra facilement être adapté pour utiliser une vraie API
- Les mock data peuvent être remplacés progressivement

## Contribution

Ce projet est en développement actif. Focus actuel: **Profil Hôtel complet**.
