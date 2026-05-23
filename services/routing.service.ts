/**
 * Service de calcul d'itinéraire.
 *
 * Utilise OSRM (Open Source Routing Machine) public — gratuit, pas de clé API.
 * Endpoint démo : router.project-osrm.org (limité en quota, ok pour MVP).
 *
 * Pour la prod, considérer Mapbox / Google Directions / un OSRM self-hosted.
 */

export interface LatLng {
    latitude: number;
    longitude: number;
}

export interface RouteResult {
    /** Polyline complète à dessiner sur la carte (suite de coordonnées). */
    coordinates: LatLng[];
    /** Distance totale en mètres. */
    distanceMeters: number;
    /** Durée estimée en secondes. */
    durationSeconds: number;
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Récupère l'itinéraire routier entre deux points.
 * Retourne `null` en cas d'erreur réseau / pas de route trouvée.
 */
export async function fetchRoute(
    from: LatLng,
    to: LatLng,
): Promise<RouteResult | null> {
    const url = `${OSRM_BASE}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url, { method: "GET" });
        if (!res.ok) return null;
        const data = (await res.json()) as {
            routes?: Array<{
                geometry: { coordinates: [number, number][] };
                distance: number;
                duration: number;
            }>;
        };
        const r = data.routes?.[0];
        if (!r) return null;
        return {
            coordinates: r.geometry.coordinates.map(([lng, lat]) => ({
                latitude: lat,
                longitude: lng,
            })),
            distanceMeters: r.distance,
            durationSeconds: r.duration,
        };
    } catch {
        return null;
    }
}
