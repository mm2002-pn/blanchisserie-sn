import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrder } from '@/contexts/OrderContext';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Order, OrderStatus, ServiceType } from '@/types/order.types';

const SERVICES_MAP: Record<ServiceType, { label: string; icon: string }> = {
    dry_wash: { label: 'Nettoyage à sec', icon: '👔' },
    washing_folding: { label: 'Lavage et pliage', icon: '🧺' },
    ironing: { label: 'Repassage', icon: '👕' },
    household_items: { label: 'Articles ménagers', icon: '🧹' },
    socks_cleaning: { label: 'Nettoyage chaussettes', icon: '🧦' },
};

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: string; color: string }> = {
    pending: { label: 'En attente', icon: '⏳', color: '#FFA500' },
    confirmed: { label: 'Confirmée', icon: '✅', color: '#4CAF50' },
    collected: { label: 'Collectée', icon: '📦', color: '#2196F3' },
    in_progress: { label: 'En traitement', icon: '🔄', color: '#9C27B0' },
    ready: { label: 'Prête', icon: '✨', color: '#00BCD4' },
    delivered: { label: 'Livrée', icon: '🎉', color: '#4CAF50' },
    cancelled: { label: 'Annulée', icon: '❌', color: '#F44336' },
};

// Workflow détaillé de production (7 étapes)
const WORKFLOW_STEPS = [
    { id: 'pending', label: 'En attente', icon: '⏳', description: 'Commande créée' },
    { id: 'confirmed', label: 'Confirmée', icon: '✅', description: 'Commande confirmée' },
    { id: 'collected', label: 'Collectée', icon: '📦', description: 'Linge collecté' },
    { id: 'weighed', label: 'Pesée', icon: '⚖️', description: 'Pesée par type' },
    { id: 'verified', label: 'Vérification', icon: '✂️', description: 'Tri vérifié' },
    { id: 'washing', label: 'Lavage', icon: '💧', description: 'En cours de lavage' },
    { id: 'drying', label: 'Séchage', icon: '🌬️', description: 'En cours de séchage' },
    { id: 'ironing', label: 'Calandrage', icon: '✨', description: 'Repassage/finition' },
    { id: 'ready', label: 'Prête', icon: '🎁', description: 'Prête pour livraison' },
    { id: 'delivered', label: 'Livrée', icon: '🎉', description: 'Livrée au client' },
];

// Mapping des statuts actuels vers les étapes du workflow
const STATUS_TO_WORKFLOW_STEP: Record<OrderStatus, string> = {
    pending: 'pending',
    confirmed: 'confirmed',
    collected: 'collected',
    in_progress: 'washing', // Par défaut, "en traitement" = en lavage
    ready: 'ready',
    delivered: 'delivered',
    cancelled: 'cancelled',
};

const TIMELINE_STEPS: { status: OrderStatus; label: string }[] = [
    { status: 'pending', label: 'En attente' },
    { status: 'confirmed', label: 'Confirmée' },
    { status: 'collected', label: 'Collectée' },
    { status: 'in_progress', label: 'En traitement' },
    { status: 'ready', label: 'Prête' },
    { status: 'delivered', label: 'Livrée' },
];

