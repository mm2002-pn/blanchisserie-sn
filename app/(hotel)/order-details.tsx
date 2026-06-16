import { Fragment, useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import Svg, { Circle, Line, Rect } from "react-native-svg";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrder as useOrderContext } from "@/contexts/OrderContext";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import { useOrder } from "@/hooks/useOrders";
import { useThemeColors } from "@/hooks/useThemeColors";
import { downloadOrderDocument } from "@/services/documents.service";
import type { LinenType, Order, OrderStatus } from "@/types/order.types";

const STATUS_TO_UI: Record<OrderStatus, UIStatus> = {
    pending: "En attente",
    confirmed: "Créée",
    collected: "Collectée",
    in_progress: "Traitement",
    ready: "Prête",
    delivered: "Livrée",
    cancelled: "Annulée",
};

const TIMELINE: { key: OrderStatus; label: string }[] = [
    { key: "confirmed", label: "Créée" },
    { key: "collected", label: "Collectée" },
    { key: "in_progress", label: "En traitement" },
    { key: "ready", label: "Prête" },
    { key: "delivered", label: "Livrée" },
];

const LINEN_LABELS: Record<string, string> = {
    drap: "Draps",
    taie: "Taies d'oreiller",
    serviette: "Serviettes",
    nappe: "Nappes",
    torchon: "Torchons",
    rideau: "Rideaux",
    couverture: "Couvertures",
    housse: "Housses de couette",
    peignoir: "Peignoirs",
    tapis: "Tapis",
};

const LINEN_WEIGHT: Record<string, number> = {
    drap: 0.9,
    taie: 0.2,
    serviette: 0.6,
    nappe: 0.8,
    torchon: 0.2,
    rideau: 1.2,
    couverture: 1.8,
    housse: 1.0,
    peignoir: 0.5,
    tapis: 3.5,
};

function formatDateTime(iso: string) {
    const d = new Date(iso);
    // Convention wall-clock : on lit en UTC (= heure saisie par le client)
    return (
        d.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
        }) +
        " · " +
        d.toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
        })
    );
}

function frNumber(n: number, frac = 1) {
    return n
        .toFixed(frac)
        .replace(".", ",")
        .replace(/,0$/, "");
}

