import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useMachines } from "@/hooks/useMachines";

type MachineStatus = "Active" | "Maintenance" | "HS";

type Machine = {
    id: string;
    ref: string;
    model: string;
    category: "Laveuse" | "Sécheuse" | "Calandre" | "Presse";
    status: MachineStatus;
    loadKg: number;
    capacityKg: number;
    nextMaintenance: string;
};

const CAT_ICON: Record<Machine["category"], IconName> = {
    Laveuse: "droplet",
    Sécheuse: "thermo",
    Calandre: "spark",
    Presse: "weight",
};

export default function MachinesScreen() {
    const colors = useThemeColors();
    const { data } = useMachines();
    const machines = (data ?? []) as Machine[];

    const active = machines.filter((m) => m.status === "Active").length;
    const maintenance = machines.filter((m) => m.status === "Maintenance").length;
    const hs = machines.filter((m) => m.status === "HS").length;

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
                <ThemedText variate="title">Machines</ThemedText>
                <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                    Atelier · Dakar
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* KPI strip */}
                <View style={styles.kpiRow}>
                    <KpiTile value={`${active}`} label="Actives" tint="ok" />
                    <KpiTile value={`${maintenance}`} label="Maintenance" tint="warn" />
                    <KpiTile value={`${hs}`} label="Hors service" tint="danger" />
                </View>

                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Parc machines · {machines.length}
                </ThemedText>

                <View style={{ gap: 10 }}>
                    {machines.map((m) => (
                        <MachineRow key={m.id} machine={m} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function KpiTile({
    value,
    label,
    tint,
}: {
    value: string;
    label: string;
    tint: "ok" | "warn" | "danger";
}) {
    const colors = useThemeColors();
    const bg =
        tint === "ok"
            ? colors.ok100
            : tint === "warn"
              ? colors.warn100
              : colors.danger100;
    const fg =
        tint === "ok"
            ? colors.ok700
            : tint === "warn"
              ? colors.warn700
              : colors.danger600;

    return (
        <View
            style={[
                styles.kpiTile,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View style={[styles.kpiDot, { backgroundColor: bg }]}>
                <Text style={[styles.kpiDotText, { color: fg }]}>{value}</Text>
            </View>
            <Text style={[styles.kpiLabel, { color: colors.ink700 }]}>
                {label}
            </Text>
        </View>
    );
}

function MachineRow({ machine }: { machine: Machine }) {
    const colors = useThemeColors();
    const ratio =
        machine.capacityKg > 0
            ? Math.min(1, machine.loadKg / machine.capacityKg)
            : 0;

    return (
        <Pressable
            style={({ pressed }) => [
                styles.machineRow,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={styles.machineTop}>
                <View
                    style={[styles.machineIcon, { backgroundColor: colors.paper2 }]}
                >
                    <Icon
                        name={CAT_ICON[machine.category]}
                        size={15}
                        color={colors.terra700}
                    />
                </View>
                <View style={{ flex: 1 }}>
                    <View style={styles.machineHeaderRow}>
                        <Text style={[styles.machineRef, { color: colors.ink900 }]}>
                            {machine.ref}
                        </Text>
                        <Text style={[styles.machineCategory, { color: colors.ink500 }]}>
                            {machine.category}
                        </Text>
                    </View>
                    <Text style={[styles.machineModel, { color: colors.ink700 }]}>
                        {machine.model}
                    </Text>
                </View>
                <StatusBadge status={machine.status} />
            </View>

            <View
                style={[styles.machineFooter, { borderTopColor: colors.ink200 }]}
            >
                <View style={{ flex: 1 }}>
                    <View style={styles.loadHeader}>
                        <Text style={[styles.loadLabel, { color: colors.ink500 }]}>
                            Charge
                        </Text>
                        <Text style={[styles.loadValue, { color: colors.ink900 }]}>
                            {machine.loadKg}
                            <Text
                                style={[styles.loadDiv, { color: colors.ink500 }]}
                            >
                                {` / ${machine.capacityKg} kg`}
                            </Text>
                        </Text>
                    </View>
                    <View
                        style={[styles.loadBar, { backgroundColor: colors.ink100 }]}
                    >
                        <View
                            style={[
                                styles.loadFill,
                                {
                                    width: `${ratio * 100}%`,
                                    backgroundColor:
                                        machine.status === "Active"
                                            ? ratio > 0.85
                                                ? colors.terra600
                                                : colors.baobab600
                                            : colors.ink300,
                                },
                            ]}
                        />
                    </View>
                </View>

                <View style={styles.maintenanceCol}>
                    <Text style={[styles.maintenanceLabel, { color: colors.ink500 }]}>
                        Révision
                    </Text>
                    <View style={styles.maintenanceRow}>
                        <Icon name="wrench" size={11} color={colors.ink500} />
                        <Text
                            style={[styles.maintenanceValue, { color: colors.ink900 }]}
                        >
                            {machine.nextMaintenance}
                        </Text>
                    </View>
                </View>
            </View>
        </Pressable>
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

    kpiRow: { flexDirection: "row", gap: 10, marginBottom: 18 },
    kpiTile: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        padding: 12,
        alignItems: "flex-start",
        gap: 10,
    },
    kpiDot: {
        minWidth: 32,
        height: 32,
        paddingHorizontal: 8,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiDotText: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
    },
    kpiLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    // Machine row
    machineRow: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 14,
    },
    machineTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    machineIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    machineHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    machineRef: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    machineCategory: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    machineModel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    machineFooter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    loadHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 6,
    },
    loadLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
    },
    loadValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },
    loadDiv: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    loadBar: {
        height: 5,
        borderRadius: 3,
        overflow: "hidden",
    },
    loadFill: { height: "100%", borderRadius: 3 },

    maintenanceCol: { alignItems: "flex-end" },
    maintenanceLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
        marginBottom: 3,
    },
    maintenanceRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    maintenanceValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },
});
