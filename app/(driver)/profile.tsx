import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import DrawerMenu from "@/components/shared/DrawerMenu";
import { useAuth } from "@/contexts/AuthContext";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type DocStatus = "valid" | "expiring" | "expired";

type Document = {
    id: string;
    name: string;
    status: DocStatus;
    expiry: string;
};

export default function DriverProfileScreen() {
    const { user } = useAuth();
    const colors = useThemeColors();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const driverStats = {
        deliveriesThisMonth: 127,
        onTimeRate: 98.5,
        customerSatisfaction: 4.9,
        totalDistance: 1245,
    };

    const assignedVehicle = {
        model: "Mercedes Sprinter",
        plate: "AB-1234-CD",
        capacity: "100 kg",
        fuelLevel: 75,
        lastMaintenance: "15 déc. 2024",
        nextMaintenance: "15 janv. 2025",
    };

    const documents: Document[] = [
        { id: "1", name: "Permis de conduire", status: "valid", expiry: "15 juin 2026" },
        { id: "2", name: "Carte d'identité", status: "valid", expiry: "20 mars 2027" },
        { id: "3", name: "Contrat de travail", status: "valid", expiry: "Indéterminé" },
        { id: "4", name: "Assurance véhicule", status: "expiring", expiry: "10 janv. 2025" },
    ];

    const weekSchedule = [
        { day: "L", date: "23", isToday: false, hasRoute: true },
        { day: "M", date: "24", isToday: false, hasRoute: true },
        { day: "M", date: "25", isToday: false, hasRoute: true },
        { day: "J", date: "26", isToday: true, hasRoute: true },
        { day: "V", date: "27", isToday: false, hasRoute: true },
        { day: "S", date: "28", isToday: false, hasRoute: false },
        { day: "D", date: "29", isToday: false, hasRoute: false },
    ];

    const initials =
        (user?.name ?? "")
            .split(" ")
            .map((w) => w.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "CH";

    const handleViewDocument = (name: string) =>
        Alert.alert("Document", `Visualisation de ${name}`);

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
                <Pressable onPress={() => setDrawerVisible(true)} hitSlop={8}>
                    <Icon name="list" size={20} color={colors.ink800} />
                </Pressable>
                <ThemedText variate="title">Profil</ThemedText>
                <Pressable hitSlop={8}>
                    <Icon name="settings" size={18} color={colors.ink800} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Identity hero */}
                <Card
                    padding={18}
                    style={[
                        styles.identity,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <View style={styles.identityTop}>
                        <View
                            style={[
                                styles.avatar,
                                { backgroundColor: colors.baobab600 },
                            ]}
                        >
                            <Text style={[styles.avatarText, { color: colors.paper }]}>
                                {initials}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.identityName, { color: colors.paper }]}>
                                {user?.name ?? "Chauffeur"}
                            </Text>
                            <Text style={[styles.identityRole, { color: colors.brand100 }]}>
                                Chauffeur-livreur
                            </Text>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: colors.baobab600 },
                                ]}
                            >
                                <View
                                    style={[styles.statusDot, { backgroundColor: colors.paper }]}
                                />
                                <Text
                                    style={[styles.statusText, { color: colors.paper }]}
                                >
                                    En service
                                </Text>
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Stats grid */}
                <View style={styles.statsGrid}>
                    <StatTile
                        icon="package"
                        value={`${driverStats.deliveriesThisMonth}`}
                        label="Livraisons / mois"
                    />
                    <StatTile
                        icon="clock"
                        value={`${driverStats.onTimeRate}%`}
                        label="Ponctualité"
                    />
                    <StatTile
                        icon="spark"
                        value={`${driverStats.customerSatisfaction}/5`}
                        label="Satisfaction"
                    />
                    <StatTile
                        icon="route"
                        value={`${driverStats.totalDistance} km`}
                        label="Distance totale"
                    />
                </View>

                {/* Vehicle */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Véhicule assigné
                </ThemedText>
                <Card padding={16} style={styles.vehicleCard}>
                    <View style={styles.vehicleTop}>
                        <View
                            style={[
                                styles.vehicleIcon,
                                { backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Icon name="truck" size={18} color={colors.brand800} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[styles.vehicleModel, { color: colors.ink900 }]}
                            >
                                {assignedVehicle.model}
                            </Text>
                            <Text
                                style={[styles.vehiclePlate, { color: colors.ink500 }]}
                            >
                                {assignedVehicle.plate} · {assignedVehicle.capacity}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[styles.fuelRow, { borderTopColor: colors.ink200 }]}
                    >
                        <View style={styles.fuelHeader}>
                            <View style={styles.fuelLabelRow}>
                                <Icon name="droplet" size={12} color={colors.ink500} />
                                <Text
                                    style={[styles.fuelLabel, { color: colors.ink500 }]}
                                >
                                    Carburant
                                </Text>
                            </View>
                            <Text
                                style={[styles.fuelValue, { color: colors.ink900 }]}
                            >
                                {assignedVehicle.fuelLevel}
                                <Text
                                    style={[styles.fuelValueUnit, { color: colors.ink500 }]}
                                >
                                    %
                                </Text>
                            </Text>
                        </View>
                        <View
                            style={[styles.fuelBar, { backgroundColor: colors.ink200 }]}
                        >
                            <View
                                style={[
                                    styles.fuelFill,
                                    {
                                        width: `${assignedVehicle.fuelLevel}%`,
                                        backgroundColor:
                                            assignedVehicle.fuelLevel > 30
                                                ? colors.baobab600
                                                : colors.warn600,
                                    },
                                ]}
                            />
                        </View>
                    </View>

                    <View
                        style={[
                            styles.maintenanceRow,
                            { borderTopColor: colors.ink200 },
                        ]}
                    >
                        <Icon name="wrench" size={14} color={colors.ink500} />
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[styles.maintenanceText, { color: colors.ink700 }]}
                            >
                                Dernière révision : {assignedVehicle.lastMaintenance}
                            </Text>
                            <Text
                                style={[styles.maintenanceText, { color: colors.ink700 }]}
                            >
                                Prochaine : {assignedVehicle.nextMaintenance}
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Schedule */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Planning de la semaine
                </ThemedText>
                <Card padding={14}>
                    <View style={styles.weekGrid}>
                        {weekSchedule.map((d, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dayCell,
                                    d.isToday && {
                                        backgroundColor: colors.brand800,
                                        borderColor: colors.brand800,
                                    },
                                    !d.isToday && {
                                        backgroundColor: colors.paper,
                                        borderColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.dayLetter,
                                        {
                                            color: d.isToday ? colors.brand100 : colors.ink500,
                                        },
                                    ]}
                                >
                                    {d.day}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayNumber,
                                        {
                                            color: d.isToday ? colors.paper : colors.ink900,
                                        },
                                    ]}
                                >
                                    {d.date}
                                </Text>
                                <View
                                    style={[
                                        styles.dayIndicator,
                                        {
                                            backgroundColor: d.hasRoute
                                                ? d.isToday
                                                    ? colors.paper
                                                    : colors.baobab600
                                                : "transparent",
                                        },
                                    ]}
                                />
                            </View>
                        ))}
                    </View>
                </Card>

                {/* Documents */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Documents
                </ThemedText>
                <Card padding={0} style={{ overflow: "hidden" }}>
                    {documents.map((doc, i) => (
                        <DocumentRow
                            key={doc.id}
                            doc={doc}
                            onPress={() => handleViewDocument(doc.name)}
                            withDivider={i < documents.length - 1}
                        />
                    ))}
                </Card>

                {/* Quick actions */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Raccourcis
                </ThemedText>
                <View style={{ gap: 10 }}>
                    <ActionRow icon="chart" label="Mes statistiques" />
                    <ActionRow icon="bell" label="Notifications" />
                    <ActionRow icon="msg" label="Aide & support" />
                </View>
            </ScrollView>

            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
        </SafeAreaView>
    );
}

