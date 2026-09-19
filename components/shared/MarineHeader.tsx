import { ReactNode } from "react";
import { StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Props {
    children: ReactNode;
    /** Rayon des coins arrondis en bas du bandeau (défaut: 28, comme la maquette). */
    radius?: number;
    /** Padding/marges propres à l'écran (le fond, le rayon et le clip restent ici). */
    style?: StyleProp<ViewStyle>;
}

/**
 * Bandeau marine arrondi utilisé en haut des écrans "profil-style" (Accueil,
 * Profil, Détail commande…). Toujours placé comme PREMIER ENFANT à
 * l'intérieur du ScrollView de l'écran — il défile avec le reste du
 * contenu. Dans la maquette, seule la liste "Mes commandes" a un en-tête
 * `position: sticky` ; tous les autres écrans défilent en un seul bloc, donc
 * ce composant ne doit JAMAIS être placé en dehors d'un ScrollView.
 *
 * `overflow: "hidden"` est indispensable pour que `borderBottomLeftRadius`/
 * `borderBottomRightRadius` se découpent correctement sur le fond — sans ça
 * le bloc marine s'affiche carré (bug déjà rencontré sur cet écran).
 */
export function MarineHeader({ children, radius = 28, style }: Props) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.header,
                {
                    backgroundColor: colors.brand900,
                    borderBottomLeftRadius: radius,
                    borderBottomRightRadius: radius,
                },
                style,
            ]}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    header: { overflow: "hidden" },
});
