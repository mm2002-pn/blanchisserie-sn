import { Fragment, useCallback, useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { OrderQrModal } from "@/components/shared/OrderQrModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrder } from "@/contexts/OrderContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Order, OrderStatus } from "@/types/order.types";

const FILTERS = [
    { id: "all", label: "Toutes" },
    { id: "pending", label: "En attente" },
    { id: "in_progress", label: "En cours" },
    { id: "delivered", label: "Livrées" },
    { id: "cancelled", label: "Annulées" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const STATUS_TO_UI: Record<OrderStatus, UIStatus> = {
    pending: "En attente",
    confirmed: "Créée",
    collected: "Collectée",
    in_progress: "Traitement",
    ready: "Prête",
    delivered: "Livrée",
    cancelled: "Annulée",
};

/** Progression 0 → 1 pour la mini-timeline en bas de chaque carte */
const STATUS_TO_PROGRESS: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    collected: 0.25,
    in_progress: 0.5,
    ready: 0.75,
    delivered: 1,
    cancelled: 0,
};

const TIMELINE_STEPS = ["Créée", "Collectée", "Traitement", "Prête", "Livrée"] as const;

function countItems(order: Order): number {
    if (!order.services) return 0;
    return order.services.reduce(
        (total, s) =>
            total + (s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0),
        0,
    );
}

function formatShort(iso: string): string {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const sameDay = (a: Date, b: Date) =>
        a.getDate() === b.getDate() &&
        a.getMonth() === b.getMonth() &&
        a.getFullYear() === b.getFullYear();
    if (sameDay(d, today)) return "Aujourd'hui";
    if (sameDay(d, yesterday)) return "Hier";
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export default function OrdersScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { orders, cancelOrder } = useOrder();
    const qc = useQueryClient();
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await qc.invalidateQueries({ queryKey: ["orders"] });
        } finally {
            setRefreshing(false);
        }
    }, [qc]);

    const [selected, setSelected] = useState<FilterId>("all");
    const [search, setSearch] = useState("");
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [qrOrder, setQrOrder] = useState<Order | null>(null);

    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        return orders.filter((o) => {
            if (selected === "all") {
                // rien
            } else if (selected === "in_progress") {
                if (
                    o.status !== "confirmed" &&
                    o.status !== "collected" &&
                    o.status !== "in_progress" &&
                    o.status !== "ready"
                ) {
                    return false;
                }
            } else if (o.status !== selected) {
                return false;
            }
            if (!term) return true;
            return (
                o.orderNumber.toLowerCase().includes(term) ||
                STATUS_TO_UI[o.status].toLowerCase().includes(term)
            );
        });
    }, [orders, selected, search]);

    const handleCancel = (id: string) => {
        Alert.alert(
            "Annuler la commande",
            "Êtes-vous sûr de vouloir annuler cette commande ?",
            [
                { text: "Non", style: "cancel" },
                {
                    text: "Oui, annuler",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            setCancellingId(id);
                            await cancelOrder(id);
                        } catch (err) {
                            Alert.alert("Erreur", "Impossible d'annuler la commande");
                        } finally {
                            setCancellingId(null);
                        }
                    },
                },
            ],
        );
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Header */}
            <View
                style={[
                    styles.header,
                    { borderBottomColor: colors.ink200, backgroundColor: colors.paper },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Mes commandes</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={styles.headerSub}>
                        {orders.length} commande{orders.length > 1 ? "s" : ""} ·{" "}
                        {filtered.length} filtrée{filtered.length > 1 ? "s" : ""}
                    </ThemedText>
                </View>
                <Pressable
                    style={[styles.iconChip, { backgroundColor: colors.ink100 }]}
                    onPress={() => router.push("/(hotel)/new-order")}
                    hitSlop={6}
                >
                    <Icon name="plus" size={16} color={colors.ink800} stroke={2} />
                </Pressable>
            </View>

            {/* Tabs */}
            <View
                style={[
                    styles.tabsWrap,
                    { borderBottomColor: colors.ink200, backgroundColor: colors.paper },
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {FILTERS.map((f) => {
                        const active = selected === f.id;
                        return (
                            <Pressable
                                key={f.id}
                                onPress={() => setSelected(f.id)}
                                style={[
                                    styles.tab,
                                    {
                                        backgroundColor: active ? colors.ink900 : colors.paper,
                                        borderColor: active ? colors.ink900 : colors.ink200,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        { color: active ? colors.paper : colors.ink700 },
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            {/* Search */}
            <View style={[styles.searchWrap, { backgroundColor: colors.paper }]}>
                <View style={[styles.search, { backgroundColor: colors.paper2 }]}>
                    <Icon name="search" size={14} color={colors.ink500} />
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Code, date, statut…"
                        placeholderTextColor={colors.ink500}
                        style={[styles.searchInput, { color: colors.ink800 }]}
                    />
                </View>
            </View>

            {/* List */}
            <FlatList
                data={filtered}
                keyExtractor={(o) => o.id}
                contentContainerStyle={styles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.brand800}
                        colors={[colors.brand800]}
                    />
                }
                renderItem={({ item }) => (
                    <OrderCard
                        order={item}
                        onPress={() =>
                            router.push({
                                pathname: "/(hotel)/order-details",
                                params: { id: item.id },
                            })
                        }
                        onCancel={() => handleCancel(item.id)}
                        onShowQr={() => setQrOrder(item)}
                        cancelling={cancellingId === item.id}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="package" size={48} color={colors.ink300} stroke={1.2} />
                        <ThemedText
                            variate="subtitle"
                            color="ink500"
                            style={{ marginTop: 12 }}
                        >
                            Aucune commande
                        </ThemedText>
                        <ThemedText
                            variate="caption"
                            color="ink500"
                            style={{ marginTop: 4 }}
                        >
                            Ajuste le filtre ou crée une nouvelle commande.
                        </ThemedText>
                    </View>
                }
            />

            {qrOrder && (
                <OrderQrModal
                    visible={!!qrOrder}
                    onClose={() => setQrOrder(null)}
                    orderId={qrOrder.id}
                    orderNumber={qrOrder.orderNumber}
                    clientName={qrOrder.hotelName}
                />
            )}
        </SafeAreaView>
    );
}

function OrderCard({
    order,
    onPress,
    onCancel,
    onShowQr,
    cancelling,
}: {
    order: Order;
    onPress: () => void;
    onCancel: () => void;
    onShowQr: () => void;
    cancelling: boolean;
}) {
    const colors = useThemeColors();
    const pieces = countItems(order);
    const kg = (order.actualWeight ?? pieces * 0.3).toFixed(1).replace(".", ",");
    const progress = STATUS_TO_PROGRESS[order.status];
    const isCancelled = order.status === "cancelled";
    const canCancel = order.status === "pending" || order.status === "confirmed";
    const canShowQr =
        order.status === "pending" || order.status === "confirmed";

    return (
        <Pressable onPress={onPress}>
            <Card padding={14} style={{ marginBottom: 10 }}>
                <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.code, { color: colors.ink500 }]}>
                            {order.orderNumber}
                        </Text>
                        <Text style={[styles.date, { color: colors.ink900 }]}>
                            {formatShort(order.createdAt)}
                        </Text>
                        <Text style={[styles.meta, { color: colors.ink600 }]}>
                            <Text style={styles.mono}>{pieces}</Text> pièces ·{" "}
                            <Text style={styles.mono}>{kg}</Text> kg
                        </Text>
                    </View>
                    <StatusBadge status={STATUS_TO_UI[order.status]} />
                </View>

                {/* Timeline */}
                <View style={styles.timeline}>
                    {TIMELINE_STEPS.map((_, i) => {
                        const dotDone = !isCancelled && progress >= i / 4;
                        const lineDone = !isCancelled && progress > i / 4;
                        return (
                            <Fragment key={i}>
                                <View
                                    style={[
                                        styles.dot,
                                        {
                                            backgroundColor: dotDone
                                                ? colors.brand800
                                                : colors.ink200,
                                        },
                                    ]}
                                />
                                {i < TIMELINE_STEPS.length - 1 && (
                                    <View
                                        style={[
                                            styles.line,
                                            {
                                                backgroundColor: lineDone
                                                    ? colors.brand800
                                                    : colors.ink200,
                                            },
                                        ]}
                                    />
                                )}
                            </Fragment>
                        );
                    })}
                </View>

                {(canCancel || canShowQr) && (
                    <View style={styles.actions}>
                        {canShowQr && (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onShowQr();
                                }}
                                style={[
                                    styles.action,
                                    { backgroundColor: colors.brand100 },
                                ]}
                            >
                                <Text
                                    style={[styles.actionText, { color: colors.brand800 }]}
                                >
                                    QR
                                </Text>
                            </Pressable>
                        )}
                        {canCancel && (
                            <Pressable
                                onPress={(e) => {
                                    e.stopPropagation();
                                    onCancel();
                                }}
                                disabled={cancelling}
                                style={[
                                    styles.action,
                                    {
                                        backgroundColor: colors.danger100,
                                        opacity: cancelling ? 0.6 : 1,
                                    },
                                ]}
                            >
                                <Text style={[styles.actionText, { color: colors.danger600 }]}>
                                    {cancelling ? "Annulation…" : "Annuler"}
                                </Text>
                            </Pressable>
                        )}
                    </View>
                )}
            </Card>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: { marginTop: 2 },
    iconChip: {
        width: 34,
        height: 34,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },

    tabsWrap: {
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabsContent: {
        paddingHorizontal: 16,
        gap: 6,
    },
    tab: {
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    tabText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
    },

    searchWrap: {
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    search: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 9,
        borderRadius: 10,
    },
    searchInput: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        paddingVertical: 0,
    },

    list: {
        padding: 16,
        paddingBottom: 120,
    },

    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: 12,
    },
    code: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    date: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        marginTop: 3,
    },
    meta: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },
    mono: { fontFamily: FontFamily.monoRegular },

    timeline: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    dot: {
        width: 9,
        height: 9,
        borderRadius: 99,
    },
    line: {
        flex: 1,
        height: 2,
    },

    actions: {
        flexDirection: "row",
        gap: 8,
        marginTop: 12,
    },
    action: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    actionText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    empty: {
        alignItems: "center",
        paddingVertical: 64,
    },
});
