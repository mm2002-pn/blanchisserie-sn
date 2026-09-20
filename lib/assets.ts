import { API_URL } from '@/constants/Api';

/**
 * Résout une URL d'asset retournée par l'API.
 *
 * - URLs absolues (http/https) : renvoyées telles quelles
 * - URLs relatives (/uploads/...) : préfixées avec l'host de l'API
 * - Vide / null : renvoie undefined (l'appelant affichera un placeholder)
 */
export function resolveAsset(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    if (/^https?:\/\//i.test(url)) return url;
    // L'API préfixe /api/v1 ; les assets sont servis depuis la racine (sans /api/v1).
    const host = API_URL.replace(/\/api\/v\d+\/?$/, '');
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}