export default function OrderDetailsScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const { cancelOrder, isLoading } = useOrderContext();

    const orderId = params.id as string;
    const { data: liveOrder } = useOrder(orderId);
    const order = useMemo<Order | null>(() => liveOrder ?? null, [liveOrder]);
    const [cancelling, setCancelling] = useState(false);

    /** Lookup nom + poids depuis le catalogue API (codes type "LP-001") avec
     *  fallback sur les anciens libellés statiques (drap, taie, etc.). */
    const { data: apiLinens = [] } = useLinenTypes();
    const labelByCode = useMemo(() => {
        const m: Record<string, string> = { ...LINEN_LABELS };
        for (const lt of apiLinens) m[lt.code] = lt.name;
        return m;
    }, [apiLinens]);
    const weightByCode = useMemo(() => {
        const m: Record<string, number> = { ...LINEN_WEIGHT };
        for (const lt of apiLinens) m[lt.code] = (lt.averageWeight ?? 0) / 1000;
        return m;
    }, [apiLinens]);

    if (!order) {
        return (
            <SafeAreaView
                edges={["top"]}
                style={[styles.container, { backgroundColor: colors.paper2 }]}
            >
                <View style={styles.emptyState}>
                    <Icon name="package" size={48} color={colors.ink300} stroke={1.2} />
                    <ThemedText variate="subtitle" color="ink500" style={{ marginTop: 12 }}>
                        Commande introuvable
                    </ThemedText>
                    <Pressable
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: colors.brand800 }]}
                    >
                        <Text style={[styles.backButtonText, { color: colors.paper }]}>
                            Retour
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    const currentIndex = TIMELINE.findIndex((s) => s.key === order.status);
    const items = order.services.flatMap((s) => s.items ?? []);
    const totalPieces = items.reduce((sum, i) => sum + i.quantity, 0);
    const estimatedWeight = items.reduce(
        (sum, i) => sum + i.quantity * (LINEN_WEIGHT[i.type] ?? 0.4),
        0,
    );
    const actualWeight = order.actualWeight;
    const diffPct =
        actualWeight && estimatedWeight > 0
            ? ((actualWeight - estimatedWeight) / estimatedWeight) * 100
            : 0;

    const canCancel = ["pending", "confirmed"].includes(order.status);
    // Modification autorisée tant que la commande n'est pas collectée.
    // Backend valide les états (pending / confirmed / collection_planned).
    const canModify =
        order.status === "pending" || order.status === "confirmed";

    const handleCancel = () =>
        Alert.alert(
            "Annuler la commande",
            "Cette action est irréversible. Continuer ?",
            [
                { text: "Non", style: "cancel" },
                {
                    text: "Oui, annuler",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setCancelling(true);
                            await cancelOrder(order.id);
                            router.back();
                        } catch {
                            Alert.alert("Erreur", "Impossible d'annuler la commande");
                        } finally {
                            setCancelling(false);
                        }
                    },
                },
            ],
        );

    const handleModify = () =>
        router.push({ pathname: "/(hotel)/new-order", params: { orderId: order.id } });

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Top bar */}
            <View
                style={[
                    styles.topBar,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.iconChip, { backgroundColor: colors.ink100 }]}
                    hitSlop={6}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} stroke={2} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">{order.orderNumber}</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={{ marginTop: 2 }}>
                        Créée le {formatDateTime(order.createdAt)}
                    </ThemedText>
                </View>
                <Pressable
                    style={[styles.iconChip, { backgroundColor: colors.ink100 }]}
                    hitSlop={6}
                >
                    <Icon name="msg" size={16} color={colors.ink700} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Status banner */}
                <Card
                    padding={14}
                    style={[
                        styles.statusBanner,
                        {
                            backgroundColor: colors.brand50,
                            borderColor: colors.brand100,
                        },
                    ]}
                >
                    <View style={styles.statusBannerRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.caps, { color: colors.brand700 }]}>
                                Étape actuelle
                            </Text>
                            <Text
                                style={[styles.statusTitle, { color: colors.ink900 }]}
                            >
                                {STATUS_TO_UI[order.status]}
                            </Text>
                            {order.deliveryDate && (
                                <Text
                                    style={[styles.statusSub, { color: colors.ink600 }]}
                                >
                                    Livraison estimée · {formatDateTime(order.deliveryDate)}
                                </Text>
                            )}
                        </View>
                        <StatusBadge status={STATUS_TO_UI[order.status]} />
                    </View>
                </Card>

                {/* Progression */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Progression
                </ThemedText>
                <Card padding={16} style={{ marginBottom: 14 }}>
                    <View style={styles.timelineWrap}>
                        {TIMELINE.map((step, i) => {
                            const done = order.status !== "cancelled" && i < currentIndex;
                            const active = order.status !== "cancelled" && i === currentIndex;
                            const dotColor = active
                                ? colors.brand800
                                : done
                                ? colors.brand700
                                : colors.paper;
                            const borderColor =
                                done || active ? colors.brand800 : colors.ink300;
                            const lineColor = done ? colors.brand700 : colors.ink200;

                            return (
                                <View key={step.key} style={styles.timelineRow}>
                                    <View style={styles.timelineCol}>
                                        <View
                                            style={[
                                                styles.timelineDot,
                                                {
                                                    backgroundColor: dotColor,
                                                    borderColor,
                                                },
                                                active && {
                                                    shadowColor: colors.brand100,
                                                    shadowOffset: { width: 0, height: 0 },
                                                    shadowRadius: 4,
                                                    shadowOpacity: 1,
                                                    elevation: 2,
                                                },
                                            ]}
                                        />
                                        {i < TIMELINE.length - 1 && (
                                            <View
                                                style={[
                                                    styles.timelineLine,
                                                    { backgroundColor: lineColor },
                                                ]}
                                            />
                                        )}
                                    </View>
                                    <View style={styles.timelineBody}>
                                        <Text
                                            style={[
                                                styles.timelineLabel,
                                                {
                                                    color:
                                                        done || active
                                                            ? colors.ink900
                                                            : colors.ink500,
                                                    fontFamily: active
                                                        ? FontFamily.uiSemibold
                                                        : FontFamily.uiMedium,
                                                },
                                            ]}
                                        >
                                            {step.label}
                                        </Text>
                                        {(done || active) && (
                                            <Text
                                                style={[
                                                    styles.timelineMeta,
                                                    { color: colors.ink500 },
                                                ]}
                                            >
                                                {active
                                                    ? "En cours"
                                                    : formatDateTime(order.updatedAt)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* Documents commerciaux */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Documents
                </ThemedText>
                <Card padding={12} style={{ marginBottom: 14 }}>
                    <View style={styles.docsRow}>
                        <DocumentButton
                            orderId={order.id}
                            type="bon-commande"
                            label="Bon de commande"
                            sub="CMD"
                            enabled
                        />
                        <DocumentButton
                            orderId={order.id}
                            type="bon-collecte"
                            label="Bon de collecte"
                            sub="BCOL"
                            enabled={
                                order.status !== "pending" &&
                                order.status !== "confirmed" &&
                                order.status !== "cancelled"
                            }
                        />
                        <DocumentButton
                            orderId={order.id}
                            type="bon-livraison"
                            label="Bon de livraison"
                            sub="BL"
                            enabled={order.status === "delivered"}
                        />
                    </View>
                </Card>

                {/* Weight comparator */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Poids estimé vs réel
                </ThemedText>
                <Card padding={16} style={{ marginBottom: 14 }}>
                    <View style={styles.weightHead}>
                        <View>
                            <Text style={[styles.weightCaption, { color: colors.ink500 }]}>
                                Estimé à la collecte
                            </Text>
                            <Text
                                style={[styles.weightValue, { color: colors.ink900 }]}
                            >
                                {frNumber(estimatedWeight)} kg
                            </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.weightCaption, { color: colors.ink500 }]}>
                                Pesée réelle · atelier
                            </Text>
                            <Text
                                style={[styles.weightValue, { color: colors.ink900 }]}
                            >
                                {actualWeight ? `${frNumber(actualWeight)} kg` : "—"}
                            </Text>
                        </View>
                    </View>

                    <Svg
                        width="100%"
                        height={26}
                        viewBox="0 0 300 26"
                        preserveAspectRatio="none"
                    >
                        <Rect x={0} y={11} width={300} height={3} rx={1.5} fill={colors.ink200} />
                        <Rect x={150} y={5} width={1} height={15} fill={colors.ink400} />
                        {actualWeight ? (
                            <>
                                <Line
                                    x1={150}
                                    y1={12.5}
                                    x2={150 + Math.max(Math.min(diffPct * 2, 120), -120)}
                                    y2={12.5}
                                    stroke={Math.abs(diffPct) > 5 ? colors.warn600 : colors.ok600}
                                    strokeWidth={3}
                                />
                                <Circle
                                    cx={150}
                                    cy={12.5}
                                    r={4.5}
                                    fill={colors.paper}
                                    stroke={colors.ink700}
                                    strokeWidth={1.5}
                                />
                                <Circle
                                    cx={150 + Math.max(Math.min(diffPct * 2, 120), -120)}
                                    cy={12.5}
                                    r={5}
                                    fill={Math.abs(diffPct) > 5 ? colors.warn600 : colors.ok600}
                                />
                            </>
                        ) : (
                            <Circle
                                cx={150}
                                cy={12.5}
                                r={4.5}
                                fill={colors.paper}
                                stroke={colors.ink400}
                                strokeWidth={1.5}
                            />
                        )}
                    </Svg>

                    <View style={styles.weightScale}>
                        <Text style={[styles.weightScaleText, { color: colors.ink500 }]}>
                            −10%
                        </Text>
                        {actualWeight ? (
                            <Text
                                style={[
                                    styles.weightScaleDiff,
                                    {
                                        color:
                                            Math.abs(diffPct) > 5
                                                ? colors.warn700
                                                : colors.ok700,
                                    },
                                ]}
                            >
                                Écart {diffPct >= 0 ? "+" : ""}
                                {frNumber(diffPct, 1)}%
                            </Text>
                        ) : (
                            <Text
                                style={[styles.weightScaleDiff, { color: colors.ink500 }]}
                            >
                                En attente de pesée
                            </Text>
                        )}
                        <Text style={[styles.weightScaleText, { color: colors.ink500 }]}>
                            +10%
                        </Text>
                    </View>

                    {actualWeight && Math.abs(diffPct) > 5 && (
                        <View
                            style={[
                                styles.weightNote,
                                { backgroundColor: colors.warn100 },
                            ]}
                        >
                            <Text style={[styles.weightNoteText, { color: colors.ink700 }]}>
                                L'écart dépasse la tolérance contractuelle (±5%). La facture
                                sera établie sur le poids réel.
                            </Text>
                        </View>
                    )}
                </Card>

                {/* Articles */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Articles · {totalPieces} pièces
                </ThemedText>
                <Card padding={0} style={{ marginBottom: 14 }}>
                    {items.length === 0 ? (
                        <Text
                            style={{
                                padding: 14,
                                fontFamily: FontFamily.uiRegular,
                                fontSize: Typography.fontSize.xs,
                                color: colors.ink500,
                            }}
                        >
                            Aucun article détaillé
                        </Text>
                    ) : (
                        items.map((it, i) => (
                            <Fragment key={`${it.type}-${i}`}>
                                <View style={styles.articleRow}>
                                    <Text
                                        style={[
                                            styles.articleLabel,
                                            { color: colors.ink900 },
                                        ]}
                                    >
                                        {labelByCode[it.type] ?? it.type}
                                    </Text>
                                    <View style={styles.articleMeta}>
                                        <Text
                                            style={[styles.articleQty, { color: colors.ink500 }]}
                                        >
                                            ×{it.quantity}
                                        </Text>
                                        <Text
                                            style={[styles.articleKg, { color: colors.ink900 }]}
                                        >
                                            {frNumber(it.quantity * (weightByCode[it.type] ?? 0.4))} kg
                                        </Text>
                                    </View>
                                </View>
                                {i < items.length - 1 && (
                                    <View
                                        style={[
                                            styles.articleDivider,
                                            { backgroundColor: colors.ink200 },
                                        ]}
                                    />
                                )}
                            </Fragment>
                        ))
                    )}
                </Card>

                {/* Hotel + dates */}
                <Card padding={14} style={{ marginBottom: 14 }}>
                    <View style={styles.kv}>
                        <Text style={[styles.kvLabel, { color: colors.ink500 }]}>
                            Établissement
                        </Text>
                        <Text style={[styles.kvValue, { color: colors.ink900 }]}>
                            {order.hotelName}
                        </Text>
                    </View>
                    <View style={[styles.kvDivider, { backgroundColor: colors.ink200 }]} />
                    <View style={styles.kv}>
                        <Text style={[styles.kvLabel, { color: colors.ink500 }]}>
                            Collecte
                        </Text>
                        <Text style={[styles.kvValue, { color: colors.ink900 }]}>
                            {formatDateTime(order.collectionDate)}
                        </Text>
                    </View>
                    {order.deliveryDate && (
                        <>
                            <View style={[styles.kvDivider, { backgroundColor: colors.ink200 }]} />
                            <View style={styles.kv}>
                                <Text style={[styles.kvLabel, { color: colors.ink500 }]}>
                                    Livraison
                                </Text>
                                <Text style={[styles.kvValue, { color: colors.ink900 }]}>
                                    {formatDateTime(order.deliveryDate)}
                                </Text>
                            </View>
                        </>
                    )}
                </Card>

                {/* Instructions */}
                {order.instructions ? (
                    <Card padding={14} style={{ marginBottom: 14 }}>
                        <Text style={[styles.caps, { color: colors.ink500, marginBottom: 6 }]}>
                            Instructions
                        </Text>
                        <Text
                            style={{
                                fontFamily: FontFamily.uiRegular,
                                fontSize: Typography.fontSize.sm,
                                color: colors.ink800,
                                lineHeight: 20,
                            }}
                        >
                            {order.instructions}
                        </Text>
                    </Card>
                ) : null}

                {/* Actions */}
                <View style={styles.actions}>
                    <Pressable
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: colors.paper,
                                borderColor: colors.ink200,
                                borderWidth: StyleSheet.hairlineWidth,
                            },
                        ]}
                    >
                        <Text style={[styles.actionBtnText, { color: colors.ink800 }]}>
                            Voir photos
                            {order.photos?.length ? ` (${order.photos.length})` : ""}
                        </Text>
                    </Pressable>
                    <Pressable
                        style={[styles.actionBtn, { backgroundColor: colors.danger100 }]}
                    >
                        <Text style={[styles.actionBtnText, { color: colors.danger600 }]}>
                            Ouvrir réclamation
                        </Text>
                    </Pressable>
                </View>

                {/* Modify / Cancel */}
                {(canModify || canCancel) && (
                    <View style={[styles.actions, { marginTop: 10 }]}>
                        {canModify && (
                            <Pressable
                                onPress={handleModify}
                                style={[
                                    styles.actionBtn,
                                    {
                                        backgroundColor: colors.brand100,
                                    },
                                ]}
                            >
                                <Text
                                    style={[styles.actionBtnText, { color: colors.brand800 }]}
                                >
                                    Modifier
                                </Text>
                            </Pressable>
                        )}
                        {canCancel && (
                            <Pressable
                                onPress={handleCancel}
                                disabled={cancelling || isLoading}
                                style={[
                                    styles.actionBtn,
                                    {
                                        backgroundColor: colors.paper,
                                        borderColor: colors.danger600,
                                        borderWidth: StyleSheet.hairlineWidth,
                                        opacity: cancelling ? 0.6 : 1,
                                    },
                                ]}
                            >
                                <Text
                                    style={[styles.actionBtnText, { color: colors.danger600 }]}
                                >
                                    {cancelling ? "Annulation…" : "Annuler la commande"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

/** Bouton de téléchargement d'un document de commande (PDF). */
function DocumentButton({
    orderId,
    type,
    label,
    sub,
    enabled,
}: {
    orderId: string;
    type: "bon-commande" | "bon-collecte" | "bon-livraison";
    label: string;
    sub: string;
    enabled: boolean;
}) {
    const colors = useThemeColors();
    const [busy, setBusy] = useState(false);

    const handlePress = async () => {
        if (!enabled || busy) return;
        setBusy(true);
        try {
            await downloadOrderDocument(orderId, type);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Pressable
            onPress={handlePress}
            disabled={!enabled || busy}
            style={[
                styles.docBtn,
                {
                    backgroundColor: enabled ? colors.paper : colors.paper2,
                    borderColor: enabled ? colors.ink200 : colors.ink100,
                    opacity: enabled ? (busy ? 0.6 : 1) : 0.5,
                },
            ]}
        >
            <Icon
                name="receipt"
                size={16}
                color={enabled ? colors.brand800 : colors.ink400}
            />
            <View style={{ flex: 1, minWidth: 0 }}>
                <Text
                    style={[
                        styles.docBtnLabel,
                        { color: enabled ? colors.ink900 : colors.ink500 },
                    ]}
                    numberOfLines={1}
                >
                    {label}
                </Text>
                <Text style={[styles.docBtnSub, { color: colors.ink500 }]}>
                    {busy ? "Téléchargement…" : sub}
                </Text>
            </View>
        </Pressable>
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
    iconChip: {
        width: 34,
        height: 34,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },

    content: {
        padding: 16,
        paddingBottom: 120,
    },

    // Status banner
    statusBanner: {
        marginBottom: 14,
    },
    statusBannerRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    caps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    statusTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        marginTop: 2,
        letterSpacing: -0.3,
    },
    statusSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
    },

    sectionLabel: {
        marginBottom: 10,
        paddingLeft: 2,
    },

    docsRow: {
        flexDirection: "row",
        gap: 8,
    },
    docBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    docBtnLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    docBtnSub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },

    // Timeline
    timelineWrap: {
        paddingLeft: 6,
    },
    timelineRow: {
        flexDirection: "row",
        minHeight: 44,
    },
    timelineCol: {
        width: 18,
        alignItems: "center",
    },
    timelineDot: {
        width: 13,
        height: 13,
        borderRadius: 99,
        borderWidth: 1.5,
        marginTop: 2,
    },
    timelineLine: {
        width: 1.5,
        flex: 1,
        marginVertical: 2,
    },
    timelineBody: {
        flex: 1,
        paddingLeft: 12,
        paddingBottom: 14,
    },
    timelineLabel: {
        fontSize: Typography.fontSize.sm,
    },
    timelineMeta: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    // Weight
    weightHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 14,
    },
    weightCaption: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    weightValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 26,
        lineHeight: 28,
        marginTop: 2,
    },
    weightScale: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
    },
    weightScaleText: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    weightScaleDiff: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.xs,
    },
    weightNote: {
        marginTop: 10,
        padding: 10,
        borderRadius: 8,
    },
    weightNoteText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        lineHeight: 16,
    },

    // Articles
    articleRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 14,
    },
    articleLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    articleMeta: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 16,
    },
    articleQty: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.xs,
    },
    articleKg: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
        minWidth: 58,
        textAlign: "right",
    },
    articleDivider: {
        height: StyleSheet.hairlineWidth,
        marginHorizontal: 14,
    },

    // KV list
    kv: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
    },
    kvLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
    },
    kvValue: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    kvDivider: {
        height: StyleSheet.hairlineWidth,
    },

    // Actions
    actions: {
        flexDirection: "row",
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
    },
    actionBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },

    // Empty
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
    },
    backButton: {
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 10,
    },
    backButtonText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
});
