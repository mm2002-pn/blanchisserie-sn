import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBarSpace } from "@/components/shared/StatusBarSpace";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge, { OrderStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import DrawerMenu from "@/components/shared/DrawerMenu";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useOrder } from "@/contexts/OrderContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useInvoices, useInvoicesRealtime } from "@/hooks/useInvoices";
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

function countItems(order: Order): number {
    if (!order.services) return 0;
    return order.services.reduce(
        (total, s) =>
            total + (s.items?.reduce((sum, i) => sum + i.quantity, 0) || 0),
        0,
    );
}

function formatDate(iso: string): string {
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

function formatCFA(n: number): string {
    return n.toLocaleString("fr-FR").replace(/\s/g, " ");
}

export default function HotelDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { orders } = useOrder();
    const colors = useThemeColors();
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
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [notifsOpen, setNotifsOpen] = useState(false);

    const greetingName = useMemo(
        () => (user?.name ?? "").split(" ")[0] || "Bienvenue",
        [user],
    );

    const pendingOrders = orders.filter(
        (o) => o.status === "pending" || o.status === "confirmed",
    ).length;
    const inProgressOrders = orders.filter(
        (o) => o.status === "in_progress" || o.status === "collected",
    ).length;

    useInvoicesRealtime();
    const { data: hotelInvoices } = useInvoices(user?.clientId ?? undefined);
    const monthlyAmount = (hotelInvoices ?? []).reduce((sum, i) => sum + i.total, 0);
    const monthlyWeight = orders.reduce(
        (sum, o) => sum + (o.actualWeight ?? countItems(o) * 0.3),
        0,
    );

    const recentOrders = useMemo(
        () =>
            [...orders]
                .sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                )
                .slice(0, 4),
        [orders],
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.paper2 }]}>
            <StatusBarSpace color={colors.paper} />
            {/* Top bar */}
            <View style={[styles.topBar, { borderBottomColor: colors.ink200, backgroundColor: colors.paper }]}>
                <Pressable
                    onPress={() => setDrawerVisible(true)}
                    style={[styles.avatar, { backgroundColor: colors.brand100 }]}
                    hitSlop={6}
                >
                    <Text style={[styles.avatarText, { color: colors.brand800 }]}>
                        {greetingName.charAt(0).toUpperCase()}
                    </Text>
                </Pressable>
                <View style={styles.topTitle}>
                    <ThemedText variate="title">Bonjour, {greetingName}</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={styles.topSub}>
                        {user?.name ?? "Votre espace pro"}
                    </ThemedText>
                </View>
                <NotificationBell onPress={() => setNotifsOpen(true)} color={colors.ink700} />
            </View>

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
                {/* Hero stat */}
                <View style={[styles.hero, { backgroundColor: colors.brand900 }]}>
                    <View
                        style={[
                            styles.heroBlob,
                            { backgroundColor: colors.brand700, opacity: 0.5 },
                        ]}
                    />
                    <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                        Activité · Avril 2026
                    </Text>
                    <View style={styles.heroAmountRow}>
                        <Text style={[styles.heroAmount, { color: colors.paper }]}>
                            {formatCFA(monthlyAmount)}
                        </Text>
                        <Text style={[styles.heroCurrency, { color: colors.brand100 }]}>F</Text>
                    </View>
                    <View style={styles.heroMetrics}>
                        <View>
                            <Text style={[styles.heroMetricValue, { color: colors.paper }]}>
                                {monthlyWeight.toFixed(1).replace(".", ",")}{" "}
                                <Text
                                    style={[styles.heroMetricUnit, { color: colors.brand100 }]}
                                >
                                    kg
                                </Text>
                            </Text>
                            <Text style={[styles.heroMetricLabel, { color: colors.brand100 }]}>
                                Volume traité
                            </Text>
                        </View>
                        <View style={[styles.heroDivider, { backgroundColor: colors.brand700 }]} />
                        <View>
                            <Text style={[styles.heroMetricValue, { color: colors.paper }]}>
                                +8,2{" "}
                                <Text
                                    style={[styles.heroMetricUnit, { color: colors.brand100 }]}
                                >
                                    %
                                </Text>
                            </Text>
                            <Text style={[styles.heroMetricLabel, { color: colors.brand100 }]}>
                                vs mars
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Compact stats */}
                <View style={styles.statsRow}>
                    <StatCard
                        icon="clock"
                        iconBg={colors.warn100}
                        iconFg={colors.warn700}
                        value={pendingOrders}
                        label="En attente"
                    />
                    <StatCard
                        icon="package"
                        iconBg={colors.brand100}
                        iconFg={colors.brand800}
                        value={inProgressOrders}
                        label="En traitement"
                    />
                </View>

                {/* Quick actions */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Actions rapides
                </ThemedText>
                <View style={styles.actionsRow}>
                    <Pressable
                        onPress={() => router.push("/(hotel)/new-order")}
                        style={[styles.primaryAction, { backgroundColor: colors.brand800 }]}
                    >
                        <Icon name="plus" size={18} color={colors.paper} stroke={2} />
                        <Text style={[styles.primaryActionText, { color: colors.paper }]}>
                            Nouvelle commande
                        </Text>
                    </Pressable>
                    <Pressable
                        onPress={() => router.push("/(hotel)/support")}
                        style={[
                            styles.secondaryAction,
                            { backgroundColor: colors.paper, borderColor: colors.ink200 },
                        ]}
                    >
                        <Icon name="msg" size={16} color={colors.ink700} />
                        <Text style={[styles.secondaryActionText, { color: colors.ink800 }]}>
                            Support
                        </Text>
                    </Pressable>
                </View>

                {/* Recent orders */}
                <View style={styles.recentHeader}>
                    <ThemedText variate="caps" color="ink500">
                        Commandes récentes
                    </ThemedText>
                    <Pressable onPress={() => router.push("/(hotel)/orders")}>
                        <Text style={[styles.seeAll, { color: colors.brand700 }]}>Tout voir →</Text>
                    </Pressable>
                </View>

                <View style={styles.ordersList}>
                    {recentOrders.length === 0 ? (
                        <Card padding={16}>
                            <ThemedText variate="caption" color="ink500">
                                Aucune commande récente. Créez votre première commande.
                            </ThemedText>
                        </Card>
                    ) : (
                        recentOrders.map((o) => (
                            <Pressable
                                key={o.id}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(hotel)/order-details",
                                        params: { id: o.id },
                                    })
                                }
                            >
                                <Card padding={12}>
                                    <View style={styles.orderRow}>
                                        <View style={{ flex: 1 }}>
                                            <Text
                                                style={[styles.orderCode, { color: colors.ink500 }]}
                                            >
                                                {o.orderNumber}
                                            </Text>
                                            <Text
                                                style={[styles.orderDate, { color: colors.ink800 }]}
                                            >
                                                {formatDate(o.createdAt)}
                                            </Text>
                                            <Text
                                                style={[styles.orderMeta, { color: colors.ink600 }]}
                                            >
                                                <Text style={styles.mono}>{countItems(o)}</Text>{" "}
                                                pièces ·{" "}
                                                <Text style={styles.mono}>
                                                    {(o.actualWeight ?? countItems(o) * 0.3)
                                                        .toFixed(1)
                                                        .replace(".", ",")}
                                                </Text>{" "}
                                                kg est.
                                            </Text>
                                        </View>
                                        <View style={styles.orderRight}>
                                            <StatusBadge
                                                status={STATUS_TO_LABEL[o.status] ?? "Créée"}
                                            />
                                            <Icon
                                                name="chevRight"
                                                size={14}
                                                color={colors.ink400}
                                            />
                                        </View>
                                    </View>
                                </Card>
                            </Pressable>
                        ))
                    )}
                </View>
            </ScrollView>

            {/* SOS floating */}
            <TouchableOpacity
                activeOpacity={0.88}
                style={[styles.sos, { backgroundColor: colors.terra700 }]}
                onPress={() => router.push("/(hotel)/support")}
            >
                <Icon name="msg" size={22} color={colors.paper} stroke={1.8} />
            </TouchableOpacity>

            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
            <NotificationsModal
                visible={notifsOpen}
                onClose={() => setNotifsOpen(false)}
            />
        </View>
    );
}

