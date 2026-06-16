import { StyleSheet, Text, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export type OrderStatus =
    | "Créée"
    | "Collectée"
    | "Traitement"
    | "Prête"
    | "Livrée"
    | "Validée"
    | "En attente"
    | "En retard"
    | "Annulée"
    | "Active"
    | "Maintenance"
    | "HS"
    | "Payée"
    | "Impayée";

type Palette = typeof Colors["light"];
type ColorKey = keyof Palette;

/**
 * Mapping des statuts vers les clés de palette Colors.
 * [background, foreground]
 */
const STATUS_MAP: Record<OrderStatus, [ColorKey, ColorKey]> = {
    "Créée": ["ink100", "ink700"],
    "Collectée": ["brand100", "brand700"],
    "Traitement": ["brand100", "brand800"],
    "Prête": ["baobab100", "baobab700"],
    "Livrée": ["ok100", "ok700"],
    "Validée": ["ok100", "ok700"],
    "En attente": ["warn100", "warn700"],
    "En retard": ["danger100", "danger600"],
    "Annulée": ["ink100", "ink500"],
    "Active": ["ok100", "ok700"],
    "Maintenance": ["warn100", "warn700"],
    "HS": ["danger100", "danger600"],
    "Payée": ["ok100", "ok700"],
    "Impayée": ["danger100", "danger600"],
};

interface StatusBadgeProps {
    status: OrderStatus | string;
    style?: ViewStyle;
}

export default function StatusBadge({ status, style }: StatusBadgeProps) {
    const colors = useThemeColors();
    const [bgKey, fgKey] = STATUS_MAP[status as OrderStatus] ?? ["ink100", "ink700"];
    const bg = colors[bgKey];
    const fg = colors[fgKey];

    return (
        <View style={[styles.badge, { backgroundColor: bg }, style]}>
            <View style={[styles.dot, { backgroundColor: fg }]} />
            <Text style={[styles.label, { color: fg }]}>{status}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingVertical: 3,
        paddingHorizontal: 8,
        borderRadius: 999,
        alignSelf: "flex-start",
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 99,
    },
    label: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        lineHeight: Typography.fontSize.tiny * Typography.lineHeight.tight,
    },
});
