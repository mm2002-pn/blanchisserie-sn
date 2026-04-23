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
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';

type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

const WORKFLOW_STEPS = [
    { step: 1, label: 'COMMANDES', icon: '📦', color: '#2196F3' },
    { step: 2, label: 'PESÉE', icon: '⚖️', color: '#9C27B0' },
    { step: 3, label: 'VÉRIFICATION', icon: '✂️', color: '#FF9800' },
    { step: 4, label: 'LAVAGE', icon: '💧', color: '#00BCD4' },
    { step: 5, label: 'SÉCHAGE', icon: '🌬️', color: '#4CAF50' },
    { step: 6, label: 'CALANDRAGE', icon: '✨', color: '#E91E63' },
    { step: 7, label: 'PRÉPARATION', icon: '📋', color: '#795548' },
];

export default function SupervisorProductionScreen() {
    const colors = useThemeColors();
    const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);

    const handleStepPress = (step: WorkflowStep) => {
        setCurrentStep(step);
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <CommandesStep colors={colors} onNext={() => setCurrentStep(2)} />;
            case 2:
                return <PeseeStep colors={colors} onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />;
            case 3:
                return <VerificationStep colors={colors} onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />;
            case 4:
                return <LavageStep colors={colors} onNext={() => setCurrentStep(5)} onBack={() => setCurrentStep(3)} />;
            case 5:
                return <SechageStep colors={colors} onNext={() => setCurrentStep(6)} onBack={() => setCurrentStep(4)} />;
            case 6:
                return <CalandrageStep colors={colors} onNext={() => setCurrentStep(7)} onBack={() => setCurrentStep(5)} />;
            case 7:
                return <PreparationStep colors={colors} onBack={() => setCurrentStep(6)} />;
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {WORKFLOW_STEPS.map((item, index) => {
                        const isActive = currentStep === item.step;
                        const isCompleted = currentStep > item.step;

                        return (
                            <TouchableOpacity
                                key={item.step}
                                style={styles.stepItem}
                                onPress={() => handleStepPress(item.step)}
                                disabled={item.step > currentStep}
                            >
                                <View
                                    style={[
                                        styles.stepCircle,
                                        {
                                            backgroundColor: isCompleted
                                                ? '#4CAF50'
                                                : isActive
                                                ? item.color
                                                : colors.border,
                                            opacity: item.step > currentStep ? 0.3 : 1,
                                        },
                                    ]}
                                >
                                    <Text style={styles.stepIcon}>
                                        {isCompleted ? '✓' : item.icon}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive ? item.color : colors.textSecondary,
                                            fontWeight: isActive ? 'bold' : 'normal',
                                        },
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {index < WORKFLOW_STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.stepLine,
                                            {
                                                backgroundColor: isCompleted
                                                    ? '#4CAF50'
                                                    : colors.border,
                                            },
                                        ]}
                                    />
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Step Content */}
            <ScrollView style={styles.content}>
                {renderStepContent()}
            </ScrollView>
        </SafeAreaView>
    );
}

