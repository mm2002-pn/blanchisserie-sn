import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableOpacityProps,
    View,
} from "react-native";
import { FontFamily, Typography } from "@/constants/Typography";
import { Spacing } from "@/constants/Spacing";
import { useThemeColors } from "@/hooks/useThemeColors";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "small" | "medium" | "large";

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    /** `outline` est un alias de `secondary` (rétro-compat — à retirer écran par écran). */
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    icon?: React.ReactNode;
    iconRight?: React.ReactNode;
    fullWidth?: boolean;
}

/**
 * Bouton Blanchisserie SN.
 * - primary  → brand-800, texte paper
 * - secondary → paper + bordure ink-300 (outline neutre)
 * - ghost    → transparent, texte brand-700
 * - danger   → danger-100 + texte danger-600
 */
export default function Button({
    title,
    variant = "primary",
    size = "medium",
    loading = false,
    disabled,
    icon,
    iconRight,
    fullWidth,
    style,
    ...rest
}: ButtonProps) {
    const colors = useThemeColors();
    const resolvedVariant: Exclude<Variant, "outline"> =
        variant === "outline" ? "secondary" : variant;

    const bg: Record<Exclude<Variant, "outline">, string> = {
        primary: colors.brand800,
        secondary: colors.paper,
        ghost: "transparent",
        danger: colors.danger100,
    };
    const fg: Record<Exclude<Variant, "outline">, string> = {
        primary: colors.paper,
        secondary: colors.ink800,
        ghost: colors.brand700,
        danger: colors.danger600,
    };
    const hasBorder = resolvedVariant === "secondary";

    return (
        <TouchableOpacity
            activeOpacity={0.85}
            style={[
                styles.base,
                styles[size],
                {
                    backgroundColor: bg[resolvedVariant],
                    borderWidth: hasBorder ? StyleSheet.hairlineWidth : 0,
                    borderColor: hasBorder ? colors.ink300 : undefined,
                },
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color={fg[resolvedVariant]} size="small" />
            ) : (
                <View style={styles.content}>
                    {icon}
                    <Text
                        style={[
                            styles.text,
                            styles[`text_${size}` as const],
                            { color: fg[resolvedVariant] },
                        ]}
                    >
                        {title}
                    </Text>
                    {iconRight}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    base: {
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
    },
    content: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.gap.sm,
    },
    small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    medium: {
        paddingVertical: 11,
        paddingHorizontal: Spacing.lg,
    },
    large: {
        paddingVertical: Spacing.md + 2,
        paddingHorizontal: Spacing.xl,
    },
    text: {
        fontFamily: FontFamily.uiSemibold,
    },
    text_small: {
        fontSize: Typography.fontSize.xs,
    },
    text_medium: {
        fontSize: Typography.fontSize.sm,
    },
    text_large: {
        fontSize: Typography.fontSize.md,
    },
    fullWidth: {
        alignSelf: "stretch",
    },
    disabled: {
        opacity: 0.5,
    },
});
