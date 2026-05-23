import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { api } from './api';

/**
 * Service push :
 *  - registerPushToken() : demande permission, récupère token Expo, POST sur API
 *  - configureForegroundHandler() : alerts/sons quand l'app est au 1er plan
 *  - unregisterPushToken() : appelée au logout
 *
 * Le serveur stocke le token dans UserPushToken (cf API Phase 14) et
 * dispatch via Expo Push API quand un order:* arrive.
 */

interface RegisterResp {
  id: string;
  token: string;
  platform: string;
}

const STORAGE_TOKEN_KEY = '__expo_push_token_id__';

/** À appeler une fois au boot (avant le 1er render). */
export function configureForegroundHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Demande permission, retourne le token Expo ou null. */
async function getExpoToken(): Promise<string | null> {
  if (!Device.isDevice) return null; // simulateurs n'ont pas de push
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted;
  }
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    (Constants.easConfig as { projectId?: string } | undefined)?.projectId;

  const { data } = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  return data;
}

/** Enregistre le device courant côté API. À appeler après login. */
export async function registerPushToken(): Promise<RegisterResp | null> {
  try {
    const token = await getExpoToken();
    if (!token) return null;

    const platform: 'ios' | 'android' | 'web' =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    const { data } = await api.post<RegisterResp>('/push-tokens', {
      token,
      platform,
      deviceName: Device.deviceName ?? `${Device.brand ?? ''} ${Device.modelName ?? ''}`.trim(),
    });

    // Stocke l'ID local pour pouvoir delete au logout
    if (typeof globalThis !== 'undefined') {
      (globalThis as { [k: string]: unknown })[STORAGE_TOKEN_KEY] = data.id;
    }
    return data;
  } catch {
    return null; // silencieux : push optionnel
  }
}

/** Désactive le token côté serveur (logout). */
export async function unregisterPushToken(): Promise<void> {
  const id = (globalThis as { [k: string]: unknown })[STORAGE_TOKEN_KEY] as
    | string
    | undefined;
  if (!id) return;
  try {
    await api.delete(`/push-tokens/${id}`);
  } catch {
    // best-effort
  } finally {
    delete (globalThis as { [k: string]: unknown })[STORAGE_TOKEN_KEY];
  }
}
