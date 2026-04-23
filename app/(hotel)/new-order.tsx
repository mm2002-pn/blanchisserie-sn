import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useOrder } from '@/contexts/OrderContext';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Spacing } from '@/constants/Spacing';
import { ServiceType, LinenType, OrderService, LinenItem } from '@/types/order.types';

// Services disponibles (3 seulement)
const SERVICES = [
    { id: 'nettoyage' as ServiceType, label: 'Nettoyage', icon: '🧼' },
    { id: 'blanchisserie' as ServiceType, label: 'Blanchisserie', icon: '🧺' },
    { id: 'aqua_clean' as ServiceType, label: 'Aqua Clean', icon: '💧' },
];

// Types de linge disponibles
const LINEN_TYPES = [
    { id: 'drap' as LinenType, label: 'Drap' },
    { id: 'taie' as LinenType, label: 'Taie d\'oreiller' },
    { id: 'serviette' as LinenType, label: 'Serviette' },
    { id: 'nappe' as LinenType, label: 'Nappe' },
    { id: 'torchon' as LinenType, label: 'Torchon' },
    { id: 'rideau' as LinenType, label: 'Rideau' },
    { id: 'couverture' as LinenType, label: 'Couverture' },
    { id: 'housse' as LinenType, label: 'Housse de couette' },
    { id: 'peignoir' as LinenType, label: 'Peignoir' },
    { id: 'tapis' as LinenType, label: 'Tapis' },
];

