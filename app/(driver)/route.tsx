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
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import DrawerMenu from "@/components/shared/DrawerMenu";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type StopStatus = "completed" | "current" | "pending";
type StopType = "collecte" | "livraison";

type RouteStop = {
    id: string;
    nom: string;
    adresse: string;
    type: StopType;
    statut: StopStatus;
    distance: string;
    heure: string;
    volume: string;
};

const ROUTE_DATA = {
    date: new Date().toLocaleDateString("fr-FR"),
    vehicule: "Camion #12 — AB-1234-CD",
    capaciteUtilisee: 45,
    capaciteMax: 100,
    clientsTotal: 8,
    clientsVisites: 3,
};

const CLIENTS: RouteStop[] = [
    {
        id: "1",
        nom: "Hôtel Teranga",
        adresse: "Almadies, Route de Ngor",
        type: "collecte",
        statut: "completed",
        distance: "2,3 km",
        heure: "08:00",
        volume: "15 kg",
    },
    {
        id: "2",
        nom: "Radisson Blu",
        adresse: "Route de la Corniche Ouest",
        type: "livraison",
        statut: "completed",
        distance: "3,1 km",
        heure: "09:30",
        volume: "28 kg",
    },
    {
        id: "3",
        nom: "Pullman Dakar Teranga",
        adresse: "Place de l'Indépendance",
        type: "collecte",
        statut: "completed",
        distance: "1,8 km",
        heure: "10:45",
        volume: "8 kg",
    },
    {
        id: "4",
        nom: "King Fahd Palace",
        adresse: "Route de la Corniche Ouest",
        type: "collecte",
        statut: "current",
        distance: "0,5 km",
        heure: "11:30",
        volume: "45 kg",
    },
    {
        id: "5",
        nom: "Hôtel Djoloff",
        adresse: "Avenue Cheikh Anta Diop",
        type: "livraison",
        statut: "pending",
        distance: "4,2 km",
        heure: "13:00",
        volume: "18 kg",
    },
];