// STEP 1: COMMANDES
function CommandesStep({ colors, onNext }: any) {
    const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

    const mockOrders = [
        { id: '1', client: 'Hôtel Plaza', items: 130, date: '04/01/2026' },
        { id: '2', client: 'Hôtel Savana', items: 53, date: '04/01/2026' },
        { id: '3', client: 'Hôtel Teranga', items: 235, date: '04/01/2026' },
    ];

    const toggleOrder = (id: string) => {
        if (selectedOrders.includes(id)) {
            setSelectedOrders(selectedOrders.filter(orderId => orderId !== id));
        } else {
            setSelectedOrders([...selectedOrders, id]);
        }
    };

    return (
        <View style={{ padding: Spacing.md }}>
            <Card>
                <ThemedText variate="headline" color="textPrimary" style={{ marginBottom: 8 }}>
                    Sélection des commandes
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ marginBottom: 16 }}>
                    Commandes collectées aujourd'hui
                </ThemedText>

                {mockOrders.map(order => (
                    <TouchableOpacity
                        key={order.id}
                        style={[
                            styles.orderCard,
                            {
                                backgroundColor: selectedOrders.includes(order.id)
                                    ? '#E3F2FD'
                                    : colors.cardBackground,
                                borderColor: selectedOrders.includes(order.id)
                                    ? '#2196F3'
                                    : colors.border,
                            },
                        ]}
                        onPress={() => toggleOrder(order.id)}
                    >
                        <View style={styles.orderHeader}>
                            <View style={styles.checkbox}>
                                {selectedOrders.includes(order.id) && (
                                    <Text style={{ fontSize: 18 }}>✓</Text>
                                )}
                            </View>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="subtitle1" color="textPrimary">
                                    {order.client}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    {order.items} pièces • {order.date}
                                </ThemedText>
                            </View>
                        </View>
                    </TouchableOpacity>
                ))}

                <Button
                    title={`Passer à la pesée (${selectedOrders.length} commandes)`}
                    onPress={onNext}
                    disabled={selectedOrders.length === 0}
                    style={{ marginTop: 16 }}
                />
            </Card>
        </View>
    );
}

