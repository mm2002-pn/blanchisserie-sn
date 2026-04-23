import { Colors } from "@/constants/Colors";
import { useThemeColors } from "@/hooks/useThemeColors";
import { StyleSheet, Text, TextProps } from "react-native";

type Variate = keyof typeof styles;

type Props = TextProps & {
    variate?: Variate;
    color?: keyof typeof Colors["light"];
};

export default function ThemedText({ variate = "body3", color, style, ...rest }: Props) {
    const colors = useThemeColors();
    return (
        <Text
            style={[styles[variate], style, { color: colors[color ?? "textPrimary"] }]}
            {...rest}
        />
    );
}

const styles = StyleSheet.create({
    headline: {
        fontSize: 24,
        fontWeight: "700",
        lineHeight: 32,
        letterSpacing: 0.5,
        color: "#212121",
    },
    subtitle1: {
        fontSize: 18,
        fontWeight: "600",
        lineHeight: 26,
        letterSpacing: 0.25,
        color: "#333333",
    },
    subtitle2: {
        fontSize: 16,
        fontWeight: "500",
        lineHeight: 24,
        letterSpacing: 0.15,
        color: "#444444",
    },
    subtitle3: {
        fontSize: 14,
        fontWeight: "500",
        lineHeight: 22,
        letterSpacing: 0.1,
        color: "#555555",
    },
    body3: {
        fontSize: 14,
        fontWeight: "400",
        lineHeight: 22,
        letterSpacing: 0.25,
        color: "#666666",
    },
    body2: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 24,
        letterSpacing: 0.5,
        color: "#777777",
    },
    body1: {
        fontSize: 18,
        fontWeight: "400",
        lineHeight: 28,
        letterSpacing: 0.5,
        color: "#888888",
    },
    caption: {
        fontSize: 12,
        fontWeight: "400",
        lineHeight: 16,
        letterSpacing: 0.4,
        color: "#777777",
    },
});
