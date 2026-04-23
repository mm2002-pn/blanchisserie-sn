import React, { useState } from 'react';
import {
    View,
    TextInput,
    Text,
    StyleSheet,
    TextInputProps,
    TouchableOpacity,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    containerStyle?: any;
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

    const togglePasswordVisibility = () => {
        setIsPasswordVisible(!isPasswordVisible);
    };

    return (
        <View style={[styles.container, containerStyle]}>
            {label && (
                <Text style={[styles.label, { color: colors.textPrimary }]}>
                    {label}
                </Text>
            )}

            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: colors.surface,
                        borderColor: error
                            ? colors.error
                            : isFocused
                            ? colors.primary
                            : colors.border,
                    },
                ]}
            >
                {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

                <TextInput
                    style={[
                        styles.input,
                        { color: colors.textPrimary },
                        style,
                    ]}
                    placeholderTextColor={colors.textDisabled}
                    secureTextEntry={secureTextEntry && !isPasswordVisible}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...rest}
                />

                {secureTextEntry && (
                    <TouchableOpacity
                        onPress={togglePasswordVisibility}
                        style={styles.rightIcon}
                    >
                        <Text style={{ color: colors.textSecondary }}>
                            {isPasswordVisible ? '👁️' : '👁️‍🗨️'}
                        </Text>
                    </TouchableOpacity>
                )}

                {!secureTextEntry && rightIcon && (
                    <View style={styles.rightIcon}>{rightIcon}</View>
                )}
            </View>

            {error && (
                <Text style={[styles.error, { color: colors.error }]}>
                    {error}
                </Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: Spacing.md,
    },
    label: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
        marginBottom: Spacing.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.lg,
        paddingHorizontal: Spacing.md,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        fontSize: Typography.fontSize.md,
    },
    leftIcon: {
        marginRight: Spacing.sm,
    },
    rightIcon: {
        marginLeft: Spacing.sm,
        padding: Spacing.xs,
    },
    error: {
        fontSize: Typography.fontSize.xs,
        marginTop: Spacing.xs,
    },
});
