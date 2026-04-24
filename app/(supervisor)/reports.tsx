import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type Period = "7j" | "30j" | "90j";

const PERIODS: { key: Period; label: string }[] = [
    { key: "7j", label: "7 jours" },
    { key: "30j", label: "30 jours" },
    { key: "90j", label: "90 jours" },
];

const METRICS_BY_PERIOD: Record<
    Period,
    { volume: string; orders: string; revenue: string; delta: string }
> = {
    "7j": { volume: "18,4 t", orders: "214", revenue: "12,4 M", delta: "+4,2 %" },
    "30j": { volume: "78,2 t", orders: "892", revenue: "54,7 M", delta: "+6,8 %" },
    "90j": { volume: "232 t", orders: "2 641", revenue: "168 M", delta: "+9,3 %" },
};

const PRODUCTION_TREND = [18, 24, 32, 28, 36, 34, 41]; // 7 days
const CHANNEL_SHARE = [
    { label: "Hôtels 4★/5★", pct: 0.58 },
    { label: "Hôtels 3★", pct: 0.24 },
    { label: "Restaurants", pct: 0.12 },
    { label: "Autres", pct: 0.06 },
];

const REPORTS_LIST: {
    id: string;
    icon: IconName;
    title: string;
    sub: string;
    format: string;
}[] = [
    {
        id: "r1",
        icon: "chart",
        title: "Rapport production hebdo",
        sub: "Semaine 17 · 22-28 avril",
        format: "PDF · 3,2 Mo",
    },
    {
        id: "r2",
        icon: "boxes",
        title: "Inventaire consommables",
        sub: "Lessive, détachants, énergie",
        format: "XLSX · 840 Ko",
    },
    {
        id: "r3",
        icon: "receipt",
        title: "Synthèse facturation",
        sub: "Mars 2026 · tous clients",
        format: "PDF · 1,8 Mo",
    },
    {
        id: "r4",
        icon: "spark",
        title: "Contrôles qualité",
        sub: "Défauts · reprises · taux",
        format: "PDF · 2,4 Mo",
    },
];

