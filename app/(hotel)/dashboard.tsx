import { useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus } from "@/components/ui/StatusBadge";
import { MarineHeader } from "@/components/shared/MarineHeader";
import { StatusBarSpace } from "@/components/shared/StatusBarSpace";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useOrder } from "@/contexts/OrderContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useClient } from "@/hooks/useClient";
import { useInvoices, useInvoicesRealtime } from "@/hooks/useInvoices";
import { useRealtime } from "@/services/realtime";
import type { Order } from "@/types/order.types";

const STATUS_TO_LABEL: Record<Order["status"], OrderStatus> = {
    pending: "En attente",
    confirmed: "Créée",
    collected: "Collectée",
    in_progress: "Traitement",
    ready: "Prête",
    delivered: "Livrée",
    cancelled: "Annulée",
};

/** Ordre des étapes visibles dans la timeline "commande en cours" — avant livraison. */
const TIMELINE_STEPS = [
    "pending",
    "confirmed",
    "collection_planned",
    "collected",
    "received",
    "triaged",
    "in_production",
    "ready",
];

const STEP_LABEL: Record<string, string> = {
    pending: "Confirmation attendue",
    confirmed: "Collecte planifiée",
    collection_planned: "Collecte planifiée",
    collected: "En route vers l'atelier",
    received: "Poids officiel enregistré",
    triaged: "Étiquetage terminé",
    in_production: "Lavage en cours",
    ready: "En attente de livraison",
    delivered: "Livraison signée",
    invoiced: "Facture émise",
};

const ACTIVE_STATUSES = new Set([
    "pending",
    "confirmed",
    "collection_planned",
    "collected",
    "received",
    "triaged",
    "in_production",
    "ready",
]);

