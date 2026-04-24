import { useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
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

type StopStatus = "completed" | "current" | "upcoming";
type StopType = "collecte" | "livraison";

type RouteStop = {
    id: string;
    name: string;
    address: string;
    distance: string;
    estimatedTime: string;
    status: StopStatus;
    type: StopType;
};

export default function NavigationScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [routeOptimized, setRouteOptimized] = useState(true);
    const [trafficEnabled, setTrafficEnabled] = useState(true);

    const routeStops: RouteStop[] = [
        {
            id: "1",
            name: "King Fahd Palace",
            address: "Route de la Corniche Ouest",
            distance: "0,5 km",
            estimatedTime: "2 min",
            status: "current",
            type: "collecte",
        },
        {
            id: "2",
            name: "Hôtel Djoloff",
            address: "Avenue Cheikh Anta Diop",
            distance: "4,2 km",
            estimatedTime: "12 min",
            status: "upcoming",
            type: "livraison",
        },
        {
            id: "3",
            name: "Radisson Blu",
            address: "Route de la Corniche Ouest",
            distance: "6,8 km",
            estimatedTime: "18 min",
            status: "upcoming",
            type: "collecte",
        },
    ];

    const currentStop = routeStops.find((s) => s.status === "current");
    const totalDistance = "24,5 km";
    const totalTime = "1 h 15 min";

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
                <ThemedText variate="title">Navigation</ThemedText>
                <Pressable hitSlop={8}>
                    <Icon name="settings" size={18} color={colors.ink800} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Map placeholder */}
                <Card padding={0} style={[styles.mapCard, { overflow: "hidden" }]}>
                    <View
                        style={[
                            styles.mapPlaceholder,
                            { backgroundColor: colors.paper2 },
                        ]}
                    >
                        <Icon name="map" size={48} color={colors.ink400} />
                        <Text
                            style={[styles.mapTitle, { color: colors.ink700 }]}
                        >
                            Carte interactive
                        </Text>
                        <Text
                            style={[styles.mapSub, { color: colors.ink500 }]}
                        >
                            Leaflet.js · à intégrer
                        </Text>

                        <View style={styles.mapControls}>
                            <MapControl icon="search" />
                            <MapControl icon="plus" />
                            <MapControl icon="minus" />
                        </View>
                    </View>
                </Card>

                {/* Current destination */}
                {currentStop && (
                    <Card
                        padding={16}
                        style={[
                            styles.currentCard,
                            {
                                backgroundColor: colors.brand900,
                                borderColor: colors.brand900,
                            },
                        ]}
                    >
                        <View style={styles.currentTop}>
                            <Text
                                style={[styles.currentCaps, { color: colors.brand100 }]}
                            >
                                Prochaine destination
                            </Text>
                            <View
                                style={[
                                    styles.typePill,
                                    {
                                        backgroundColor:
                                            currentStop.type === "collecte"
                                                ? colors.brand700
                                                : colors.baobab600,
                                    },
                                ]}
                            >
                                <Icon
                                    name={
                                        currentStop.type === "collecte" ? "package" : "truck"
                                    }
                                    size={11}
                                    color={colors.paper}
                                />
                                <Text
                                    style={[styles.typePillText, { color: colors.paper }]}
                                >
                                    {currentStop.type === "collecte" ? "Collecte" : "Livraison"}
                                </Text>
                            </View>
                        </View>
                        <Text
                            style={[styles.currentName, { color: colors.paper }]}
                        >
                            {currentStop.name}
                        </Text>
                        <Text
                            style={[styles.currentAddress, { color: colors.brand100 }]}
                        >
                            {currentStop.address}
                        </Text>

                        <View
                            style={[
                                styles.currentStats,
                                { borderTopColor: colors.brand700 },
                            ]}
                        >
                            <CurrentStat
                                icon="route"
                                value={currentStop.distance}
                                label="Distance"
                            />
                            <CurrentStat
                                icon="clock"
                                value={currentStop.estimatedTime}
                                label="Temps"
                            />
                            <CurrentStat icon="truck" value="Fluide" label="Trafic" />
                        </View>

                        <Pressable
                            style={[
                                styles.goCta,
                                { backgroundColor: colors.terra600 },
                            ]}
                        >
                            <Icon name="route" size={14} color={colors.paper} />
                            <Text style={[styles.goCtaText, { color: colors.paper }]}>
                                Démarrer la navigation
                            </Text>
                            <Icon name="arrowRight" size={14} color={colors.paper} />
                        </Pressable>
                    </Card>
                )}

                {/* Options */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Options de route
                </ThemedText>
                <Card padding={0} style={{ marginBottom: 14, overflow: "hidden" }}>
                    <OptionRow
                        icon="spark"
                        label="Route optimisée"
                        sub="Trajet le plus rapide"
                        value={routeOptimized}
                        onValueChange={setRouteOptimized}
                        withDivider
                    />
                    <OptionRow
                        icon="alert"
                        label="Trafic en temps réel"
                        sub="Éviter les embouteillages"
                        value={trafficEnabled}
                        onValueChange={setTrafficEnabled}
                    />
                </Card>

                {/* Route overview */}
                <View style={styles.routeHeader}>
                    <ThemedText variate="caps" color="ink500">
                        Aperçu de la tournée
                    </ThemedText>
                    <View style={styles.routeStats}>
                        <View style={styles.routeStat}>
                            <Icon name="route" size={11} color={colors.ink500} />
                            <Text style={[styles.routeStatText, { color: colors.ink700 }]}>
                                {totalDistance}
                            </Text>
                        </View>
                        <View style={styles.routeStat}>
                            <Icon name="clock" size={11} color={colors.ink500} />
                            <Text style={[styles.routeStatText, { color: colors.ink700 }]}>
                                {totalTime}
                            </Text>
                        </View>
                    </View>
                </View>

                <Card padding={14}>
                    <View style={styles.stopsList}>
                        {routeStops.map((stop, i) => (
                            <RouteStopRow
                                key={stop.id}
                                stop={stop}
                                isLast={i === routeStops.length - 1}
                            />
                        ))}
                    </View>
                </Card>

                {/* Quick actions */}
                <View style={styles.quickRow}>
                    <QuickAction icon="phone" label="Appeler" />
                    <QuickAction icon="alert" label="Incident" />
                    <QuickAction icon="clock" label="Pause" />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

/* ---------- sous-composants ---------- */

function MapControl({ icon }: { icon: IconName }) {
    const colors = useThemeColors();
    return (
        <Pressable
            style={[
                styles.mapCtl,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <Icon name={icon} size={14} color={colors.ink700} />
        </Pressable>
    );
}

function CurrentStat({
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
        <View style={{ flex: 1 }}>
            <View style={styles.currentStatIcon}>
                <Icon name={icon} size={12} color={colors.brand100} />
                <Text
                    style={[styles.currentStatValue, { color: colors.paper }]}
                >
                    {value}
                </Text>
            </View>
            <Text style={[styles.currentStatLabel, { color: colors.brand100 }]}>
                {label}
            </Text>
        </View>
    );
}

function OptionRow({
    icon,
    label,
    sub,
    value,
    onValueChange,
    withDivider = false,
}: {
    icon: IconName;
    label: string;
    sub: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
    withDivider?: boolean;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.optionRow,
                withDivider && {
                    borderBottomColor: colors.ink200,
                    borderBottomWidth: StyleSheet.hairlineWidth,
                },
            ]}
        >
            <View
                style={[styles.optionIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={14} color={colors.ink700} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.optionLabel, { color: colors.ink900 }]}>
                    {label}
                </Text>
                <Text style={[styles.optionSub, { color: colors.ink500 }]}>
                    {sub}
                </Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.ink200, true: colors.brand500 }}
                thumbColor={value ? colors.brand800 : colors.paper}
            />
        </View>
    );
}

