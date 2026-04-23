# Test avec navigation simplifiée

Si l'erreur persiste, voici comment tester avec une version ultra-simplifiée:

## Étape 1: Créer un écran de test simple

Créez un fichier `app/test.tsx`:

```typescript
import { View, Text } from 'react-native';

export default function TestScreen() {
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 24 }}>✅ Navigation fonctionne!</Text>
        </View>
    );
}
```

## Étape 2: Modifier temporairement index.tsx

Dans `app/index.tsx`, remplacez tout par:

```typescript
import { Redirect } from 'expo-router';

export default function Index() {
    return <Redirect href="/test" />;
}
```

## Étape 3: Redémarrer

```bash
# Dans le terminal, appuyez sur Ctrl+C
npx expo start --clear
```

Si vous voyez "✅ Navigation fonctionne!", alors le problème vient spécifiquement de la configuration des Tabs ou de l'AuthContext.

## Diagnostic

### Si ça marche:
Le problème est dans les composants complexes (Tabs, AuthContext, etc.)

### Si ça ne marche pas:
Le problème est plus profond - probablement les versions de packages incompatibles.

## Solution: Packages incompatibles

Si rien ne fonctionne, réinstallez avec les versions exactes d'Expo:

```bash
npx expo install --fix
```

Cela va installer automatiquement les versions compatibles de tous les packages.
