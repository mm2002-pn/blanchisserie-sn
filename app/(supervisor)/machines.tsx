import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function MachinesScreen() {
    const colors = useThemeColors();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.content}>
                <Text style={[styles.title, { color: colors.text }]}>
                    ⚙️ Gestion des Machines
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Contrôle et suivi des machines de production
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
