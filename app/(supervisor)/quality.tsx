import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function QualityScreen() {
    const colors = useThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    ✅ Contrôle Qualité
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Suivi et validation de la qualité du linge
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
    },
});
