/**
 * URL de l'API/WS — bascule automatique dev/prod.
 *
 * `__DEV__` est vrai en local (Expo Go, dev client, `expo start`) et faux dans
 * tout build distribué (APK preview/production via EAS). Pas besoin d'éditer
 * `.env` à chaque changement d'environnement : seule l'IP locale (qui change
 * avec le réseau Wi-Fi) est à tenir à jour dans `EXPO_PUBLIC_API_URL_LOCAL`.
 */

const LOCAL_API_URL =
    process.env.EXPO_PUBLIC_API_URL_LOCAL ?? 'http://localhost:4000/api/v1';
const LOCAL_WS_URL =
    process.env.EXPO_PUBLIC_WS_URL_LOCAL ?? 'http://localhost:4000';

const PROD_API_URL =
    process.env.EXPO_PUBLIC_API_URL_PROD ?? 'https://api.bcterangasignature.com/api/v1';
const PROD_WS_URL =
    process.env.EXPO_PUBLIC_WS_URL_PROD ?? 'https://api.bcterangasignature.com';

export const API_URL = __DEV__ ? LOCAL_API_URL : PROD_API_URL;
export const WS_URL = __DEV__ ? LOCAL_WS_URL : PROD_WS_URL;
