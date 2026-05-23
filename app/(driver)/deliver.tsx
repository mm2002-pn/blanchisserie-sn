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
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";

import Icon from "@/components/ui/Icon";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useDeliverOrder, useOrder } from "@/hooks/useOrders";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { ApiError } from "@/services/api";
import { capturePhoto, currentPosition } from "@/services/capture.service";
import { uploadPhotos } from "@/services/uploads.service";

/**
 * Écran livraison driver — utilisé dans le cadre d'une round type=delivery.
 *  - Toujours arrivé via tour-detail avec orderId + roundId en params (pas de scanner ici)
 *  - Capture photos, signature, nom du réceptionnaire
 *  - Mutation deliverOrder → status=delivered + workflowState=LIVRAISON_COMPLETED
 *  - Reset systématique au focus pour éviter qu'une livraison précédente fuit
 */
export default function DeliverScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams<{
        orderId?: string;
        roundId?: string;
    }>();

    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [signaturePadOpen, setSignaturePadOpen] = useState(false);
    const [recipientName, setRecipientName] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useOrdersRealtime();

    /** Reset complet à chaque focus pour éviter contamination entre livraisons. */
    useFocusEffect(
        useCallback(() => {
            setPhotoUrls([]);
            setSignatureUrl(null);
            setSignaturePadOpen(false);
            setRecipientName("");
            setSubmitting(false);
        }, []),
    );

    const orderId = params.orderId ? String(params.orderId) : null;
    const { data: order, isLoading } = useOrder(orderId ?? undefined);
    const deliver = useDeliverOrder();

    const photosCount = photoUrls.length;
    const signed = !!signatureUrl;
    const hasName = recipientName.trim().length > 0;
    const canValidate = photosCount > 0 && signed && hasName && !submitting;

    const totalPieces =
        (order?.services ?? []).reduce(
            (s, sv) =>
                s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
            0,
        ) || 0;
    const totalKg = order?.actualWeight ?? order?.estimatedWeight ?? 0;

    const handleClose = () => {
        if (params.roundId) {
            router.replace({
                pathname: "/(driver)/tour-detail",
                params: { roundId: String(params.roundId) },
            });
        } else {
            router.back();
        }
    };

    const handleAddPhoto = async () => {
        if (uploadingPhoto) return;
        try {
            const uri = await capturePhoto();
            if (!uri) return;
            setUploadingPhoto(true);
            const [uploaded] = await uploadPhotos([uri]);
            if (uploaded) setPhotoUrls((prev) => [...prev, uploaded.url]);
        } catch (err) {
            Alert.alert(
                "Échec photo",
                err instanceof Error ? err.message : "Upload échoué.",
            );
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = (i: number) => {
        setPhotoUrls((prev) => prev.filter((_, idx) => idx !== i));
    };

    const handleSign = () => setSignaturePadOpen(true);

    const handleValidate = async () => {
        if (!orderId) {
            Alert.alert("Aucune commande", "Identifiant commande manquant.");
            return;
        }
        if (!canValidate) {
            Alert.alert(
                "Incomplet",
                "Ajoute au moins une photo, la signature et le nom du destinataire.",
            );
            return;
        }
        setSubmitting(true);
        try {
            const geo = await currentPosition();
            await deliver.mutateAsync({
                id: orderId,
                data: {
                    recipientName: recipientName.trim(),
                    signatureUrl: signatureUrl ?? undefined,
                    deliveryPhotos: photoUrls,
                    geoLat: geo?.lat,
                    geoLng: geo?.lng,
                },
            });
            Alert.alert(
                "Livraison validée",
                `${order?.hotelName ?? "Client"} · ${recipientName.trim()}`,
                [{ text: "OK", onPress: handleClose }],
            );
        } catch (err) {
            const msg =
                err instanceof ApiError
                    ? err.message
                    : err instanceof Error
                      ? err.message
                      : "Échec de la livraison";
            Alert.alert("Erreur", msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (isLoading || !order) {
        return (
            <SafeAreaView
                edges={["top"]}
                style={[styles.container, { backgroundColor: colors.paper2 }]}
            >
                <Text style={{ padding: 20, color: colors.ink500 }}>
                    Chargement…
                </Text>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Top bar */}
            <View
                style={[
                    styles.topBar,
                    {
                        backgroundColor: colors.paper,
                        borderBottomColor: colors.ink200,
                    },
                ]}
            >
                <Pressable
                    onPress={handleClose}
                    hitSlop={6}
                    style={[styles.backBtn, { backgroundColor: colors.ink100 }]}
                >
                    <Icon name="x" size={16} color={colors.ink800} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.topTitle, { color: colors.ink900 }]}>
                        Livraison
                    </Text>
                    <Text style={[styles.topSub, { color: colors.ink500 }]}>
                        {order.orderNumber}
                    </Text>
                </View>
                <View
                    style={[styles.typePill, { backgroundColor: colors.baobab100 }]}
                >
                    <Icon name="truck" size={12} color={colors.baobab600} />
                    <Text
                        style={[styles.typePillText, { color: colors.baobab600 }]}
                    >
                        Livraison
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Client header */}
                <View
                    style={[
                        styles.clientCard,
                        {
                            backgroundColor: colors.paper,
                            borderColor: colors.ink200,
                        },
                    ]}
                >
                    <View style={styles.clientRow}>
                        <Icon name="building" size={18} color={colors.brand800} />
                        <Text
                            style={[styles.clientName, { color: colors.ink900 }]}
                            numberOfLines={1}
                        >
                            {order.hotelName || "—"}
                        </Text>
                    </View>
                    {order.hotelAddress && (
                        <Text style={[styles.clientAddr, { color: colors.ink500 }]}>
                            {order.hotelAddress}
                        </Text>
                    )}
                    <View style={styles.statsRow}>
                        <View style={styles.statBlock}>
                            <Text
                                style={[styles.statLabel, { color: colors.ink500 }]}
                            >
                                Pièces
                            </Text>
                            <Text
                                style={[styles.statValue, { color: colors.ink900 }]}
                            >
                                {totalPieces}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.statSep,
                                { backgroundColor: colors.ink200 },
                            ]}
                        />
                        <View style={styles.statBlock}>
                            <Text
                                style={[styles.statLabel, { color: colors.ink500 }]}
                            >
                                Poids
                            </Text>
                            <Text
                                style={[styles.statValue, { color: colors.ink900 }]}
                            >
                                {totalKg.toFixed(1).replace(".", ",")} kg
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Nom du réceptionnaire */}
                <Section title="Réceptionnaire" required done={hasName}>
                    <View
                        style={[
                            styles.input,
                            {
                                backgroundColor: colors.paper,
                                borderColor: hasName ? colors.brand800 : colors.ink200,
                            },
                        ]}
                    >
                        <Icon name="user" size={16} color={colors.ink500} />
                        <TextInput
                            value={recipientName}
                            onChangeText={setRecipientName}
                            placeholder="Nom et fonction (ex: M. Diop, gouvernante)"
                            placeholderTextColor={colors.ink400}
                            style={[styles.inputText, { color: colors.ink900 }]}
                        />
                    </View>
                </Section>

                {/* Photos */}
                <Section
                    title={`Photos de preuve (${photosCount})`}
                    required
                    done={photosCount > 0}
                >
                    <View style={styles.photosGrid}>
                        {photoUrls.map((url, i) => (
                            <View
                                key={`${url}-${i}`}
                                style={[
                                    styles.photoTile,
                                    { backgroundColor: colors.paper2 },
                                ]}
                            >
                                <Icon
                                    name="camera"
                                    size={14}
                                    color={colors.ink500}
                                />
                                <Text
                                    style={[
                                        styles.photoIdx,
                                        { color: colors.ink700 },
                                    ]}
                                >
                                    Photo {i + 1}
                                </Text>
                                <Pressable
                                    onPress={() => handleRemovePhoto(i)}
                                    hitSlop={6}
                                    style={[
                                        styles.photoRemove,
                                        { backgroundColor: colors.danger100 },
                                    ]}
                                >
                                    <Icon
                                        name="x"
                                        size={10}
                                        color={colors.danger600}
                                    />
                                </Pressable>
                            </View>
                        ))}
                        <Pressable
                            onPress={handleAddPhoto}
                            disabled={uploadingPhoto}
                            style={[
                                styles.photoAdd,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.brand800,
                                    opacity: uploadingPhoto ? 0.6 : 1,
                                },
                            ]}
                        >
                            <Icon
                                name="camera"
                                size={18}
                                color={colors.brand800}
                            />
                            <Text
                                style={[
                                    styles.photoAddText,
                                    { color: colors.brand800 },
                                ]}
                            >
                                {uploadingPhoto ? "Envoi…" : "Prendre"}
                            </Text>
                        </Pressable>
                    </View>
                </Section>

                {/* Signature */}
                <Section title="Signature" required done={signed}>
                    <Pressable
                        onPress={handleSign}
                        style={[
                            styles.signBtn,
                            {
                                backgroundColor: signed ? colors.ok100 : colors.paper,
                                borderColor: signed ? colors.ok600 : colors.brand800,
                            },
                        ]}
                    >
                        <Icon
                            name={signed ? "check" : "signature"}
                            size={18}
                            color={signed ? colors.ok700 : colors.brand800}
                            stroke={2}
                        />
                        <Text
                            style={[
                                styles.signBtnText,
                                { color: signed ? colors.ok700 : colors.brand800 },
                            ]}
                        >
                            {signed ? "Signature ajoutée" : "Faire signer"}
                        </Text>
                    </Pressable>
                </Section>

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* Bottom bar fixe */}
            <View
                style={[
                    styles.bottomBar,
                    {
                        backgroundColor: colors.paper,
                        borderTopColor: colors.ink200,
                    },
                ]}
            >
                <Pressable
                    onPress={handleValidate}
                    disabled={!canValidate}
                    style={[
                        styles.validateBtn,
                        {
                            backgroundColor: canValidate
                                ? colors.baobab600
                                : colors.ink300,
                        },
                    ]}
                >
                    <Icon name="check" size={16} color={colors.paper} stroke={2} />
                    <Text
                        style={[styles.validateBtnText, { color: colors.paper }]}
                    >
                        {submitting
                            ? "Validation…"
                            : "Confirmer la livraison"}
                    </Text>
                </Pressable>
            </View>

            <SignaturePad
                visible={signaturePadOpen}
                onClose={() => setSignaturePadOpen(false)}
                onSign={(url) => {
                    setSignatureUrl(url);
                    setSignaturePadOpen(false);
                }}
            />
        </SafeAreaView>
    );
}