function formatDayLabel(): string {
    const d = new Date();
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

function formatOrderDate(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const sameDay =
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear();
    if (sameDay) {
        return `Aujourd'hui · ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
    }
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function HotelDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { orders, refreshOrders } = useOrder();
    const colors = useThemeColors();
    const qc = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);
    const [notifsOpen, setNotifsOpen] = useState(false);

    const { data: client } = useClient(user?.clientId);
    const { connected } = useRealtime();
    useInvoicesRealtime();
    const { data: hotelInvoices } = useInvoices(user?.clientId ?? undefined);
    const overdueCount = (hotelInvoices ?? []).filter((i) => i.status === "overdue").length;

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                refreshOrders(),
                qc.invalidateQueries({ queryKey: ["invoices"] }),
            ]);
        } finally {
            setRefreshing(false);
        }
    };

    const displayName = client?.name ?? user?.name ?? "Établissement";
    const initials =
        displayName
            .split(" ")
            .map((w) => w.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "ET";

    const activeOrders = useMemo(
        () => orders.filter((o) => ACTIVE_STATUSES.has(o.apiStatus ?? o.status)),
        [orders],
    );

    // "Commande en cours" — la plus récente parmi les commandes actives.
    const heroOrder = useMemo(
        () =>
            [...activeOrders].sort(
                (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
            )[0],
        [activeOrders],
    );
    const heroStepIdx = heroOrder
        ? TIMELINE_STEPS.indexOf(heroOrder.apiStatus ?? "pending")
        : -1;
    const heroKg = heroOrder?.actualWeight ?? heroOrder?.estimatedWeight;

    const recentOrders = useMemo(
        () =>
            [...orders]
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .slice(0, 3),
        [orders],
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.paper }]}>
            <StatusBarSpace color={colors.brand900} />
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.brand800}
                        colors={[colors.brand800]}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* Header marine */}
                <MarineHeader radius={30} style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.headerDate, { color: colors.ink400 }]}>
                                {formatDayLabel()}
                            </Text>
                            <Text style={styles.headerName} numberOfLines={1}>
                                {displayName}
                            </Text>
                        </View>
                        <View style={styles.headerActions}>
                            <NotificationBell onPress={() => setNotifsOpen(true)} color="#FFFFFF" />
                            <Pressable
                                onPress={() => router.push("/(hotel)/profile")}
                                style={[styles.avatar, { backgroundColor: colors.brand800, borderColor: colors.brand700 }]}
                                hitSlop={6}
                            >
                                <Text style={[styles.avatarText, { color: colors.terra600 }]}>{initials}</Text>
                            </Pressable>
                        </View>
                    </View>

                    {/* Commande en cours */}
                    {heroOrder && (
                        <View style={[styles.heroCard, { backgroundColor: colors.brand800, borderColor: colors.brand700 }]}>
                            <View style={styles.heroCardTop}>
                                <Text style={[styles.heroCaps, { color: colors.terra600 }]}>
                                    Commande en cours
                                </Text>
                                <View style={styles.liveTag}>
                                    <View
                                        style={[
                                            styles.liveDot,
                                            { backgroundColor: connected ? colors.terra600 : colors.ink500 },
                                        ]}
                                    />
                                    <Text style={[styles.liveText, { color: colors.ink400 }]}>
                                        {connected ? "en direct" : "hors ligne"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.heroIdRow}>
                                <Text style={styles.heroId}>{heroOrder.orderNumber}</Text>
                                {heroKg != null && (
                                    <Text style={[styles.heroKg, { color: colors.ink400 }]}>
                                        {heroKg.toFixed(1).replace(".", ",")} kg
                                    </Text>
                                )}
                            </View>
                            <Text style={styles.heroStep}>
                                {STEP_LABEL[heroOrder.apiStatus ?? "pending"] ?? "En cours de traitement"}
                            </Text>

                            <View style={styles.heroBars}>
                                {TIMELINE_STEPS.map((step, i) => (
                                    <View
                                        key={step}
                                        style={[
                                            styles.heroBar,
                                            {
                                                backgroundColor:
                                                    i <= heroStepIdx ? colors.terra600 : colors.brand700,
                                            },
                                        ]}
                                    />
                                ))}
                            </View>

                            <Pressable
                                onPress={() =>
                                    router.push({
                                        pathname: "/(hotel)/order-details",
                                        params: { id: heroOrder.id },
                                    })
                                }
                                style={[styles.heroBtn, { borderColor: colors.brand700 }]}
                            >
                                <Text style={styles.heroBtnText}>Voir le suivi détaillé</Text>
                            </Pressable>
                        </View>
                    )}

                    {/* Compact stats */}
                    <View style={styles.statsRow}>
                        <Pressable
                            onPress={() => router.push("/(hotel)/orders")}
                            style={styles.statCell}
                        >
                            <Text style={styles.statValue}>{activeOrders.length}</Text>
                            <Text style={[styles.statLabel, { color: colors.ink400 }]}>
                                commande{activeOrders.length !== 1 ? "s" : ""} active
                                {activeOrders.length !== 1 ? "s" : ""}
                            </Text>
                        </Pressable>
                        <View style={[styles.statDivider, { backgroundColor: colors.brand700 }]} />
                        <Pressable
                            onPress={() => router.push("/(hotel)/invoices")}
                            style={styles.statCell}
                        >
                            <View style={styles.overdueRow}>
                                <Text style={[styles.statValue, { color: colors.terra700 }]}>
                                    {overdueCount}
                                </Text>
                                {overdueCount > 0 && (
                                    <View style={[styles.overdueDot, { backgroundColor: colors.terra600 }]} />
                                )}
                            </View>
                            <Text style={[styles.statLabel, { color: colors.terra700 }]}>
                                facture{overdueCount !== 1 ? "s" : ""} échue{overdueCount !== 1 ? "s" : ""}
                            </Text>
                        </Pressable>
                    </View>
                </MarineHeader>

                {/* Historique */}
                <View style={styles.historyHeader}>
                    <Text style={[styles.historyTitle, { color: colors.ink900 }]}>Historique</Text>
                    <Pressable onPress={() => router.push("/(hotel)/orders")}>
                        <Text style={[styles.seeAll, { color: colors.brand700 }]}>Tout voir</Text>
                    </Pressable>
                </View>

                <View style={styles.ordersList}>
                    {recentOrders.length === 0 ? (
                        <Card padding={16}>
                            <Text style={{ color: colors.ink500, fontFamily: FontFamily.uiRegular }}>
                                Aucune commande récente. Créez votre première commande.
                            </Text>
                        </Card>
                    ) : (
                        recentOrders.map((o) => {
                            const label = STATUS_TO_LABEL[o.status] ?? "Créée";
                            return (
                                <Pressable
                                    key={o.id}
                                    onPress={() =>
                                        router.push({
                                            pathname: "/(hotel)/order-details",
                                            params: { id: o.id },
                                        })
                                    }
                                    style={[styles.orderRow, { borderColor: colors.ink200 }]}
                                >
                                    <View style={[styles.orderIcon, { backgroundColor: colors.paper2 }]}>
                                        <View style={[styles.orderIconSquare, { borderColor: colors.brand700 }]} />
                                    </View>
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={[styles.orderId, { color: colors.ink900 }]}>
                                            {o.orderNumber}
                                        </Text>
                                        <Text style={[styles.orderMeta, { color: colors.ink600 }]}>
                                            {formatOrderDate(o.createdAt)}
                                            {(o.actualWeight ?? o.estimatedWeight) != null &&
                                                ` · ${(o.actualWeight ?? o.estimatedWeight)!
                                                    .toFixed(1)
                                                    .replace(".", ",")} kg`}
                                        </Text>
                                    </View>
                                    <StatusBadge status={label} />
                                </Pressable>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            {/* CTA sticky */}
            <View style={[styles.ctaWrap, { backgroundColor: colors.paper }]}>
                <Pressable
                    onPress={() => router.push("/(hotel)/new-order")}
                    style={[styles.cta, { backgroundColor: colors.brand900 }]}
                >
                    <View style={[styles.ctaIcon, { backgroundColor: colors.terra600 }]}>
                        <Icon name="plus" size={19} color={colors.brand900} stroke={2.2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={styles.ctaTitle}>Commander une collecte</Text>
                        <Text style={[styles.ctaSub, { color: colors.ink400 }]}>
                            Choisis ta date et ton créneau
                        </Text>
                    </View>
                    <Icon name="chevRight" size={18} color={colors.terra600} />
                </Pressable>
            </View>

            <NotificationsModal visible={notifsOpen} onClose={() => setNotifsOpen(false)} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { paddingBottom: 140 },

    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 22,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 12,
    },
    headerDate: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 13,
        textTransform: "capitalize",
    },
    headerName: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 22,
        color: "#FFFFFF",
        marginTop: 3,
        letterSpacing: -0.2,
    },
    headerActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 21,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 14,
    },

    // Hero card
    heroCard: {
        marginTop: 22,
        borderRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 18,
    },
    heroCardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    heroCaps: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 11,
        letterSpacing: 1.5,
        textTransform: "uppercase",
    },
    liveTag: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    liveDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    liveText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12,
    },
    heroIdRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 10,
        marginTop: 12,
    },
    heroId: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 26,
        color: "#FFFFFF",
        letterSpacing: -0.2,
    },
    heroKg: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 14,
    },
    heroStep: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 14,
        color: "#FFFFFF",
        marginTop: 10,
    },
    heroBars: {
        flexDirection: "row",
        gap: 4,
        marginTop: 16,
    },
    heroBar: {
        flex: 1,
        height: 4,
        borderRadius: 99,
    },
    heroBtn: {
        marginTop: 16,
        height: 46,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    heroBtnText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 13.5,
        color: "#FFFFFF",
    },

    // Stats
    statsRow: {
        flexDirection: "row",
        alignItems: "stretch",
        gap: 14,
        marginTop: 18,
    },
    statCell: { flex: 1, minWidth: 0 },
    statDivider: { width: StyleSheet.hairlineWidth },
    statValue: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 22,
        color: "#FFFFFF",
        letterSpacing: -0.2,
    },
    statLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12,
        marginTop: 4,
    },
    overdueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 7,
    },
    overdueDot: {
        width: 7,
        height: 7,
        borderRadius: 3.5,
    },

    // Historique
    historyHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 8,
    },
    historyTitle: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 16,
    },
    seeAll: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 13,
    },
    ordersList: {
        paddingHorizontal: 20,
        gap: 9,
    },
    orderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        backgroundColor: "#FFFFFF",
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 18,
        padding: 15,
    },
    orderIcon: {
        width: 38,
        height: 38,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    orderIconSquare: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 2,
    },
    orderId: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 14,
    },
    orderMeta: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12.5,
        marginTop: 2,
    },

    // CTA
    ctaWrap: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 18,
    },
    cta: {
        height: 60,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
        paddingHorizontal: 18,
        shadowColor: "#0B1A2E",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.22,
        shadowRadius: 22,
        elevation: 6,
    },
    ctaIcon: {
        width: 34,
        height: 34,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 15.5,
        color: "#FFFFFF",
    },
    ctaSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 11.5,
        marginTop: 2,
    },
});
