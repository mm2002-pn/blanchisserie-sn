import React, { useState } from 'react';
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
import { ServiceType, LinenType, OrderFormData, OrderService } from '@/types/order.types';

const SERVICES_MAP: Record<ServiceType, { label: string; icon: string; pricePerKg: number }> = {
    nettoyage: { label: 'Nettoyage', icon: '🧼', pricePerKg: 800 },
    blanchisserie: { label: 'Blanchisserie', icon: '🧺', pricePerKg: 500 },
    aqua_clean: { label: 'Aqua Clean', icon: '💧', pricePerKg: 600 },
};

const LINEN_TYPES_MAP: Record<LinenType, string> = {
    drap: 'Drap',
    taie: 'Taie d\'oreiller',
    serviette: 'Serviette',
    nappe: 'Nappe',
    torchon: 'Torchon',
    rideau: 'Rideau',
    couverture: 'Couverture',
    housse: 'Housse de couette',
    peignoir: 'Peignoir',
    tapis: 'Tapis',
};

// Poids moyens estimés par type de linge (en kg)
const LINEN_WEIGHTS: Record<LinenType, number> = {
    drap: 0.8,
    taie: 0.2,
    serviette: 0.3,
    nappe: 0.6,
    torchon: 0.1,
    rideau: 1.5,
    couverture: 2.0,
    housse: 1.0,
    peignoir: 0.5,
    tapis: 3.0,
};

