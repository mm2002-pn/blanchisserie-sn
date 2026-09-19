import { useState } from "react";
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
import ThemedText from "@/components/ui/ThemedText";
import { useAuth } from "@/contexts/AuthContext";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function DriverProfileScreen() {
    const { user } = useAuth();
    const colors = useThemeColors();

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
    };

    const initials =
        (user?.name ?? "")
            .split(" ")
            .map((w) => w.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "CH";

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper }]}
        >
            <View style={styles.header}>
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

                </Card>
            </ScrollView>
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

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
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
        borderRadius: 16,
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
});
