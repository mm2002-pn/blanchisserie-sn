import React from 'react';
import {
    TouchableOpacity,
    Text,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacityProps,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'small' | 'medium' | 'large';
    loading?: boolean;
    icon?: React.ReactNode;
}

export default function Button({
    title,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled,
    icon,
    style,
    ...rest
}: ButtonProps) {
    const colors = useThemeColors();

    const getButtonStyle = () => {
        const baseStyle = [styles.button, styles[size]];

        if (variant === 'primary') {
            return [...baseStyle, { backgroundColor: colors.primary }];
        } else if (variant === 'secondary') {
            return [...baseStyle, { backgroundColor: colors.secondary }];
        } else {
            return [
                ...baseStyle,
                {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.primary,
                },
            ];
        }
    };

    const getTextStyle = () => {
        if (variant === 'outline') {
            return { color: colors.primary };
        }
        return { color: '#FFFFFF' };
    };

    return (
        <TouchableOpacity
            style={[getButtonStyle(), disabled && styles.disabled, style]}
            disabled={disabled || loading}
            {...rest}
        >
            {loading ? (
                <ActivityIndicator color="#FFFFFF" />
            ) : (
                <>
                    {icon && icon}
                    <Text style={[styles.text, getTextStyle()]}>{title}</Text>
                </>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: Spacing.borderRadius.lg,
        gap: Spacing.gap.sm,
    },
    small: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    medium: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
    },
    large: {
        paddingVertical: Spacing.lg,
        paddingHorizontal: Spacing.xxl,
    },
    text: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    disabled: {
        opacity: 0.5,
    },
});
