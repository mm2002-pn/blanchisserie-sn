import { useCallback, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

const SCAN_RESULT_KEY = "@driver_last_scan";

type StepId = "qr" | "qty" | "photos" | "signature";

export default function CollectScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [chariots, setChariots] = useState("");
    const [sacs, setSacs] = useState("");
    const [notes, setNotes] = useState("");
    const [qrScanned, setQrScanned] = useState(false);
    const [scannedCode, setScannedCode] = useState<string | null>(null);
    const [photosAdded, setPhotosAdded] = useState(0);
    const [signed, setSigned] = useState(false);

    // Read scan result on focus (set by /(driver)/scan screen)
    useFocusEffect(
        useCallback(() => {
            let cancelled = false;
            (async () => {
                try {
                    const raw = await AsyncStorage.getItem(SCAN_RESULT_KEY);
                    if (!raw || cancelled) return;
                    const parsed = JSON.parse(raw) as { code: string };
                    setQrScanned(true);
                    setScannedCode(parsed.code);
                    await AsyncStorage.removeItem(SCAN_RESULT_KEY);
                } catch (err) {
                    console.error(err);
                }
            })();
            return () => {
                cancelled = true;
            };
        }, []),
    );

    const currentClient = {
        nom: "King Fahd Palace",
        adresse: "Route de la Corniche Ouest",
        contact: "M. Diallo · +221 77 123 45 67",
        volume: "≈ 45 kg",
        heure: "11:30",
    };

    const qtyDone = Boolean(chariots && sacs);
    const photosDone = photosAdded > 0;
    const allDone = qrScanned && qtyDone && photosDone && signed;

    const completedSteps = [qrScanned, qtyDone, photosDone, signed].filter(
        Boolean,
    ).length;

    const handleScanQR = () => {
        router.push("/(driver)/scan");
    };

    const handleAddPhoto = () => {
        setPhotosAdded((n) => n + 1);
    };

    const handleSign = () => {
        setSigned(true);
        Alert.alert("Signature", "Signature enregistrée");
    };

    const handleComplete = () => {
        if (!allDone) {
            Alert.alert("Attention", "Veuillez compléter toutes les étapes");
            return;
        }
        Alert.alert(
            "Collecte terminée",
            "La collecte a été enregistrée avec succès",
            [{ text: "OK", onPress: () => router.back() }],
        );
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Icon name="chevLeft" size={20} color={colors.ink800} />
                </Pressable>
                <ThemedText variate="title">Collecte</ThemedText>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Client hero */}
                <Card
                    padding={16}
                    style={[
                        styles.clientCard,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <View style={styles.clientTop}>
                        <View
                            style={[
                                styles.clientAvatar,
                                { backgroundColor: colors.terra600 },
                            ]}
                        >
                            <Icon name="building" size={18} color={colors.paper} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.clientName, { color: colors.paper }]}>
                                {currentClient.nom}
                            </Text>
                            <Text
                                style={[styles.clientAddress, { color: colors.brand100 }]}
                            >
                                {currentClient.adresse}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[
                            styles.clientMetaRow,
                            { borderTopColor: colors.brand700 },
                        ]}
                    >
                        <MetaDark icon="user" label={currentClient.contact} />
                        <MetaDark icon="clock" label={currentClient.heure} />
                        <MetaDark icon="weight" label={currentClient.volume} />
                    </View>
                </Card>

                {/* Progress summary */}
                <Card padding={14} style={styles.progressCard}>
                    <View style={styles.progressHeader}>
                        <ThemedText variate="caps" color="ink500">
                            Progression
                        </ThemedText>
                        <Text style={[styles.progressCount, { color: colors.ink900 }]}>
                            {completedSteps}
                            <Text style={[styles.progressDiv, { color: colors.ink500 }]}>
                                {" / 4 étapes"}
                            </Text>
                        </Text>
                    </View>
                    <View
                        style={[styles.progressBar, { backgroundColor: colors.ink200 }]}
                    >
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${(completedSteps / 4) * 100}%`,
                                    backgroundColor: colors.baobab600,
                                },
                            ]}
                        />
                    </View>
                </Card>

                {/* Step 1 — QR */}
                <StepCard
                    index={1}
                    title="Scanner le QR code client"
                    subtitle="Vérifie l'identité de l'établissement"
                    done={qrScanned}
                >
                    {!qrScanned ? (
                        <Pressable
                            onPress={handleScanQR}
                            style={[
                                styles.primaryCta,
                                { backgroundColor: colors.brand800 },
                            ]}
                        >
                            <Icon name="qr" size={15} color={colors.paper} />
                            <Text style={[styles.primaryCtaText, { color: colors.paper }]}>
                                Scanner le QR code
                            </Text>
                        </Pressable>
                    ) : (
                        <SuccessRow
                            label={
                                scannedCode
                                    ? `QR code vérifié · ${scannedCode}`
                                    : "QR code vérifié"
                            }
                        />
                    )}
                </StepCard>

                {/* Step 2 — Quantités */}
                <StepCard
                    index={2}
                    title="Saisie des quantités"
                    subtitle="Chariots et sacs collectés"
                    done={qtyDone}
                >
                    <View style={{ gap: 12 }}>
                        <FieldNumeric
                            label="Chariots"
                            icon="boxes"
                            value={chariots}
                            onChangeText={setChariots}
                            placeholder="Ex: 3"
                        />
                        <FieldNumeric
                            label="Sacs"
                            icon="package"
                            value={sacs}
                            onChangeText={setSacs}
                            placeholder="Ex: 5"
                        />
                        <FieldTextArea
                            label="Notes (optionnel)"
                            value={notes}
                            onChangeText={setNotes}
                            placeholder="Articles délicats, remarques…"
                        />
                    </View>
                </StepCard>

                {/* Step 3 — Photos */}
                <StepCard
                    index={3}
                    title="Photos de la collecte"
                    subtitle="Preuve visuelle des chariots et sacs"
                    done={photosDone}
                >
                    <Pressable
                        onPress={handleAddPhoto}
                        style={[
                            styles.dashedBox,
                            { borderColor: colors.ink300, backgroundColor: colors.paper2 },
                        ]}
                    >
                        <Icon name="camera" size={22} color={colors.ink500} />
                        <Text
                            style={[styles.dashedBoxText, { color: colors.ink700 }]}
                        >
                            {photosAdded === 0
                                ? "Ajouter une photo"
                                : `Ajouter une autre photo · ${photosAdded} ajoutée${photosAdded > 1 ? "s" : ""}`}
                        </Text>
                    </Pressable>
                    {photosAdded > 0 && (
                        <View style={styles.photoList}>
                            {Array.from({ length: photosAdded }).map((_, i) => (
                                <View
                                    key={i}
                                    style={[
                                        styles.photoTile,
                                        { backgroundColor: colors.paper2, borderColor: colors.ink200 },
                                    ]}
                                >
                                    <Icon name="camera" size={14} color={colors.ink600} />
                                    <Text
                                        style={[styles.photoTileText, { color: colors.ink700 }]}
                                    >
                                        Photo {i + 1}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </StepCard>

                {/* Step 4 — Signature */}
                <StepCard
                    index={4}
                    title="Signature du responsable"
                    subtitle="Validation du bordereau de collecte"
                    done={signed}
                >
                    {!signed ? (
                        <Pressable
                            onPress={handleSign}
                            style={[
                                styles.dashedBox,
                                { borderColor: colors.ink300, backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Icon name="signature" size={22} color={colors.ink500} />
                            <Text
                                style={[styles.dashedBoxText, { color: colors.ink700 }]}
                            >
                                Demander la signature
                            </Text>
                        </Pressable>
                    ) : (
                        <SuccessRow label="Signature enregistrée" />
                    )}
                </StepCard>

                {/* Complete */}
                <Pressable
                    onPress={handleComplete}
                    style={[
                        styles.completeCta,
                        {
                            backgroundColor: allDone ? colors.baobab600 : colors.ink300,
                        },
                    ]}
                    disabled={!allDone}
                >
                    <Icon name="check" size={16} color={colors.paper} />
                    <Text
                        style={[styles.completeCtaText, { color: colors.paper }]}
                    >
                        Terminer la collecte
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------- sous-composants ---------- */

function StepCard({
    index,
    title,
    subtitle,
    done,
    children,
}: {
    index: number;
    title: string;
    subtitle: string;
    done: boolean;
    children: React.ReactNode;
}) {
    const colors = useThemeColors();
    return (
        <Card padding={16} style={styles.stepCard}>
            <View style={styles.stepHeader}>
                <View
                    style={[
                        styles.stepNumber,
                        {
                            backgroundColor: done ? colors.baobab600 : colors.ink100,
                            borderColor: done ? colors.baobab600 : colors.ink200,
                        },
                    ]}
                >
                    {done ? (
                        <Icon name="check" size={13} color={colors.paper} />
                    ) : (
                        <Text
                            style={[styles.stepNumberText, { color: colors.ink700 }]}
                        >
                            {index}
                        </Text>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.stepTitle, { color: colors.ink900 }]}>
                        {title}
                    </Text>
                    <Text style={[styles.stepSubtitle, { color: colors.ink500 }]}>
                        {subtitle}
                    </Text>
                </View>
            </View>
            <View style={{ marginTop: 12 }}>{children}</View>
        </Card>
    );
}

function FieldNumeric({
    label,
    icon,
    value,
    onChangeText,
    placeholder,
}: {
    label: string;
    icon: IconName;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
}) {
    const colors = useThemeColors();
    return (
        <View>
            <Text style={[styles.fieldLabel, { color: colors.ink700 }]}>
                {label}
            </Text>
            <View
                style={[
                    styles.fieldRow,
                    { backgroundColor: colors.paper, borderColor: colors.ink200 },
                ]}
            >
                <Icon name={icon} size={14} color={colors.ink500} />
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder={placeholder}
                    placeholderTextColor={colors.ink400}
                    keyboardType="numeric"
                    style={[styles.fieldInput, { color: colors.ink900 }]}
                />
            </View>
        </View>
    );
}

function FieldTextArea({
    label,
    value,
    onChangeText,
    placeholder,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    placeholder: string;
}) {
    const colors = useThemeColors();
    return (
        <View>
            <Text style={[styles.fieldLabel, { color: colors.ink700 }]}>
                {label}
            </Text>
            <TextInput
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.ink400}
                multiline
                numberOfLines={3}
                style={[
                    styles.textArea,
                    {
                        backgroundColor: colors.paper,
                        borderColor: colors.ink200,
                        color: colors.ink900,
                    },
                ]}
            />
        </View>
    );
}

function MetaDark({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={styles.metaDark}>
            <Icon name={icon} size={12} color={colors.brand100} />
            <Text style={[styles.metaDarkText, { color: colors.brand100 }]}>
                {label}
            </Text>
        </View>
    );
}

function SuccessRow({ label }: { label: string }) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.successRow,
                { backgroundColor: colors.ok100, borderColor: colors.ok600 },
            ]}
        >
            <Icon name="check" size={14} color={colors.ok700} />
            <Text style={[styles.successText, { color: colors.ok700 }]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    content: { padding: 16, paddingBottom: 120 },

    // Client hero
    clientCard: { marginBottom: 14 },
    clientTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    clientAvatar: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    clientName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        letterSpacing: -0.2,
    },
    clientAddress: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    clientMetaRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    metaDark: { flexDirection: "row", alignItems: "center", gap: 5 },
    metaDarkText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    // Progress
    progressCard: { marginBottom: 14 },
    progressHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    progressCount: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.lg,
    },
    progressDiv: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },

    // Step
    stepCard: { marginBottom: 12 },
    stepHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    stepTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    stepSubtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    // Ctas
    primaryCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    primaryCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Dashed box
    dashedBox: {
        borderWidth: 1.25,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    dashedBoxText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },

    // Photo tiles
    photoList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    photoTile: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
    },
    photoTileText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    // Fields
    fieldLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 5,
    },
    fieldRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    fieldInput: {
        flex: 1,
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },
    textArea: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 74,
        textAlignVertical: "top",
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },

    // Success
    successRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    successText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Complete CTA
    completeCta: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    completeCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },
});
