import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type ControlStatus = "Validée" | "En attente" | "En retard";

type Control = {
    id: string;
    orderCode: string;
    client: string;
    type: string;
    status: ControlStatus;
    inspector: string;
    date: string;
    defectsPct: number;
};

const KPIS = [
    { value: "98,6 %", label: "Taux de conformité", icon: "spark" as IconName },
    { value: "1,4 %", label: "Taux de défauts", icon: "alert" as IconName },
    { value: "4,7", label: "Note moyenne", icon: "check" as IconName },
    { value: "12", label: "Contrôles / jour", icon: "list" as IconName },
];

const CONTROLS: Control[] = [
    {
        id: "1",
        orderCode: "CMD-2024-089",
        client: "Hôtel Plaza",
        type: "Linge plat · blanc 60°",
        status: "Validée",
        inspector: "A. Diop",
        date: "Aujourd'hui · 14:02",
        defectsPct: 0.4,
    },
    {
        id: "2",
        orderCode: "CMD-2024-088",
        client: "Hôtel Savana",
        type: "Éponge · 40°",
        status: "En attente",
        inspector: "M. Fall",
        date: "Aujourd'hui · 13:45",
        defectsPct: 1.1,
    },
    {
        id: "3",
        orderCode: "CMD-2024-086",
        client: "Hôtel Teranga",
        type: "Restaurant · détachage",
        status: "En retard",
        inspector: "—",
        date: "En attente",
        defectsPct: 2.3,
    },
    {
        id: "4",
        orderCode: "CMD-2024-081",
        client: "Radisson Blu",
        type: "Chambre · linge plat",
        status: "Validée",
        inspector: "A. Diop",
        date: "Hier · 18:10",
        defectsPct: 0.2,
    },
];

const DEFECTS = [
    { label: "Tâches persistantes", count: 8, weight: 0.55 },
    { label: "Couture défectueuse", count: 4, weight: 0.28 },
    { label: "Couleur altérée", count: 2, weight: 0.14 },
    { label: "Autre", count: 1, weight: 0.07 },
];

export default function QualityScreen() {
    const colors = useThemeColors();

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
                <ThemedText variate="title">Qualité</ThemedText>
                <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                    Contrôles post-production · 7 derniers jours
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero KPI */}
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
                        Score qualité global
                    </Text>
                    <Text style={[styles.heroValue, { color: colors.paper }]}>
                        98,6
                        <Text
                            style={[styles.heroValueUnit, { color: colors.brand100 }]}
                        >
                            {" / 100"}
                        </Text>
                    </Text>
                    <View
                        style={[styles.heroBar, { backgroundColor: colors.brand700 }]}
                    >
                        <View
                            style={[
                                styles.heroFill,
                                {
                                    width: "98.6%",
                                    backgroundColor: colors.baobab600,
                                },
                            ]}
                        />
                    </View>
                    <View style={styles.heroMetaRow}>
                        <Text style={[styles.heroMeta, { color: colors.brand100 }]}>
                            +0,3 pt vs semaine passée
                        </Text>
                        <Text style={[styles.heroMeta, { color: colors.brand100 }]}>
                            214 contrôles
                        </Text>
                    </View>
                </Card>

                {/* KPIs grid */}
                <View style={styles.kpiGrid}>
                    {KPIS.map((k) => (
                        <KpiTile key={k.label} {...k} />
                    ))}
                </View>

                {/* Defects */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Types de défauts
                </ThemedText>
                <Card padding={16} style={{ marginBottom: 18 }}>
                    {DEFECTS.map((d, i) => (
                        <View
                            key={d.label}
                            style={[
                                styles.defectRow,
                                i < DEFECTS.length - 1 && {
                                    borderBottomColor: colors.ink200,
                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                },
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.defectLabel, { color: colors.ink900 }]}
                                >
                                    {d.label}
                                </Text>
                                <View
                                    style={[
                                        styles.defectBar,
                                        { backgroundColor: colors.ink100 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.defectFill,
                                            {
                                                width: `${d.weight * 100}%`,
                                                backgroundColor: colors.terra600,
                                            },
                                        ]}
                                    />
                                </View>
                            </View>
                            <Text
                                style={[styles.defectCount, { color: colors.ink900 }]}
                            >
                                {d.count}
                            </Text>
                        </View>
                    ))}
                </Card>

                {/* Controls */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Contrôles récents · {CONTROLS.length}
                </ThemedText>

                <View style={{ gap: 10 }}>
                    {CONTROLS.map((c) => (
                        <ControlRow key={c.id} control={c} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function KpiTile({
    value,
    label,
    icon,
}: {
    value: string;
    label: string;
    icon: IconName;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.kpiTile,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View
                style={[styles.kpiIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={13} color={colors.terra700} />
            </View>
            <Text style={[styles.kpiValue, { color: colors.ink900 }]}>
                {value}
            </Text>
            <Text style={[styles.kpiLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
        </View>
    );
}

function ControlRow({ control }: { control: Control }) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.controlRow,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View style={styles.controlTop}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.controlCode, { color: colors.ink900 }]}>
                        {control.orderCode}
                    </Text>
                    <Text style={[styles.controlClient, { color: colors.ink500 }]}>
                        {control.client} · {control.type}
                    </Text>
                </View>
                <StatusBadge status={control.status} />
            </View>
            <View
                style={[styles.controlFoot, { borderTopColor: colors.ink200 }]}
            >
                <View style={styles.controlMetaRow}>
                    <Icon name="user" size={11} color={colors.ink500} />
                    <Text
                        style={[styles.controlMeta, { color: colors.ink700 }]}
                    >
                        {control.inspector}
                    </Text>
                </View>
                <View style={styles.controlMetaRow}>
                    <Icon name="clock" size={11} color={colors.ink500} />
                    <Text
                        style={[styles.controlMeta, { color: colors.ink700 }]}
                    >
                        {control.date}
                    </Text>
                </View>
                <Text
                    style={[
                        styles.controlDefects,
                        {
                            color:
                                control.defectsPct > 1.5
                                    ? colors.danger600
                                    : control.defectsPct > 0.5
                                      ? colors.warn700
                                      : colors.ok700,
                        },
                    ]}
                >
                    {control.defectsPct.toFixed(1)} %
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    // Hero
    hero: { marginBottom: 14 },
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
        marginTop: 4,
    },
    heroValueUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.md,
    },
    heroBar: {
        height: 5,
        borderRadius: 3,
        overflow: "hidden",
        marginTop: 14,
    },
    heroFill: { height: "100%", borderRadius: 3 },
    heroMetaRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 10,
    },
    heroMeta: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
    },

    // KPIs
    kpiGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 18,
    },
    kpiTile: {
        width: "47%",
        flexGrow: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        padding: 14,
    },
    kpiIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    kpiValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    kpiLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Defects
    defectRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 12,
    },
    defectLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        marginBottom: 6,
    },
    defectBar: { height: 5, borderRadius: 3, overflow: "hidden" },
    defectFill: { height: "100%", borderRadius: 3 },
    defectCount: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        minWidth: 24,
        textAlign: "right",
    },

    // Control rows
    controlRow: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 14,
    },
    controlTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    controlCode: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    controlClient: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    controlFoot: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    controlMetaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    controlMeta: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
    },
    controlDefects: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
        marginLeft: "auto",
    },
});
