import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrder } from '@/contexts/OrderContext';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { Order, OrderStatus } from '@/types/order.types';

const FILTERS = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'in_progress', label: 'En cours' },
    { id: 'delivered', label: 'Livrées' },
];

const STATUS_COLORS: Record<OrderStatus, string> = {
    pending: '#FFA500',
    confirmed: '#4169E1',
    collected: '#9370DB',
    in_progress: '#1E90FF',
    ready: '#32CD32',
    delivered: '#228B22',
    cancelled: '#DC143C',
};

const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'En attente',
    confirmed: 'Confirmée',
    collected: 'Collectée',
    in_progress: 'En traitement',
    ready: 'Prête',
    delivered: 'Livrée',
    cancelled: 'Annulée',
};

export default function OrdersScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { orders, cancelOrder, saveDraft, isLoading } = useOrder();
    const [selectedFilter, setSelectedFilter] = useState('all');
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const filteredOrders = selectedFilter === 'all'
        ? orders
        : orders.filter(order => order.status === selectedFilter);

    const handleCancelOrder = (orderId: string) => {
        Alert.alert(
            'Annuler la commande',
            'Êtes-vous sûr de vouloir annuler cette commande ?',
            [
                { text: 'Non', style: 'cancel' },
                {
                    text: 'Oui, annuler',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setCancellingId(orderId);
                            await cancelOrder(orderId);
                            Alert.alert('Succès', 'La commande a été annulée');
                        } catch (error: any) {
                            Alert.alert('Erreur', error.message || 'Impossible d\'annuler la commande');
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ]
        );
    };

    const handleModifyOrder = async (order: Order) => {
        try {
            // Save order data as draft
            await saveDraft({
                services: order.services,
                volume: order.volume,
                estimatedWeight: order.estimatedWeight,
                collectionDate: order.collectionDate,
                instructions: order.instructions,
                photos: order.photos,
            });

            // Navigate to new-order screen
            router.push('/(hotel)/new-order');
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de charger la commande');
        }
    };

    const renderOrderCard = ({ item }: { item: Order }) => (
        <TouchableOpacity
            onPress={() => {
                router.push({
                    pathname: '/(hotel)/order-details',
                    params: { id: item.id },
                });
            }}
        >
            <Card style={styles.orderCard}>
                <View style={styles.orderHeader}>
                    <View>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            {item.orderNumber}
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                        </ThemedText>
                    </View>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: STATUS_COLORS[item.status] + '20' },
                        ]}
                    >
                        <Text
                            style={[
                                styles.statusText,
                                { color: STATUS_COLORS[item.status] },
                            ]}
                        >
                            {STATUS_LABELS[item.status]}
                        </Text>
                    </View>
                </View>

                <View style={styles.orderDetails}>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📦</Text>
                        <ThemedText variate="body3" color="textSecondary">
                            Volume: {item.volume}
                        </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>⚖️</Text>
                        <ThemedText variate="body3" color="textSecondary">
                            {item.actualWeight || item.estimatedWeight} kg
                        </ThemedText>
                    </View>
                    <View style={styles.detailRow}>
                        <Text style={styles.detailIcon}>📅</Text>
                        <ThemedText variate="body3" color="textSecondary">
                            Collecte: {new Date(item.collectionDate).toLocaleDateString('fr-FR')}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.servicesContainer}>
                    {item.services.slice(0, 3).map((service, index) => (
                        <View
                            key={index}
                            style={[
                                styles.serviceTag,
                                { backgroundColor: colors.hotelPrimary + '15' },
                            ]}
                        >
                            <Text style={[styles.serviceTagText, { color: colors.hotelPrimary }]}>
                                {service === 'dry_wash' && '👔 Nettoyage'}
                                {service === 'washing_folding' && '🧺 Lavage'}
                                {service === 'ironing' && '👕 Repassage'}
                                {service === 'household_items' && '🧹 Ménager'}
                                {service === 'socks_cleaning' && '🧦 Chaussettes'}
                            </Text>
                        </View>
                    ))}
                    {item.services.length > 3 && (
                        <Text style={styles.moreServices}>+{item.services.length - 3}</Text>
                    )}
                </View>

                {item.status === 'pending' && (
                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.error + '15' },
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleCancelOrder(item.id);
                            }}
                            disabled={cancellingId === item.id}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.error }]}>
                                {cancellingId === item.id ? 'Annulation...' : 'Annuler'}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.actionButton,
                                { backgroundColor: colors.hotelPrimary + '15' },
                            ]}
                            onPress={(e) => {
                                e.stopPropagation();
                                handleModifyOrder(item);
                            }}
                        >
                            <Text style={[styles.actionButtonText, { color: colors.hotelPrimary }]}>
                                Modifier
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Card>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText variate="headline" color="textPrimary">
                    Mes Commandes
                </ThemedText>
                <TouchableOpacity
                    onPress={() => router.push('/(hotel)/new-order')}
                    style={[styles.newOrderButton, { backgroundColor: colors.hotelPrimary }]}
                >
                    <Text style={styles.newOrderButtonText}>+ Nouveau</Text>
                </TouchableOpacity>
            </View>

            {/* Filters */}
            <View style={styles.filtersWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {FILTERS.map(filter => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                selectedFilter === filter.id && {
                                    backgroundColor: colors.hotelPrimary,
                                },
                            ]}
                            onPress={() => setSelectedFilter(filter.id)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    {
                                        color: selectedFilter === filter.id
                                            ? '#FFFFFF'
                                            : colors.textSecondary,
                                    },
                                ]}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Orders List */}
            <FlatList
                data={filteredOrders}
                renderItem={renderOrderCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📦</Text>
                        <ThemedText variate="subtitle2" color="textSecondary">
                            Aucune commande trouvée
                        </ThemedText>
                    </View>
                }
            />
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
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    newOrderButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.lg,
    },
    newOrderButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    filtersWrapper: {
        marginBottom: Spacing.md,
        paddingVertical: Spacing.xs,
    },
    filtersContent: {
        paddingHorizontal: Spacing.padding.screen,
        gap: Spacing.xs,
    },
    filterChip: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.full,
        backgroundColor: '#F3F4F6',
    },
    filterChipText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    listContent: {
        paddingHorizontal: Spacing.padding.screen,
        paddingBottom: 100, // Espace pour la navigation flottante
    },
    orderCard: {
        marginBottom: Spacing.md,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    statusBadge: {
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.md,
    },
    statusText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    orderDetails: {
        marginBottom: Spacing.md,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.xs,
    },
    detailIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
    },
    servicesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    serviceTag: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.sm,
    },
    serviceTagText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.medium,
    },
    moreServices: {
        fontSize: Typography.fontSize.xs,
        color: '#999',
        alignSelf: 'center',
    },
    actions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    actionButton: {
        flex: 1,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    actionButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.huge,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
});
