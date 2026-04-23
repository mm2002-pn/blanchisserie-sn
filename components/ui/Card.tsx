import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Spacing } from '@/constants/Spacing';
import { Shadows } from '@/constants/Shadows';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    padding?: number;
    shadow?: boolean;
}

export default function Card({
    children,
    padding = Spacing.padding.card,
    shadow = true,
    style,
    ...rest
}: CardProps) {
    const colors = useThemeColors();

    return (
        <View
            style={[
                styles.card,
                {
                    backgroundColor: colors.card,
                    padding,
                },
                shadow && Shadows.dp3,
                style,
            ]}
            {...rest}
        >
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        borderRadius: Spacing.borderRadius.lg,
    },
});
