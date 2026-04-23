import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function CollectScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [step, setStep] = useState(1); // 1: Arrivée, 2: Scan, 3: Saisie, 4: Photos, 5: Signature
    const [chariots, setChariots] = useState('');
    const [sacs, setSacs] = useState('');
    const [notes, setNotes] = useState('');
    const [qrScanned, setQrScanned] = useState(false);
    const [photosAdded, setPhotosAdded] = useState(0);
    const [signed, setSigned] = useState(false);

    const currentClient = {
        nom: 'King Fahd Palace',
        adresse: 'Route de la Corniche Ouest',
        contact: 'M. Diallo - +221 77 123 45 67',
        volume: 'XL - 45kg',
    };

    const handleScanQR = () => {
        // TODO: Implement QR Scanner
        setQrScanned(true);
        Alert.alert('QR Code scanné', 'Client vérifié avec succès');
    };

    const handleAddPhoto = () => {
        // TODO: Implement Camera
        setPhotosAdded(photosAdded + 1);
    };

    const handleSign = () => {
        // TODO: Implement Signature Pad
        setSigned(true);
        Alert.alert('Signature', 'Signature enregistrée');
    };

    const handleComplete = () => {
        if (!qrScanned || !chariots || !sacs || photosAdded === 0 || !signed) {
            Alert.alert('Attention', 'Veuillez compléter toutes les étapes');
            return;
        }
        Alert.alert(
            'Collecte terminée',
            'La collecte a été enregistrée avec succès',
            [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]
        );
    };

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
                    Collecte
                </ThemedText>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                {/* Client Info */}
                <Card style={[styles.clientCard, { backgroundColor: colors.driverPrimary + '10' }]}>
                    <View style={styles.clientHeader}>
                        <Text style={styles.clientIcon}>🏨</Text>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="subtitle1" color="textPrimary">
                                {currentClient.nom}
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                {currentClient.adresse}
                            </ThemedText>
                            <View style={styles.clientMeta}>
                                <Text style={styles.metaIcon}>👤</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {currentClient.contact}
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Step 1: QR Code Scan */}
                <Card style={styles.section}>
                    <View style={styles.stepHeader}>
                        <View
                            style={[
                                styles.stepNumber,
                                {
                                    backgroundColor: qrScanned
                                        ? colors.driverPrimary
                                        : '#E5E7EB',
                                },
                            ]}
                        >
                            <Text style={[styles.stepNumberText, { color: qrScanned ? '#FFFFFF' : '#9CA3AF' }]}>
                                {qrScanned ? '✓' : '1'}
                            </Text>
                        </View>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Scanner le QR Code client
                        </ThemedText>
                    </View>
                    {!qrScanned ? (
                        <TouchableOpacity
                            style={[styles.scanButton, { backgroundColor: colors.driverPrimary }]}
                            onPress={handleScanQR}
                        >
                            <Text style={styles.scanButtonText}>📷 Scanner le QR Code</Text>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.successBadge}>
                            <Text style={styles.successIcon}>✓</Text>
                            <ThemedText variate="body3" style={{ color: colors.driverPrimary }}>
                                QR Code scanné avec succès
                            </ThemedText>
                        </View>
                    )}
                </Card>

                {/* Step 2: Quantity Input */}
                <Card style={styles.section}>
                    <View style={styles.stepHeader}>
                        <View
                            style={[
                                styles.stepNumber,
                                {
                                    backgroundColor: (chariots && sacs)
                                        ? colors.driverPrimary
                                        : '#E5E7EB',
                                },
                            ]}
                        >
                            <Text style={[styles.stepNumberText, { color: (chariots && sacs) ? '#FFFFFF' : '#9CA3AF' }]}>
                                {(chariots && sacs) ? '✓' : '2'}
                            </Text>
                        </View>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Saisie des quantités
                        </ThemedText>
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputIcon}>🛒</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Nombre de chariots
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholder="Ex: 3"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={chariots}
                                    onChangeText={setChariots}
                                />
                            </View>
                        </View>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputIcon}>👜</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Nombre de sacs
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholder="Ex: 5"
                                    placeholderTextColor={colors.textSecondary}
                                    keyboardType="numeric"
                                    value={sacs}
                                    onChangeText={setSacs}
                                />
                            </View>
                        </View>
                        <View style={styles.inputRow}>
                            <Text style={styles.inputIcon}>📝</Text>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="caption" color="textSecondary">
                                    Notes (optionnel)
                                </ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border }]}
                                    placeholder="Ex: Articles délicats..."
                                    placeholderTextColor={colors.textSecondary}
                                    multiline
                                    numberOfLines={3}
                                    value={notes}
                                    onChangeText={setNotes}
                                />
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Step 3: Photos */}
                <Card style={styles.section}>
                    <View style={styles.stepHeader}>
                        <View
                            style={[
                                styles.stepNumber,
                                {
                                    backgroundColor: photosAdded > 0
                                        ? colors.driverPrimary
                                        : '#E5E7EB',
                                },
                            ]}
                        >
                            <Text style={[styles.stepNumberText, { color: photosAdded > 0 ? '#FFFFFF' : '#9CA3AF' }]}>
                                {photosAdded > 0 ? '✓' : '3'}
                            </Text>
                        </View>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Photos de la collecte
                        </ThemedText>
                    </View>
                    <TouchableOpacity
                        style={styles.photoButton}
                        onPress={handleAddPhoto}
                    >
                        <Text style={styles.photoIcon}>📸</Text>
                        <ThemedText variate="body3" color="textSecondary">
                            {photosAdded === 0 ? 'Ajouter des photos' : `${photosAdded} photo(s) ajoutée(s)`}
                        </ThemedText>
                    </TouchableOpacity>
                </Card>

                {/* Step 4: Signature */}
                <Card style={styles.section}>
                    <View style={styles.stepHeader}>
                        <View
                            style={[
                                styles.stepNumber,
                                {
                                    backgroundColor: signed
                                        ? colors.driverPrimary
                                        : '#E5E7EB',
                                },
                            ]}
                        >
                            <Text style={[styles.stepNumberText, { color: signed ? '#FFFFFF' : '#9CA3AF' }]}>
                                {signed ? '✓' : '4'}
                            </Text>
                        </View>
                        <ThemedText variate="subtitle2" color="textPrimary">
                            Signature du client
                        </ThemedText>
                    </View>
                    {!signed ? (
                        <TouchableOpacity
                            style={styles.signatureButton}
                            onPress={handleSign}
                        >
                            <Text style={styles.signatureIcon}>✍️</Text>
                            <ThemedText variate="body3" color="textSecondary">
                                Demander la signature
                            </ThemedText>
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.successBadge}>
                            <Text style={styles.successIcon}>✓</Text>
                            <ThemedText variate="body3" style={{ color: colors.driverPrimary }}>
                                Signature enregistrée
                            </ThemedText>
                        </View>
                    )}
                </Card>

                {/* Complete Button */}
                <Button
                    title="Terminer la collecte"
                    onPress={handleComplete}
                    style={styles.completeButton}
                />
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
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    clientCard: {
        marginBottom: Spacing.lg,
    },
    clientHeader: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    clientIcon: {
        fontSize: 32,
    },
    clientMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    metaIcon: {
        fontSize: 14,
    },
    section: {
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
    scanButton: {
        paddingVertical: Spacing.lg,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    scanButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.md,
        fontWeight: Typography.fontWeight.semibold,
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
    inputGroup: {
        gap: Spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    inputIcon: {
        fontSize: 24,
        marginTop: Spacing.sm,
    },
    input: {
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.sm,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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
    completeButton: {
        marginTop: Spacing.lg,
    },
});
