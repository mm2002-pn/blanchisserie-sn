import { Alert, Linking, Platform } from "react-native";

/**
 * Ouvre l'app de navigation native (Apple Maps sur iOS, Google Maps sur Android)
 * avec un itinéraire vers les coordonnées fournies.
 *
 * - iOS : `maps://?daddr=lat,lng&dirflg=d` (Apple Maps)
 * - Android : `geo:0,0?q=lat,lng(label)` puis fallback Google Maps web
 */
export async function openMapsNavigation(
    lat: number,
    lng: number,
    label?: string,
): Promise<void> {
    const url =
        Platform.OS === "ios"
            ? `maps://?daddr=${lat},${lng}&dirflg=d`
            : `geo:0,0?q=${lat},${lng}${label ? `(${encodeURIComponent(label)})` : ""}`;

    try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
            await Linking.openURL(url);
            return;
        }
    } catch {
        // fallback ci-dessous
    }

    // Fallback universel : Google Maps web (ouvre l'app si installée)
    const fallback = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    try {
        await Linking.openURL(fallback);
    } catch {
        Alert.alert(
            "Navigation indisponible",
            "Impossible d'ouvrir l'application de cartes.",
        );
    }
}
