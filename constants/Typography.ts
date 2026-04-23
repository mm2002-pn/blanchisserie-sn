export const Typography = {
    // Sizes
    fontSize: {
        xs: 12,
        sm: 14,
        md: 16,
        lg: 18,
        xl: 20,
        xxl: 24,
        xxxl: 32,
    },

    // Weights
    fontWeight: {
        regular: "400" as const,
        medium: "500" as const,
        semibold: "600" as const,
        bold: "700" as const,
    },

    // Line heights
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },

    // Letter spacing
    letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
    },
};