function RouteStopRow({
    stop,
    isLast,
}: {
    stop: RouteStop;
    isLast: boolean;
}) {
    const colors = useThemeColors();
    const dotColor =
        stop.status === "completed"
            ? colors.ok600
            : stop.status === "current"
              ? colors.baobab600
              : colors.ink200;

    return (
        <View style={styles.stopRow}>
            <View style={styles.stopTimeline}>
                <View
                    style={[
                        styles.stopDot,
                        {
                            backgroundColor: dotColor,
                            borderColor:
                                stop.status === "current" ? colors.baobab600 : "transparent",
                            borderWidth: stop.status === "current" ? 3 : 0,
                        },
                    ]}
                >
                    {stop.status === "completed" && (
                        <Icon name="check" size={11} color={colors.paper} />
                    )}
                </View>
                {!isLast && (
                    <View
                        style={[styles.stopLine, { backgroundColor: colors.ink200 }]}
                    />
                )}
            </View>

            <View style={styles.stopBody}>
                <Text style={[styles.stopName, { color: colors.ink900 }]}>
                    {stop.name}
                </Text>
                <Text style={[styles.stopAddress, { color: colors.ink500 }]}>
                    {stop.address}
                </Text>
                <View style={styles.stopFoot}>
                    <View
                        style={[
                            styles.typePillSmall,
                            {
                                backgroundColor:
                                    stop.type === "collecte"
                                        ? colors.brand100
                                        : colors.baobab100,
                            },
                        ]}
                    >
                        <Icon
                            name={stop.type === "collecte" ? "package" : "truck"}
                            size={10}
                            color={
                                stop.type === "collecte"
                                    ? colors.brand800
                                    : colors.baobab700
                            }
                        />
                        <Text
                            style={[
                                styles.typePillSmallText,
                                {
                                    color:
                                        stop.type === "collecte"
                                            ? colors.brand800
                                            : colors.baobab700,
                                },
                            ]}
                        >
                            {stop.type === "collecte" ? "Collecte" : "Livraison"}
                        </Text>
                    </View>
                    <Text style={[styles.stopMeta, { color: colors.ink500 }]}>
                        {stop.distance} · {stop.estimatedTime}
                    </Text>
                </View>
            </View>
        </View>
    );
}

