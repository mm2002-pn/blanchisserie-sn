/**
 * Blanchisserie SN — Design tokens
 * Palette : bleu boubou (brand) · terre de Casamance (terra) · vert baobab (baobab)
 * Neutres chauds (paper/ink) · sémantiques ok/warn/danger
 *
 * Valeurs converties depuis OKLCH (cf. `docs/design.md`) vers hex pour React Native.
 */

const lightPalette = {
    // Paper — fonds chauds
    paper: "#FCFBF9",
    paper2: "#F6F4F0",
    paper3: "#F1EEE9",

    // Ink — texte, bordures
    ink50: "#FDFCFB",
    ink100: "#F2EFEB",
    ink200: "#E4E0DA", // bordures 0.5px
    ink300: "#CDC8BF",
    ink400: "#A39E93",
    ink500: "#807A6F", // captions
    ink600: "#5E584F",
    ink700: "#423D35",
    ink800: "#2A2620",
    ink900: "#1A1712", // titres

    // Brand — bleu boubou (hue 244)
    brand50: "#F1F3FA",
    brand100: "#DDE2F0",
    brand500: "#6A80CC",
    brand600: "#4A62BC",
    brand700: "#394E9A",
    brand800: "#2C3C79",
    brand900: "#1D2853",

    // Terra — terre de Casamance (hue 38)
    terra100: "#F5E4D7",
    terra600: "#CF7B4B",
    terra700: "#AA5B2A",

    // Baobab — vert baobab (hue 135)
    baobab100: "#E0EEDB",
    baobab600: "#629853",
    baobab700: "#4A7A3E",

    // Sémantiques
    ok100: "#DCEEE1",
    ok600: "#53A47C",
    ok700: "#3A825E",
    warn100: "#F6EAD0",
    warn600: "#CA9A36",
    warn700: "#92671D",
    danger100: "#F6E0DA",
    danger600: "#C3452B",
};

const darkPalette = {
    paper: "#161719",
    paper2: "#1D1E20",
    paper3: "#242527",

    ink50: "#151619",
    ink100: "#1B1D1F",
    ink200: "#2A2C2F",
    ink300: "#3A3C3F",
    ink400: "#555759",
    ink500: "#6E7073",
    ink600: "#8B8D8F",
    ink700: "#A8AAAC",
    ink800: "#C7C8CA",
    ink900: "#F1F1F2",

    brand50: "#1E2442",
    brand100: "#2A3158",
    brand500: "#8C9EE1",
    brand600: "#A0B1E8",
    brand700: "#B3C1EC",
    brand800: "#C7D2F0",
    brand900: "#DCE4F4",

    terra100: "#3A241A",
    terra600: "#D4916A",
    terra700: "#E0A583",

    baobab100: "#223324",
    baobab600: "#7EB36F",
    baobab700: "#94C28B",

    ok100: "#1F3829",
    ok600: "#70B998",
    ok700: "#8CCCAE",
    warn100: "#3A2E14",
    warn600: "#DCAF57",
    warn700: "#E6C281",
    danger100: "#3A1F17",
    danger600: "#DB644C",
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
        secondary: lightPalette.baobab600,
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
        secondary: darkPalette.baobab600,
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