export default function OrderValidationScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const { createOrder, isLoading } = useOrder();

    // Parse order data from route params
    const orderData: OrderFormData = {
        services: JSON.parse(params.services as string) as OrderService[],
        collectionDate: params.collectionDate as string,
        instructions: params.instructions as string,
        photos: params.photos ? JSON.parse(params.photos as string) : undefined,
    };

    const [loading, setLoading] = useState(false);

    // Calculer le poids total estimé basé sur les types et quantités de linge
    const calculateEstimatedWeight = () => {
        let totalWeight = 0;
        orderData.services.forEach(service => {
            service.items.forEach(item => {
                totalWeight += (LINEN_WEIGHTS[item.type] || 0.5) * item.quantity;
            });
        });
        return totalWeight;
    };

    // Calculer le nombre total d'articles
    const calculateTotalItems = () => {
        return orderData.services.reduce((total, service) => {
            return total + service.items.reduce((sum, item) => sum + item.quantity, 0);
        }, 0);
    };

    // Calculate estimated price
    const calculatePrice = () => {
        const estimatedWeight = calculateEstimatedWeight();
        let totalPrice = 0;
        orderData.services.forEach(service => {
            const serviceInfo = SERVICES_MAP[service.service];
            // Pour simplifier, on utilise le poids total divisé par le nombre de services
            totalPrice += serviceInfo.pricePerKg * (estimatedWeight / orderData.services.length);
        });
        return totalPrice;
    };

    const estimatedWeight = calculateEstimatedWeight();
    const totalItems = calculateTotalItems();
    const estimatedPrice = calculatePrice();

    const handleConfirm = async () => {
        try {
            setLoading(true);
            const newOrder = await createOrder(orderData);

            Alert.alert(
                'Commande créée!',
                `Votre commande ${newOrder.orderNumber} a été créée avec succès`,
                [
                    {
                        text: 'Voir mes commandes',
                        onPress: () => router.replace('/(hotel)/orders'),
                    },
                    {
                        text: 'Retour au dashboard',
                        onPress: () => router.replace('/(hotel)/dashboard'),
                    },
                ]
            );
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de créer la commande. Veuillez réessayer.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (isoDate: string) => {
        const date = new Date(isoDate);
        return date.toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

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
                    <ThemedText variate="headline" color="textPrimary">
                        Validation de la commande
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                {/* Validation Message */}
                <Card style={{ backgroundColor: colors.hotelPrimary + '15' }}>
                    <View style={styles.validationHeader}>
                        <Text style={styles.validationIcon}>✓</Text>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle1" color="textPrimary">
                                Vérifiez votre commande
                            </ThemedText>
                            <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                                Assurez-vous que toutes les informations sont correctes avant de confirmer
                            </ThemedText>
                        </View>
                    </View>
                </Card>

                {/* Services and Linen Items Section */}
                {orderData.services.map((service, serviceIndex) => {
                    const serviceInfo = SERVICES_MAP[service.service];
                    return (
                        <Card key={serviceIndex}>
                            <View style={styles.serviceHeader}>
                                <Text style={styles.serviceHeaderIcon}>{serviceInfo.icon}</Text>
                                <ThemedText variate="subtitle1" color="textPrimary">
                                    {serviceInfo.label}
                                </ThemedText>
                                <ThemedText variate="body3" color="textSecondary" style={{ marginLeft: 'auto' }}>
                                    {serviceInfo.pricePerKg} FCFA/kg
                                </ThemedText>
                            </View>

                            <View style={styles.itemsList}>
                                {service.items.map((item, itemIndex) => (
                                    <View key={itemIndex} style={styles.linenItem}>
                                        <ThemedText variate="body2" color="textPrimary">
                                            {LINEN_TYPES_MAP[item.type]}
                                        </ThemedText>
                                        <View style={styles.itemQuantity}>
                                            <ThemedText variate="body2" color="hotelPrimary" style={{ fontWeight: 'bold' }}>
                                                ×{item.quantity}
                                            </ThemedText>
                                            <ThemedText variate="caption" color="textSecondary" style={{ marginLeft: 8 }}>
                                                (~{(LINEN_WEIGHTS[item.type] * item.quantity).toFixed(1)} kg)
                                            </ThemedText>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </Card>
                    );
                })}

                {/* Summary Section */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Récapitulatif
                    </ThemedText>
                    <View style={styles.summaryRow}>
                        <ThemedText variate="body3" color="textSecondary">
                            Services:
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            {orderData.services.length} service{orderData.services.length > 1 ? 's' : ''}
                        </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText variate="body3" color="textSecondary">
                            Total articles:
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            {totalItems} article{totalItems > 1 ? 's' : ''}
                        </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText variate="body3" color="textSecondary">
                            Poids estimé:
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            ~{estimatedWeight.toFixed(1)} kg
                        </ThemedText>
                    </View>
                </Card>

                {/* Collection Date Section */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Date de collecte
                    </ThemedText>
                    <View style={styles.dateDisplay}>
                        <Text style={styles.dateIcon}>📅</Text>
                        <View>
                            <ThemedText variate="body1" color="textPrimary">
                                {formatDate(orderData.collectionDate)}
                            </ThemedText>
                            <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                                {new Date(orderData.collectionDate).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}
                            </ThemedText>
                        </View>
                    </View>
                </Card>

                {/* Instructions Section */}
                {orderData.instructions && (
                    <Card>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                            Instructions spéciales
                        </ThemedText>
                        <View style={[styles.instructionsBox, { backgroundColor: colors.surface }]}>
                            <ThemedText variate="body2" color="textSecondary">
                                {orderData.instructions}
                            </ThemedText>
                        </View>
                    </Card>
                )}

                {/* Photos Section */}
                {orderData.photos && orderData.photos.length > 0 && (
                    <Card>
                        <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                            Photos jointes
                        </ThemedText>
                        <ThemedText variate="body3" color="textSecondary">
                            {orderData.photos.length} photo(s) ajoutée(s)
                        </ThemedText>
                    </Card>
                )}

                {/* Price Estimate Section */}
                <Card style={{ backgroundColor: colors.hotelPrimary + '10' }}>
                    <View style={styles.priceSection}>
                        <View>
                            <ThemedText variate="body3" color="textSecondary">
                                Estimation du coût
                            </ThemedText>
                            <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                                ({totalItems} articles × ~{estimatedWeight.toFixed(1)} kg)
                            </ThemedText>
                        </View>
                        <View>
                            <ThemedText variate="headline" color="hotelPrimary" style={{ textAlign: 'right' }}>
                                ~{Math.round(estimatedPrice).toLocaleString('fr-FR')} FCFA
                            </ThemedText>
                            <ThemedText variate="body3" color="textSecondary" style={{ marginTop: 4 }}>
                                Prix indicatif
                            </ThemedText>
                        </View>
                    </View>
                </Card>

                {/* Info Notice */}
                <View style={[styles.noticeBox, { backgroundColor: colors.surface }]}>
                    <Text style={styles.noticeIcon}>ℹ️</Text>
                    <ThemedText variate="body3" color="textSecondary" style={{ flex: 1 }}>
                        Le prix final sera calculé après pesée lors de la collecte. Un devis détaillé vous sera envoyé.
                    </ThemedText>
                </View>
            </ScrollView>

            {/* Action Buttons */}
            <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
                <Button
                    title="Retour"
                    onPress={() => router.back()}
                    variant="outline"
                    style={{ flex: 1, marginRight: 8 }}
                />
                <Button
                    title={loading || isLoading ? "Création..." : "Confirmer la commande"}
                    onPress={handleConfirm}
                    variant="primary"
                    disabled={loading || isLoading}
                    style={{ flex: 2, marginLeft: 8 }}
                />
            </View>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    validationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    validationIcon: {
        fontSize: 32,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        paddingBottom: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    serviceHeaderIcon: {
        fontSize: 24,
        marginRight: Spacing.sm,
    },
    itemsList: {
        gap: Spacing.xs,
    },
    linenItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.sm,
        backgroundColor: '#f8f8f8',
        borderRadius: 6,
    },
    itemQuantity: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    dateDisplay: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    dateIcon: {
        fontSize: 32,
    },
    instructionsBox: {
        padding: Spacing.md,
        borderRadius: 8,
    },
    priceSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noticeBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        padding: Spacing.md,
        borderRadius: 8,
        marginTop: Spacing.sm,
    },
    noticeIcon: {
        fontSize: 16,
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
