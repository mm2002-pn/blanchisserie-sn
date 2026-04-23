import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import DrawerMenu from '@/components/shared/DrawerMenu';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// Mock data
const ROUTE_DATA = {
    date: new Date().toLocaleDateString('fr-FR'),
    vehicule: 'Camion #12 - AB-1234-CD',
    capaciteUtilisee: 45,
    capaciteMax: 100,
    clientsTotal: 8,
    clientsVisites: 3,
};

const CLIENTS = [
    {
        id: '1',
        nom: 'Hôtel Teranga',
        adresse: 'Almadies, Route de Ngor',
        type: 'collecte',
        statut: 'completed',
        distance: '2.3 km',
        heure: '08:00',
        volume: 'M - 15kg',
    },
    {
        id: '2',
        nom: 'Radisson Blu',
        adresse: 'Route de la Corniche Ouest',
        type: 'livraison',
        statut: 'completed',
        distance: '3.1 km',
        heure: '09:30',
        volume: 'L - 28kg',
    },
    {
        id: '3',
        nom: 'Pullman Dakar Teranga',
        adresse: 'Place de l\'Indépendance',
        type: 'collecte',
        statut: 'completed',
        distance: '1.8 km',
        heure: '10:45',
        volume: 'S - 8kg',
    },
    {
        id: '4',
        nom: 'King Fahd Palace',
        adresse: 'Route de la Corniche Ouest',
        type: 'collecte',
        statut: 'current',
        distance: '0.5 km',
        heure: '11:30',
        volume: 'XL - 45kg',
    },
    {
        id: '5',
        nom: 'Hôtel Djoloff',
        adresse: 'Avenue Cheikh Anta Diop',
        type: 'livraison',
        statut: 'pending',
        distance: '4.2 km',
        heure: '13:00',
        volume: 'M - 18kg',
    },
];

export default function DriverRouteScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case 'completed':
                return '#22C55E';
            case 'current':
                return colors.driverPrimary;
            case 'pending':
                return '#9CA3AF';
            default:
                return '#9CA3AF';
        }
    };

    const getStatusLabel = (statut: string) => {
        switch (statut) {
            case 'completed':
                return 'Terminé';
            case 'current':
                return 'En cours';
            case 'pending':
                return 'À venir';
            default:
                return statut;
        }
    };

    const currentClient = CLIENTS.find(c => c.statut === 'current');

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setDrawerVisible(true)}
                    style={styles.iconButton}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <ThemedText variate="headline" color="textPrimary">
                    Ma Tournée
                </ThemedText>
                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={() => router.push('/(driver)/navigation')}
                >
                    <Text style={styles.iconText}>🗺️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                {/* Stats Card */}
                <Card style={styles.statsCard}>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>🚚</Text>
                            <ThemedText variate="caption" color="textSecondary">
                                Véhicule
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {ROUTE_DATA.vehicule}
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>📦</Text>
                            <ThemedText variate="subtitle3" color="textPrimary">
                                {ROUTE_DATA.capaciteUtilisee}kg / {ROUTE_DATA.capaciteMax}kg
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Capacité utilisée
                            </ThemedText>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statIcon}>✓</Text>
                            <ThemedText variate="subtitle3" color="textPrimary">
                                {ROUTE_DATA.clientsVisites} / {ROUTE_DATA.clientsTotal}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Clients visités
                            </ThemedText>
                        </View>
                    </View>
                    <View style={styles.progressBar}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${(ROUTE_DATA.clientsVisites / ROUTE_DATA.clientsTotal) * 100}%`,
                                    backgroundColor: colors.driverPrimary,
                                },
                            ]}
                        />
                    </View>
                </Card>

                {/* Current Client Card */}
                {currentClient && (
                    <Card style={[styles.currentCard, { backgroundColor: colors.driverPrimary + '10' }]}>
                        <View style={styles.currentHeader}>
                            <Text style={styles.currentIcon}>🎯</Text>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Prochain client
                            </ThemedText>
                        </View>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.currentName}>
                            {currentClient.nom}
                        </ThemedText>
                        <View style={styles.currentMeta}>
                            <View style={styles.currentMetaItem}>
                                <Text style={styles.metaIcon}>📍</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {currentClient.distance} • {currentClient.heure}
                                </ThemedText>
                            </View>
                            <View style={styles.currentMetaItem}>
                                <Text style={styles.metaIcon}>📦</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {currentClient.volume}
                                </ThemedText>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.startButton, { backgroundColor: colors.driverPrimary }]}
                            onPress={() => {
                                if (currentClient.type === 'collecte') {
                                    router.push('/(driver)/collect');
                                } else {
                                    router.push('/(driver)/delivery');
                                }
                            }}
                        >
                            <Text style={styles.startButtonText}>
                                {currentClient.type === 'collecte' ? '📦 Commencer la collecte' : '✅ Commencer la livraison'}
                            </Text>
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Clients List */}
                <View style={styles.listSection}>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Liste des clients ({CLIENTS.length})
                    </ThemedText>
                    {CLIENTS.map((client, index) => (
                        <TouchableOpacity
                            key={client.id}
                            style={[
                                styles.clientCard,
                                client.statut === 'current' && {
                                    borderColor: colors.driverPrimary,
                                    borderWidth: 2,
                                },
                            ]}
                        >
                            <View style={styles.clientCardLeft}>
                                <View
                                    style={[
                                        styles.clientNumber,
                                        { backgroundColor: getStatusColor(client.statut) + '20' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.clientNumberText,
                                            { color: getStatusColor(client.statut) },
                                        ]}
                                    >
                                        {index + 1}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="subtitle3" color="textPrimary">
                                        {client.nom}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {client.adresse}
                                    </ThemedText>
                                    <View style={styles.clientMeta}>
                                        <Text style={styles.metaIcon}>🕐</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {client.heure}
                                        </ThemedText>
                                        <Text style={[styles.metaIcon, { marginLeft: Spacing.sm }]}>📍</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {client.distance}
                                        </ThemedText>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.clientCardRight}>
                                <View
                                    style={[
                                        styles.typeBadge,
                                        {
                                            backgroundColor:
                                                client.type === 'collecte' ? '#3B82F620' : '#10B98120',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.typeBadgeText,
                                            {
                                                color: client.type === 'collecte' ? '#3B82F6' : '#10B981',
                                            },
                                        ]}
                                    >
                                        {client.type === 'collecte' ? '📦' : '✅'}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(client.statut) + '20' },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: getStatusColor(client.statut) },
                                        ]}
                                    >
                                        {getStatusLabel(client.statut)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>

            <DrawerMenu visible={drawerVisible} onClose={() => setDrawerVisible(false)} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.padding.screen,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuIcon: {
        fontSize: 28,
        color: '#374151',
    },
    iconText: {
        fontSize: 24,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    statsCard: {
        marginBottom: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    currentCard: {
        marginBottom: Spacing.lg,
    },
    currentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    currentIcon: {
        fontSize: 24,
    },
    currentName: {
        marginBottom: Spacing.sm,
    },
    currentMeta: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    currentMetaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    metaIcon: {
        fontSize: 14,
    },
    startButton: {
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    listSection: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    clientCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFFFFF',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    clientCardLeft: {
        flex: 1,
        flexDirection: 'row',
        gap: Spacing.md,
    },
    clientNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    clientNumberText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
    },
    clientMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    clientCardRight: {
        alignItems: 'flex-end',
        gap: Spacing.xs,
    },
    typeBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    typeBadgeText: {
        fontSize: 16,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.sm,
    },
    statusText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
});
