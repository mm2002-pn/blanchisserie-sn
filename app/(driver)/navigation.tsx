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
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

type RouteStop = {
    id: string;
    name: string;
    address: string;
    distance: string;
    estimatedTime: string;
    status: 'completed' | 'current' | 'upcoming';
    type: 'collecte' | 'livraison';
};

export default function NavigationScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [routeOptimized, setRouteOptimized] = useState(true);
    const [trafficEnabled, setTrafficEnabled] = useState(true);

    const routeStops: RouteStop[] = [
        {
            id: '1',
            name: 'King Fahd Palace',
            address: 'Route de la Corniche Ouest',
            distance: '0.5 km',
            estimatedTime: '2 min',
            status: 'current',
            type: 'collecte',
        },
        {
            id: '2',
            name: 'Hôtel Djoloff',
            address: 'Avenue Cheikh Anta Diop',
            distance: '4.2 km',
            estimatedTime: '12 min',
            status: 'upcoming',
            type: 'livraison',
        },
        {
            id: '3',
            name: 'Radisson Blu',
            address: 'Route de la Corniche Ouest',
            distance: '6.8 km',
            estimatedTime: '18 min',
            status: 'upcoming',
            type: 'collecte',
        },
    ];

    const currentStop = routeStops.find(stop => stop.status === 'current');
    const totalDistance = '24.5 km';
    const totalTime = '1h 15min';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backButton}
                >
                    <Text style={styles.backIcon}>←</Text>
                </TouchableOpacity>
                <ThemedText variate="headline" color="textPrimary">
                    Navigation
                </ThemedText>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                {/* Map Placeholder */}
                <Card style={styles.mapCard}>
                    <View style={styles.mapPlaceholder}>
                        <Text style={styles.mapIcon}>🗺️</Text>
                        <ThemedText variate="subtitle2" color="textSecondary">
                            Carte interactive
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                            La carte GPS s'affichera ici{'\n'}(Leaflet.js à intégrer)
                        </ThemedText>
                    </View>

                    {/* Map Controls */}
                    <View style={styles.mapControls}>
                        <TouchableOpacity style={styles.controlButton}>
                            <Text style={styles.controlIcon}>📍</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}>
                            <Text style={styles.controlIcon}>➕</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.controlButton}>
                            <Text style={styles.controlIcon}>➖</Text>
                        </TouchableOpacity>
                    </View>
                </Card>

                {/* Current Destination */}
                {currentStop && (
                    <Card style={[styles.currentCard, { backgroundColor: colors.driverPrimary + '10' }]}>
                        <View style={styles.currentHeader}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.currentBadge}>
                                    <Text style={styles.currentBadgeIcon}>🎯</Text>
                                    <ThemedText variate="caption" style={{ color: colors.driverPrimary }}>
                                        Prochaine destination
                                    </ThemedText>
                                </View>
                                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginTop: Spacing.xs }}>
                                    {currentStop.name}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    {currentStop.address}
                                </ThemedText>
                            </View>
                        </View>

                        <View style={styles.currentStats}>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>📍</Text>
                                <ThemedText variate="subtitle3" color="textPrimary">
                                    {currentStop.distance}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Distance
                                </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>🕐</Text>
                                <ThemedText variate="subtitle3" color="textPrimary">
                                    {currentStop.estimatedTime}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Temps estimé
                                </ThemedText>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statIcon}>🚗</Text>
                                <ThemedText variate="subtitle3" color="textPrimary">
                                    Normal
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Trafic
                                </ThemedText>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.navigationButton, { backgroundColor: colors.driverPrimary }]}
                        >
                            <Text style={styles.navigationButtonText}>🧭 Démarrer la navigation</Text>
                        </TouchableOpacity>
                    </Card>
                )}

                {/* Route Options */}
                <Card style={styles.optionsCard}>
                    <ThemedText variate="subtitle2" color="textPrimary" style={{ marginBottom: Spacing.md }}>
                        Options de route
                    </ThemedText>

                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setRouteOptimized(!routeOptimized)}
                    >
                        <View style={styles.optionLeft}>
                            <Text style={styles.optionIcon}>🎯</Text>
                            <View>
                                <ThemedText variate="body3" color="textPrimary">
                                    Route optimisée
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Trajet le plus rapide
                                </ThemedText>
                            </View>
                        </View>
                        <View
                            style={[
                                styles.toggle,
                                routeOptimized && { backgroundColor: colors.driverPrimary },
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleDot,
                                    routeOptimized && styles.toggleDotActive,
                                ]}
                            />
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.optionRow}
                        onPress={() => setTrafficEnabled(!trafficEnabled)}
                    >
                        <View style={styles.optionLeft}>
                            <Text style={styles.optionIcon}>🚦</Text>
                            <View>
                                <ThemedText variate="body3" color="textPrimary">
                                    Trafic en temps réel
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Éviter les embouteillages
                                </ThemedText>
                            </View>
                        </View>
                        <View
                            style={[
                                styles.toggle,
                                trafficEnabled && { backgroundColor: colors.driverPrimary },
                            ]}
                        >
                            <View
                                style={[
                                    styles.toggleDot,
                                    trafficEnabled && styles.toggleDotActive,
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                </Card>

                {/* Route Overview */}
                <Card style={styles.routeCard}>
                    <View style={styles.routeHeader}>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Aperçu de la tournée
                        </ThemedText>
                        <View style={styles.routeStats}>
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatIcon}>📍</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {totalDistance}
                                </ThemedText>
                            </View>
                            <View style={styles.routeStat}>
                                <Text style={styles.routeStatIcon}>🕐</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {totalTime}
                                </ThemedText>
                            </View>
                        </View>
                    </View>

                    <View style={styles.stopsContainer}>
                        {routeStops.map((stop, index) => (
                            <View key={stop.id} style={styles.stopItem}>
                                <View style={styles.stopTimeline}>
                                    <View
                                        style={[
                                            styles.stopDot,
                                            {
                                                backgroundColor:
                                                    stop.status === 'completed'
                                                        ? '#22C55E'
                                                        : stop.status === 'current'
                                                        ? colors.driverPrimary
                                                        : '#D1D5DB',
                                            },
                                        ]}
                                    >
                                        {stop.status === 'completed' && (
                                            <Text style={styles.stopCheckIcon}>✓</Text>
                                        )}
                                    </View>
                                    {index < routeStops.length - 1 && (
                                        <View style={styles.stopLine} />
                                    )}
                                </View>

                                <View style={styles.stopContent}>
                                    <View style={styles.stopInfo}>
                                        <ThemedText variate="subtitle3" color="textPrimary">
                                            {stop.name}
                                        </ThemedText>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {stop.address}
                                        </ThemedText>
                                        <View style={styles.stopMeta}>
                                            <View
                                                style={[
                                                    styles.typeBadge,
                                                    {
                                                        backgroundColor:
                                                            stop.type === 'collecte'
                                                                ? '#3B82F620'
                                                                : '#10B98120',
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.typeBadgeText,
                                                        {
                                                            color:
                                                                stop.type === 'collecte'
                                                                    ? '#3B82F6'
                                                                    : '#10B981',
                                                        },
                                                    ]}
                                                >
                                                    {stop.type === 'collecte' ? '📦 Collecte' : '✅ Livraison'}
                                                </Text>
                                            </View>
                                            <ThemedText variate="caption" color="textSecondary">
                                                {stop.distance} • {stop.estimatedTime}
                                            </ThemedText>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Text style={styles.quickActionIcon}>📞</Text>
                        <ThemedText variate="caption" color="textSecondary">
                            Appeler
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Text style={styles.quickActionIcon}>⚠️</Text>
                        <ThemedText variate="caption" color="textSecondary">
                            Incident
                        </ThemedText>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.quickActionButton}>
                        <Text style={styles.quickActionIcon}>⏸️</Text>
                        <ThemedText variate="caption" color="textSecondary">
                            Pause
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </ScrollView>
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
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 28,
        color: '#374151',
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 24,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    mapCard: {
        marginBottom: Spacing.lg,
        padding: 0,
        overflow: 'hidden',
    },
    mapPlaceholder: {
        height: 300,
        backgroundColor: '#E5E7EB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mapIcon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    mapControls: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        gap: Spacing.xs,
    },
    controlButton: {
        width: 40,
        height: 40,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    controlIcon: {
        fontSize: 20,
    },
    currentCard: {
        marginBottom: Spacing.lg,
    },
    currentHeader: {
        flexDirection: 'row',
        marginBottom: Spacing.md,
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    currentBadgeIcon: {
        fontSize: 16,
    },
    currentStats: {
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
    navigationButton: {
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    navigationButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    optionsCard: {
        marginBottom: Spacing.lg,
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    optionLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        flex: 1,
    },
    optionIcon: {
        fontSize: 24,
    },
    toggle: {
        width: 50,
        height: 28,
        backgroundColor: '#D1D5DB',
        borderRadius: 14,
        padding: 2,
        justifyContent: 'center',
    },
    toggleDot: {
        width: 24,
        height: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
    },
    toggleDotActive: {
        alignSelf: 'flex-end',
    },
    routeCard: {
        marginBottom: Spacing.lg,
    },
    routeHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    routeStats: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    routeStat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    routeStatIcon: {
        fontSize: 14,
    },
    stopsContainer: {
        gap: Spacing.xs,
    },
    stopItem: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    stopTimeline: {
        alignItems: 'center',
        width: 32,
    },
    stopDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stopCheckIcon: {
        fontSize: 16,
        color: '#FFFFFF',
    },
    stopLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#D1D5DB',
        marginVertical: Spacing.xs,
    },
    stopContent: {
        flex: 1,
        paddingBottom: Spacing.md,
    },
    stopInfo: {
        gap: Spacing.xs,
    },
    stopMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginTop: Spacing.xs,
    },
    typeBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Spacing.borderRadius.sm,
    },
    typeBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    quickActions: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    quickActionButton: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    quickActionIcon: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
});
