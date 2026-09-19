import { useCallback, useMemo, useState } from "react";
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

import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
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

/** Étape textuelle affichée sous chaque carte — basée sur le vrai workflow API. */
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
    cancelled: "Commande annulée",
};

function countItems(order: Order): number {
    if (!order.services) return 0;
    return order.services.reduce(
        (total, s) => total + (s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0),
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
                        } catch {
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
        <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.paper }]}>
            {/* Header sticky */}
            <View style={[styles.header, { backgroundColor: colors.paper }]}>
                <View style={styles.headerTop}>
                    <Text style={[styles.title, { color: colors.ink900 }]}>Mes commandes</Text>
                    <Pressable
                        style={[styles.addBtn, { backgroundColor: colors.brand900 }]}
                        onPress={() => router.push("/(hotel)/new-order")}
                        hitSlop={6}
                    >
                        <Icon name="plus" size={16} color="#FFFFFF" stroke={2.2} />
                    </Pressable>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersRow}
                >
                    {FILTERS.map((f) => {
                        const active = selected === f.id;
                        return (
                            <Pressable
                                key={f.id}
                                onPress={() => setSelected(f.id)}
                                style={[
                                    styles.filterChip,
                                    {
                                        backgroundColor: active ? colors.brand900 : colors.paper,
                                        borderColor: active ? colors.brand900 : colors.ink200,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: active ? "#FFFFFF" : colors.ink700 },
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

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
                        <Text style={[styles.emptyTitle, { color: colors.ink600 }]}>
                            Aucune commande
                        </Text>
                        <Text style={[styles.emptySub, { color: colors.ink500 }]}>
                            Ajuste le filtre ou crée une nouvelle commande.
                        </Text>
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
    const kg = (order.actualWeight ?? order.estimatedWeight ?? pieces * 0.3)
        .toFixed(1)
        .replace(".", ",");
    const stepLabel = STEP_LABEL[order.apiStatus ?? order.status] ?? "—";
    const canCancel = order.status === "pending" || order.status === "confirmed";
    const canShowQr = order.status === "pending" || order.status === "confirmed";

    return (
        <Pressable
            onPress={onPress}
            style={[styles.card, { backgroundColor: colors.paper, borderColor: colors.ink200 }]}
        >
            <View style={styles.cardTop}>
                <Text style={[styles.cardId, { color: colors.ink900 }]}>{order.orderNumber}</Text>
                <StatusBadge status={STATUS_TO_UI[order.status]} />
            </View>
            <Text style={[styles.cardDate, { color: colors.ink600 }]}>
                {formatShort(order.createdAt)}
            </Text>
            <View style={styles.cardBottom}>
                <Text style={[styles.cardKg, { color: colors.ink900 }]}>{kg} kg estimés</Text>
                <Text style={[styles.cardStep, { color: colors.ink600 }]} numberOfLines={1}>
                    {stepLabel}
                </Text>
            </View>

            {(canCancel || canShowQr) && (
                <View style={styles.actions}>
                    {canShowQr && (
                        <Pressable
                            onPress={(e) => {
                                e.stopPropagation();
                                onShowQr();
                            }}
                            style={[styles.action, { backgroundColor: colors.brand100 }]}
                        >
                            <Text style={[styles.actionText, { color: colors.brand800 }]}>QR</Text>
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
                                { backgroundColor: colors.danger100, opacity: cancelling ? 0.6 : 1 },
                            ]}
                        >
                            <Text style={[styles.actionText, { color: colors.danger600 }]}>
                                {cancelling ? "Annulation…" : "Annuler"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 12,
        gap: 12,
    },
    headerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    title: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 22,
        letterSpacing: -0.2,
    },
    addBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
    },

    filtersRow: { gap: 7 },
    filterChip: {
        height: 34,
        paddingHorizontal: 15,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    filterText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 12.5,
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
        paddingHorizontal: 20,
        paddingTop: 6,
        paddingBottom: 120,
        gap: 9,
    },

    card: {
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 16,
    },
    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    cardId: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 15,
    },
    cardDate: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12.5,
        marginTop: 7,
    },
    cardBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 13,
        gap: 10,
    },
    cardKg: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 13,
    },
    cardStep: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12.5,
        flexShrink: 1,
        textAlign: "right",
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
    emptyTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
        marginTop: 12,
    },
    emptySub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        marginTop: 4,
    },
});