export default function ReportsScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [period, setPeriod] = useState<Period>("7j");
    const metrics = METRICS_BY_PERIOD[period];

    const maxTrend = Math.max(...PRODUCTION_TREND);

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
                <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Icon name="chevLeft" size={20} color={colors.ink800} />
                </Pressable>
                <ThemedText variate="title">Rapports</ThemedText>
                <Pressable hitSlop={8}>
                    <Icon name="download" size={18} color={colors.ink800} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Period tabs */}
                <View style={styles.periodRow}>
                    {PERIODS.map((p) => {
                        const active = period === p.key;
                        return (
                            <Pressable
                                key={p.key}
                                onPress={() => setPeriod(p.key)}
                                style={[
                                    styles.periodPill,
                                    {
                                        backgroundColor: active
                                            ? colors.brand800
                                            : colors.paper,
                                        borderColor: active
                                            ? colors.brand800
                                            : colors.ink200,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.periodLabel,
                                        {
                                            color: active ? colors.paper : colors.ink700,
                                        },
                                    ]}
                                >
                                    {p.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </View>

                {/* Hero revenue */}
                <Card
                    padding={18}
                    style={[
                        styles.hero,
                        {
                            backgroundColor: colors.brand900,
                            borderColor: colors.brand900,
                        },
                    ]}
                >
                    <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                        Chiffre d'affaires · {period}
                    </Text>
                    <Text style={[styles.heroValue, { color: colors.paper }]}>
                        {metrics.revenue}
                        <Text
                            style={[styles.heroUnit, { color: colors.brand100 }]}
                        >
                            {" F CFA"}
                        </Text>
                    </Text>
                    <View style={styles.heroDelta}>
                        <View
                            style={[
                                styles.deltaBadge,
                                { backgroundColor: colors.baobab600 },
                            ]}
                        >
                            <Icon name="spark" size={11} color={colors.paper} />
                            <Text
                                style={[styles.deltaText, { color: colors.paper }]}
                            >
                                {metrics.delta}
                            </Text>
                        </View>
                        <Text style={[styles.deltaCompare, { color: colors.brand100 }]}>
                            vs période précédente
                        </Text>
                    </View>

                    <View
                        style={[styles.heroStats, { borderTopColor: colors.brand700 }]}
                    >
                        <HeroStat value={metrics.volume} label="Volume traité" />
                        <HeroStat value={metrics.orders} label="Commandes" />
                    </View>
                </Card>

                {/* Production trend */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Production · derniers 7 jours
                </ThemedText>
                <Card padding={16} style={{ marginBottom: 18 }}>
                    <View style={styles.chartRow}>
                        {PRODUCTION_TREND.map((v, i) => {
                            const ratio = v / maxTrend;
                            const days = ["L", "M", "M", "J", "V", "S", "D"];
                            return (
                                <View key={i} style={styles.chartCol}>
                                    <View style={styles.chartBarWrap}>
                                        <View
                                            style={[
                                                styles.chartBar,
                                                {
                                                    height: `${ratio * 100}%`,
                                                    backgroundColor: colors.terra600,
                                                },
                                            ]}
                                        />
                                    </View>
                                    <Text
                                        style={[styles.chartLabel, { color: colors.ink500 }]}
                                    >
                                        {days[i]}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </Card>

                {/* Channel share */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Répartition par canal
                </ThemedText>
                <Card padding={16} style={{ marginBottom: 18 }}>
                    {CHANNEL_SHARE.map((ch, i) => (
                        <View
                            key={ch.label}
                            style={[
                                styles.shareRow,
                                i < CHANNEL_SHARE.length - 1 && {
                                    borderBottomColor: colors.ink200,
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                },
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.shareLabel, { color: colors.ink900 }]}
                                >
                                    {ch.label}
                                </Text>
                                <View
                                    style={[
                                        styles.shareBar,
                                        { backgroundColor: colors.ink100 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.shareFill,
                                            {
                                                width: `${ch.pct * 100}%`,
                                                backgroundColor:
                                                    i === 0
                                                        ? colors.brand800
                                                        : i === 1
                                                          ? colors.terra600
                                                          : i === 2
                                                            ? colors.baobab600
                                                            : colors.ink400,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text
                                style={[stylesSharePct.pct, { color: colors.ink900 }]}
                            >
                                {Math.round(ch.pct * 100)}%
                            </Text>
                        </View>
                    ))}
                </Card>

                {/* Downloadable reports */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Rapports à télécharger
                </ThemedText>
                <View style={{ gap: 10 }}>
                    {REPORTS_LIST.map((r) => (
                        <Pressable
                            key={r.id}
                            style={({ pressed }) => [
                                styles.reportRow,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.ink200,
                                    opacity: pressed ? 0.85 : 1,
                                },
                            ]}
                        >
                            <View
                                style={[styles.reportIcon, { backgroundColor: colors.paper2 }]}
                            >
                                <Icon name={r.icon} size={15} color={colors.terra700} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.reportTitle, { color: colors.ink900 }]}>
                                    {r.title}
                                </Text>
                                <Text style={[styles.reportSub, { color: colors.ink500 }]}>
                                    {r.sub}
                                </Text>
                                <Text style={[styles.reportFmt, { color: colors.ink700 }]}>
                                    {r.format}
                                </Text>
                            </View>
                            <Icon name="download" size={16} color={colors.brand800} />
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function HeroStat({ value, label }: { value: string; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.heroStatValue, { color: colors.paper }]}>
                {value}
            </Text>
            <Text style={[styles.heroStatLabel, { color: colors.brand100 }]}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    // Period
    periodRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 14,
    },
    periodPill: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    periodLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    // Hero
    hero: { marginBottom: 18 },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    heroValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 40,
        letterSpacing: -0.8,
        marginTop: 6,
    },
    heroUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.md,
    },
    heroDelta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
    },
    deltaBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    deltaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    deltaCompare: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    heroStats: {
        flexDirection: "row",
        gap: 20,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    heroStatValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 20,
    },
    heroStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Chart
    chartRow: {
        flexDirection: "row",
        alignItems: "flex-end",
        justifyContent: "space-between",
        height: 120,
    },
    chartCol: { flex: 1, alignItems: "center", height: "100%" },
    chartBarWrap: {
        flex: 1,
        justifyContent: "flex-end",
        width: "70%",
    },
    chartBar: { width: "100%", borderRadius: 4 },
    chartLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        marginTop: 6,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },

    // Share
    shareRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
    },
    shareLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        marginBottom: 6,
    },
    shareBar: { height: 5, borderRadius: 3, overflow: "hidden" },
    shareFill: { height: "100%", borderRadius: 3 },

    // Reports
    reportRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    reportIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    reportTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    reportSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    reportFmt: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 3,
    },
});

const stylesSharePct = StyleSheet.create({
    pct: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
        minWidth: 44,
        textAlign: "right",
    },
});
