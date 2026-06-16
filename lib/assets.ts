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
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';
    // L'API préfixe /api/v1 ; les assets sont servis depuis la racine (sans /api/v1).
    const host = apiUrl.replace(/\/api\/v\d+\/?$/, '');
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
}