export default function NewOrderScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { saveDraft, draftOrder } = useOrder();

    // État pour les services sélectionnés avec leurs items
    const [selectedServices, setSelectedServices] = useState<OrderService[]>(
        draftOrder?.services || []
    );
    const [collectionDate, setCollectionDate] = useState(draftOrder?.collectionDate || '');
    const [instructions, setInstructions] = useState(draftOrder?.instructions || '');
    const [loading, setLoading] = useState(false);

    // Vérifier si un service est sélectionné
    const isServiceSelected = (serviceId: ServiceType) => {
        return selectedServices.some(s => s.service === serviceId);
    };

    // Toggle service selection
    const toggleService = (serviceId: ServiceType) => {
        if (isServiceSelected(serviceId)) {
            // Retirer le service
            setSelectedServices(selectedServices.filter(s => s.service !== serviceId));
        } else {
            // Ajouter le service avec items vides
            setSelectedServices([...selectedServices, { service: serviceId, items: [] }]);
        }
    };

    // Obtenir les items d'un service
    const getServiceItems = (serviceId: ServiceType): LinenItem[] => {
        const service = selectedServices.find(s => s.service === serviceId);
        return service?.items || [];
    };

    // Obtenir la quantité d'un type de linge pour un service
    const getLinenQuantity = (serviceId: ServiceType, linenType: LinenType): number => {
        const items = getServiceItems(serviceId);
        const item = items.find(i => i.type === linenType);
        return item?.quantity || 0;
    };

    // Mettre à jour la quantité d'un type de linge pour un service
    const updateLinenQuantity = (serviceId: ServiceType, linenType: LinenType, quantity: number) => {
        setSelectedServices(prevServices => {
            return prevServices.map(service => {
                if (service.service !== serviceId) return service;

                const existingItemIndex = service.items.findIndex(i => i.type === linenType);

                if (quantity === 0) {
                    // Retirer l'item si quantité = 0
                    return {
                        ...service,
                        items: service.items.filter(i => i.type !== linenType),
                    };
                } else if (existingItemIndex >= 0) {
                    // Mettre à jour l'item existant
                    const newItems = [...service.items];
                    newItems[existingItemIndex] = { type: linenType, quantity };
                    return { ...service, items: newItems };
                } else {
                    // Ajouter un nouvel item
                    return {
                        ...service,
                        items: [...service.items, { type: linenType, quantity }],
                    };
                }
            });
        });
    };

    const handleSubmit = async () => {
        // Validation
        if (selectedServices.length === 0) {
            Alert.alert('Erreur', 'Veuillez sélectionner au moins un service');
            return;
        }

        // Vérifier que chaque service a au moins un item
        const servicesWithoutItems = selectedServices.filter(s => s.items.length === 0);
        if (servicesWithoutItems.length > 0) {
            Alert.alert('Erreur', 'Veuillez ajouter au moins un type de linge pour chaque service sélectionné');
            return;
        }

        if (!collectionDate) {
            Alert.alert('Erreur', 'Veuillez sélectionner une date de collecte');
            return;
        }

        try {
            setLoading(true);

            // Convert collection date to ISO format
            const isoDate = new Date(collectionDate).toISOString();

            // Save draft
            const orderData = {
                services: selectedServices,
                collectionDate: isoDate,
                instructions: instructions || undefined,
                photos: undefined,
            };

            await saveDraft(orderData);

            // Navigate to validation screen
            router.push({
                pathname: '/(hotel)/order-validation',
                params: {
                    services: JSON.stringify(selectedServices),
                    collectionDate: isoDate,
                    instructions: instructions || '',
                    photos: JSON.stringify([]),
                },
            });
        } catch (error) {
            Alert.alert('Erreur', 'Impossible de sauvegarder le brouillon');
            console.error(error);
        } finally {
            setLoading(false);
        }
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
                        Nouvelle Commande
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                {/* Services Selection */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Sélectionnez vos services
                    </ThemedText>
                    <View style={styles.servicesGrid}>
                        {SERVICES.map(service => (
                            <TouchableOpacity
                                key={service.id}
                                style={[
                                    styles.serviceCard,
                                    {
                                        backgroundColor: isServiceSelected(service.id)
                                            ? colors.hotelPrimary + '20'
                                            : colors.surface,
                                        borderColor: isServiceSelected(service.id)
                                            ? colors.hotelPrimary
                                            : colors.border,
                                    },
                                ]}
                                onPress={() => toggleService(service.id)}
                            >
                                <Text style={styles.serviceIcon}>{service.icon}</Text>
                                <ThemedText
                                    variate="body3"
                                    color="textPrimary"
                                    style={styles.serviceLabel}
                                >
                                    {service.label}
                                </ThemedText>
                                {isServiceSelected(service.id) && (
                                    <View
                                        style={[
                                            styles.checkmark,
                                            { backgroundColor: colors.hotelPrimary },
                                        ]}
                                    >
                                        <Text style={styles.checkmarkIcon}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Card>

                {/* Linen Items for Each Selected Service */}
                {selectedServices.map(service => {
                    const serviceInfo = SERVICES.find(s => s.id === service.service);
                    if (!serviceInfo) return null;

                    return (
                        <Card key={service.service}>
                            <View style={styles.serviceHeader}>
                                <Text style={styles.serviceHeaderIcon}>{serviceInfo.icon}</Text>
                                <ThemedText variate="subtitle1" color="textPrimary">
                                    {serviceInfo.label}
                                </ThemedText>
                            </View>
                            <ThemedText variate="caption" color="textSecondary" style={styles.subtitle}>
                                Indiquez la quantité pour chaque type de linge
                            </ThemedText>

                            {LINEN_TYPES.map(linen => (
                                <View key={linen.id} style={styles.linenRow}>
                                    <ThemedText variate="body3" color="textPrimary" style={styles.linenLabel}>
                                        {linen.label}
                                    </ThemedText>
                                    <View style={styles.quantityControl}>
                                        <TouchableOpacity
                                            style={[styles.quantityButton, { borderColor: colors.border }]}
                                            onPress={() => {
                                                const currentQty = getLinenQuantity(service.service, linen.id);
                                                if (currentQty > 0) {
                                                    updateLinenQuantity(service.service, linen.id, currentQty - 1);
                                                }
                                            }}
                                        >
                                            <Text style={styles.quantityButtonText}>−</Text>
                                        </TouchableOpacity>
                                        <TextInput
                                            style={[
                                                styles.quantityInput,
                                                {
                                                    color: colors.textPrimary,
                                                    borderColor: colors.border,
                                                },
                                            ]}
                                            value={getLinenQuantity(service.service, linen.id).toString()}
                                            onChangeText={(text) => {
                                                const qty = parseInt(text) || 0;
                                                updateLinenQuantity(service.service, linen.id, qty);
                                            }}
                                            keyboardType="numeric"
                                        />
                                        <TouchableOpacity
                                            style={[styles.quantityButton, { borderColor: colors.border }]}
                                            onPress={() => {
                                                const currentQty = getLinenQuantity(service.service, linen.id);
                                                updateLinenQuantity(service.service, linen.id, currentQty + 1);
                                            }}
                                        >
                                            <Text style={styles.quantityButtonText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                        </Card>
                    );
                })}

                {/* Details */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Détails de la commande
                    </ThemedText>

                    <Input
                        label="Date de collecte souhaitée"
                        placeholder="JJ/MM/AAAA"
                        value={collectionDate}
                        onChangeText={setCollectionDate}
                        leftIcon={<Text>📅</Text>}
                    />

                    <Input
                        label="Instructions spéciales - Optionnel"
                        placeholder="Ex: Linge délicat, traitement spécial..."
                        value={instructions}
                        onChangeText={setInstructions}
                        multiline
                        numberOfLines={4}
                        style={{ height: 100, textAlignVertical: 'top' }}
                        leftIcon={<Text>📝</Text>}
                    />
                </Card>

                {/* Photos Section */}
                <Card>
                    <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                        Photos (Optionnel)
                    </ThemedText>
                    <TouchableOpacity
                        style={[
                            styles.photoButton,
                            { backgroundColor: colors.surface, borderColor: colors.border },
                        ]}
                    >
                        <Text style={{ fontSize: 40 }}>📸</Text>
                        <ThemedText variate="body3" color="textSecondary">
                            Ajouter des photos
                        </ThemedText>
                    </TouchableOpacity>
                </Card>

                {/* Summary */}
                {selectedServices.length > 0 && (
                    <Card style={{ backgroundColor: colors.hotelPrimary + '10' }}>
                        <ThemedText variate="subtitle2" color="textPrimary" style={styles.sectionTitle}>
                            Résumé
                        </ThemedText>
                        <View style={styles.summaryRow}>
                            <ThemedText variate="body3" color="textSecondary">
                                Services:
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {selectedServices.length} service(s)
                            </ThemedText>
                        </View>
                        <View style={styles.summaryRow}>
                            <ThemedText variate="body3" color="textSecondary">
                                Total articles:
                            </ThemedText>
                            <ThemedText variate="body3" color="textPrimary">
                                {selectedServices.reduce((total, service) => {
                                    return total + service.items.reduce((sum, item) => sum + item.quantity, 0);
                                }, 0)}
                            </ThemedText>
                        </View>
                        {collectionDate && (
                            <View style={styles.summaryRow}>
                                <ThemedText variate="body3" color="textSecondary">
                                    Collecte:
                                </ThemedText>
                                <ThemedText variate="body3" color="textPrimary">
                                    {collectionDate}
                                </ThemedText>
                            </View>
                        )}
                    </Card>
                )}

                {/* Submit Button */}
                <Button
                    title="Continuer vers la validation"
                    onPress={handleSubmit}
                    loading={loading}
                    style={styles.submitButton}
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
        paddingBottom: Spacing.xxxl,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    subtitle: {
        marginBottom: Spacing.md,
    },
    servicesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    serviceCard: {
        flex: 1,
        minWidth: '28%',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
        borderWidth: 2,
        alignItems: 'center',
        position: 'relative',
    },
    serviceIcon: {
        fontSize: 32,
        marginBottom: Spacing.sm,
    },
    serviceLabel: {
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: Spacing.borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkIcon: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    serviceHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    serviceHeaderIcon: {
        fontSize: 24,
        marginRight: Spacing.sm,
    },
    linenRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    linenLabel: {
        flex: 1,
    },
    quantityControl: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    quantityInput: {
        width: 50,
        height: 32,
        textAlign: 'center',
        marginHorizontal: Spacing.sm,
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.md,
        fontSize: 14,
    },
    photoButton: {
        padding: Spacing.xl,
        borderRadius: Spacing.borderRadius.lg,
        borderWidth: 2,
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    submitButton: {
        marginTop: Spacing.lg,
    },
});
