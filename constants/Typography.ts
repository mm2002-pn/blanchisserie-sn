/**
 * B&C Teranga — Typographie
 * Titres / UI  · Outfit
 * Corps de texte · Source Sans 3
 * Numériques (kg, XOF) · Outfit (tabular-nums)
 *
 * Les polices sont chargées via `useFonts` dans `app/_layout.tsx`.
 * Les noms de clés ci-dessous sont conservés (serif, ui, mono) pour ne pas
 * casser les écrans existants — ils pointent désormais vers Outfit/Source Sans 3.
 * Les variantes avec poids sont nommées directement — ne PAS cumuler avec `fontWeight` sur RN.
 */

export const FontFamily = {
    serifRegular: "Outfit_400Regular",
    serifMedium: "Outfit_500Medium",
    serifSemibold: "Outfit_600SemiBold",

    uiRegular: "SourceSans3_400Regular",
    uiMedium: "SourceSans3_500Medium",
    uiSemibold: "SourceSans3_600SemiBold",
    uiBold: "Outfit_700Bold",

    monoRegular: "Outfit_400Regular",
    monoMedium: "Outfit_500Medium",
} as const;

export const Typography = {
    fontFamily: FontFamily,

    fontSize: {
        micro: 10, // labels uppercase caps
        tiny: 11, // badges
        xs: 12,
        sm: 13, // corps mockup
        md: 14,
        base: 15,
        lg: 16,
        xl: 18,
        xxl: 22, // titres mobile
        xxxl: 28,
        display: 36,
        huge: 52,
    },

    fontWeight: {
        regular: "400" as const,
        medium: "500" as const,
        semibold: "600" as const,
        bold: "700" as const,
    },

    lineHeight: {
        tight: 1.1,
        snug: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    letterSpacing: {
        tight: -0.3,
        normal: 0,
        wide: 0.8, // uppercase caps labels (0.08em ≈ 0.8px à 10px)
    },
};
