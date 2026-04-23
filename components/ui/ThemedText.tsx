import { StyleSheet, Text, TextProps, TextStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type Variate = keyof typeof styles;

type Props = TextProps & {
    variate?: Variate;
    color?: keyof typeof Colors["light"];
};

export default function ThemedText({
    variate = "body",
    color,
    style,
    ...rest
}: Props) {
    const colors = useThemeColors();
    const defaultColor = defaultColors[variate] ?? "textPrimary";
    return (
        <Text
            style={[
                styles[variate],
                { color: colors[color ?? defaultColor] },
                style,
            ]}
            {...rest}
        />
    );
}

const defaultColors: Partial<Record<Variate, keyof typeof Colors["light"]>> = {
    caps: "ink500",
    caption: "ink500",
    mono: "ink800",
    monoLg: "ink900",
    subtitle: "ink700",
};

const styles = StyleSheet.create<Record<string, TextStyle>>({
    /** Grands titres éditoriaux — Bricolage Grotesque Medium */
    display: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.huge,
        lineHeight: Typography.fontSize.huge * Typography.lineHeight.tight,
        letterSpacing: -0.8,
    },
    headline: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.xxxl,
        lineHeight: Typography.fontSize.xxxl * Typography.lineHeight.tight,
        letterSpacing: -0.5,
    },
    /** Titre d'écran mobile (22px Bricolage) */
    title: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.xxl,
        lineHeight: Typography.fontSize.xxl * Typography.lineHeight.tight,
        letterSpacing: Typography.letterSpacing.tight,
    },
    titleLg: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 28,
        lineHeight: 30,
        letterSpacing: -0.5,
    },
    /** Sous-titre (Manrope SemiBold) */
    subtitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.fontSize.lg * Typography.lineHeight.snug,
    },

    /** Corps standard (Manrope Regular) */
    body: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    },
    bodyMedium: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    },
    bodyStrong: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.normal,
    },
    bodyLg: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.md,
        lineHeight: Typography.fontSize.md * Typography.lineHeight.normal,
    },

    /** Caption — petits messages secondaires */
    caption: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
    },
    captionStrong: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
        lineHeight: Typography.fontSize.xs * Typography.lineHeight.normal,
    },
    /** Micro caps — labels uppercase de section (10px, tracking large) */
    caps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        lineHeight: Typography.fontSize.micro * Typography.lineHeight.snug,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },

    /** Monospace DM Mono — valeurs numériques (kg, F CFA, codes) */
    mono: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.snug,
    },
    monoMedium: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * Typography.lineHeight.snug,
    },
    monoLg: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.xl,
        lineHeight: Typography.fontSize.xl * Typography.lineHeight.snug,
    },

    // — Aliases de compatibilité avec l'ancienne API (ne plus utiliser) —
    subtitle1: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xl,
        lineHeight: 26,
    },
    subtitle2: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.lg,
        lineHeight: 24,
    },
    subtitle3: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
    },
    body1: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xl,
        lineHeight: 28,
    },
    body2: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.lg,
        lineHeight: 24,
    },
    body3: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.md,
        lineHeight: 22,
    },
});
