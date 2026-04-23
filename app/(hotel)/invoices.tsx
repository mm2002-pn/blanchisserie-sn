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

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { mockInvoices } from "@/data/mock-invoices";
import { useAuth } from "@/contexts/AuthContext";
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
    const colors = useThemeColors();
    const { user } = useAuth();
    const [selected, setSelected] = useState<FilterId>("all");

    const hotelInvoices = useMemo(
        () => mockInvoices.filter((i) => i.hotelId === (user?.id ?? "1")),
        [user?.id],
    );

    const outstanding = useMemo(
        () =>
            hotelInvoices
                .filter((i) => resolveStatus(i) === "pending" || resolveStatus(i) === "overdue")
                .reduce((sum, i) => sum + i.total, 0),
        [hotelInvoices],
    );
    const pendingCount = hotelInvoices.filter((i) => i.status === "pending").length;
    const overdueCount = hotelInvoices.filter((i) => resolveStatus(i) === "overdue").length;

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
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
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
                        {/* Outstanding summary */}
                        {outstanding > 0 ? (
                            <Card
                                padding={16}
                                style={[
                                    styles.outstanding,
                                    {
                                        backgroundColor: colors.terra100,
                                        borderColor: colors.terra600,
                                    },
                                ]}
                            >
                                <View style={styles.outstandingTop}>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                styles.capsLabel,
                                                { color: colors.terra700 },
                                            ]}
                                        >
                                            À régler
                                        </Text>
                                        <View style={styles.amountRow}>
                                            <Text
                                                style={[styles.amount, { color: colors.ink900 }]}
                                            >
                                                {formatCFA(outstanding)}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.amountUnit,
                                                    { color: colors.ink500 },
                                                ]}
                                            >
                                                F
                                            </Text>
                                        </View>
                                        <Text
                                            style={[styles.summaryLine, { color: colors.ink600 }]}
                                        >
                                            {pendingCount} facture{pendingCount > 1 ? "s" : ""}{" "}
                                            en attente
                                            {overdueCount > 0
                                                ? ` · ${overdueCount} en retard`
                                                : ""}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.outstandingIcon,
                                            { backgroundColor: colors.terra600 },
                                        ]}
                                    >
                                        <Icon
                                            name="alert"
                                            size={20}
                                            color={colors.paper}
                                            stroke={2}
                                        />
                                    </View>
                                </View>
                                <Pressable
                                    onPress={handlePay}
                                    style={[
                                        styles.payCTA,
                                        { backgroundColor: colors.terra700 },
                                    ]}
                                >
                                    <Text style={[styles.payCTAText, { color: colors.paper }]}>
                                        Payer · Orange Money / Wave
                                    </Text>
                                </Pressable>
                            </Card>
                        ) : null}

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
                renderItem={({ item }) => <InvoiceRow invoice={item} />}
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

function InvoiceRow({ invoice }: { invoice: Invoice }) {
    const colors = useThemeColors();
    const status = resolveStatus(invoice);

    return (
        <Card padding={14} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name="receipt" size={18} color={colors.ink600} />
            </View>
            <View style={styles.rowBody}>
                <View style={styles.rowHeader}>
                    <Text style={[styles.rowCode, { color: colors.ink500 }]}>
                        {invoice.invoiceNumber}
                    </Text>
                    <StatusBadge status={STATUS_TO_UI[status]} />
                </View>
                <Text style={[styles.rowPeriod, { color: colors.ink900 }]}>
                    {capitalize(formatMonth(invoice.createdAt))}
                </Text>
                {status === "paid" && invoice.paymentMethod ? (
                    <Text style={[styles.rowDue, { color: colors.ink500 }]}>
                        Payée · {PAYMENT_METHOD_LABELS[invoice.paymentMethod]}
                    </Text>
                ) : (
                    <Text style={[styles.rowDue, { color: colors.ink500 }]}>
                        échéance {formatDueShort(invoice.dueDate)}
                    </Text>
                )}
            </View>
            <View style={styles.rowRight}>
                <Text style={[styles.rowAmount, { color: colors.ink900 }]}>
                    {formatCFA(invoice.total)}
                </Text>
                <Text style={[styles.rowAmountUnit, { color: colors.ink500 }]}>F CFA TTC</Text>
            </View>
        </Card>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: { marginTop: 2 },

    list: {
        padding: 16,
        paddingBottom: 120,
        gap: 8,
    },

    // Outstanding card
    outstanding: {
        marginBottom: 14,
    },
    outstandingTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
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
        marginTop: 4,
    },
    amount: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 32,
        lineHeight: 34,
        letterSpacing: -0.5,
    },
    amountUnit: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 14,
    },
    summaryLine: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
    },
    outstandingIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    payCTA: {
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 10,
        alignItems: "center",
    },
    payCTAText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
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
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    rowIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    rowBody: { flex: 1 },
    rowHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    rowCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    rowPeriod: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        marginTop: 3,
    },
    rowDue: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    rowRight: {
        alignItems: "flex-end",
    },
    rowAmount: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.lg,
        lineHeight: Typography.fontSize.lg,
    },
    rowAmountUnit: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    empty: {
        alignItems: "center",
        paddingVertical: 64,
    },
});
