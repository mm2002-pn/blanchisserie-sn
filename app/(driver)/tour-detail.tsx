import { useCallback, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
    useRound,
    useStartRound,
    useUnloadRound,
} from "@/hooks/useCollectionRounds";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";

export default function TourDetailScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const roundId = (params.roundId as string | undefined) ?? null;

    // Branche le realtime pour rafraîchir la tournée quand une commande
    // est collectée (depuis ce screen ou un autre device).
    useOrdersRealtime();

    const { data: round, isLoading } = useRound(roundId);
    const start = useStartRound();
    const unload = useUnloadRound();
    const qc = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["collection-rounds"] }),
                qc.invalidateQueries({ queryKey: ["orders"] }),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [qc]);

    const isDelivery = round?.type === 'delivery';
    const actionLabelSingular = isDelivery ? 'livraison' : 'collecte';
    const actionLabelPlural = isDelivery ? 'livraisons' : 'collectes';

    const stops = useMemo(() => {
        if (!round) return [];
        // Trie par date prévue (utilise collectionDate de chaque commande)
        return [...round.orders].sort(
            (a, b) =>
                new Date(a.collectionDate).getTime() -
                new Date(b.collectionDate).getTime(),
        );
    }, [round]);

    const done = stops.filter((o) =>
        isDelivery ? o.deliveredAt : o.collectedAt,
    ).length;
    const total = stops.length;
    const totalKg = stops.reduce((s, o) => s + (o.estimatedWeight ?? 0), 0) / 1000;
    const allDone = total > 0 && done === total;

    const [unloadModalOpen, setUnloadModalOpen] = useState(false);
    const [unloadSignatureOpen, setUnloadSignatureOpen] = useState(false);
    const [unloadSignatureUrl, setUnloadSignatureUrl] = useState<string | null>(
        null,
    );
    const [unloadRecipient, setUnloadRecipient] = useState("");

    const handleSubmitUnload = async () => {
        if (!roundId) return;
        if (!unloadSignatureUrl) {
            Alert.alert(
                "Signature requise",
                "Le réceptionnaire doit signer pour confirmer l'arrivée.",
            );
            return;
        }
        try {
            await unload.mutateAsync({
                id: roundId,
                data: {
                    signatureUrl: unloadSignatureUrl,
                    recipientName: unloadRecipient.trim() || undefined,
                },
            });
            setUnloadModalOpen(false);
            setUnloadSignatureUrl(null);
            setUnloadRecipient("");
            Alert.alert(
                "Arrivée confirmée",
                "Les commandes sont prêtes pour la pesée atelier.",
            );
        } catch (err) {
            Alert.alert(
                "Erreur",
                err instanceof Error ? err.message : "Échec déchargement",
            );
        }
    };

    const handleStart = async () => {
        if (!roundId) return;
        try {
            await start.mutateAsync(roundId);
        } catch (err) {
            Alert.alert(
                "Erreur",
                err instanceof Error ? err.message : "Échec démarrage",
            );
        }
    };

    if (isLoading || !round) {
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

    const inProgress = round.status === "in_progress";
    const planned = round.status === "planned";

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
                    onPress={() => router.back()}
                    hitSlop={6}
                    style={[styles.backBtn, { backgroundColor: colors.ink100 }]}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.topNumber, { color: colors.ink900 }]}>
                        Tournée {round.number}
                    </Text>
                    <Text style={[styles.topSub, { color: colors.ink500 }]}>
                        {format(new Date(round.plannedAt), "EEEE d MMMM 'à' HH:mm", {
                            locale: fr,
                        })}
                    </Text>
                </View>
                <View
                    style={[
                        styles.statusPill,
                        {
                            backgroundColor: inProgress
                                ? colors.baobab600
                                : allDone
                                  ? colors.ok700
                                  : colors.brand100,
                        },
                    ]}
                >
                    <Text
                        style={[
                            styles.statusText,
                            {
                                color:
                                    inProgress || allDone ? colors.paper : colors.brand800,
                            },
                        ]}
                    >
                        {allDone
                            ? "Terminée"
                            : inProgress
                              ? "En cours"
                              : "Planifiée"}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.brand800}
                        colors={[colors.brand800]}
                    />
                }
            >
                {/* Progrès */}
                <Card padding={16} style={{ marginBottom: 14 }}>
                    <View style={styles.progressHead}>
                        <View>
                            <Text style={[styles.progressCaps, { color: colors.ink500 }]}>
                                Progression
                            </Text>
                            <Text
                                style={[styles.progressValue, { color: colors.ink900 }]}
                            >
                                {done} / {total}
                                <Text
                                    style={[styles.progressUnit, { color: colors.ink500 }]}
                                >
                                    {" "}
                                    {total > 1 ? actionLabelPlural : actionLabelSingular}
                                </Text>
                            </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.progressCaps, { color: colors.ink500 }]}>
                                Poids total
                            </Text>
                            <Text
                                style={[styles.progressValue, { color: colors.ink900 }]}
                            >
                                {totalKg.toFixed(1)}
                                <Text
                                    style={[styles.progressUnit, { color: colors.ink500 }]}
                                >
                                    {" kg"}
                                </Text>
                            </Text>
                        </View>
                    </View>
                    <View
                        style={[
                            styles.progressTrack,
                            { backgroundColor: colors.ink200 },
                        ]}
                    >
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    backgroundColor: allDone
                                        ? colors.ok700
                                        : colors.brand800,
                                    width: total > 0 ? `${(done / total) * 100}%` : "0%",
                                },
                            ]}
                        />
                    </View>
                </Card>

                {/* Bouton démarrer tournée (uniquement si planned) */}
                {planned && (
                    <Pressable
                        onPress={handleStart}
                        disabled={start.isPending}
                        style={[
                            styles.startBtn,
                            { backgroundColor: colors.baobab600 },
                        ]}
                    >
                        <Icon name="truck" size={18} color={colors.paper} stroke={2} />
                        <Text style={[styles.startBtnText, { color: colors.paper }]}>
                            {start.isPending
                                ? "Démarrage…"
                                : "Démarrer la tournée"}
                        </Text>
                        <Icon
                            name="arrowRight"
                            size={16}
                            color={colors.paper}
                            stroke={2}
                        />
                    </Pressable>
                )}

                {/* Bouton "Arrivée usine" : visible uniquement pour les rounds
                    de collecte terminées et pas encore déchargées. */}
                {!isDelivery && allDone && !round.unloadedAt && (
                    <Pressable
                        onPress={() => setUnloadModalOpen(true)}
                        style={[
                            styles.startBtn,
                            { backgroundColor: colors.terra600 },
                        ]}
                    >
                        <Icon
                            name="building"
                            size={18}
                            color={colors.paper}
                            stroke={2}
                        />
                        <Text
                            style={[styles.startBtnText, { color: colors.paper }]}
                        >
                            Confirmer arrivée à l'usine
                        </Text>
                        <Icon
                            name="arrowRight"
                            size={16}
                            color={colors.paper}
                            stroke={2}
                        />
                    </Pressable>
                )}

                {/* Bandeau confirmation : round déchargée */}
                {!isDelivery && round.unloadedAt && (
                    <View
                        style={[
                            styles.unloadedBanner,
                            {
                                backgroundColor: colors.ok100,
                                borderColor: colors.ok600,
                            },
                        ]}
                    >
                        <Icon name="check" size={14} color={colors.ok700} stroke={2} />
                        <Text
                            style={[
                                styles.unloadedText,
                                { color: colors.ok700 },
                            ]}
                        >
                            Sacs déposés à l'usine — en attente de pesée
                        </Text>
                    </View>
                )}

                {/* Équipage */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Équipage
                </ThemedText>
                <Card padding={14} style={{ marginBottom: 14 }}>
                    <View style={styles.crewRow}>
                        <Icon name="truck" size={14} color={colors.ink500} />
                        <Text style={[styles.crewText, { color: colors.ink800 }]}>
                            {round.vehicle.matricule} · {round.vehicle.brand}{" "}
                            {round.vehicle.model}
                        </Text>
                    </View>
                    {round.vehicle.enrolledPda && (
                        <View style={styles.crewRow}>
                            <Icon name="qr" size={14} color={colors.ink500} />
                            <Text style={[styles.crewText, { color: colors.ink800 }]}>
                                {round.vehicle.enrolledPda.reference}
                            </Text>
                        </View>
                    )}
                    {round.notes && (
                        <Text
                            style={[
                                styles.notesText,
                                { color: colors.ink700, borderTopColor: colors.ink200 },
                            ]}
                        >
                            📝 {round.notes}
                        </Text>
                    )}
                </Card>

                {/* Liste des stops */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Arrêts ({total})
                </ThemedText>
                <View style={{ gap: 10 }}>
                    {stops.map((stop, idx) => (
                        <StopRow
                            key={stop.id}
                            stop={stop}
                            index={idx + 1}
                            roundInProgress={inProgress}
                            isDelivery={isDelivery}
                            onAction={() =>
                                router.push({
                                    pathname: isDelivery
                                        ? "/(driver)/deliver"
                                        : "/(driver)/collect",
                                    params: { orderId: stop.id, roundId: round.id },
                                })
                            }
                            onNavigate={() => {
                                if (
                                    stop.pickupGeoLat == null ||
                                    stop.pickupGeoLng == null
                                ) {
                                    return;
                                }
                                // Bascule sur l'onglet Carte avec les params
                                // de focus → route.tsx trace l'itinéraire.
                                router.push({
                                    pathname: "/(driver)/route",
                                    params: {
                                        focusOrderId: stop.id,
                                        focusRoundId: round.id,
                                        focusLat: String(stop.pickupGeoLat),
                                        focusLng: String(stop.pickupGeoLng),
                                        focusName:
                                            stop.client?.name ?? stop.orderNumber,
                                    },
                                });
                            }}
                        />
                    ))}
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Modale confirmation arrivée usine */}
            {unloadModalOpen && (
                <View style={styles.unloadModalBackdrop}>
                    <View
                        style={[
                            styles.unloadModalSheet,
                            { backgroundColor: colors.paper },
                        ]}
                    >
                        <View
                            style={[
                                styles.unloadModalHead,
                                { borderBottomColor: colors.ink200 },
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[
                                        styles.unloadModalTitle,
                                        { color: colors.ink900 },
                                    ]}
                                >
                                    Arrivée à l'usine
                                </Text>
                                <Text
                                    style={[
                                        styles.unloadModalSub,
                                        { color: colors.ink500 },
                                    ]}
                                >
                                    Le réceptionnaire signe pour confirmer
                                </Text>
                            </View>
                            <Pressable
                                onPress={() => {
                                    setUnloadModalOpen(false);
                                    setUnloadSignatureUrl(null);
                                    setUnloadRecipient("");
                                }}
                                style={[
                                    styles.unloadModalClose,
                                    { backgroundColor: colors.paper2 },
                                ]}
                            >
                                <Icon name="x" size={16} color={colors.ink700} />
                            </Pressable>
                        </View>

                        <View style={styles.unloadModalBody}>
                            {/* Nom du réceptionnaire */}
                            <Text
                                style={[
                                    styles.unloadModalLabel,
                                    { color: colors.ink500 },
                                ]}
                            >
                                Nom du réceptionnaire
                            </Text>
                            <View
                                style={[
                                    styles.unloadModalInput,
                                    {
                                        backgroundColor: colors.paper2,
                                        borderColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Icon name="user" size={14} color={colors.ink500} />
                                <TextInput
                                    value={unloadRecipient}
                                    onChangeText={setUnloadRecipient}
                                    placeholder="ex: Aminata, atelier"
                                    placeholderTextColor={colors.ink400}
                                    style={[
                                        styles.unloadInputText,
                                        { color: colors.ink900 },
                                    ]}
                                />
                            </View>

                            {/* Signature */}
                            <Text
                                style={[
                                    styles.unloadModalLabel,
                                    { color: colors.ink500, marginTop: 14 },
                                ]}
                            >
                                Signature
                                <Text style={{ color: colors.danger600 }}> *</Text>
                            </Text>
                            <Pressable
                                onPress={() => setUnloadSignatureOpen(true)}
                                style={[
                                    styles.unloadSignBtn,
                                    {
                                        backgroundColor: unloadSignatureUrl
                                            ? colors.ok100
                                            : colors.paper,
                                        borderColor: unloadSignatureUrl
                                            ? colors.ok600
                                            : colors.brand800,
                                    },
                                ]}
                            >
                                <Icon
                                    name={
                                        unloadSignatureUrl ? "check" : "signature"
                                    }
                                    size={18}
                                    color={
                                        unloadSignatureUrl
                                            ? colors.ok700
                                            : colors.brand800
                                    }
                                    stroke={2}
                                />
                                <Text
                                    style={[
                                        styles.unloadSignBtnText,
                                        {
                                            color: unloadSignatureUrl
                                                ? colors.ok700
                                                : colors.brand800,
                                        },
                                    ]}
                                >
                                    {unloadSignatureUrl
                                        ? "Signature ajoutée"
                                        : "Faire signer"}
                                </Text>
                            </Pressable>

                            {/* Footer actions */}
                            <Pressable
                                onPress={handleSubmitUnload}
                                disabled={!unloadSignatureUrl || unload.isPending}
                                style={[
                                    styles.unloadValidateBtn,
                                    {
                                        backgroundColor:
                                            unloadSignatureUrl && !unload.isPending
                                                ? colors.terra600
                                                : colors.ink300,
                                    },
                                ]}
                            >
                                <Icon
                                    name="check"
                                    size={16}
                                    color={colors.paper}
                                    stroke={2}
                                />
                                <Text
                                    style={[
                                        styles.unloadValidateText,
                                        { color: colors.paper },
                                    ]}
                                >
                                    {unload.isPending
                                        ? "Confirmation…"
                                        : "Confirmer arrivée"}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            )}

            <SignaturePad
                visible={unloadSignatureOpen}
                onClose={() => setUnloadSignatureOpen(false)}
                onSign={(url) => {
                    setUnloadSignatureUrl(url);
                    setUnloadSignatureOpen(false);
                }}
            />
        </SafeAreaView>
    );
}

/* ════════════ STOP ROW ════════════ */

function StopRow({
    stop,
    index,
    roundInProgress,
    isDelivery,
    onAction,
    onNavigate,
}: {
    stop: {
        id: string;
        orderNumber: string;
        client: { name: string; address: string; city: string | null } | null;
        collectionDate: string;
        estimatedWeight: number | null;
        pickupGeoLat: number | null;
        pickupGeoLng: number | null;
        collectedAt: string | null;
        deliveredAt?: string | null;
    };
    index: number;
    roundInProgress: boolean;
    isDelivery: boolean;
    onAction: () => void;
    onNavigate: () => void;
}) {
    const colors = useThemeColors();
    const done = !!(isDelivery ? stop.deliveredAt : stop.collectedAt);
    const hasGeo = stop.pickupGeoLat != null && stop.pickupGeoLng != null;
    const weightKg = ((stop.estimatedWeight ?? 0) / 1000).toFixed(1);
    const time = format(new Date(stop.collectionDate), "HH:mm");

    return (
        <View
            style={[
                styles.stop,
                {
                    backgroundColor: done ? colors.ok100 : colors.paper,
                    borderColor: done ? colors.ok600 : colors.ink200,
                    borderWidth: done ? 1 : StyleSheet.hairlineWidth,
                },
            ]}
        >
            <View style={styles.stopHead}>
                <View
                    style={[
                        styles.stopIdx,
                        {
                            backgroundColor: done ? colors.ok700 : colors.brand800,
                        },
                    ]}
                >
                    {done ? (
                        <Icon name="check" size={12} color={colors.paper} stroke={2.5} />
                    ) : (
                        <Text style={[styles.stopIdxText, { color: colors.paper }]}>
                            {index}
                        </Text>
                    )}
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.stopTopRow}>
                        <Text
                            style={[styles.stopName, { color: colors.ink900 }]}
                            numberOfLines={1}
                        >
                            {stop.client?.name ?? stop.orderNumber}
                        </Text>
                        <Text style={[styles.stopTime, { color: colors.ink700 }]}>
                            {time}
                        </Text>
                    </View>
                    {stop.client?.address && (
                        <Text
                            style={[styles.stopAddr, { color: colors.ink500 }]}
                            numberOfLines={1}
                        >
                            {stop.client.address}
                        </Text>
                    )}
                    <Text style={[styles.stopMeta, { color: colors.ink500 }]}>
                        {stop.orderNumber} · {weightKg} kg
                    </Text>
                </View>
            </View>

            {/* Actions */}
            {!done && (
                <View style={styles.stopActions}>
                    {hasGeo && (
                        <Pressable
                            onPress={onNavigate}
                            style={[
                                styles.navAction,
                                { borderColor: colors.ink300 },
                            ]}
                        >
                            <Icon
                                name="navigate"
                                size={13}
                                color={colors.brand800}
                                stroke={2}
                            />
                            <Text
                                style={[
                                    styles.navActionText,
                                    { color: colors.brand800 },
                                ]}
                            >
                                Naviguer
                            </Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={onAction}
                        disabled={!roundInProgress}
                        style={[
                            styles.collectBtn,
                            {
                                backgroundColor: roundInProgress
                                    ? colors.brand800
                                    : colors.ink200,
                                opacity: roundInProgress ? 1 : 0.6,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.collectBtnText,
                                { color: roundInProgress ? colors.paper : colors.ink500 },
                            ]}
                        >
                            {roundInProgress
                                ? isDelivery
                                    ? 'Livrer'
                                    : 'Collecter'
                                : 'En attente démarrage'}
                        </Text>
                        {roundInProgress && (
                            <Icon
                                name="arrowRight"
                                size={13}
                                color={colors.paper}
                                stroke={2}
                            />
                        )}
                    </Pressable>
                </View>
            )}
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
        width: 34,
        height: 34,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },
    topNumber: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
    },
    topSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 99,
    },
    statusText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    content: {
        padding: 16,
    },
    sectionLabel: {
        marginBottom: 6,
        paddingLeft: 2,
    },

    /* Progress */
    progressHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    progressCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    progressValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        marginTop: 2,
    },
    progressUnit: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
    },

    /* Bouton démarrer */
    startBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        paddingVertical: 14,
        borderRadius: 12,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
        elevation: 4,
    },
    startBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },

    /* Modale arrivée usine */
    unloadModalBackdrop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#00000099",
        justifyContent: "flex-end",
        zIndex: 100,
    },
    unloadModalSheet: {
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingBottom: 32,
    },
    unloadModalHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    unloadModalTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
    },
    unloadModalSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    unloadModalClose: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    unloadModalBody: {
        padding: 16,
    },
    unloadModalLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginBottom: 6,
    },
    unloadModalInput: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    unloadInputText: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },
    unloadSignBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1.5,
        borderStyle: "dashed",
    },
    unloadSignBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    unloadValidateBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 20,
    },
    unloadValidateText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },

    /* Banner "Sacs déposés à l'usine" */
    unloadedBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 14,
    },
    unloadedText: {
        flex: 1,
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    /* Crew */
    crewRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 4,
    },
    crewText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    notesText: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        fontStyle: "italic",
    },

    /* Stops */
    stop: {
        padding: 12,
        borderRadius: 14,
        gap: 10,
    },
    stopHead: {
        flexDirection: "row",
        gap: 10,
        alignItems: "flex-start",
    },
    stopIdx: {
        width: 26,
        height: 26,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        shrink: 0,
    } as never,
    stopIdxText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    stopTopRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
    },
    stopName: {
        flex: 1,
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    stopTime: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },
    stopAddr: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    stopMeta: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 4,
    },
    stopActions: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    navAction: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    navActionText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    collectBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 9,
        borderRadius: 10,
    },
    collectBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
});
