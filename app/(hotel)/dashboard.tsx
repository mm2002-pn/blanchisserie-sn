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
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import DrawerMenu from '@/components/shared/DrawerMenu';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mockInvoices } from '@/data/mock-invoices';

export default function HotelDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { orders } = useOrder();
    const colors = useThemeColors();
    const [drawerVisible, setDrawerVisible] = useState(false);

    // Calculate stats
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
    const inProgressOrders = orders.filter(o => o.status === 'in_progress' || o.status === 'collected').length;
    const pendingInvoices = mockInvoices.filter(i => i.status === 'pending').length;
    const totalPending = mockInvoices
        .filter(i => i.status === 'pending')
        .reduce((sum, i) => sum + i.total, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
            >
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setDrawerVisible(true)}
                    style={styles.iconButton}
                >
                    <Text style={styles.menuIcon}>☰</Text>
                </TouchableOpacity>
                <View style={styles.headerRight}>
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.iconText}>🔔</Text>
                        <View style={styles.badge} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconButton}>
                        <Text style={styles.iconText}>🔍</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Main Question */}
            <View style={styles.questionSection}>
                <ThemedText variate="headline" color="textPrimary" style={styles.mainQuestion}>
                    De quel service avez-vous besoin aujourd'hui?
                </ThemedText>
            </View>

            {/* Service Cards */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.servicesScroll}
                contentContainerStyle={styles.servicesContent}
            >
                <TouchableOpacity
                    style={styles.serviceCard}
                    onPress={() => router.push('/(hotel)/new-order')}
                >
                    <View style={[styles.serviceIconContainer, { backgroundColor: '#E0F2FE' }]}>
                        <Text style={styles.serviceIconLarge}>🧼</Text>
                    </View>
                    <ThemedText variate="body3" color="textPrimary" style={styles.serviceLabel}>
                        Nettoyage
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.serviceCard}
                    onPress={() => router.push('/(hotel)/new-order')}
                >
                    <View style={[styles.serviceIconContainer, { backgroundColor: '#FCE7F3' }]}>
                        <Text style={styles.serviceIconLarge}>🧺</Text>
                    </View>
                    <ThemedText variate="body3" color="textPrimary" style={styles.serviceLabel}>
                        Blanchisserie
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.serviceCard}
                    onPress={() => router.push('/(hotel)/new-order')}
                >
                    <View style={[styles.serviceIconContainer, { backgroundColor: '#DBEAFE' }]}>
                        <Text style={styles.serviceIconLarge}>💧</Text>
                    </View>
                    <ThemedText variate="body3" color="textPrimary" style={styles.serviceLabel}>
                        Aqua Clean
                    </ThemedText>
                </TouchableOpacity>
            </ScrollView>

            {/* Promo Banner */}
            <TouchableOpacity style={styles.promoBanner}>
                <View style={{ flex: 1 }}>
                    <ThemedText variate="subtitle1" style={{ color: colors.hotelPrimary }}>
                        Service Gratuit
                    </ThemedText>
                    <ThemedText variate="body3" color="textSecondary">
                        Pour votre première commande!
                    </ThemedText>
                </View>
                <View style={styles.promoIcon}>
                    <Text style={{ fontSize: 40 }}>🎁</Text>
                </View>
            </TouchableOpacity>

            {/* Pagination Dots */}
            <View style={styles.paginationDots}>
                <View style={[styles.dot, { backgroundColor: colors.hotelPrimary }]} />
                <View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} />
                <View style={[styles.dot, { backgroundColor: '#D1D5DB' }]} />
            </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsSection}>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Actions rapides
                </ThemedText>

                {/* Nouvelle commande - Grande carte principale */}
                <TouchableOpacity
                    style={[styles.mainActionCard, { backgroundColor: colors.hotelPrimary }]}
                    onPress={() => router.push('/(hotel)/new-order')}
                    activeOpacity={0.85}
                >
                    <View style={styles.mainActionContent}>
                        <View>
                            <Text style={styles.mainActionTitle}>Créer une commande</Text>
                            <Text style={styles.mainActionSubtitle}>Passez une nouvelle commande rapidement</Text>
                        </View>
                        <View style={styles.mainActionIcon}>
                            <Text style={styles.mainActionEmoji}>📝</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                {/* Autres actions - Grille compacte */}
                <View style={styles.quickActionsGrid}>
                    <TouchableOpacity
                        style={styles.compactActionCard}
                        onPress={() => router.push('/(hotel)/orders')}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.compactIconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Text style={styles.compactEmoji}>📦</Text>
                        </View>
                        <Text style={styles.compactActionTitle}>Commandes</Text>
                        <Text style={styles.compactActionSubtitle}>Voir tout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.compactActionCard}
                        onPress={() => router.push('/(hotel)/invoices')}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.compactIconBox, { backgroundColor: '#F0FDF4' }]}>
                            <Text style={styles.compactEmoji}>💰</Text>
                        </View>
                        <Text style={styles.compactActionTitle}>Factures</Text>
                        <Text style={styles.compactActionSubtitle}>Paiements</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.compactActionCard}
                        onPress={() => router.push('/(hotel)/planning')}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.compactIconBox, { backgroundColor: '#F5F3FF' }]}>
                            <Text style={styles.compactEmoji}>📅</Text>
                        </View>
                        <Text style={styles.compactActionTitle}>Planning</Text>
                        <Text style={styles.compactActionSubtitle}>Collectes</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Recent Orders */}
            <View style={styles.popularSection}>
                <View style={styles.sectionHeader}>
                    <ThemedText variate="subtitle1" color="textPrimary">
                        Commandes récentes
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(hotel)/orders')}>
                        <Text style={[styles.seeAllButton, { color: colors.hotelPrimary }]}>
                            Voir tout →
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.ordersContainer}>
                    {orders.slice(0, 3).map((order) => {
                        // Calculer le nombre total d'articles
                        let totalItems = 0;
                        if (order.services && Array.isArray(order.services)) {
                            if (order.services.length > 0 && order.services[0].items) {
                                totalItems = order.services.reduce((total, service) => {
                                    return total + (service.items?.reduce((sum, item) => sum + item.quantity, 0) || 0);
                                }, 0);
                            } else {
                                totalItems = order.services.length;
                            }
                        }

                        // Couleur selon le statut
                        const getStatusColor = (status: string) => {
                            switch (status) {
                                case 'delivered': return '#10B981';
                                case 'pending': return '#F59E0B';
                                case 'confirmed': return '#3B82F6';
                                case 'in_progress': return '#8B5CF6';
                                case 'collected': return '#6366F1';
                                default: return '#6B7280';
                            }
                        };

                        const getStatusLabel = (status: string) => {
                            switch (status) {
                                case 'delivered': return 'Livrée';
                                case 'pending': return 'En attente';
                                case 'confirmed': return 'Confirmée';
                                case 'in_progress': return 'En cours';
                                case 'collected': return 'Collectée';
                                default: return status;
                            }
                        };

                        return (
                            <TouchableOpacity
                                key={order.id}
                                style={styles.modernOrderCard}
                                onPress={() => router.push({
                                    pathname: '/(hotel)/order-details',
                                    params: { id: order.id },
                                })}
                                activeOpacity={0.85}
                            >
                                <View style={styles.orderCardLeft}>
                                    <View style={[styles.orderStatusDot, { backgroundColor: getStatusColor(order.status) }]} />
                                    <View style={styles.orderCardInfo}>
                                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                                        <Text style={styles.orderDate}>
                                            {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'short'
                                            })}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.orderCardRight}>
                                    <View style={styles.orderItemsBox}>
                                        <Text style={styles.orderItemsCount}>{totalItems > 0 ? totalItems : '-'}</Text>
                                        <Text style={styles.orderItemsLabel}>articles</Text>
                                    </View>
                                    <View style={[styles.orderStatusBadge, { backgroundColor: getStatusColor(order.status) + '15' }]}>
                                        <Text style={[styles.orderStatusText, { color: getStatusColor(order.status) }]}>
                                            {getStatusLabel(order.status)}
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Drawer Menu */}
            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: 100, // Espace pour la navigation flottante
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    headerRight: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    menuIcon: {
        fontSize: 28,
        color: '#374151',
    },
    iconText: {
        fontSize: 24,
    },
    badge: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#3B82F6',
    },
    questionSection: {
        marginBottom: Spacing.xl,
    },
    mainQuestion: {
        fontSize: 28,
        lineHeight: 36,
    },
    servicesScroll: {
        marginBottom: Spacing.xl,
    },
    servicesContent: {
        gap: Spacing.md,
    },
    serviceCard: {
        alignItems: 'center',
        width: 110,
    },
    serviceIconContainer: {
        width: 80,
        height: 80,
        borderRadius: Spacing.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    serviceIconLarge: {
        fontSize: 36,
    },
    serviceLabel: {
        textAlign: 'center',
        fontSize: Typography.fontSize.xs,
    },
    promoBanner: {
        flexDirection: 'row',
        backgroundColor: '#EFF6FF',
        padding: Spacing.lg,
        borderRadius: Spacing.borderRadius.lg,
        marginBottom: Spacing.md,
        alignItems: 'center',
    },
    promoIcon: {
        marginLeft: Spacing.md,
    },
    paginationDots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.xl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    quickActionsSection: {
        marginBottom: Spacing.xl,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    mainActionCard: {
        borderRadius: Spacing.borderRadius.xl,
        padding: Spacing.xl,
        marginBottom: Spacing.md,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 4,
    },
    mainActionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainActionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    mainActionSubtitle: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '400',
    },
    mainActionIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    mainActionEmoji: {
        fontSize: 30,
    },
    quickActionsGrid: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    compactActionCard: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 2,
    },
    compactIconBox: {
        width: 56,
        height: 56,
        borderRadius: Spacing.borderRadius.lg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    compactEmoji: {
        fontSize: 28,
    },
    compactActionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    compactActionSubtitle: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '400',
    },
    popularSection: {
        marginBottom: Spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    seeAllButton: {
        fontSize: 14,
        fontWeight: '600',
    },
    ordersContainer: {
        gap: Spacing.sm,
    },
    modernOrderCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.md,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
        marginBottom: Spacing.xs,
    },
    orderCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    orderStatusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: Spacing.md,
    },
    orderCardInfo: {
        flex: 1,
    },
    orderNumber: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1F2937',
        marginBottom: 2,
    },
    orderDate: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '400',
    },
    orderCardRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    orderItemsBox: {
        alignItems: 'center',
        minWidth: 50,
    },
    orderItemsCount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    orderItemsLabel: {
        fontSize: 10,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    orderStatusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: Spacing.borderRadius.md,
    },
    orderStatusText: {
        fontSize: 11,
        fontWeight: '600',
    },
});