/* ════════════ Section helper ════════════ */

function Section({
    title,
    required,
    done,
    children,
}: {
    title: string;
    required?: boolean;
    done: boolean;
    children: React.ReactNode;
}) {
    const colors = useThemeColors();
    return (
        <View style={styles.section}>
            <View style={styles.sectionHead}>
                <Text style={[styles.sectionTitle, { color: colors.ink900 }]}>
                    {title}
                    {required && (
                        <Text style={{ color: colors.danger600 }}> *</Text>
                    )}
                </Text>
                {done && (
                    <View
                        style={[
                            styles.sectionDot,
                            { backgroundColor: colors.ok700 },
                        ]}
                    >
                        <Icon
                            name="check"
                            size={10}
                            color={colors.paper}
                            stroke={2.5}
                        />
                    </View>
                )}
            </View>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    topTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
        letterSpacing: -0.3,
    },
    topSub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    typePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    typePillText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },

    content: { padding: 16, gap: 14 },

    clientCard: {
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 8,
    },
    clientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    clientName: {
        flex: 1,
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        letterSpacing: -0.3,
    },
    clientAddr: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginLeft: 26,
    },
    statsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        marginTop: 6,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: "#e5e7eb",
    },
    statBlock: { flex: 1, gap: 2 },
    statSep: { width: 1, marginHorizontal: 12 },
    statLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    statValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
    },

    section: { gap: 8 },
    sectionHead: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    sectionTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    sectionDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    input: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    inputText: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },

    photosGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    photoTile: {
        position: "relative",
        width: 88,
        height: 88,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    photoIdx: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    photoRemove: {
        position: "absolute",
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    photoAdd: {
        width: 88,
        height: 88,
        borderRadius: 10,
        borderWidth: 2,
        borderStyle: "dashed",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
    },
    photoAddText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },

    signBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: "dashed",
    },
    signBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    bottomBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: 16,
        paddingBottom: 28,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    validateBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
    },
    validateBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },
});