/* ---------- sous-composants ---------- */

function StatTile({
    icon,
    value,
    label,
}: {
    icon: IconName;
    value: string;
    label: string;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.statTile,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View
                style={[styles.statIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={13} color={colors.brand800} />
            </View>
            <Text style={[styles.statValue, { color: colors.ink900 }]}>
                {value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
        </View>
    );
}

function DocumentRow({
    doc,
    onPress,
    withDivider,
}: {
    doc: Document;
    onPress: () => void;
    withDivider: boolean;
}) {
    const colors = useThemeColors();

    const [bg, fg]: [string, string] =
        doc.status === "valid"
            ? [colors.ok100, colors.ok700]
            : doc.status === "expiring"
              ? [colors.warn100, colors.warn700]
              : [colors.danger100, colors.danger600];

    const statusLabel =
        doc.status === "valid"
            ? "Valide"
            : doc.status === "expiring"
              ? "Expire bientôt"
              : "Expiré";

    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.docRow,
                withDivider && {
                    borderBottomColor: colors.ink200,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                },
            ]}
        >
            <View
                style={[styles.docIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name="receipt" size={13} color={colors.ink600} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.docName, { color: colors.ink900 }]}>
                    {doc.name}
                </Text>
                <Text style={[styles.docExpiry, { color: colors.ink500 }]}>
                    Expire : {doc.expiry}
                </Text>
            </View>
            <View style={[styles.docBadge, { backgroundColor: bg }]}>
                <Text style={[styles.docBadgeText, { color: fg }]}>
                    {statusLabel}
                </Text>
            </View>
        </Pressable>
    );
}

function ActionRow({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <Pressable
            style={[
                styles.actionRow,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View
                style={[styles.actionIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={14} color={colors.ink700} />
            </View>
            <Text style={[styles.actionLabel, { color: colors.ink900 }]}>
                {label}
            </Text>
            <Icon name="chevRight" size={14} color={colors.ink400} />
        </Pressable>
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

    // Identity
    identity: { marginBottom: 14 },
    identityTop: { flexDirection: "row", alignItems: "center", gap: 14 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 20,
    },
    identityName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    identityRole: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
        alignSelf: "flex-start",
        marginTop: 8,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },

    // Stats
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 4,
    },
    statTile: {
        width: "47%",
        flexGrow: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        padding: 14,
    },
    statIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    statValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    statLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Groups
    groupLabel: { marginTop: 18, marginBottom: 8, paddingLeft: 4 },

    // Vehicle
    vehicleCard: {},
    vehicleTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    vehicleIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    vehicleModel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    vehiclePlate: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    fuelRow: {
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    fuelHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    fuelLabelRow: { flexDirection: "row", alignItems: "center", gap: 5 },
    fuelLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    fuelValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
    },
    fuelValueUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    fuelBar: { height: 6, borderRadius: 3, overflow: "hidden" },
    fuelFill: { height: "100%", borderRadius: 3 },
    maintenanceRow: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    maintenanceText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        lineHeight: Typography.fontSize.tiny * 1.5,
    },

    // Week schedule
    weekGrid: { flexDirection: "row", gap: 6 },
    dayCell: {
        flex: 1,
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    dayLetter: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    dayNumber: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
        marginTop: 2,
    },
    dayIndicator: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 5,
    },

    // Documents
    docRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    docIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    docName: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    docExpiry: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    docBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    docBadgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },

    // Action rows
    actionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
    },
    actionIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    actionLabel: {
        flex: 1,
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
});
