/**
 * B&C Teranga — Design tokens
 * Palette : marine (brand) · terracotta (terra) · vert (baobab, alias succès)
 * Neutres (paper/ink) · sémantiques ok/warn/danger
 *
 * Alignée sur le design system du back-office (tailwind.config.js).
 */

const lightPalette = {
    // Paper — fonds
    paper: "#FFFFFF",
    paper2: "#F1F3F7",
    paper3: "#EDEFF3",

    // Ink — texte, bordures (échelle marine/gris)
    ink50: "#FAFBFC",
    ink100: "#F1F3F7",
    ink200: "#EDEFF3", // bordures
    ink300: "#DDE2EA",
    ink400: "#AFBDD1",
    ink500: "#8B97A8", // captions
    ink600: "#4A5768",
    ink700: "#2E4066",
    ink800: "#17356B",
    ink900: "#0B1A2E", // titres

    // Brand — marine (identité principale)
    brand50: "#EDF1F7",
    brand100: "#D7E1F0",
    brand500: "#2C5A9E",
    brand600: "#1E3E70",
    brand700: "#17356B",
    brand800: "#0F2549",
    brand900: "#0B1A2E",

    // Terra — terracotta (accent secondaire, CTA)
    terra100: "#FCEBD9",
    terra600: "#DE6B0E",
    terra700: "#B3540A",

    // Baobab — alias succès (conservé pour compat)
    baobab100: "#E4F3E9",
    baobab600: "#2C7A4B",
    baobab700: "#215C38",

    // Sémantiques
    ok100: "#E4F3E9",
    ok600: "#2C7A4B",
    ok700: "#215C38",
    warn100: "#FCEBD9",
    warn600: "#F0A03D",
    warn700: "#B3540A",
    danger100: "#FBEAE5",
    danger600: "#C1441F",
};

const darkPalette = {
    paper: "#0B1220",
    paper2: "#111A2C",
    paper3: "#17233A",

    ink50: "#0B1220",
    ink100: "#111A2C",
    ink200: "#233150",
    ink300: "#334469",
    ink400: "#5C6E93",
    ink500: "#8B97A8",
    ink600: "#AFBDD1",
    ink700: "#C9D4E4",
    ink800: "#E4EAF3",
    ink900: "#F5F7FB",

    brand50: "#0F1B33",
    brand100: "#17284A",
    brand500: "#5C88CC",
    brand600: "#7DA3DE",
    brand700: "#9EBCE8",
    brand800: "#C1D3F0",
    brand900: "#E4ECFA",

    terra100: "#3A2410",
    terra600: "#F0A03D",
    terra700: "#F4B968",

    baobab100: "#16301F",
    baobab600: "#4FA871",
    baobab700: "#79C296",

    ok100: "#16301F",
    ok600: "#4FA871",
    ok700: "#79C296",
    warn100: "#3A2410",
    warn600: "#F0A03D",
    warn700: "#F4B968",
    danger100: "#3A1710",
    danger600: "#E06A45",
};

/**
 * Colors conserve aussi les alias historiques (`primary`, `background`, `textPrimary`, etc.)
 * pour ne pas casser les écrans existants pendant la migration.
 */
export const Colors = {
    light: {
        ...lightPalette,

        // Aliases historiques — pointent vers la nouvelle palette
        primary: lightPalette.brand800,
        primaryDark: lightPalette.brand900,
        secondary: lightPalette.terra600,
        background: lightPalette.paper2,
        surface: lightPalette.paper,

        textPrimary: lightPalette.ink900,
        textSecondary: lightPalette.ink500,
        textDisabled: lightPalette.ink400,

        success: lightPalette.ok600,
        warning: lightPalette.warn600,
        error: lightPalette.danger600,
        info: lightPalette.brand500,

        border: lightPalette.ink200,
        divider: lightPalette.ink200,

        card: lightPalette.paper,
        shadow: "#00000010",

        hotelPrimary: lightPalette.brand800,
        driverPrimary: lightPalette.baobab600,
        supervisorPrimary: lightPalette.terra600,
    },

    dark: {
        ...darkPalette,

        primary: darkPalette.brand700,
        primaryDark: darkPalette.brand800,
        secondary: darkPalette.terra600,
        background: darkPalette.paper,
        surface: darkPalette.paper2,

        textPrimary: darkPalette.ink900,
        textSecondary: darkPalette.ink600,
        textDisabled: darkPalette.ink400,

        success: darkPalette.ok600,
        warning: darkPalette.warn600,
        error: darkPalette.danger600,
        info: darkPalette.brand500,

        border: darkPalette.ink200,
        divider: darkPalette.ink200,

        card: darkPalette.paper2,
        shadow: "#00000080",

        hotelPrimary: darkPalette.brand700,
        driverPrimary: darkPalette.baobab600,
        supervisorPrimary: darkPalette.terra600,
    },
};