function QuickAction({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <Pressable
            style={[
                styles.quickBtn,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View
                style={[styles.quickIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={16} color={colors.ink700} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.ink700 }]}>
                {label}
            </Text>
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
    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    // Map
    mapCard: { marginBottom: 14 },
    mapPlaceholder: {
        height: 240,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    mapTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    mapSub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    mapControls: {
        position: "absolute",
        top: 12,
        right: 12,
        gap: 6,
    },
    mapCtl: {
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
    },

    // Current card
    currentCard: { marginBottom: 14 },
    currentTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    currentCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    typePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 999,
    },
    typePillText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    currentName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
        marginTop: 8,
    },
    currentAddress: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    currentStats: {
        flexDirection: "row",
        gap: 12,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    currentStatIcon: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
    },
    currentStatValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.base,
    },
    currentStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 3,
    },
    goCta: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    goCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Options
    optionRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    optionIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    optionLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    optionSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },

    // Route overview
    routeHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        paddingLeft: 4,
    },
    routeStats: { flexDirection: "row", gap: 12 },
    routeStat: { flexDirection: "row", alignItems: "center", gap: 4 },
    routeStatText: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },

    stopsList: { gap: 2 },
    stopRow: { flexDirection: "row", gap: 12 },
    stopTimeline: { alignItems: "center", width: 24 },
    stopDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    stopLine: { width: 2, flex: 1, marginVertical: 4, minHeight: 30 },
    stopBody: { flex: 1, paddingBottom: 14 },
    stopName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    stopAddress: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    stopFoot: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginTop: 6,
    },
    typePillSmall: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
    },
    typePillSmallText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    stopMeta: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },

    // Quick actions
    quickRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    quickBtn: {
        flex: 1,
        alignItems: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    quickIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    quickLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
});
