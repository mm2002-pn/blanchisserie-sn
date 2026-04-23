import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { Spacing } from "@/constants/Spacing";
import { useThemeColors } from "@/hooks/useThemeColors";

interface CardProps extends ViewProps {
    children: React.ReactNode;
    padding?: number;
    /** Utilisé uniquement pour les cartes d'action (CTA) — sinon conserver le style bordure */
    elevated?: boolean;
}

/**
 * Card Blanchisserie SN — fond paper, bordure 0.5px, radius 14.
 * Pas d'ombre par défaut : le mockup privilégie la bordure fine sur l'ombre portée.
 */
export default function Card({
    children,
    padding = Spacing.padding.card,
    elevated = false,
    style,
    ...rest
}: CardProps) {
    const colors = useThemeColors();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    padding,
                },
                elevated && styles.elevated,
                style,
            ]}
            {...rest}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    elevated: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 2,
    },
});
