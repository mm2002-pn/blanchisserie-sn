import * as SecureStore from 'expo-secure-store';

/**
 * Wrapper SecureStore. Sur web (expo-router web), SecureStore tombe en
 * fallback localStorage côté Expo SDK 50+, donc cohérent multi-plateforme.
 *
 * Clés normalisées ici pour éviter les typos.
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  USER: 'auth_user',
} as const;

type Key = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

export async function getItem(key: Key): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function setItem(key: Key, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeItem(key: Key): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export async function clearAuth(): Promise<void> {
  await Promise.all([
    removeItem(STORAGE_KEYS.ACCESS_TOKEN),
    removeItem(STORAGE_KEYS.REFRESH_TOKEN),
    removeItem(STORAGE_KEYS.USER),
  ]);
}
