import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function Index() {
    const { isAuthenticated, isLoading, user } = useAuth();
    const colors = useThemeColors();

    if (isLoading) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    if (!isAuthenticated) {
        return <Redirect href="/(auth)/sign-in" />;
    }

    // Redirect based on user role
    if (user?.role === 'hotel') {
        return <Redirect href="/(hotel)/dashboard" />;
    } else if (user?.role === 'driver') {
        return <Redirect href="/(driver)/route" />;
    } else if (user?.role === 'supervisor') {
        return <Redirect href="/(supervisor)/production" />;
    }

    // Fallback
    return <Redirect href="/(auth)/sign-in" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
