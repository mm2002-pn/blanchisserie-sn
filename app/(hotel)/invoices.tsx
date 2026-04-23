import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    FlatList,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import { mockInvoices } from '@/data/mock-invoices';
import { Invoice } from '@/types/invoice.types';

const FILTERS = [
    { id: 'all', label: 'Toutes' },
    { id: 'pending', label: 'En attente' },
    { id: 'paid', label: 'Payées' },
];

const STATUS_COLORS = {
    pending: '#FFA500',
    paid: '#228B22',
    overdue: '#DC143C',
};

const STATUS_LABELS = {
    pending: 'En attente',
    paid: 'Payée',
    overdue: 'En retard',
};

const PAYMENT_METHOD_LABELS = {
    card: 'Carte bancaire',
    transfer: 'Virement',
    cash: 'Espèces',
    mobile: 'Mobile Money',
};

export default function InvoicesScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [selectedFilter, setSelectedFilter] = useState('all');

    // Filter invoices for current hotel (using hotelId '1' from mock data)
    const hotelInvoices = mockInvoices.filter(invoice => invoice.hotelId === '1');

    const filteredInvoices = selectedFilter === 'all'
        ? hotelInvoices
        : hotelInvoices.filter(invoice => invoice.status === selectedFilter);

    const handlePayment = (invoice: Invoice) => {
        Alert.alert(
            'Paiement',
            `Payer ${invoice.total.toLocaleString('fr-FR')} FCFA pour la facture ${invoice.invoiceNumber}?`,
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Payer',
                    onPress: () => {
                        // TODO: Implement payment flow
                        Alert.alert('Succès', 'Paiement effectué avec succès');
                    },
                },
            ]
        );
    };

    const renderInvoiceCard = ({ item }: { item: Invoice }) => {
        const isOverdue = item.status === 'pending' && new Date(item.dueDate) < new Date();
        const displayStatus = isOverdue ? 'overdue' : item.status;

        return (
            <TouchableOpacity
                onPress={() => {
                    // TODO: Navigate to invoice details
                }}
            >
                <Card style={styles.invoiceCard}>
                    <View style={styles.invoiceHeader}>
                        <View>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                {item.invoiceNumber}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Commande: {item.orderNumber}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                {new Date(item.createdAt).toLocaleDateString('fr-FR')}
                            </ThemedText>
                        </View>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: STATUS_COLORS[displayStatus] + '20' },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.statusText,
                                    { color: STATUS_COLORS[displayStatus] },
                                ]}
                            >
                                {STATUS_LABELS[displayStatus]}
                            </Text>
                        </View>
                    </View>

                    {/* Invoice Items */}
                    <View style={styles.itemsContainer}>
                        {item.items.map((lineItem, index) => (
                            <View key={index} style={styles.itemRow}>
                                <ThemedText variate="body3" color="textSecondary" style={{ flex: 1 }}>
                                    {lineItem.description}
                                </ThemedText>
                                <ThemedText variate="body3" color="textPrimary">
                                    {lineItem.total.toLocaleString('fr-FR')} FCFA
                                </ThemedText>
                            </View>
                        ))}
                    </View>

                    {/* Totals */}
                    <View style={styles.totalsContainer}>
                        <View style={styles.totalRow}>
                            <ThemedText variate="body3" color="textSecondary">
                                Sous-total:
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {item.subtotal.toLocaleString('fr-FR')} FCFA
                            </ThemedText>
                        </View>
                        <View style={styles.totalRow}>
                            <ThemedText variate="body3" color="textSecondary">
                                TVA (18%):
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {item.tax.toLocaleString('fr-FR')} FCFA
                            </ThemedText>
                        </View>
                        <View style={[styles.totalRow, styles.grandTotalRow]}>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Total:
                            </ThemedText>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                {item.total.toLocaleString('fr-FR')} FCFA
                            </ThemedText>
                        </View>
                    </View>

                    {/* Due Date / Payment Info */}
                    {item.status === 'pending' ? (
                        <View style={styles.dueDateContainer}>
                            <Text style={styles.dueDateIcon}>📅</Text>
                            <ThemedText variate="caption" color="textSecondary">
                                Date d'échéance: {new Date(item.dueDate).toLocaleDateString('fr-FR')}
                            </ThemedText>
                        </View>
                    ) : (
                        <View style={styles.paymentInfoContainer}>
                            <View style={styles.paymentInfo}>
                                <Text style={styles.paymentIcon}>✓</Text>
                                <View>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Payé le {new Date(item.paidDate!).toLocaleDateString('fr-FR')}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {PAYMENT_METHOD_LABELS[item.paymentMethod!]}
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Payment Button */}
                    {item.status === 'pending' && (
                        <TouchableOpacity
                            style={[
                                styles.paymentButton,
                                { backgroundColor: colors.hotelPrimary },
                            ]}
                            onPress={() => handlePayment(item)}
                        >
                            <Text style={styles.paymentButtonText}>💳 Payer maintenant</Text>
                        </TouchableOpacity>
                    )}
                </Card>
            </TouchableOpacity>
        );
    };

    // Calculate summary stats
    const totalPending = filteredInvoices
        .filter(inv => inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.total, 0);

    const totalPaid = filteredInvoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.total, 0);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText variate="headline" color="textPrimary">
                    Mes Factures
                </ThemedText>
            </View>

            {/* Summary Cards */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.summaryContainer}
                contentContainerStyle={styles.summaryContent}
            >
                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryIcon}>⏳</Text>
                    <ThemedText variate="caption" color="textSecondary">
                        En attente
                    </ThemedText>
                    <ThemedText variate="subtitle1" color="textPrimary">
                        {totalPending.toLocaleString('fr-FR')} FCFA
                    </ThemedText>
                </Card>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryIcon}>✓</Text>
                    <ThemedText variate="caption" color="textSecondary">
                        Payées
                    </ThemedText>
                    <ThemedText variate="subtitle1" color="textPrimary">
                        {totalPaid.toLocaleString('fr-FR')} FCFA
                    </ThemedText>
                </Card>

                <Card style={styles.summaryCard}>
                    <Text style={styles.summaryIcon}>📊</Text>
                    <ThemedText variate="caption" color="textSecondary">
                        Total factures
                    </ThemedText>
                    <ThemedText variate="subtitle1" color="textPrimary">
                        {filteredInvoices.length}
                    </ThemedText>
                </Card>
            </ScrollView>

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

            {/* Invoices List */}
            <FlatList
                data={filteredInvoices}
                renderItem={renderInvoiceCard}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📄</Text>
                        <ThemedText variate="subtitle2" color="textSecondary">
                            Aucune facture trouvée
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
        paddingHorizontal: Spacing.padding.screen,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    summaryContainer: {
        maxHeight: 100,
        marginBottom: Spacing.md,
    },
    summaryContent: {
        paddingHorizontal: Spacing.padding.screen,
        gap: Spacing.md,
    },
    summaryCard: {
        width: 140,
        alignItems: 'center',
        padding: Spacing.md,
    },
    summaryIcon: {
        fontSize: 32,
        marginBottom: Spacing.xs,
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
    invoiceCard: {
        marginBottom: Spacing.md,
    },
    invoiceHeader: {
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
    itemsContainer: {
        marginBottom: Spacing.md,
        paddingVertical: Spacing.sm,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    totalsContainer: {
        marginBottom: Spacing.md,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.xs,
    },
    grandTotalRow: {
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    dueDateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF7ED',
        padding: Spacing.sm,
        borderRadius: Spacing.borderRadius.md,
        marginBottom: Spacing.sm,
    },
    dueDateIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
    },
    paymentInfoContainer: {
        marginBottom: Spacing.sm,
    },
    paymentInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0FDF4',
        padding: Spacing.sm,
        borderRadius: Spacing.borderRadius.md,
    },
    paymentIcon: {
        fontSize: 16,
        marginRight: Spacing.sm,
        color: '#228B22',
    },
    paymentButton: {
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    paymentButtonText: {
        color: '#FFFFFF',
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