export default function DriverRouteScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [drawerVisible, setDrawerVisible] = useState(false);

    const currentClient = CLIENTS.find((c) => c.statut === "current");
    const capacityRatio = Math.min(
        1,
        ROUTE_DATA.capaciteUtilisee / ROUTE_DATA.capaciteMax,
    );
    const visitRatio = Math.min(
        1,
        ROUTE_DATA.clientsVisites / ROUTE_DATA.clientsTotal,
    );

    const statusLabel = (s: StopStatus) =>
        s === "completed" ? "Livrée" : s === "current" ? "En cours" : "En attente";

    const statusColor = (s: StopStatus): string =>
        s === "completed"
            ? colors.ok700
            : s === "current"
              ? colors.baobab700
              : colors.ink500;

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
                <ThemedText variate="title">Ma tournée</ThemedText>
                <Pressable
                    onPress={() => router.push("/(driver)/navigation")}
                    hitSlop={8}
                >
                    <Icon name="map" size={20} color={colors.ink800} />
                </Pressable>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero card */}
                <Card
                    padding={18}
                    style={[
                        styles.hero,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <View style={styles.heroTop}>
                        <View>
                            <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                                Tournée du jour
                            </Text>
                            <Text style={[styles.heroDate, { color: colors.paper }]}>
                                {ROUTE_DATA.date}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.heroBadge,
                                { backgroundColor: colors.baobab600 },
                            ]}
                        >
                            <Icon name="truck" size={14} color={colors.paper} />
                            <Text style={[styles.heroBadgeText, { color: colors.paper }]}>
                                En route
                            </Text>
                        </View>
                    </View>

                    <View style={styles.heroVehicle}>
                        <Icon name="truck" size={14} color={colors.brand100} />
                        <Text style={[styles.heroVehicleText, { color: colors.brand100 }]}>
                            {ROUTE_DATA.vehicule}
                        </Text>
                    </View>

                    <View
                        style={[styles.heroStats, { borderTopColor: colors.brand700 }]}
                    >
                        <View style={styles.heroStatCol}>
                            <Text style={[styles.heroStatValue, { color: colors.paper }]}>
                                {ROUTE_DATA.clientsVisites}
                                <Text
                                    style={[styles.heroStatDiv, { color: colors.brand100 }]}
                                >
                                    {` / ${ROUTE_DATA.clientsTotal}`}
                                </Text>
                            </Text>
                            <Text
                                style={[styles.heroStatLabel, { color: colors.brand100 }]}
                            >
                                Clients visités
                            </Text>
                            <View
                                style={[styles.miniBar, { backgroundColor: colors.brand700 }]}
                            >
                                <View
                                    style={[
                                        styles.miniBarFill,
                                        {
                                            width: `${visitRatio * 100}%`,
                                            backgroundColor: colors.baobab600,
                                        },
                                    ]}
                                />
                            </View>
                        </View>

                        <View style={styles.heroStatCol}>
                            <Text style={[styles.heroStatValue, { color: colors.paper }]}>
                                {ROUTE_DATA.capaciteUtilisee}
                                <Text
                                    style={[styles.heroStatDiv, { color: colors.brand100 }]}
                                >
                                    {` / ${ROUTE_DATA.capaciteMax} kg`}
                                </Text>
                            </Text>
                            <Text
                                style={[styles.heroStatLabel, { color: colors.brand100 }]}
                            >
                                Capacité utilisée
                            </Text>
                            <View
                                style={[styles.miniBar, { backgroundColor: colors.brand700 }]}
                            >
                                <View
                                    style={[
                                        styles.miniBarFill,
                                        {
                                            width: `${capacityRatio * 100}%`,
                                            backgroundColor: colors.terra600,
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>
                </Card>

                {/* Next stop */}
                {currentClient && (
                    <Card
                        padding={16}
                        style={[
                            styles.nextCard,
                            {
                                backgroundColor: colors.baobab100,
                                borderColor: colors.baobab600,
                            },
                        ]}
                    >
                        <View style={styles.nextTop}>
                            <Text style={[styles.nextCaps, { color: colors.baobab700 }]}>
                                Prochain arrêt
                            </Text>
                            <StatusBadge status={currentClient.type === "collecte" ? "Traitement" : "Prête"} />
                        </View>
                        <Text style={[styles.nextName, { color: colors.ink900 }]}>
                            {currentClient.nom}
                        </Text>
                        <Text style={[styles.nextAddress, { color: colors.ink500 }]}>
                            {currentClient.adresse}
                        </Text>

                        <View style={styles.nextMeta}>
                            <Meta icon="route" label={currentClient.distance} />
                            <Meta icon="clock" label={currentClient.heure} />
                            <Meta icon="weight" label={currentClient.volume} />
                        </View>

                        <Pressable
                            onPress={() =>
                                router.push(
                                    currentClient.type === "collecte"
                                        ? "/(driver)/collect"
                                        : "/(driver)/delivery",
                                )
                            }
                            style={[
                                styles.nextCta,
                                { backgroundColor: colors.brand800 },
                            ]}
                        >
                            <Icon
                                name={currentClient.type === "collecte" ? "package" : "truck"}
                                size={15}
                                color={colors.paper}
                            />
                            <Text style={[styles.nextCtaText, { color: colors.paper }]}>
                                {currentClient.type === "collecte"
                                    ? "Démarrer la collecte"
                                    : "Démarrer la livraison"}
                            </Text>
                            <Icon name="arrowRight" size={14} color={colors.paper} />
                        </Pressable>
                    </Card>
                )}

                {/* Stops list */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Arrêts de la tournée · {CLIENTS.length}
                </ThemedText>

                <View style={{ gap: 10 }}>
                    {CLIENTS.map((client, index) => (
                        <Pressable
                            key={client.id}
                            style={({ pressed }) => [
                                styles.stopRow,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor:
                                        client.statut === "current"
                                            ? colors.baobab600
                                            : colors.ink200,
                                    borderWidth:
                                        client.statut === "current"
                                            ? 1.5
                                            : StyleSheet.hairlineWidth,
                                    opacity: pressed ? 0.8 : 1,
                                },
                            ]}
                        >
                            <View style={styles.stopIndex}>
                                <View
                                    style={[
                                        styles.stopIndexDot,
                                        {
                                            backgroundColor:
                                                client.statut === "completed"
                                                    ? colors.ok100
                                                    : client.statut === "current"
                                                      ? colors.baobab600
                                                      : colors.ink100,
                                        },
                                    ]}
                                >
                                    {client.statut === "completed" ? (
                                        <Icon name="check" size={11} color={colors.ok700} />
                                    ) : (
                                        <Text
                                            style={[
                                                styles.stopIndexText,
                                                {
                                                    color:
                                                        client.statut === "current"
                                                            ? colors.paper
                                                            : colors.ink500,
                                                },
                                            ]}
                                        >
                                            {index + 1}
                                        </Text>
                                    )}
                                </View>
                                {index < CLIENTS.length - 1 && (
                                    <View
                                        style={[styles.stopLine, { backgroundColor: colors.ink200 }]}
                                    />
                                )}
                            </View>

                            <View style={styles.stopBody}>
                                <View style={styles.stopHeader}>
                                    <Text
                                        style={[styles.stopName, { color: colors.ink900 }]}
                                        numberOfLines={1}
                                    >
                                        {client.nom}
                                    </Text>
                                    <Text
                                        style={[styles.stopTime, { color: colors.ink700 }]}
                                    >
                                        {client.heure}
                                    </Text>
                                </View>
                                <Text
                                    style={[styles.stopAddress, { color: colors.ink500 }]}
                                    numberOfLines={1}
                                >
                                    {client.adresse}
                                </Text>

                                <View style={styles.stopFoot}>
                                    <View
                                        style={[
                                            styles.typePill,
                                            {
                                                backgroundColor:
                                                    client.type === "collecte"
                                                        ? colors.brand100
                                                        : colors.baobab100,
                                            },
                                        ]}
                                    >
                                        <Icon
                                            name={client.type === "collecte" ? "package" : "truck"}
                                            size={10}
                                            color={
                                                client.type === "collecte"
                                                    ? colors.brand800
                                                    : colors.baobab700
                                            }
                                        />
                                        <Text
                                            style={[
                                                styles.typePillText,
                                                {
                                                    color:
                                                        client.type === "collecte"
                                                            ? colors.brand800
                                                            : colors.baobab700,
                                                },
                                            ]}
                                        >
                                            {client.type === "collecte" ? "Collecte" : "Livraison"}
                                        </Text>
                                    </View>

                                    <Text
                                        style={[styles.stopMeta, { color: colors.ink500 }]}
                                    >
                                        {client.distance} · {client.volume}
                                    </Text>

                                    <Text
                                        style={[styles.stopStatus, { color: statusColor(client.statut) }]}
                                    >
                                        {statusLabel(client.statut)}
                                    </Text>
                                </View>
                            </View>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
        </SafeAreaView>
    );
}

function Meta({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={styles.metaItem}>
            <Icon name={icon} size={12} color={colors.ink500} />
            <Text style={[styles.metaText, { color: colors.ink700 }]}>{label}</Text>
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

    // Hero
    hero: { marginBottom: 14 },
    heroTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-start",
    },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    heroDate: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        letterSpacing: -0.3,
        marginTop: 4,
    },
    heroBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 999,
    },
    heroBadgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    heroVehicle: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 10,
    },
    heroVehicleText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    heroStats: {
        flexDirection: "row",
        gap: 20,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    heroStatCol: { flex: 1 },
    heroStatValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 20,
    },
    heroStatDiv: {
        fontFamily: FontFamily.monoRegular,
        fontSize: 14,
    },
    heroStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    miniBar: {
        height: 4,
        borderRadius: 2,
        marginTop: 8,
        overflow: "hidden",
    },
    miniBarFill: { height: "100%", borderRadius: 2 },

    // Next stop
    nextCard: { marginBottom: 14 },
    nextTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    nextCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    nextName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        letterSpacing: -0.2,
    },
    nextAddress: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    nextMeta: {
        flexDirection: "row",
        gap: 16,
        marginTop: 12,
        marginBottom: 14,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    nextCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 12,
        borderRadius: 10,
    },
    nextCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Sections
    sectionLabel: { marginTop: 4, marginBottom: 10, paddingLeft: 4 },

    // Stops
    stopRow: {
        flexDirection: "row",
        borderRadius: 14,
        padding: 12,
        gap: 12,
    },
    stopIndex: { alignItems: "center", width: 22 },
    stopIndexDot: {
        width: 22,
        height: 22,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    stopIndexText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    stopLine: { width: StyleSheet.hairlineWidth, flex: 1, marginTop: 4 },
    stopBody: { flex: 1 },
    stopHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    stopName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        flex: 1,
        marginRight: 8,
    },
    stopTime: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
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
        marginTop: 8,
    },
    typePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
    },
    typePillText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    stopMeta: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        flex: 1,
    },
    stopStatus: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
});
