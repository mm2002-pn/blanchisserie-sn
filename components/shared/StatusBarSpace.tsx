import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Bande colorée de la hauteur de la status bar système.
 *
 * Le SafeAreaView de `react-native-safe-area-context` colore TOUTE la zone
 * (status bar incluse) avec sa propre couleur. Quand le top bar de la page
 * a une couleur différente du fond de page, on voit une bande gris/blanc
 * disgracieuse au-dessus du top bar.
 *
 * Pattern recommandé : remplacer `<SafeAreaView edges={["top"]}>` par un
 * `<View>` racine + `<StatusBarSpace color={topBarColor} />` au début. La
 * bande du dessus prend alors la même couleur que le top bar, transition
 * invisible.
 *
 * Sur iOS, `insets.top` ≈ 47px (encoche) ou 20px (Touch ID).
 * Sur Android edge-to-edge, ≈ 24px (selon device).
 */
export function StatusBarSpace({ color }: { color: string }) {
    const insets = useSafeAreaInsets();
    return <View style={{ height: insets.top, backgroundColor: color }} />;
}