function StatCard({
    icon,
    iconBg,
    iconFg,
    value,
    label,
}: {
    icon: IconName;
    iconBg: string;
    iconFg: string;
    value: number;
    label: string;
}) {
    return (
        <Card padding={12} style={{ flex: 1 }}>
            <View style={styles.statHeader}>
                <View style={[styles.statIconBox, { backgroundColor: iconBg }]}>
                    <Icon name={icon} size={14} color={iconFg} />
                </View>
                <Text style={styles.statValue}>{value}</Text>
            </View>
            <Text style={styles.statLabel}>{label}</Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    // Top bar
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 38,
        height: 38,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    topTitle: { flex: 1 },
    topSub: { marginTop: 2 },
    iconChip: {
        width: 34,
        height: 34,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    notifDot: {
        position: "absolute",
        top: 8,
        right: 8,
        width: 6,
        height: 6,
        borderRadius: 99,
    },

    content: {
        padding: 16,
        paddingBottom: 120,
    },

    // Hero
    hero: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        overflow: "hidden",
    },
    heroBlob: {
        position: "absolute",
        right: -40,
        top: -40,
        width: 140,
        height: 140,
        borderRadius: 99,
    },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    heroAmountRow: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 6,
        gap: 6,
    },
    heroAmount: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 34,
        lineHeight: 36,
        letterSpacing: -0.5,
    },
    heroCurrency: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
    },
    heroMetrics: {
        flexDirection: "row",
        alignItems: "center",
        gap: 18,
        marginTop: 14,
    },
    heroDivider: {
        width: StyleSheet.hairlineWidth,
        height: 32,
    },
    heroMetricValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.xl,
    },
    heroMetricUnit: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    heroMetricLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Stat cards
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    statHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    statIconBox: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    statValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.xxl,
    },
    statLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 6,
        color: "#807A6F",
    },

    // Sections
    sectionLabel: {
        marginBottom: 8,
        paddingLeft: 2,
    },

    // Actions row
    actionsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 18,
    },
    primaryAction: {
        flex: 2,
        padding: 14,
        borderRadius: 12,
        alignItems: "flex-start",
        gap: 4,
    },
    primaryActionText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    secondaryAction: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "flex-start",
        gap: 4,
    },
    secondaryActionText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    // Recent orders
    recentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
    },
    seeAll: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    ordersList: { gap: 8 },
    orderRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    orderCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    orderDate: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        marginTop: 4,
    },
    orderMeta: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
    },
    mono: { fontFamily: FontFamily.monoRegular },
    orderRight: {
        alignItems: "flex-end",
        gap: 10,
    },

    // SOS
    sos: {
        position: "absolute",
        bottom: 100,
        right: 16,
        width: 52,
        height: 52,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 6,
    },
});