// STEP 2: PESÉE
function PeseeStep({ colors, onNext, onBack }: any) {
    const [currentOrderIndex, setCurrentOrderIndex] = useState(0);
    const mockLinenTypes = [
        { type: 'Drap', quantity: 45, weight: 0 },
        { type: 'Taie', quantity: 30, weight: 0 },
        { type: 'Serviette', quantity: 35, weight: 0 },
        { type: 'Nappe', quantity: 15, weight: 0 },
        { type: 'Torchon', quantity: 5, weight: 0 },
    ];
    const [items, setItems] = useState(mockLinenTypes);

    const updateWeight = (index: number, weight: string) => {
        const updated = [...items];
        updated[index].weight = parseFloat(weight) || 0;
        setItems(updated);
    };

    const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>⚖️</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Pesée par type de linge
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Pesez chaque type individuellement
                </ThemedText>

                <View style={[styles.infoBox, { backgroundColor: '#E3F2FD', marginBottom: 16 }]}>
                    <Text style={{ fontSize: 20, marginBottom: 4, fontWeight: 'bold' }}>🏨 Hôtel Plaza</Text>
                    <ThemedText variate="body2" color="textSecondary">
                        Commande #CMD-2026-001
                    </ThemedText>
                </View>

                {items.map((item, index) => (
                    <View key={index} style={styles.weighingItem}>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 4 }}>
                                {item.type}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                {item.quantity} pièces
                            </ThemedText>
                        </View>
                        <View style={{ width: 100 }}>
                            <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                Poids (kg)
                            </ThemedText>
                            <View style={styles.weightInput}>
                                <ThemedText variate="body1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                    {item.weight > 0 ? item.weight.toFixed(1) : '0.0'}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={[styles.infoBox, { backgroundColor: '#4CAF50', marginTop: 16 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText variate="subtitle1" style={{ color: 'white' }}>
                            Poids total:
                        </ThemedText>
                        <ThemedText variate="h1" style={{ color: 'white', fontWeight: 'bold' }}>
                            {totalWeight.toFixed(1)} kg
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Valider et continuer" onPress={onNext} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

// STEP 3: VÉRIFICATION
function VerificationStep({ colors, onNext, onBack }: any) {
    const mockTriageItems = [
        { type: 'Drap', quantity: 45, weight: 18.5, category: 'Linge Plat' },
        { type: 'Taie', quantity: 30, weight: 6.2, category: 'Linge Plat' },
        { type: 'Serviette', quantity: 35, weight: 21.0, category: 'Linge Plat' },
        { type: 'Nappe', quantity: 15, weight: 19.0, category: 'Linge Plat' },
        { type: 'Torchon', quantity: 5, weight: 2.8, category: 'Linge Forme' },
    ];

    const totalWeight = mockTriageItems.reduce((sum, item) => sum + item.weight, 0);
    const totalQuantity = mockTriageItems.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>✂️</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Vérification du triage
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Confirmez le tri effectué par l'hôtel
                </ThemedText>

                <View style={[styles.infoBox, { backgroundColor: '#E3F2FD', marginBottom: 16 }]}>
                    <Text style={{ fontSize: 20, marginBottom: 4, fontWeight: 'bold' }}>🏨 Hôtel Plaza</Text>
                    <ThemedText variate="body2" color="textSecondary">
                        Poids pesé: {totalWeight.toFixed(1)} kg • {totalQuantity} pièces
                    </ThemedText>
                </View>

                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                    Vérification par type
                </ThemedText>

                {mockTriageItems.map((item, index) => (
                    <View key={index} style={styles.weighingItem}>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 4 }}>
                                {item.type}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                {item.category}
                            </ThemedText>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <ThemedText variate="body1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                {item.quantity} pièces
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                {item.weight.toFixed(1)} kg
                            </ThemedText>
                        </View>
                        <View style={{ marginLeft: 12 }}>
                            <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                                <Text style={{ color: 'white', fontSize: 16 }}>✓</Text>
                            </View>
                        </View>
                    </View>
                ))}

                <View style={[styles.infoBox, { backgroundColor: '#4CAF50', marginTop: 16 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <ThemedText variate="subtitle1" style={{ color: 'white' }}>
                            ✅ Tous les types vérifiés
                        </ThemedText>
                        <ThemedText variate="h2" style={{ color: 'white', fontWeight: 'bold' }}>
                            {mockTriageItems.length}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Passer au lavage" onPress={onNext} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

// STEP 4: LAVAGE
function LavageStep({ colors, onNext, onBack }: any) {
    const mockBatches = [
        {
            id: 1,
            machine: 'PRIMUS FX600',
            program: 'Linge Plat Blanc 60°C',
            items: [
                { type: 'Drap', quantity: 25, weight: 18.5 },
                { type: 'Taie', quantity: 20, weight: 6.2 }
            ],
            totalWeight: 24.7,
            capacity: 60,
            duration: 45,
            water: 150
        },
        {
            id: 2,
            machine: 'GIRBAU HS6057',
            program: 'Linge Plat Blanc 60°C',
            items: [
                { type: 'Serviette', quantity: 35, weight: 21.0 },
                { type: 'Nappe', quantity: 10, weight: 12.5 }
            ],
            totalWeight: 33.5,
            capacity: 57,
            duration: 45,
            water: 140
        },
        {
            id: 3,
            machine: 'PRIMUS FX350',
            program: 'Linge Plat Couleur 40°C',
            items: [
                { type: 'Nappe', quantity: 5, weight: 6.5 },
                { type: 'Torchon', quantity: 5, weight: 2.8 }
            ],
            totalWeight: 9.3,
            capacity: 35,
            duration: 40,
            water: 80
        }
    ];

    const totalCycles = mockBatches.length;
    const totalWeight = mockBatches.reduce((sum, b) => sum + b.totalWeight, 0);
    const avgUtilization = mockBatches.reduce((sum, b) => sum + (b.totalWeight / b.capacity * 100), 0) / totalCycles;
    const totalWater = mockBatches.reduce((sum, b) => sum + b.water, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>💧</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Dispatching Lavage
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Optimisation automatique des laveuses
                </ThemedText>

                {/* Statistiques globales */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <View style={[styles.statCard, { backgroundColor: '#E3F2FD', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Cycles
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalCycles}
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Poids
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalWeight.toFixed(0)}kg
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF3E0', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Util.
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {avgUtilization.toFixed(0)}%
                        </ThemedText>
                    </View>
                </View>

                {/* Liste des batches */}
                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                    Plan de lavage optimisé
                </ThemedText>

                {mockBatches.map((batch, index) => {
                    const utilization = (batch.totalWeight / batch.capacity * 100);
                    const utilizationColor = utilization > 80 ? '#4CAF50' : utilization > 60 ? '#FF9800' : '#9E9E9E';

                    return (
                        <View key={batch.id} style={styles.batchCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="subtitle1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                        Cycle {index + 1}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.machine}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.program} • {batch.duration} min
                                    </ThemedText>
                                </View>
                                <View style={[styles.badge, { backgroundColor: utilizationColor }]}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                        {utilization.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>

                            {/* Items */}
                            {batch.items.map((item, idx) => (
                                <View key={idx} style={styles.batchItem}>
                                    <ThemedText variate="body2" color="textPrimary">
                                        {item.type}
                                    </ThemedText>
                                    <ThemedText variate="body2" color="textSecondary">
                                        {item.quantity} pcs • {item.weight.toFixed(1)} kg
                                    </ThemedText>
                                </View>
                            ))}

                            {/* Metrics */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Total: {batch.totalWeight.toFixed(1)}kg
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Cap: {batch.capacity}kg
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Eau: {batch.water}L
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View style={[styles.infoBox, { backgroundColor: '#E3F2FD', marginTop: 16 }]}>
                    <ThemedText variate="body2" color="textPrimary" style={{ textAlign: 'center' }}>
                        💧 Consommation totale d'eau: {totalWater}L
                    </ThemedText>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Lancer le lavage" onPress={onNext} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

// STEP 5: SÉCHAGE
function SechageStep({ colors, onNext, onBack }: any) {
    const mockBatches = [
        {
            id: 1,
            machine: 'PRIMUS I50-320',
            program: 'Séchage Standard',
            items: [
                { type: 'Drap', quantity: 25, weight: 18.5 },
                { type: 'Taie', quantity: 20, weight: 6.2 }
            ],
            totalWeight: 24.7,
            capacity: 145,
            duration: 35,
            energy: 18
        },
        {
            id: 2,
            machine: 'GIRBAU PB5132',
            program: 'Séchage Standard',
            items: [
                { type: 'Serviette', quantity: 35, weight: 21.0 },
                { type: 'Nappe', quantity: 10, weight: 12.5 }
            ],
            totalWeight: 33.5,
            capacity: 145,
            duration: 35,
            energy: 18
        },
        {
            id: 3,
            machine: 'PRIMUS T24',
            program: 'Séchage Délicat',
            items: [
                { type: 'Nappe', quantity: 5, weight: 6.5 },
                { type: 'Torchon', quantity: 5, weight: 2.8 }
            ],
            totalWeight: 9.3,
            capacity: 24,
            duration: 30,
            energy: 15
        }
    ];

    const totalCycles = mockBatches.length;
    const totalWeight = mockBatches.reduce((sum, b) => sum + b.totalWeight, 0);
    const avgUtilization = mockBatches.reduce((sum, b) => sum + (b.totalWeight / b.capacity * 100), 0) / totalCycles;
    const totalEnergy = mockBatches.reduce((sum, b) => sum + b.energy, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>🌬️</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Dispatching Séchage
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Optimisation automatique des sécheuses
                </ThemedText>

                {/* Statistiques globales */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <View style={[styles.statCard, { backgroundColor: '#E8F5E9', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Cycles
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalCycles}
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#FFF3E0', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Poids
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalWeight.toFixed(0)}kg
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E1F5FE', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Util.
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {avgUtilization.toFixed(0)}%
                        </ThemedText>
                    </View>
                </View>

                {/* Liste des batches */}
                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                    Plan de séchage optimisé
                </ThemedText>

                {mockBatches.map((batch, index) => {
                    const utilization = (batch.totalWeight / batch.capacity * 100);
                    const utilizationColor = utilization > 80 ? '#4CAF50' : utilization > 60 ? '#FF9800' : '#9E9E9E';

                    return (
                        <View key={batch.id} style={styles.batchCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="subtitle1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                        Cycle {index + 1}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.machine}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.program} • {batch.duration} min
                                    </ThemedText>
                                </View>
                                <View style={[styles.badge, { backgroundColor: utilizationColor }]}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                        {utilization.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>

                            {/* Items */}
                            {batch.items.map((item, idx) => (
                                <View key={idx} style={styles.batchItem}>
                                    <ThemedText variate="body2" color="textPrimary">
                                        {item.type}
                                    </ThemedText>
                                    <ThemedText variate="body2" color="textSecondary">
                                        {item.quantity} pcs • {item.weight.toFixed(1)} kg
                                    </ThemedText>
                                </View>
                            ))}

                            {/* Metrics */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Total: {batch.totalWeight.toFixed(1)}kg
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Cap: {batch.capacity}kg
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Énergie: {batch.energy} kWh
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View style={[styles.infoBox, { backgroundColor: '#E8F5E9', marginTop: 16 }]}>
                    <ThemedText variate="body2" color="textPrimary" style={{ textAlign: 'center' }}>
                        ⚡ Consommation totale d'énergie: {totalEnergy} kWh
                    </ThemedText>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Lancer le séchage" onPress={onNext} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

// STEP 6: CALANDRAGE
function CalandrageStep({ colors, onNext, onBack }: any) {
    const mockBatches = [
        {
            id: 1,
            machine: 'PRIMUS FI280',
            machineType: 'Calandre',
            program: 'Calandrage Standard',
            items: [
                { type: 'Drap', quantity: 45 },
                { type: 'Nappe', quantity: 15 }
            ],
            totalPieces: 60,
            capacity: 45,
            duration: 30,
            energy: 22
        },
        {
            id: 2,
            machine: 'PRIMUS FI220',
            machineType: 'Calandre',
            program: 'Calandrage Standard',
            items: [
                { type: 'Serviette', quantity: 35 },
                { type: 'Taie', quantity: 30 }
            ],
            totalPieces: 65,
            capacity: 35,
            duration: 30,
            energy: 22
        },
        {
            id: 3,
            machine: 'GIRBAU MP45',
            machineType: 'Presse',
            program: 'Pressage Chemise',
            items: [
                { type: 'Torchon', quantity: 5 }
            ],
            totalPieces: 5,
            capacity: 25,
            duration: 20,
            energy: 15
        }
    ];

    const totalCycles = mockBatches.length;
    const totalPieces = mockBatches.reduce((sum, b) => sum + b.totalPieces, 0);
    const avgUtilization = mockBatches.reduce((sum, b) => sum + (b.totalPieces / b.capacity * 100), 0) / totalCycles;
    const totalEnergy = mockBatches.reduce((sum, b) => sum + b.energy, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>✨</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Dispatching Calandrage
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Optimisation repassage et finition
                </ThemedText>

                {/* Statistiques globales */}
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                    <View style={[styles.statCard, { backgroundColor: '#FCE4EC', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Cycles
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalCycles}
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#F3E5F5', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Pièces
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {totalPieces}
                        </ThemedText>
                    </View>
                    <View style={[styles.statCard, { backgroundColor: '#E8EAF6', flex: 1 }]}>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                            Util.
                        </ThemedText>
                        <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                            {avgUtilization.toFixed(0)}%
                        </ThemedText>
                    </View>
                </View>

                {/* Liste des batches */}
                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                    Plan de calandrage/pressage optimisé
                </ThemedText>

                {mockBatches.map((batch, index) => {
                    const utilization = (batch.totalPieces / batch.capacity * 100);
                    const utilizationColor = utilization > 80 ? '#4CAF50' : utilization > 60 ? '#FF9800' : '#9E9E9E';

                    return (
                        <View key={batch.id} style={styles.batchCard}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="subtitle1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                        Cycle {index + 1} - {batch.machineType}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.machine}
                                    </ThemedText>
                                    <ThemedText variate="caption" color="textSecondary">
                                        {batch.program} • {batch.duration} min
                                    </ThemedText>
                                </View>
                                <View style={[styles.badge, { backgroundColor: utilizationColor }]}>
                                    <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>
                                        {utilization.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>

                            {/* Items */}
                            {batch.items.map((item, idx) => (
                                <View key={idx} style={styles.batchItem}>
                                    <ThemedText variate="body2" color="textPrimary">
                                        {item.type}
                                    </ThemedText>
                                    <ThemedText variate="body2" color="textSecondary">
                                        {item.quantity} pièces
                                    </ThemedText>
                                </View>
                            ))}

                            {/* Metrics */}
                            <View style={{ flexDirection: 'row', gap: 12, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Total: {batch.totalPieces} pcs
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Cap: {batch.capacity} pcs
                                    </ThemedText>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <ThemedText variate="caption" color="textSecondary">
                                        Énergie: {batch.energy} kWh
                                    </ThemedText>
                                </View>
                            </View>
                        </View>
                    );
                })}

                <View style={[styles.infoBox, { backgroundColor: '#FCE4EC', marginTop: 16 }]}>
                    <ThemedText variate="body2" color="textPrimary" style={{ textAlign: 'center' }}>
                        ⚡ Consommation totale d'énergie: {totalEnergy} kWh
                    </ThemedText>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Lancer le calandrage" onPress={onNext} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

// STEP 7: PRÉPARATION
function PreparationStep({ colors, onBack }: any) {
    const handleFinish = () => {
        Alert.alert(
            'Journée terminée! 🎉',
            '3 commandes traitées\nTout est archivé',
            [{ text: 'OK' }]
        );
    };

    const mockOrderSummary = [
        { client: 'Hôtel Plaza', weight: 67.5, amount: 135000 },
        { client: 'Hôtel Savana', weight: 42.8, amount: 85600 },
        { client: 'Hôtel Teranga', weight: 157.2, amount: 314400 }
    ];

    const totalWeight = mockOrderSummary.reduce((sum, o) => sum + o.weight, 0);
    const totalAmount = mockOrderSummary.reduce((sum, o) => sum + o.amount, 0);

    return (
        <ScrollView style={{ padding: Spacing.md }}>
            <Card>
                <Text style={{ fontSize: 40, textAlign: 'center', marginBottom: 16 }}>📋</Text>
                <ThemedText variate="headline" color="textPrimary" style={{ textAlign: 'center', marginBottom: 8 }}>
                    Récapitulatif Final
                </ThemedText>
                <ThemedText variate="body2" color="textSecondary" style={{ textAlign: 'center', marginBottom: 24 }}>
                    Vérifiez et générez les factures
                </ThemedText>

                {/* Détail par commande */}
                <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                    Détail des commandes
                </ThemedText>

                {mockOrderSummary.map((order, index) => (
                    <View key={index} style={styles.orderSummaryCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                            <ThemedText variate="subtitle1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                {index + 1}. {order.client}
                            </ThemedText>
                            <View style={[styles.badge, { backgroundColor: '#4CAF50' }]}>
                                <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>
                                    ✓ PRÊT
                                </Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E0E0E0' }}>
                            <View>
                                <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                    Poids traité
                                </ThemedText>
                                <ThemedText variate="body1" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                    {order.weight.toFixed(1)} kg
                                </ThemedText>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                    Montant facturé
                                </ThemedText>
                                <ThemedText variate="body1" style={{ fontWeight: 'bold', color: '#4CAF50' }}>
                                    {order.amount.toLocaleString('fr-FR')} FCFA
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                ))}

                {/* Totaux */}
                <View style={[styles.summaryBox, { backgroundColor: '#2196F3', marginTop: 16 }]}>
                    <ThemedText variate="subtitle1" style={{ color: 'white', marginBottom: 12, fontWeight: 'bold' }}>
                        TOTAL JOURNÉE
                    </ThemedText>
                    <View style={styles.summaryRow}>
                        <ThemedText variate="body1" style={{ color: 'white' }}>
                            Commandes traitées:
                        </ThemedText>
                        <ThemedText variate="h2" style={{ color: 'white', fontWeight: 'bold' }}>
                            {mockOrderSummary.length}
                        </ThemedText>
                    </View>
                    <View style={styles.summaryRow}>
                        <ThemedText variate="body1" style={{ color: 'white' }}>
                            Poids total:
                        </ThemedText>
                        <ThemedText variate="h2" style={{ color: 'white', fontWeight: 'bold' }}>
                            {totalWeight.toFixed(1)} kg
                        </ThemedText>
                    </View>
                    <View style={[styles.summaryRow, { paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.3)', marginTop: 8 }]}>
                        <ThemedText variate="body1" style={{ color: 'white' }}>
                            Montant total:
                        </ThemedText>
                        <ThemedText variate="h1" style={{ color: 'white', fontWeight: 'bold' }}>
                            {totalAmount.toLocaleString('fr-FR')} FCFA
                        </ThemedText>
                    </View>
                </View>

                {/* Statistiques de production */}
                <View style={{ marginTop: 16 }}>
                    <ThemedText variate="subtitle1" color="textPrimary" style={{ marginBottom: 12, fontWeight: 'bold' }}>
                        Statistiques de production
                    </ThemedText>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <View style={[styles.statCard, { backgroundColor: '#E3F2FD', flex: 1 }]}>
                            <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                Cycles lavage
                            </ThemedText>
                            <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                3
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                370L eau
                            </ThemedText>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#E8F5E9', flex: 1 }]}>
                            <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                Cycles séchage
                            </ThemedText>
                            <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                3
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                51 kWh
                            </ThemedText>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: '#FCE4EC', flex: 1 }]}>
                            <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: 4 }}>
                                Cycles caland.
                            </ThemedText>
                            <ThemedText variate="h2" color="textPrimary" style={{ fontWeight: 'bold' }}>
                                3
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                59 kWh
                            </ThemedText>
                        </View>
                    </View>
                </View>

                <View style={styles.buttonRow}>
                    <Button title="Retour" onPress={onBack} variant="outline" style={{ flex: 1 }} />
                    <View style={{ width: 12 }} />
                    <Button title="Terminer la journée" onPress={handleFinish} style={{ flex: 1 }} />
                </View>
            </Card>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    progressBar: {
        backgroundColor: 'white',
        paddingVertical: 16,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    stepItem: {
        alignItems: 'center',
        marginHorizontal: 8,
        position: 'relative',
    },
    stepCircle: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    stepIcon: {
        fontSize: 24,
    },
    stepLabel: {
        fontSize: 10,
        textAlign: 'center',
    },
    stepLine: {
        position: 'absolute',
        top: 25,
        left: 50,
        width: 40,
        height: 2,
    },
    content: {
        flex: 1,
    },
    orderCard: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#2196F3',
        borderRadius: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoBox: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
    },
    buttonRow: {
        flexDirection: 'row',
        marginTop: 8,
    },
    summaryBox: {
        backgroundColor: '#F5F5F5',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    // New styles for enhanced steps
    statCard: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    batchCard: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    batchItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 8,
        backgroundColor: '#F5F5F5',
        borderRadius: 6,
        marginBottom: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    orderSummaryCard: {
        backgroundColor: '#F9F9F9',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    weighingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#F9F9F9',
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    weightInput: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#2196F3',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 40,
    },
});
