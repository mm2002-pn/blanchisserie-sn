import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { STORAGE_KEYS, getItem } from './storage';

const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

export type OrderDocumentType =
    | 'bon-commande'
    | 'bon-collecte'
    | 'bordereau-triage'
    | 'bon-livraison';

/**
 * Télécharge un PDF de commande en respectant l'auth (Bearer token),
 * puis le partage via le sheet natif (iOS Share / Android Intent).
 *
 * Pattern : on n'ouvre pas dans Linking (qui perdrait l'auth) — on récupère
 * en local d'abord avec le token, puis on délègue à expo-sharing.
 */
export async function downloadOrderDocument(
    orderId: string,
    type: OrderDocumentType,
): Promise<void> {
    const token = await getItem(STORAGE_KEYS.ACCESS_TOKEN);
    if (!token) {
        Alert.alert('Non authentifié', 'Veuillez vous reconnecter.');
        return;
    }

    const url = `${BASE_URL}/documents/orders/${orderId}/${type}.pdf`;
    const localPath = `${FileSystem.cacheDirectory}${type}-${orderId}.pdf`;

    try {
        const result = await FileSystem.downloadAsync(url, localPath, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (result.status >= 400) {
            Alert.alert(
                'Téléchargement échoué',
                `Le serveur a répondu ${result.status}.`,
            );
            return;
        }

        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
            await Sharing.shareAsync(result.uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Partager le document',
            });
        } else {
            Alert.alert(
                'Document téléchargé',
                `Enregistré localement : ${result.uri}`,
            );
        }
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur inconnue';
        Alert.alert('Erreur', msg);
    }
}
