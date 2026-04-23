import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
    ViewStyle,
} from "react-native";
import { FontFamily, Typography } from "@/constants/Typography";
import { Spacing } from "@/constants/Spacing";
import { useThemeColors } from "@/hooks/useThemeColors";

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: ViewStyle;
}

export default function Input({
    label,
    error,
    leftIcon,
    rightIcon,
    containerStyle,
    style,
    secureTextEntry,
    ...rest
}: InputProps) {
    const colors = useThemeColors();
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    const togglePasswordVisibility = () => setIsPasswordVisible((v) => !v);

    const borderColor = error
        ? colors.danger600
        : isFocused
        ? colors.brand800
        : colors.ink300;

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.ink600 }]}>
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.paper,
                        borderColor,
                        borderWidth: isFocused && !error ? 1.5 : StyleSheet.hairlineWidth,
                    },
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[styles.input, { color: colors.ink800 }, style]}
                    placeholderTextColor={colors.ink400}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...rest}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.rightIcon}
                        hitSlop={8}
                    >
                        <Text style={{ color: colors.ink500, fontSize: 16 }}>
                            {isPasswordVisible ? "👁" : "👁‍🗨"}
                        </Text>
                    </TouchableOpacity>
                )}

                {!secureTextEntry && rightIcon && (
                    <View style={styles.rightIcon}>{rightIcon}</View>
                )}
            </View>

            {error && (
                <Text style={[styles.error, { color: colors.danger600 }]}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 6,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 10,
        paddingHorizontal: 14,
    },
    input: {
        flex: 1,
        paddingVertical: 12,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    leftIcon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
        padding: Spacing.xs,
    },
    error: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
});
