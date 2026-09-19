import { useMemo, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useInvoices, useInvoicesRealtime } from "@/hooks/useInvoices";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { Invoice, InvoiceStatus, PaymentMethod } from "@/types/invoice.types";

const FILTERS = [
    { id: "all", label: "Toutes" },
    { id: "pending", label: "En attente" },
    { id: "overdue", label: "En retard" },
    { id: "paid", label: "Payées" },
] as const;

type FilterId = (typeof FILTERS)[number]["id"];

const STATUS_TO_UI: Record<InvoiceStatus, UIStatus> = {
    pending: "En attente",
    paid: "Payée",
    overdue: "En retard",
    cancelled: "Annulée",
};

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    card: "Carte bancaire",
    transfer: "Virement",
    cash: "Espèces",
    cheque: "Chèque",
};

function formatCFA(n: number) {
    return n.toLocaleString("fr-FR").replace(/\s/g, " ");
}

function formatMonth(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

function formatDueShort(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
    });
}

function resolveStatus(inv: Invoice): InvoiceStatus {
    if (inv.status === "pending" && new Date(inv.dueDate) < new Date()) {
        return "overdue";
    }
    return inv.status;
}

export default function InvoicesScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { user } = useAuth();
    const [selected, setSelected] = useState<FilterId>("all");

    useInvoicesRealtime();
    const { data } = useInvoices(user?.clientId ?? undefined);
    const hotelInvoices = data ?? [];

    const outstanding = useMemo(
        () =>
            hotelInvoices
                .filter((i) => resolveStatus(i) === "pending" || resolveStatus(i) === "overdue")
                .reduce((sum, i) => sum + i.total, 0),
        [hotelInvoices],
    );
    const pendingCount = hotelInvoices.filter((i) => i.status === "pending").length;
    const overdueCount = hotelInvoices.filter((i) => resolveStatus(i) === "overdue").length;

    /** Ancienneté (jours) de la facture en retard la plus ancienne — vraie donnée. */
    const maxOverdueDays = useMemo(() => {
        const overdue = hotelInvoices.filter((i) => resolveStatus(i) === "overdue");
        if (overdue.length === 0) return 0;
        const now = Date.now();
        return Math.max(
            ...overdue.map((i) =>
                Math.floor((now - new Date(i.dueDate).getTime()) / 86_400_000),
            ),
        );
    }, [hotelInvoices]);

    /** Total réglé sur l'année en cours — vraie donnée. */
    const paidThisYear = useMemo(() => {
        const year = new Date().getFullYear();
        return hotelInvoices
            .filter(
                (i) =>
                    i.status === "paid" &&
                    new Date(i.paidDate ?? i.createdAt).getFullYear() === year,
            )
            .reduce((sum, i) => sum + i.total, 0);
    }, [hotelInvoices]);

    const summaryLine = useMemo(() => {
        const parts: string[] = [];
        if (overdueCount > 0) {
            parts.push(
                `${overdueCount} facture${overdueCount > 1 ? "s" : ""} échue${overdueCount > 1 ? "s" : ""} depuis ${maxOverdueDays} jour${maxOverdueDays > 1 ? "s" : ""}`,
            );
        } else if (pendingCount > 0) {
            parts.push(`${pendingCount} facture${pendingCount > 1 ? "s" : ""} en attente`);
        } else {
            parts.push("Aucune facture en attente");
        }
        if (paidThisYear > 0) {
            parts.push(`${formatCFA(paidThisYear)} F réglés en ${new Date().getFullYear()}`);
        }
        return parts.join(" · ");
    }, [overdueCount, pendingCount, maxOverdueDays, paidThisYear]);

    const filtered = useMemo(() => {
        if (selected === "all") return hotelInvoices;
        return hotelInvoices.filter((i) => resolveStatus(i) === selected);
    }, [hotelInvoices, selected]);

    const handlePay = () => {
        Alert.alert(
            "Paiement mobile money",
            `Régler ${formatCFA(outstanding)} F CFA par Orange Money ou Wave ?`,
            [
                { text: "Annuler", style: "cancel" },
                { text: "Orange Money", onPress: () => {} },
                { text: "Wave", onPress: () => {} },
            ],
        );
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper }]}
        >
            <View style={styles.header}>
                <ThemedText variate="title">Factures</ThemedText>
                <ThemedText variate="caption" color="ink500" style={styles.headerSub}>
                    {user?.name ?? "Votre espace pro"}
                </ThemedText>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(i) => i.id}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    <>
                        {/* Reste à régler — carte marine, comme la maquette */}
                        <View style={[styles.outstanding, { backgroundColor: colors.brand900 }]}>
                            <Text style={[styles.capsLabel, { color: colors.warn600 }]}>
                                Reste à régler
                            </Text>
                            <View style={styles.amountRow}>
                                <Text style={styles.amount}>{formatCFA(outstanding)}</Text>
                                <Text style={[styles.amountUnit, { color: colors.ink400 }]}>
                                    FCFA
                                </Text>
                            </View>
                            <Text style={[styles.summaryLine, { color: colors.ink400 }]}>
                                {summaryLine}
                            </Text>
                            {outstanding > 0 && (
                                <Pressable
                                    onPress={handlePay}
                                    style={[
                                        styles.payCTA,
                                        { backgroundColor: colors.brand800, borderColor: colors.brand600 },
                                    ]}
                                >
                                    <Text style={styles.payCTAText}>
                                        Payer · Orange Money / Wave
                                    </Text>
                                </Pressable>
                            )}
                        </View>

                        {/* Filters */}
                        <View style={styles.tabsWrap}>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.tabs}
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
                                                    backgroundColor: active
                                                        ? colors.ink900
                                                        : colors.paper,
                                                    borderColor: active
                                                        ? colors.ink900
                                                        : colors.ink200,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.tabText,
                                                    {
                                                        color: active
                                                            ? colors.paper
                                                            : colors.ink700,
                                                    },
                                                ]}
                                            >
                                                {f.label}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>
                        </View>

                        <ThemedText
                            variate="caps"
                            color="ink500"
                            style={styles.historyLabel}
                        >
                            Historique
                        </ThemedText>
                    </>
                }
                renderItem={({ item }) => (
                    <InvoiceRow
                        invoice={item}
                        onPress={() =>
                            router.push({
                                pathname: "/(hotel)/invoice-detail",
                                params: { id: item.id },
                            })
                        }
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Icon name="receipt" size={48} color={colors.ink300} stroke={1.2} />
                        <ThemedText
                            variate="subtitle"
                            color="ink500"
                            style={{ marginTop: 12 }}
                        >
                            Aucune facture
                        </ThemedText>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

function InvoiceRow({
    invoice,
    onPress,
}: {
    invoice: Invoice;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const status = resolveStatus(invoice);
    const detail =
        status === "paid" && invoice.paymentMethod
            ? `${capitalize(formatMonth(invoice.createdAt))} · ${PAYMENT_METHOD_LABELS[invoice.paymentMethod]}`
            : `${capitalize(formatMonth(invoice.createdAt))} · échéance ${formatDueShort(invoice.dueDate)}`;

    return (
        <Pressable
            onPress={onPress}
            style={[styles.row, { backgroundColor: colors.paper, borderColor: colors.ink200 }]}
        >
            <View style={styles.rowHeader}>
                <Text style={[styles.rowCode, { color: colors.ink900 }]}>
                    {invoice.invoiceNumber}
                </Text>
                <StatusBadge status={STATUS_TO_UI[status]} />
            </View>
            <View style={styles.rowBottom}>
                <Text style={[styles.rowPeriod, { color: colors.ink600 }]} numberOfLines={1}>
                    {detail}
                </Text>
                <Text style={[styles.rowAmount, { color: colors.ink900 }]}>
                    {formatCFA(invoice.total)} F
                </Text>
            </View>
        </Pressable>
    );
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerSub: { marginTop: 2 },

    list: {
        padding: 16,
        paddingBottom: 120,
        gap: 8,
    },

    // Outstanding card (marine, comme la maquette)
    outstanding: {
        borderRadius: 22,
        padding: 20,
        marginBottom: 14,
    },
    capsLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    amountRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 6,
        marginTop: 8,
    },
    amount: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 32,
        lineHeight: 34,
        letterSpacing: -0.5,
        color: "#FFFFFF",
    },
    amountUnit: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 16,
    },
    summaryLine: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 8,
        lineHeight: 17,
    },
    payCTA: {
        marginTop: 14,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    payCTAText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
        color: "#FFFFFF",
    },

    // Tabs
    tabsWrap: {
        marginTop: 6,
        marginBottom: 12,
    },
    tabs: { gap: 6 },
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

    historyLabel: {
        marginBottom: 10,
        paddingLeft: 2,
    },

    // Row
    row: {
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 16,
    },
    rowHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 10,
    },
    rowCode: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.base,
    },
    rowBottom: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginTop: 10,
        gap: 10,
    },
    rowPeriod: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        flexShrink: 1,
    },
    rowAmount: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 17,
    },

    empty: {
        alignItems: "center",
        paddingVertical: 64,
    },
});