export default function OrderDetailsScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const { getOrderById, cancelOrder, isLoading } = useOrder();

    const [order, setOrder] = useState<Order | null>(null);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const orderId = params.id as string;
        if (orderId) {
            const foundOrder = getOrderById(orderId);
            setOrder(foundOrder || null);
        }
    }, [params.id]);

    if (!order) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.centerContent}>
                    <Text style={{ fontSize: 48 }}>📦</Text>
                    <ThemedText variate="subtitle1" color="textSecondary" style={{ marginTop: 16 }}>
                        Commande non trouvée
                    </ThemedText>
                    <Button
                        title="Retour"
                        onPress={() => router.back()}
                        variant="outline"
                        style={{ marginTop: 24 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status];
    const currentStepIndex = TIMELINE_STEPS.findIndex(step => step.status === order.status);

    const handleCancel = () => {
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancelling(true);
                            await cancelOrder(order.id);
                            Alert.alert(
                                'Commande annulée',
                                'Votre commande a été annulée avec succès',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => router.back(),
                                    },
                                ]
                            );
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message || 'Impossible d\'annuler la commande');
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ]
        );
    };

    const handleModify = () => {
        router.push({
            pathname: '/(hotel)/new-order',
            params: {
                orderId: order.id,
                // Pre-fill form with existing data
            },
        });
    };

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatTime = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const canCancel = ['pending', 'confirmed'].includes(order.status);
    const canModify = order.status === 'pending';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.backButton}
                    >
                        <Text style={{ fontSize: 24 }}>←</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="headline" color="textPrimary">
                            {order.orderNumber}
                        </ThemedText>
                        <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                            Créée le {formatDate(order.createdAt)}
                        </ThemedText>
                    </View>
                </View>

                {/* Status Badge */}
                <Card style={{ backgroundColor: statusConfig.color + '15' }}>
                    <View style={styles.statusHeader}>
                        <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle1" color="textPrimary">
                                {statusConfig.label}
                            </ThemedText>
                            <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                                Dernière mise à jour: {formatDate(order.updatedAt)} à {formatTime(order.updatedAt)}
                            </ThemedText>
                        </View>
                    </View>
                </Card>

                {/* Workflow de Production - Suivi détaillé */}
                {order.status !== 'cancelled' && (
                    <Card>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                            Suivi détaillé de production
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 16 }}>
                            Suivez votre commande à travers toutes les étapes du processus
                        </ThemedText>
                        <View style={styles.timeline}>
                            {WORKFLOW_STEPS.map((step, index) => {
                                // Déterminer si l'étape est complétée en fonction du statut actuel
                                const currentWorkflowStep = STATUS_TO_WORKFLOW_STEP[order.status];
                                const currentStepIdx = WORKFLOW_STEPS.findIndex(s => s.id === currentWorkflowStep);
                                const isCompleted = index <= currentStepIdx;
                                const isCurrent = index === currentStepIdx;

                                return (
                                    <View key={step.id} style={styles.timelineItem}>
                                        <View style={styles.timelineLeft}>
                                            <View
                                                style={[
                                                    styles.workflowDot,
                                                    {
                                                        backgroundColor: isCompleted
                                                            ? (isCurrent ? colors.hotelPrimary : '#4CAF50')
                                                            : colors.border,
                                                        borderWidth: isCurrent ? 3 : 0,
                                                        borderColor: isCurrent ? colors.hotelPrimary : 'transparent',
                                                    },
                                                ]}
                                            >
                                                <Text style={styles.workflowIcon}>
                                                    {isCompleted ? (isCurrent ? step.icon : '✓') : step.icon}
                                                </Text>
                                            </View>
                                            {index < WORKFLOW_STEPS.length - 1 && (
                                                <View
                                                    style={[
                                                        styles.timelineLine,
                                                        {
                                                            backgroundColor: isCompleted && !isCurrent
                                                                ? '#4CAF50'
                                                                : colors.border,
                                                        },
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <View style={[styles.timelineRight, { opacity: isCompleted ? 1 : 0.5 }]}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                                <ThemedText
                                                    variate="body2"
                                                    color={isCompleted ? 'textPrimary' : 'textSecondary'}
                                                    style={{ fontWeight: isCurrent ? 'bold' : 'normal' }}
                                                >
                                                    {step.label}
                                                </ThemedText>
                                                {isCurrent && (
                                                    <View style={{
                                                        backgroundColor: colors.hotelPrimary,
                                                        paddingHorizontal: 8,
                                                        paddingVertical: 2,
                                                        borderRadius: 12,
                                                    }}>
                                                        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                                            EN COURS
                                                        </Text>
                                                    </View>
                                                )}
                                                {isCompleted && !isCurrent && (
                                                    <Text style={{ fontSize: 16 }}>✅</Text>
                                                )}
                                            </View>
                                            <ThemedText
                                                variate="caption"
                                                color={isCompleted ? 'textSecondary' : 'textTertiary'}
                                                style={{ marginTop: 2 }}
                                            >
                                                {step.description}
                                            </ThemedText>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                )}

                {/* Services */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Services
                    </ThemedText>
                    <View style={styles.servicesList}>
                        {order.services.map((serviceId, index) => {
                            const service = SERVICES_MAP[serviceId];
                            return (
                                <View key={index} style={styles.serviceItem}>
                                    <Text style={styles.serviceIcon}>{service.icon}</Text>
                                    <ThemedText variate="body2" color="textPrimary">
                                        {service.label}
                                    </ThemedText>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* Volume & Weight */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Volume et poids
                    </ThemedText>
                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <ThemedText variate="body3" color="textSecondary">
                                Volume
                            </ThemedText>
                            <ThemedText variate="headline" color="textPrimary" style={{ marginTop: 8 }}>
                                {order.volume}
                            </ThemedText>
                        </View>
                        <View style={[styles.infoItem, styles.infoItemBorder, { borderLeftColor: colors.border }]}>
                            <ThemedText variate="body3" color="textSecondary">
                                Poids estimé
                            </ThemedText>
                            <ThemedText variate="headline" color="textPrimary" style={{ marginTop: 8 }}>
                                {order.estimatedWeight} kg
                            </ThemedText>
                        </View>
                        {order.actualWeight && (
                            <View style={[styles.infoItem, styles.infoItemBorder, { borderLeftColor: colors.border }]}>
                                <ThemedText variate="body3" color="textSecondary">
                                    Poids réel
                                </ThemedText>
                                <ThemedText variate="headline" color="hotelPrimary" style={{ marginTop: 8 }}>
                                    {order.actualWeight} kg
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </Card>

                {/* Dates */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Dates importantes
                    </ThemedText>
                    <View style={styles.dateItem}>
                        <Text style={styles.dateIcon}>📅</Text>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="body3" color="textSecondary">
                                Date de collecte
                            </ThemedText>
                            <ThemedText variate="body1" color="textPrimary" style={{ marginTop: 4 }}>
                                {formatDate(order.collectionDate)} à {formatTime(order.collectionDate)}
                            </ThemedText>
                        </View>
                    </View>
                    {order.deliveryDate && (
                        <View style={[styles.dateItem, { marginTop: 12 }]}>
                            <Text style={styles.dateIcon}>🚚</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="body3" color="textSecondary">
                                    Date de livraison
                                </ThemedText>
                                <ThemedText variate="body1" color="textPrimary" style={{ marginTop: 4 }}>
                                    {formatDate(order.deliveryDate)} à {formatTime(order.deliveryDate)}
                                </ThemedText>
                            </View>
                        </View>
                    )}
                </Card>

                {/* Instructions */}
                {order.instructions && (
                    <Card>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                            Instructions spéciales
                        </ThemedText>
                        <View style={[styles.instructionsBox, { backgroundColor: colors.surface }]}>
                            <ThemedText variate="body2" color="textSecondary">
                                {order.instructions}
                            </ThemedText>
                        </View>
                    </Card>
                )}

                {/* Photos */}
                {order.photos && order.photos.length > 0 && (
                    <Card>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                            Photos jointes
                        </ThemedText>
                        <ThemedText variate="body3" color="textSecondary">
                            {order.photos.length} photo(s)
                        </ThemedText>
                    </Card>
                )}

                {/* Hotel Info */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Informations client
                    </ThemedText>
                    <View style={styles.hotelInfo}>
                        <Text style={styles.hotelIcon}>🏨</Text>
                        <ThemedText variate="body1" color="textPrimary">
                            {order.hotelName}
                        </ThemedText>
                    </View>
                </Card>
            </ScrollView>

            {/* Action Buttons */}
            {(canCancel || canModify) && (
                <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                    {canModify && (
                        <Button
                            title="Modifier"
                            onPress={handleModify}
                            variant="outline"
                            style={{ flex: 1, marginRight: canCancel ? 8 : 0 }}
                        />
                    )}
                    {canCancel && (
                        <Button
                            title={cancelling ? "Annulation..." : "Annuler la commande"}
                            onPress={handleCancel}
                            variant="outline"
                            disabled={cancelling || isLoading}
                            style={{
                                flex: 1,
                                marginLeft: canModify ? 8 : 0,
                                borderColor: '#F44336',
                            }}
                        />
                    )}
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.md,
        paddingBottom: 100,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xl,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.md,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    statusIcon: {
        fontSize: 32,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    timeline: {
        paddingLeft: 4,
    },
    timelineItem: {
        flexDirection: 'row',
        minHeight: 60,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: Spacing.md,
    },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timelineDotIcon: {
        fontSize: 14,
    },
    workflowDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    workflowIcon: {
        fontSize: 18,
    },
    timelineLine: {
        width: 2,
        flex: 1,
        marginTop: 4,
        marginBottom: 4,
    },
    timelineRight: {
        flex: 1,
        paddingTop: 6,
    },
    servicesList: {
        gap: Spacing.sm,
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    serviceIcon: {
        fontSize: 24,
    },
    infoRow: {
        flexDirection: 'row',
    },
    infoItem: {
        flex: 1,
    },
    infoItemBorder: {
        paddingLeft: Spacing.md,
        borderLeftWidth: 1,
    },
    dateItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    dateIcon: {
        fontSize: 24,
    },
    instructionsBox: {
        padding: Spacing.md,
        borderRadius: 8,
    },
    hotelInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    hotelIcon: {
        fontSize: 32,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        padding: Spacing.md,
        borderTopWidth: 1,
    },
});
