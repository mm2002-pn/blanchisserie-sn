import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    Modal,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock data structure matching backoffice
type TriageItem = {
    linenTypeCode: string;
    linenTypeName: string;
    weight: number;
    pieces: number;
    unitPrice: number;
    totalPrice: number;
};

type DeliveryStatus =
    | 'Prêt pour livraison'
    | 'En route'
    | 'Sur place'
    | 'Livraison en cours'
    | 'Livrée';

type Photo = {
    uri: string;
    timestamp: string;
};

type DeliveryOrder = {
    id: string;
    orderNumber: string;
    clientName: string;
    clientAddress: string;
    status: DeliveryStatus;
    actualWeight: number;
    deliveryDate: string;
    deliveryTime: string;
    triage: {
        completedAt: string;
        items: TriageItem[];
        totalWeight: number;
        totalPieces: number;
        totalAmount: number;
    };
    deliveryProgress?: {
        startedAt?: string;
        arrivedAt?: string;
        photos: Photo[];
        signatureUri?: string;
        completedAt?: string;
        recipientName?: string;
    };
};

// Mock deliveries for the current driver
const mockDeliveries: DeliveryOrder[] = [
    {
        id: 'ord-001',
        orderNumber: 'CMD-2024-089',
        clientName: 'Hôtel Plaza',
        clientAddress: 'Route de la Corniche Ouest, Dakar',
        status: 'Prêt pour livraison',
        actualWeight: 840000, // en grammes
        deliveryDate: '2025-12-30',
        deliveryTime: '14:00',
        triage: {
            completedAt: '2024-12-20T10:30:00Z',
            items: [
                {
                    linenTypeCode: 'LP-001',
                    linenTypeName: 'Drap 2 personnes',
                    weight: 400000,
                    pieces: 500,
                    unitPrice: 300,
                    totalPrice: 120000,
                },
                {
                    linenTypeCode: 'LP-002',
                    linenTypeName: 'Drap 1 personne',
                    weight: 100000,
                    pieces: 167,
                    unitPrice: 400,
                    totalPrice: 40000,
                },
                {
                    linenTypeCode: 'LP-005',
                    linenTypeName: 'Grande serviette',
                    weight: 240000,
                    pieces: 480,
                    unitPrice: 250,
                    totalPrice: 60000,
                },
                {
                    linenTypeCode: 'LF-009',
                    linenTypeName: 'Nappe légère',
                    weight: 0,
                    pieces: 60,
                    unitPrice: 500,
                    totalPrice: 30000,
                },
                {
                    linenTypeCode: 'LF-002',
                    linenTypeName: 'Chemise',
                    weight: 0,
                    pieces: 40,
                    unitPrice: 400,
                    totalPrice: 16000,
                },
            ],
            totalWeight: 740000,
            totalPieces: 1247,
            totalAmount: 266000,
        },
    },
    {
        id: 'ord-002',
        orderNumber: 'CMD-2024-088',
        clientName: 'Hôtel Savana',
        clientAddress: 'Avenue Cheikh Anta Diop, Dakar',
        status: 'Prêt pour livraison',
        actualWeight: 820000,
        deliveryDate: '2025-12-30',
        deliveryTime: '16:00',
        triage: {
            completedAt: '2024-12-15T10:30:00Z',
            items: [
                {
                    linenTypeCode: 'LP-001',
                    linenTypeName: 'Drap 2 personnes',
                    weight: 480000,
                    pieces: 600,
                    unitPrice: 300,
                    totalPrice: 144000,
                },
                {
                    linenTypeCode: 'LP-005',
                    linenTypeName: 'Grande serviette',
                    weight: 280000,
                    pieces: 560,
                    unitPrice: 250,
                    totalPrice: 70000,
                },
                {
                    linenTypeCode: 'LF-009',
                    linenTypeName: 'Nappe légère',
                    weight: 0,
                    pieces: 40,
                    unitPrice: 500,
                    totalPrice: 20000,
                },
            ],
            totalWeight: 760000,
            totalPieces: 1200,
            totalAmount: 234000,
        },
    },
];

const STORAGE_KEY = '@driver_deliveries';

