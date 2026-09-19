import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useInvoice } from "@/hooks/useInvoices";
import { useOrdersByIds } from "@/hooks/useOrders";
import { useThemeColors } from "@/hooks/useThemeColors";
import { downloadInvoicePdf } from "@/services/documents.service";

/** Seuil contractuel d'écart poids estimé/réel (%) — même valeur que côté commande. */
const DEVIATION_THRESHOLD = 10;

function formatCFA(n: number) {
    return Math.round(n).toLocaleString("fr-FR");
}

function frKg(n: number) {
    return n.toFixed(1).replace(".", ",");
}

function daysSince(iso: string): number {
    return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function InvoiceDetailScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const id = params.id as string;

    const { data: invoice } = useInvoice(id);
    const [downloading, setDownloading] = useState(false);

    // Commandes liées à cette facture (une facture peut couvrir plusieurs commandes).
    const orderIds = useMemo(
        () => Array.from(new Set((invoice?.items ?? []).map((it) => it.orderId).filter(Boolean))) as string[],
        [invoice],
    );
    const orderQueries = useOrdersByIds(orderIds);
    const ordersLoaded = orderQueries.length === orderIds.length && orderQueries.every((q) => q.isSuccess);

    const estimatedWeightKg = useMemo(
        () =>
            orderQueries.reduce((sum, q) => sum + (q.data?.estimatedWeight ?? 0), 0),
        [orderQueries],
    );
    const actualWeightKg = useMemo(
        () =>
            (invoice?.items ?? []).reduce((sum, it) => sum + (it.weightGrams ?? 0), 0) / 1000,
        [invoice],
    );
    const hasWeightData = actualWeightKg > 0 && orderIds.length > 0;

    const diffPct =
        hasWeightData && estimatedWeightKg > 0
            ? ((actualWeightKg - estimatedWeightKg) / estimatedWeightKg) * 100
            : 0;
    const maxWeight = Math.max(estimatedWeightKg, actualWeightKg, 1);

    // Commandes facturées — regroupement des lignes par commande.
    const invoiceOrders = useMemo(() => {
        const byOrder = new Map<string, { orderNumber: string; total: number }>();
        for (const it of invoice?.items ?? []) {
            if (!it.orderId) continue;
            const cur = byOrder.get(it.orderId);
            if (cur) cur.total += it.total;
            else byOrder.set(it.orderId, { orderNumber: it.orderNumber ?? it.orderId, total: it.total });
        }
        return Array.from(byOrder.values());
    }, [invoice]);

    if (!invoice) {
        return (
            <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.paper }]} />
        );
    }

    const overdue = invoice.status === "pending" && new Date(invoice.dueDate) < new Date();

    const handleShare = async () => {
        if (!invoice.pdfUrl) return;
        setDownloading(true);
        try {
            await downloadInvoicePdf(invoice.pdfUrl, invoice.invoiceNumber);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <SafeAreaView edges={["top"]} style={[styles.container, { backgroundColor: colors.paper }]}>
            <View style={styles.topBar}>
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.iconChip, { backgroundColor: colors.paper, borderColor: colors.ink200 }]}
                    hitSlop={6}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink900} stroke={1.8} />
                </Pressable>
                <ThemedText variate="title">{invoice.invoiceNumber}</ThemedText>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {/* Montant TTC */}
                <Card padding={20} style={{ marginBottom: 12 }}>
                    <Text style={[styles.caption, { color: colors.ink600 }]}>Montant TTC</Text>
                    <Text style={[styles.bigAmount, { color: colors.ink900 }]}>
                        {formatCFA(invoice.total)} F
                    </Text>
                    {invoice.status === "paid" ? (
                        <Pill bg={colors.ok100} fg={colors.ok700}>
                            Payée{invoice.paidDate ? ` le ${formatDate(invoice.paidDate)}` : ""}
                        </Pill>
                    ) : overdue ? (
                        <Pill bg={colors.danger100} fg={colors.danger600}>
                            Échue depuis {daysSince(invoice.dueDate)} jour{daysSince(invoice.dueDate) > 1 ? "s" : ""}
                        </Pill>
                    ) : invoice.status === "cancelled" ? (
                        <Pill bg={colors.ink100} fg={colors.ink600}>Annulée</Pill>
                    ) : (
                        <Pill bg={colors.warn100} fg={colors.warn700}>
                            Échéance le {formatDate(invoice.dueDate)}
                        </Pill>
                    )}
                </Card>

                {/* Poids estimé vs réel */}
                {hasWeightData && ordersLoaded && (
                    <Card padding={20} style={{ marginBottom: 12 }}>
                        <Text style={[styles.cardTitle, { color: colors.ink900 }]}>
                            Poids estimé vs réel
                        </Text>
                        <Text style={[styles.cardSubtitle, { color: colors.ink600 }]}>
                            La facturation suit la pesée officielle en usine.
                        </Text>

                        <View style={{ marginTop: 18, gap: 16 }}>
                            <WeightBar
                                label="Estimé à la commande"
                                value={`${frKg(estimatedWeightKg)} kg`}
                                pct={(estimatedWeightKg / maxWeight) * 100}
                                barColor={colors.ink300}
                                trackColor={colors.ink200}
                                valueColor={colors.ink900}
                            />
                            <WeightBar
                                label="Pesé en usine"
                                value={`${frKg(actualWeightKg)} kg`}
                                pct={(actualWeightKg / maxWeight) * 100}
                                barColor={colors.brand700}
                                trackColor={colors.ink200}
                                valueColor={colors.ink900}
                                bold
                            />
                        </View>

                        {Math.abs(diffPct) > DEVIATION_THRESHOLD && (
                            <>
                                <View
                                    style={[
                                        styles.deviationNote,
                                        { backgroundColor: colors.terra100, borderColor: colors.terra600 },
                                    ]}
                                >
                                    <Text style={[styles.deviationText, { color: colors.terra700 }]}>
                                        Écart de{" "}
                                        <Text style={styles.deviationStrong}>
                                            {diffPct >= 0 ? "+" : ""}
                                            {frKg(actualWeightKg - estimatedWeightKg)} kg (
                                            {diffPct >= 0 ? "+" : ""}
                                            {frKg(diffPct)} %)
                                        </Text>{" "}
                                        — au-delà du seuil contractuel de {DEVIATION_THRESHOLD} %. Une pesée
                                        contradictoire peut être demandée.
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => router.push("/(hotel)/support")}
                                    style={[styles.disputeBtn, { borderColor: colors.terra600 }]}
                                >
                                    <Text style={[styles.disputeBtnText, { color: colors.terra700 }]}>
                                        Contester l'écart
                                    </Text>
                                </Pressable>
                            </>
                        )}
                    </Card>
                )}

                {/* Commandes facturées */}
                {invoiceOrders.length > 0 && (
                    <Card padding={18} style={{ marginBottom: 12 }}>
                        <Text style={[styles.cardTitle, { color: colors.ink900 }]}>
                            Commandes facturées
                        </Text>
                        <View style={{ marginTop: 10 }}>
                            {invoiceOrders.map((o) => (
                                <View key={o.orderNumber} style={styles.orderLine}>
                                    <Text style={[styles.orderLineId, { color: colors.ink900 }]}>
                                        {o.orderNumber}
                                    </Text>
                                    <Text style={[styles.orderLineDetail, { color: colors.ink600 }]}>
                                        {formatCFA(o.total)} F
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </Card>
                )}

                {!invoice.pdfUrl && (
                    <Text style={[styles.pdfHint, { color: colors.ink500 }]}>
                        PDF pas encore généré par le service facturation — réessayez plus tard.
                    </Text>
                )}

                <View style={styles.actions}>
                    <Pressable
                        onPress={handleShare}
                        disabled={!invoice.pdfUrl || downloading}
                        style={[
                            styles.shareBtn,
                            { borderColor: colors.ink200, opacity: !invoice.pdfUrl ? 0.4 : 1 },
                        ]}
                    >
                        <Text style={[styles.shareBtnText, { color: colors.ink900 }]}>Partager</Text>
                    </Pressable>
                    <Pressable
                        onPress={handleShare}
                        disabled={!invoice.pdfUrl || downloading}
                        style={[
                            styles.downloadBtn,
                            { backgroundColor: colors.brand900, opacity: !invoice.pdfUrl ? 0.4 : 1 },
                        ]}
                    >
                        <Text style={styles.downloadBtnText}>
                            {downloading ? "Téléchargement…" : "Télécharger le PDF"}
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function Pill({ bg, fg, children }: { bg: string; fg: string; children: React.ReactNode }) {
    return (
        <View style={[styles.pill, { backgroundColor: bg }]}>
            <Text style={[styles.pillText, { color: fg }]}>{children}</Text>
        </View>
    );
}

function WeightBar({
    label,
    value,
    pct,
    barColor,
    trackColor,
    valueColor,
    bold,
}: {
    label: string;
    value: string;
    pct: number;
    barColor: string;
    trackColor: string;
    valueColor: string;
    bold?: boolean;
}) {
    const colors = useThemeColors();
    return (
        <View>
            <View style={styles.weightBarHead}>
                <Text style={[styles.weightBarLabel, { color: colors.ink600 }]}>{label}</Text>
                <Text
                    style={[
                        styles.weightBarValue,
                        { color: valueColor, fontFamily: bold ? FontFamily.uiSemibold : FontFamily.uiRegular },
                    ]}
                >
                    {value}
                </Text>
            </View>
            <View style={[styles.weightTrack, { backgroundColor: trackColor }]}>
                <View
                    style={[
                        styles.weightFill,
                        { width: `${Math.max(4, Math.min(100, pct))}%`, backgroundColor: barColor },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 18,
    },
    iconChip: {
        width: 38,
        height: 38,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },

    content: { paddingHorizontal: 20, paddingBottom: 40 },

    caption: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
    },
    bigAmount: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 34,
        letterSpacing: -0.4,
        marginTop: 4,
    },
    pill: {
        alignSelf: "flex-start",
        marginTop: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
    },
    pillText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    cardTitle: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: Typography.fontSize.base,
    },
    cardSubtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 5,
        lineHeight: 17,
    },

    weightBarHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 7,
    },
    weightBarLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    weightBarValue: {
        fontSize: Typography.fontSize.tiny,
    },
    weightTrack: {
        height: 10,
        borderRadius: 99,
        overflow: "hidden",
    },
    weightFill: {
        height: "100%",
        borderRadius: 99,
    },

    deviationNote: {
        marginTop: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
        padding: 14,
    },
    deviationText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        lineHeight: 19,
    },
    deviationStrong: {
        fontFamily: FontFamily.uiSemibold,
    },
    disputeBtn: {
        marginTop: 12,
        height: 48,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    disputeBtnText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },

    orderLine: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 7,
    },
    orderLineId: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    orderLineDetail: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },

    pdfHint: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 12,
        textAlign: "center",
    },

    actions: {
        flexDirection: "row",
        gap: 11,
    },
    shareBtn: {
        width: 104,
        height: 54,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    shareBtnText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    downloadBtn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    downloadBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
        color: "#FFFFFF",
    },
});
