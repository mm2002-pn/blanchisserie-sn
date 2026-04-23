import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import DrawerMenu from '@/components/shared/DrawerMenu';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function DriverProfileScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const colors = useThemeColors();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const driverStats = {
        deliveriesThisMonth: 127,
        onTimeRate: 98.5,
        customerSatisfaction: 4.9,
        totalDistance: 1245,
    };

    const assignedVehicle = {
        model: 'Mercedes Sprinter',
        plate: 'AB-1234-CD',
        capacity: '100 kg',
        fuelLevel: 75,
        lastMaintenance: '15 Déc 2024',
        nextMaintenance: '15 Jan 2025',
    };

    const documents = [
        { id: '1', name: 'Permis de conduire', status: 'valid', expiry: '15 Juin 2026' },
        { id: '2', name: 'Carte d\'identité', status: 'valid', expiry: '20 Mars 2027' },
        { id: '3', name: 'Contrat de travail', status: 'valid', expiry: 'Indéterminé' },
        { id: '4', name: 'Assurance véhicule', status: 'expiring', expiry: '10 Jan 2025' },
    ];

    const weekSchedule = [
        { day: 'Lun', date: '23', isToday: false, hasRoute: true },
        { day: 'Mar', date: '24', isToday: false, hasRoute: true },
        { day: 'Mer', date: '25', isToday: false, hasRoute: true },
        { day: 'Jeu', date: '26', isToday: true, hasRoute: true },
        { day: 'Ven', date: '27', isToday: false, hasRoute: true },
        { day: 'Sam', date: '28', isToday: false, hasRoute: false },
        { day: 'Dim', date: '29', isToday: false, hasRoute: false },
    ];

    const handleViewDocument = (docName: string) => {
        Alert.alert('Document', `Visualisation de ${docName}`);
    };

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
                    Mon Profil
                </ThemedText>
                <TouchableOpacity style={styles.iconButton}>
                    <Text style={styles.iconText}>⚙️</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                {/* Profile Card */}
                <Card style={[styles.profileCard, { backgroundColor: colors.driverPrimary + '10' }]}>
                    <View style={styles.profileHeader}>
                        <View style={[styles.avatar, { backgroundColor: colors.driverPrimary }]}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || 'C'}
                            </Text>
                        </View>
                        <View style={styles.profileInfo}>
                            <ThemedText variate="subtitle1" color="textPrimary">
                                {user?.name || 'Chauffeur'}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Chauffeur-Livreur
                            </ThemedText>
                            <View style={styles.profileMeta}>
                                <View style={[styles.statusBadge, { backgroundColor: '#10B98120' }]}>
                                    <Text style={styles.statusDot}>●</Text>
                                    <ThemedText variate="caption" style={{ color: colors.driverPrimary }}>
                                        En service
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Stats Grid */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statCard}>
                        <Text style={styles.statIcon}>📦</Text>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {driverStats.deliveriesThisMonth}
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Livraisons ce mois
                        </ThemedText>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statIcon}>⏱️</Text>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {driverStats.onTimeRate}%
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Ponctualité
                        </ThemedText>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statIcon}>⭐</Text>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {driverStats.customerSatisfaction}/5
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Satisfaction
                        </ThemedText>
                    </Card>

                    <Card style={styles.statCard}>
                        <Text style={styles.statIcon}>🚗</Text>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {driverStats.totalDistance} km
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Distance totale
                        </ThemedText>
                    </Card>
                </View>

                {/* Assigned Vehicle */}
                <Card style={styles.vehicleCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>🚚</Text>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Véhicule assigné
                        </ThemedText>
                    </View>

                    <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleRow}>
                            <ThemedText variate="body3" color="textSecondary" style={{ flex: 1 }}>
                                Modèle
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {assignedVehicle.model}
                            </ThemedText>
                        </View>
                        <View style={styles.vehicleRow}>
                            <ThemedText variate="body3" color="textSecondary" style={{ flex: 1 }}>
                                Immatriculation
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {assignedVehicle.plate}
                            </ThemedText>
                        </View>
                        <View style={styles.vehicleRow}>
                            <ThemedText variate="body3" color="textSecondary" style={{ flex: 1 }}>
                                Capacité
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {assignedVehicle.capacity}
                            </ThemedText>
                        </View>
                    </View>

                    <View style={styles.fuelContainer}>
                        <View style={styles.fuelHeader}>
                            <ThemedText variate="caption" color="textSecondary">
                                Niveau de carburant
                            </ThemedText>
                            <ThemedText variate="caption" style={{ color: colors.driverPrimary }}>
                                {assignedVehicle.fuelLevel}%
                            </ThemedText>
                        </View>
                        <View style={styles.fuelBar}>
                            <View
                                style={[
                                    styles.fuelFill,
                                    {
                                        width: `${assignedVehicle.fuelLevel}%`,
                                        backgroundColor: colors.driverPrimary,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.maintenanceInfo}>
                        <View style={styles.maintenanceRow}>
                            <Text style={styles.maintenanceIcon}>🔧</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Dernière révision: {assignedVehicle.lastMaintenance}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Prochaine révision: {assignedVehicle.nextMaintenance}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Week Schedule */}
                <Card style={styles.scheduleCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📅</Text>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Planning de la semaine
                        </ThemedText>
                    </View>

                    <View style={styles.weekDays}>
                        {weekSchedule.map((day) => (
                            <View
                                key={day.date}
                                style={[
                                    styles.dayCard,
                                    day.isToday && { backgroundColor: colors.driverPrimary, borderColor: colors.driverPrimary },
                                ]}
                            >
                                <ThemedText
                                    variate="caption"
                                    style={{
                                        color: day.isToday ? '#FFFFFF' : colors.textSecondary,
                                        marginBottom: Spacing.xs,
                                    }}
                                >
                                    {day.day}
                                </ThemedText>
                                <ThemedText
                                    variate="subtitle3"
                                    style={{
                                        color: day.isToday ? '#FFFFFF' : colors.textPrimary,
                                        marginBottom: Spacing.xs,
                                    }}
                                >
                                    {day.date}
                                </ThemedText>
                                {day.hasRoute && (
                                    <Text style={styles.routeIndicator}>
                                        {day.isToday ? '✓' : '●'}
                                    </Text>
                                )}
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Documents */}
                <Card style={styles.documentsCard}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionIcon}>📄</Text>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Documents professionnels
                        </ThemedText>
                    </View>

                    <View style={styles.documentsList}>
                        {documents.map((doc) => (
                            <TouchableOpacity
                                key={doc.id}
                                style={styles.documentItem}
                                onPress={() => handleViewDocument(doc.name)}
                            >
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="body3" color="textPrimary">
                                        {doc.name}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Expire le: {doc.expiry}
                                    </ThemedText>
                                </View>
                                <View
                                    style={[
                                        styles.docStatusBadge,
                                        {
                                            backgroundColor:
                                                doc.status === 'valid'
                                                    ? '#10B98120'
                                                    : doc.status === 'expiring'
                                                    ? '#FFA50020'
                                                    : '#DC262620',
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.docStatusText,
                                            {
                                                color:
                                                    doc.status === 'valid'
                                                        ? '#10B981'
                                                        : doc.status === 'expiring'
                                                        ? '#FFA500'
                                                        : '#DC2626',
                                            },
                                        ]}
                                    >
                                        {doc.status === 'valid' ? '✓ Valide' : doc.status === 'expiring' ? '⚠️ Expire bientôt' : '✗ Expiré'}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>📊</Text>
                        <ThemedText variate="body3" color="textPrimary">
                            Mes statistiques
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>🔔</Text>
                        <ThemedText variate="body3" color="textPrimary">
                            Notifications
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionButton}>
                        <Text style={styles.actionIcon}>❓</Text>
                        <ThemedText variate="body3" color="textPrimary">
                            Aide & Support
                        </ThemedText>
                    </TouchableOpacity>
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
    profileCard: {
        marginBottom: Spacing.lg,
    },
    profileHeader: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: Typography.fontWeight.bold,
    },
    profileInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    profileMeta: {
        marginTop: Spacing.sm,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Spacing.borderRadius.full,
        alignSelf: 'flex-start',
    },
    statusDot: {
        fontSize: 10,
        color: '#10B981',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    statCard: {
        width: '47%',
        alignItems: 'center',
        padding: Spacing.md,
    },
    statIcon: {
        fontSize: 32,
        marginBottom: Spacing.xs,
    },
    vehicleCard: {
        marginBottom: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    sectionIcon: {
        fontSize: 24,
    },
    vehicleInfo: {
        gap: Spacing.sm,
        marginBottom: Spacing.md,
    },
    vehicleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
    },
    fuelContainer: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        backgroundColor: '#F9FAFB',
        borderRadius: Spacing.borderRadius.md,
    },
    fuelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    fuelBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    fuelFill: {
        height: '100%',
        borderRadius: 4,
    },
    maintenanceInfo: {
        marginTop: Spacing.md,
    },
    maintenanceRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    maintenanceIcon: {
        fontSize: 20,
    },
    scheduleCard: {
        marginBottom: Spacing.lg,
    },
    weekDays: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    dayCard: {
        flex: 1,
        alignItems: 'center',
        padding: Spacing.sm,
        borderRadius: Spacing.borderRadius.md,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#F9FAFB',
    },
    routeIndicator: {
        fontSize: 10,
        color: '#10B981',
    },
    documentsCard: {
        marginBottom: Spacing.lg,
    },
    documentsList: {
        gap: Spacing.md,
    },
    documentItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    docStatusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Spacing.borderRadius.sm,
    },
    docStatusText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    quickActions: {
        gap: Spacing.md,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: '#FFFFFF',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    actionIcon: {
        fontSize: 24,
    },
});