export default function DeliveryScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<DeliveryOrder | null>(null);
    const [deliveryStep, setDeliveryStep] = useState<'list' | 'details' | 'complete'>('list');
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [recipientName, setRecipientName] = useState('');

    // Load deliveries from storage on mount
    useEffect(() => {
        loadDeliveries();
    }, []);

    const loadDeliveries = async () => {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setDeliveries(JSON.parse(stored));
            } else {
                // Initialize with mock data on first load
                setDeliveries(mockDeliveries);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDeliveries));
            }
        } catch (error) {
            console.error('Error loading deliveries:', error);
            setDeliveries(mockDeliveries);
        }
    };

    const saveDeliveries = async (updatedDeliveries: DeliveryOrder[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDeliveries));
            setDeliveries(updatedDeliveries);
        } catch (error) {
            console.error('Error saving deliveries:', error);
        }
    };

    const updateDeliveryStatus = (deliveryId: string, newStatus: DeliveryStatus, progress?: any) => {
        const updatedDeliveries = deliveries.map((delivery) => {
            if (delivery.id === deliveryId) {
                return {
                    ...delivery,
                    status: newStatus,
                    deliveryProgress: progress || delivery.deliveryProgress,
                };
            }
            return delivery;
        });
        saveDeliveries(updatedDeliveries);

        // Update selected delivery if it's the one being modified
        if (selectedDelivery?.id === deliveryId) {
            const updated = updatedDeliveries.find((d) => d.id === deliveryId);
            if (updated) setSelectedDelivery(updated);
        }
    };

    const formatWeight = (weightInGrams: number) => {
        return `${(weightInGrams / 1000).toFixed(1)} kg`;
    };

    const formatCurrency = (amount: number) => {
        return `${amount.toLocaleString()} FCFA`;
    };

    const handleSelectDelivery = (delivery: DeliveryOrder) => {
        setSelectedDelivery(delivery);
        setDeliveryStep('details');
    };

    const handleStartRoute = () => {
        if (!selectedDelivery) return;

        Alert.alert(
            'Démarrer la tournée',
            'Êtes-vous prêt à commencer la livraison ?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Démarrer',
                    onPress: () => {
                        const progress = {
                            startedAt: new Date().toISOString(),
                            photos: [],
                        };
                        updateDeliveryStatus(selectedDelivery.id, 'En route', progress);
                        Alert.alert('En route', 'Livraison démarrée. Bonne route !');
                    },
                },
            ]
        );
    };

    const handleArrived = () => {
        if (!selectedDelivery) return;

        const progress = {
            ...selectedDelivery.deliveryProgress,
            arrivedAt: new Date().toISOString(),
            photos: selectedDelivery.deliveryProgress?.photos || [],
        };
        updateDeliveryStatus(selectedDelivery.id, 'Sur place', progress);
        Alert.alert('Sur place', 'Vous êtes arrivé chez le client');
    };

    const handleStartDelivery = () => {
        if (!selectedDelivery) return;

        const progress = {
            ...selectedDelivery.deliveryProgress,
            photos: selectedDelivery.deliveryProgress?.photos || [],
        };
        updateDeliveryStatus(selectedDelivery.id, 'Livraison en cours', progress);
        setDeliveryStep('complete');
    };

    const handleTakePhoto = () => {
        if (!selectedDelivery) return;

        // Simulate taking photo with timestamp
        const newPhoto: Photo = {
            uri: `photo_${Date.now()}.jpg`,
            timestamp: new Date().toISOString(),
        };

        const photos = [...(selectedDelivery.deliveryProgress?.photos || []), newPhoto];
        const progress = {
            ...selectedDelivery.deliveryProgress,
            photos,
        };

        updateDeliveryStatus(selectedDelivery.id, selectedDelivery.status, progress);
        Alert.alert(
            'Photo ajoutée',
            `Photo ${photos.length} enregistrée avec succès`,
            [{ text: 'OK' }]
        );
    };

    const handleSignature = () => {
        setShowSignatureModal(true);
    };

    const handleSaveSignature = () => {
        if (!selectedDelivery || !recipientName.trim()) {
            Alert.alert('Attention', 'Veuillez entrer le nom du destinataire');
            return;
        }

        const progress = {
            ...selectedDelivery.deliveryProgress,
            signatureUri: `signature_${Date.now()}.png`,
            recipientName: recipientName.trim(),
            photos: selectedDelivery.deliveryProgress?.photos || [],
        };

        updateDeliveryStatus(selectedDelivery.id, selectedDelivery.status, progress);
        setShowSignatureModal(false);
        setRecipientName('');
        Alert.alert('Signature enregistrée', `Signé par: ${recipientName.trim()}`);
    };

    const handleCompleteDelivery = () => {
        if (!selectedDelivery) return;

        const photos = selectedDelivery.deliveryProgress?.photos || [];
        const signature = selectedDelivery.deliveryProgress?.signatureUri;

        if (photos.length === 0 || !signature) {
            Alert.alert(
                'Attention',
                'Veuillez prendre au moins une photo et obtenir la signature avant de terminer'
            );
            return;
        }

        Alert.alert(
            'Confirmer la livraison',
            `Confirmer la livraison ${selectedDelivery.orderNumber} ?\n\nRécipient: ${selectedDelivery.deliveryProgress?.recipientName}\nPhotos: ${photos.length}`,
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Confirmer',
                    onPress: () => {
                        const progress = {
                            ...selectedDelivery.deliveryProgress,
                            completedAt: new Date().toISOString(),
                            photos,
                            signatureUri: signature,
                        };

                        updateDeliveryStatus(selectedDelivery.id, 'Livrée', progress);

                        Alert.alert(
                            'Livraison terminée',
                            `La livraison a été enregistrée avec succès !`,
                            [
                                {
                                    text: 'OK',
                                    onPress: () => {
                                        setSelectedDelivery(null);
                                        setDeliveryStep('list');
                                    },
                                },
                            ]
                        );
                    },
                },
            ]
        );
    };

    const getStatusColor = (status: DeliveryStatus) => {
        switch (status) {
            case 'Prêt pour livraison':
                return '#3B82F6'; // Blue
            case 'En route':
                return '#F59E0B'; // Orange
            case 'Sur place':
                return '#8B5CF6'; // Purple
            case 'Livraison en cours':
                return '#EC4899'; // Pink
            case 'Livrée':
                return '#10B981'; // Green
            default:
                return '#6B7280'; // Gray
        }
    };

    const activeDeliveries = deliveries.filter((d) => d.status !== 'Livrée');
    const completedDeliveries = deliveries.filter((d) => d.status === 'Livrée');

    // LIST VIEW - Show all deliveries for the driver
    if (deliveryStep === 'list') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <ThemedText variate="headline" color="textPrimary">
                        Mes Livraisons
                    </ThemedText>
                    <View style={styles.badge}>
                        <Text style={[styles.badgeText, { color: colors.driverPrimary }]}>
                            {activeDeliveries.length}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {activeDeliveries.length > 0 && (
                        <ThemedText
                            variate="subtitle2"
                            color="textSecondary"
                            style={{ marginBottom: Spacing.md }}
                        >
                            🚚 Livraisons en cours ({activeDeliveries.length})
                        </ThemedText>
                    )}

                    {activeDeliveries.map((delivery, index) => (
                        <TouchableOpacity
                            key={delivery.id}
                            onPress={() => handleSelectDelivery(delivery)}
                            activeOpacity={0.7}
                        >
                            <Card style={styles.deliveryCard}>
                                <View style={styles.deliveryHeader}>
                                    <View style={styles.deliveryNumber}>
                                        <Text style={[styles.deliveryNumberText, { color: colors.driverPrimary }]}>
                                            {index + 1}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <ThemedText variate="subtitle2" color="textPrimary">
                                            {delivery.orderNumber}
                                        </ThemedText>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {delivery.clientName}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.deliveryTime}>
                                        <Text style={styles.timeIcon}>🕐</Text>
                                        <ThemedText variate="subtitle3" color="textPrimary">
                                            {delivery.deliveryTime}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.deliveryStats}>
                                    <View style={styles.stat}>
                                        <Text style={styles.statIcon}>⚖️</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {formatWeight(delivery.actualWeight)}
                                        </ThemedText>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statIcon}>📦</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {delivery.triage.totalPieces} pièces
                                        </ThemedText>
                                    </View>
                                    <View style={styles.stat}>
                                        <Text style={styles.statIcon}>💰</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {formatCurrency(delivery.triage.totalAmount)}
                                        </ThemedText>
                                    </View>
                                </View>

                                <View style={styles.deliveryAddress}>
                                    <Text style={styles.addressIcon}>📍</Text>
                                    <ThemedText variate="caption" color="textSecondary" style={{ flex: 1 }}>
                                        {delivery.clientAddress}
                                    </ThemedText>
                                </View>

                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(delivery.status) + '15' },
                                    ]}
                                >
                                    <ThemedText
                                        variate="caption"
                                        style={{ color: getStatusColor(delivery.status), fontWeight: '600' }}
                                    >
                                        {delivery.status}
                                    </ThemedText>
                                </View>
                            </Card>
                        </TouchableOpacity>
                    ))}

                    {activeDeliveries.length === 0 && completedDeliveries.length === 0 && (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <ThemedText variate="subtitle2" color="textSecondary">
                                Aucune livraison pour aujourd'hui
                            </ThemedText>
                        </View>
                    )}

                    {/* Completed Deliveries Section */}
                    {completedDeliveries.length > 0 && (
                        <>
                            <ThemedText
                                variate="subtitle2"
                                color="textSecondary"
                                style={{ marginTop: Spacing.xl, marginBottom: Spacing.md }}
                            >
                                ✅ Livraisons terminées ({completedDeliveries.length})
                            </ThemedText>

                            {completedDeliveries.map((delivery, index) => (
                                <TouchableOpacity
                                    key={delivery.id}
                                    onPress={() => handleSelectDelivery(delivery)}
                                    activeOpacity={0.7}
                                >
                                    <Card style={[styles.deliveryCard, { opacity: 0.7 }]}>
                                        <View style={styles.deliveryHeader}>
                                            <View style={[styles.deliveryNumber, { backgroundColor: '#10B98120' }]}>
                                                <Text style={[styles.deliveryNumberText, { color: '#10B981' }]}>
                                                    ✓
                                                </Text>
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <ThemedText variate="subtitle2" color="textPrimary">
                                                    {delivery.orderNumber}
                                                </ThemedText>
                                                <ThemedText variate="caption" color="textSecondary">
                                                    {delivery.clientName}
                                                </ThemedText>
                                            </View>
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: '#10B98115' },
                                            ]}
                                        >
                                            <ThemedText
                                                variate="caption"
                                                style={{ color: '#10B981', fontWeight: '600' }}
                                            >
                                                Livrée • {delivery.deliveryProgress?.recipientName}
                                            </ThemedText>
                                        </View>
                                    </Card>
                                </TouchableOpacity>
                            ))}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // DETAILS VIEW - Show delivery slip (bordereau) with all triage info
    if (deliveryStep === 'details' && selectedDelivery) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => setDeliveryStep('list')}
                        style={styles.backButton}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <ThemedText variate="headline" color="textPrimary">
                        Bordereau de Livraison
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order Header */}
                    <Card style={[styles.slipHeader, { backgroundColor: colors.driverPrimary + '10' }]}>
                        <View style={styles.slipRow}>
                            <ThemedText variate="subtitle3" color="textSecondary">
                                Commande
                            </ThemedText>
                            <ThemedText variate="subtitle1" color="textPrimary">
                                {selectedDelivery.orderNumber}
                            </ThemedText>
                        </View>
                        <View style={styles.slipRow}>
                            <ThemedText variate="subtitle3" color="textSecondary">
                                Client
                            </ThemedText>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                {selectedDelivery.clientName}
                            </ThemedText>
                        </View>
                        <View style={styles.slipRow}>
                            <Text style={styles.addressIcon}>📍</Text>
                            <ThemedText variate="caption" color="textSecondary" style={{ flex: 1 }}>
                                {selectedDelivery.clientAddress}
                            </ThemedText>
                        </View>
                    </Card>

                    {/* Weight Summary */}
                    <Card style={styles.summaryCard}>
                        <ThemedText variate="subtitle2" color="textPrimary" style={styles.sectionTitle}>
                            📊 Résumé Global
                        </ThemedText>
                        <View style={styles.summaryGrid}>
                            <View style={styles.summaryItem}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Poids total
                                </ThemedText>
                                <ThemedText variate="subtitle1" style={{ color: colors.driverPrimary }}>
                                    {formatWeight(selectedDelivery.triage.totalWeight)}
                                </ThemedText>
                            </View>
                            <View style={styles.summaryItem}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Pièces totales
                                </ThemedText>
                                <ThemedText variate="subtitle1" style={{ color: colors.driverPrimary }}>
                                    {selectedDelivery.triage.totalPieces}
                                </ThemedText>
                            </View>
                            <View style={[styles.summaryItem, styles.summaryItemFull]}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Montant total
                                </ThemedText>
                                <ThemedText variate="headline" style={{ color: '#10B981' }}>
                                    {formatCurrency(selectedDelivery.triage.totalAmount)}
                                </ThemedText>
                            </View>
                        </View>
                    </Card>

                    {/* Triage Details */}
                    <Card style={styles.triageCard}>
                        <ThemedText variate="subtitle2" color="textPrimary" style={styles.sectionTitle}>
                            📋 Détail du Linge
                        </ThemedText>
                        <View style={styles.triageTable}>
                            {/* Table Header */}
                            <View style={styles.tableHeader}>
                                <ThemedText
                                    variate="caption"
                                    color="textSecondary"
                                    style={[styles.tableCell, styles.tableCellType]}
                                >
                                    Type de linge
                                </ThemedText>
                                <ThemedText
                                    variate="caption"
                                    color="textSecondary"
                                    style={[styles.tableCell, styles.tableCellQty]}
                                >
                                    Pièces
                                </ThemedText>
                                <ThemedText
                                    variate="caption"
                                    color="textSecondary"
                                    style={[styles.tableCell, styles.tableCellWeight]}
                                >
                                    Poids
                                </ThemedText>
                                <ThemedText
                                    variate="caption"
                                    color="textSecondary"
                                    style={[styles.tableCell, styles.tableCellPrice]}
                                >
                                    Montant
                                </ThemedText>
                            </View>

                            {/* Table Rows */}
                            {selectedDelivery.triage.items.map((item, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.tableRow,
                                        index % 2 === 0 && { backgroundColor: '#F9FAFB' },
                                    ]}
                                >
                                    <View style={[styles.tableCell, styles.tableCellType]}>
                                        <ThemedText variate="caption" color="textPrimary">
                                            {item.linenTypeCode}
                                        </ThemedText>
                                        <ThemedText variate="caption" color="textSecondary">
                                            {item.linenTypeName}
                                        </ThemedText>
                                    </View>
                                    <ThemedText
                                        variate="subtitle3"
                                        color="textPrimary"
                                        style={[styles.tableCell, styles.tableCellQty]}
                                    >
                                        {item.pieces}
                                    </ThemedText>
                                    <ThemedText
                                        variate="caption"
                                        color="textSecondary"
                                        style={[styles.tableCell, styles.tableCellWeight]}
                                    >
                                        {item.weight > 0 ? formatWeight(item.weight) : '-'}
                                    </ThemedText>
                                    <ThemedText
                                        variate="subtitle3"
                                        style={[
                                            styles.tableCell,
                                            styles.tableCellPrice,
                                            { color: '#10B981' },
                                        ]}
                                    >
                                        {formatCurrency(item.totalPrice)}
                                    </ThemedText>
                                </View>
                            ))}

                            {/* Table Footer */}
                            <View style={[styles.tableRow, styles.tableFooter]}>
                                <ThemedText
                                    variate="subtitle2"
                                    color="textPrimary"
                                    style={[styles.tableCell, styles.tableCellType]}
                                >
                                    TOTAL
                                </ThemedText>
                                <ThemedText
                                    variate="subtitle1"
                                    style={[
                                        styles.tableCell,
                                        styles.tableCellQty,
                                        { color: colors.driverPrimary },
                                    ]}
                                >
                                    {selectedDelivery.triage.totalPieces}
                                </ThemedText>
                                <ThemedText
                                    variate="subtitle2"
                                    style={[
                                        styles.tableCell,
                                        styles.tableCellWeight,
                                        { color: colors.driverPrimary },
                                    ]}
                                >
                                    {formatWeight(selectedDelivery.triage.totalWeight)}
                                </ThemedText>
                                <ThemedText
                                    variate="subtitle1"
                                    style={[styles.tableCell, styles.tableCellPrice, { color: '#10B981' }]}
                                >
                                    {formatCurrency(selectedDelivery.triage.totalAmount)}
                                </ThemedText>
                            </View>
                        </View>
                    </Card>

                    {/* Status Progress Indicator */}
                    <Card style={styles.progressCard}>
                        <ThemedText variate="subtitle2" color="textPrimary" style={{ marginBottom: Spacing.md }}>
                            📍 État de la livraison
                        </ThemedText>
                        <View style={styles.progressSteps}>
                            <View style={styles.progressStep}>
                                <View
                                    style={[
                                        styles.progressDot,
                                        {
                                            backgroundColor:
                                                selectedDelivery.status !== 'Prêt pour livraison'
                                                    ? '#10B981'
                                                    : '#E5E7EB',
                                        },
                                    ]}
                                >
                                    {selectedDelivery.status !== 'Prêt pour livraison' && (
                                        <Text style={styles.progressCheck}>✓</Text>
                                    )}
                                </View>
                                <ThemedText variate="caption" color="textSecondary">
                                    Démarré
                                </ThemedText>
                            </View>
                            <View style={styles.progressLine} />
                            <View style={styles.progressStep}>
                                <View
                                    style={[
                                        styles.progressDot,
                                        {
                                            backgroundColor:
                                                selectedDelivery.status === 'Sur place' ||
                                                selectedDelivery.status === 'Livraison en cours' ||
                                                selectedDelivery.status === 'Livrée'
                                                    ? '#10B981'
                                                    : '#E5E7EB',
                                        },
                                    ]}
                                >
                                    {(selectedDelivery.status === 'Sur place' ||
                                        selectedDelivery.status === 'Livraison en cours' ||
                                        selectedDelivery.status === 'Livrée') && (
                                        <Text style={styles.progressCheck}>✓</Text>
                                    )}
                                </View>
                                <ThemedText variate="caption" color="textSecondary">
                                    Sur place
                                </ThemedText>
                            </View>
                            <View style={styles.progressLine} />
                            <View style={styles.progressStep}>
                                <View
                                    style={[
                                        styles.progressDot,
                                        {
                                            backgroundColor:
                                                selectedDelivery.status === 'Livrée'
                                                    ? '#10B981'
                                                    : '#E5E7EB',
                                        },
                                    ]}
                                >
                                    {selectedDelivery.status === 'Livrée' && (
                                        <Text style={styles.progressCheck}>✓</Text>
                                    )}
                                </View>
                                <ThemedText variate="caption" color="textSecondary">
                                    Livrée
                                </ThemedText>
                            </View>
                        </View>
                    </Card>

                    {/* Action Buttons based on status */}
                    {selectedDelivery.status === 'Prêt pour livraison' && (
                        <Button
                            title="🚚 Démarrer la livraison"
                            onPress={handleStartRoute}
                            style={styles.actionButton}
                        />
                    )}

                    {selectedDelivery.status === 'En route' && (
                        <Button
                            title="📍 Je suis arrivé"
                            onPress={handleArrived}
                            style={styles.actionButton}
                        />
                    )}

                    {(selectedDelivery.status === 'Sur place' ||
                        selectedDelivery.status === 'Livraison en cours') && (
                        <Button
                            title="📦 Commencer la remise"
                            onPress={handleStartDelivery}
                            style={styles.actionButton}
                        />
                    )}

                    {selectedDelivery.status === 'Livrée' && (
                        <View style={styles.completedBanner}>
                            <Text style={styles.completedIcon}>✅</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="subtitle2" style={{ color: '#10B981' }}>
                                    Livraison terminée
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    Récipient: {selectedDelivery.deliveryProgress?.recipientName}
                                </ThemedText>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    // COMPLETE VIEW - Photos and signature
    if (deliveryStep === 'complete' && selectedDelivery) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => setDeliveryStep('details')}
                        style={styles.backButton}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <ThemedText variate="headline" color="textPrimary">
                        Finaliser la livraison
                    </ThemedText>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Card style={styles.clientInfoCard}>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {selectedDelivery.clientName}
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            {selectedDelivery.orderNumber}
                        </ThemedText>
                    </Card>

                    {/* Step 1: Photos */}
                    <Card style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View
                                style={[
                                    styles.stepNumber,
                                    {
                                        backgroundColor:
                                            (selectedDelivery.deliveryProgress?.photos.length || 0) > 0
                                                ? colors.driverPrimary
                                                : '#E5E7EB',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepNumberText,
                                        {
                                            color:
                                                (selectedDelivery.deliveryProgress?.photos.length || 0) > 0
                                                    ? '#FFFFFF'
                                                    : '#9CA3AF',
                                        },
                                    ]}
                                >
                                    {(selectedDelivery.deliveryProgress?.photos.length || 0) > 0 ? '✓' : '1'}
                                </Text>
                            </View>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Photos preuve de livraison
                            </ThemedText>
                        </View>
                        <TouchableOpacity style={styles.photoButton} onPress={handleTakePhoto}>
                            <Text style={styles.photoIcon}>📸</Text>
                            <ThemedText variate="body3" color="textSecondary">
                                {(selectedDelivery.deliveryProgress?.photos.length || 0) === 0
                                    ? 'Ajouter des photos'
                                    : `${selectedDelivery.deliveryProgress?.photos.length} photo(s) ajoutée(s)`}
                            </ThemedText>
                        </TouchableOpacity>
                        {(selectedDelivery.deliveryProgress?.photos.length || 0) > 0 && (
                            <View style={styles.photosList}>
                                {selectedDelivery.deliveryProgress?.photos.map((photo, index) => (
                                    <View key={index} style={styles.photoItem}>
                                        <Text style={{ fontSize: 20 }}>📷</Text>
                                        <ThemedText variate="caption" color="textSecondary">
                                            Photo {index + 1}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Card>

                    {/* Step 2: Signature */}
                    <Card style={styles.stepCard}>
                        <View style={styles.stepHeader}>
                            <View
                                style={[
                                    styles.stepNumber,
                                    {
                                        backgroundColor: selectedDelivery.deliveryProgress?.signatureUri
                                            ? colors.driverPrimary
                                            : '#E5E7EB',
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.stepNumberText,
                                        {
                                            color: selectedDelivery.deliveryProgress?.signatureUri
                                                ? '#FFFFFF'
                                                : '#9CA3AF',
                                        },
                                    ]}
                                >
                                    {selectedDelivery.deliveryProgress?.signatureUri ? '✓' : '2'}
                                </Text>
                            </View>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Signature du client
                            </ThemedText>
                        </View>
                        {!selectedDelivery.deliveryProgress?.signatureUri ? (
                            <TouchableOpacity
                                style={styles.signatureButton}
                                onPress={handleSignature}
                            >
                                <Text style={styles.signatureIcon}>✍️</Text>
                                <ThemedText variate="body3" color="textSecondary">
                                    Demander la signature
                                </ThemedText>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.successBadge}>
                                <Text style={styles.successIcon}>✓</Text>
                                <View style={{ flex: 1 }}>
                                    <ThemedText
                                        variate="body3"
                                        style={{ color: colors.driverPrimary }}
                                    >
                                        Signature enregistrée
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Par: {selectedDelivery.deliveryProgress?.recipientName}
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    </Card>

                    <Button
                        title="✅ Terminer la livraison"
                        onPress={handleCompleteDelivery}
                        style={styles.actionButton}
                        disabled={
                            (selectedDelivery.deliveryProgress?.photos.length || 0) === 0 ||
                            !selectedDelivery.deliveryProgress?.signatureUri
                        }
                    />

                    {/* Signature Modal */}
                    <Modal
                        visible={showSignatureModal}
                        transparent={true}
                        animationType="slide"
                        onRequestClose={() => setShowSignatureModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                                <ThemedText variate="headline" color="textPrimary" style={{ marginBottom: Spacing.lg }}>
                                    Signature du client
                                </ThemedText>

                                <ThemedText variate="body3" color="textSecondary" style={{ marginBottom: Spacing.md }}>
                                    Nom du destinataire
                                </ThemedText>
                                <View style={styles.input}>
                                    <Text
                                        style={styles.inputText}
                                        onPress={() => {
                                            Alert.prompt(
                                                'Nom du destinataire',
                                                'Entrez le nom de la personne qui reçoit la livraison',
                                                (text) => setRecipientName(text),
                                                'plain-text',
                                                recipientName
                                            );
                                        }}
                                    >
                                        {recipientName || 'Toucher pour entrer le nom'}
                                    </Text>
                                </View>

                                <View style={styles.signaturePad}>
                                    <Text style={{ fontSize: 64, textAlign: 'center' }}>✍️</Text>
                                    <ThemedText variate="caption" color="textSecondary" style={{ textAlign: 'center' }}>
                                        Zone de signature
                                    </ThemedText>
                                </View>

                                <View style={styles.modalButtons}>
                                    <TouchableOpacity
                                        style={[styles.modalButton, styles.modalButtonSecondary]}
                                        onPress={() => {
                                            setShowSignatureModal(false);
                                            setRecipientName('');
                                        }}
                                    >
                                        <Text style={styles.modalButtonTextSecondary}>Annuler</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[
                                            styles.modalButton,
                                            styles.modalButtonPrimary,
                                            { backgroundColor: colors.driverPrimary },
                                        ]}
                                        onPress={handleSaveSignature}
                                    >
                                        <Text style={styles.modalButtonTextPrimary}>Valider</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return null;
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
    badge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.full,
    },
    badgeText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.bold,
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
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl + 20,
    },
    deliveryCard: {
        marginBottom: Spacing.md,
    },
    deliveryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    deliveryNumber: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    deliveryNumberText: {
        fontSize: Typography.fontSize.lg,
        fontWeight: Typography.fontWeight.bold,
    },
    deliveryTime: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    timeIcon: {
        fontSize: 16,
    },
    deliveryStats: {
        flexDirection: 'row',
        gap: Spacing.lg,
        marginBottom: Spacing.md,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    statIcon: {
        fontSize: 16,
    },
    deliveryAddress: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    addressIcon: {
        fontSize: 14,
    },
    statusBadge: {
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignSelf: 'flex-start',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.xxxl,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    slipHeader: {
        marginBottom: Spacing.lg,
    },
    slipRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    summaryCard: {
        marginBottom: Spacing.lg,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    summaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.md,
    },
    summaryItem: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F9FAFB',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
    },
    summaryItemFull: {
        minWidth: '100%',
        backgroundColor: '#F0FDF4',
    },
    triageCard: {
        marginBottom: Spacing.lg,
    },
    triageTable: {
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: Spacing.borderRadius.md,
        overflow: 'hidden',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
    },
    tableRow: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    tableFooter: {
        backgroundColor: '#F9FAFB',
    },
    tableCell: {
        justifyContent: 'center',
    },
    tableCellType: {
        flex: 2,
    },
    tableCellQty: {
        flex: 1,
        textAlign: 'center',
    },
    tableCellWeight: {
        flex: 1.2,
        textAlign: 'right',
    },
    tableCellPrice: {
        flex: 1.5,
        textAlign: 'right',
    },
    actionButton: {
        marginTop: Spacing.lg,
    },
    clientInfoCard: {
        marginBottom: Spacing.lg,
        backgroundColor: '#F0F9FF',
    },
    stepCard: {
        marginBottom: Spacing.lg,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.md,
    },
    stepNumber: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumberText: {
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.bold,
    },
    photoButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    photoIcon: {
        fontSize: 48,
    },
    signatureButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    signatureIcon: {
        fontSize: 48,
    },
    successBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: '#10B98110',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
    },
    successIcon: {
        fontSize: 20,
        color: '#10B981',
    },
    progressCard: {
        marginBottom: Spacing.lg,
    },
    progressSteps: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressStep: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    progressDot: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressCheck: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    progressLine: {
        flex: 1,
        height: 2,
        backgroundColor: '#E5E7EB',
        marginHorizontal: Spacing.xs,
    },
    completedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: '#10B98110',
        padding: Spacing.lg,
        borderRadius: Spacing.borderRadius.lg,
        marginTop: Spacing.lg,
    },
    completedIcon: {
        fontSize: 32,
    },
    photosList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    photoItem: {
        alignItems: 'center',
        gap: Spacing.xs,
        padding: Spacing.sm,
        backgroundColor: '#F3F4F6',
        borderRadius: Spacing.borderRadius.md,
        minWidth: 80,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: Spacing.xl,
        paddingBottom: Spacing.xxxl,
    },
    input: {
        borderWidth: 1,
        borderColor: '#D1D5DB',
        borderRadius: Spacing.borderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    inputText: {
        fontSize: Typography.fontSize.md,
        color: '#374151',
    },
    signaturePad: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#D1D5DB',
        borderRadius: Spacing.borderRadius.lg,
        padding: Spacing.xxxl,
        marginBottom: Spacing.lg,
        backgroundColor: '#F9FAFB',
    },
    modalButtons: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modalButton: {
        flex: 1,
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    modalButtonPrimary: {
        backgroundColor: '#3B82F6',
    },
    modalButtonSecondary: {
        backgroundColor: '#F3F4F6',
    },
    modalButtonTextPrimary: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
    modalButtonTextSecondary: {
        color: '#374151',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
    },
});
