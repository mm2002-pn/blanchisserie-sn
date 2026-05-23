import { useEffect, useMemo, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    PanResponder,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import MapView, {
    Marker,
    Polyline,
    PROVIDER_DEFAULT,
    type Region,
} from "react-native-maps";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { currentPosition } from "@/services/capture.service";
import { fetchRoute, type LatLng } from "@/services/routing.service";

import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import DrawerMenu from "@/components/shared/DrawerMenu";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useMyRounds } from "@/hooks/useCollectionRounds";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import type {
    ApiCollectionRound,
    RoundOrder,
} from "@/services/collectionRounds.service";

interface MapStop {
    /** Clé composite `roundId-orderId` (une même commande peut être dans 2 rounds différents). */
    id: string;
    /** ID de la commande seule, pour navigation et matching. */
    orderId: string;
    roundId: string;
    name: string;
    address: string;
    status: "completed" | "pending";
    geoLat: number;
    geoLng: number;
    time: string;
    weightKg: number;
    raw: RoundOrder;
}

/** Région par défaut centrée sur Dakar. */
const DEFAULT_REGION: Region = {
    latitude: 14.7167,
    longitude: -17.4677,
    latitudeDelta: 0.12,
    longitudeDelta: 0.1,
};

const { height: SCREEN_H } = Dimensions.get("window");
const SNAP_PEEK = 180;
const SNAP_MID = Math.round(SCREEN_H * 0.5);
const SNAP_FULL = Math.round(SCREEN_H * 0.85);

export default function DriverRouteScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    // Params de "focus" envoyés depuis tour-detail / collections quand
    // l'utilisateur appuie sur "Naviguer" — on trace alors la route ici.
    const params = useLocalSearchParams<{
        focusOrderId?: string;
        focusRoundId?: string;
        focusLat?: string;
        focusLng?: string;
        focusName?: string;
    }>();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [notifsOpen, setNotifsOpen] = useState(false);
    const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
    // Itinéraire actif : suite de coordonnées à dessiner en polyline sur la carte
    const [activeRoute, setActiveRoute] = useState<LatLng[] | null>(null);
    const [routingStopId, setRoutingStopId] = useState<string | null>(null);
    const [routingBusy, setRoutingBusy] = useState(false);
    // Évite de re-déclencher la nav quand l'utilisateur revient sur l'onglet
    // avec les mêmes params déjà consommés.
    const lastConsumedFocusKey = useRef<string | null>(null);

    useOrdersRealtime();
    // On charge planned + in_progress en deux requêtes pour les afficher séparées.
    const { data: plannedRounds = [] } = useMyRounds({ status: "planned" });
    const { data: inProgressRounds = [] } = useMyRounds({ status: "in_progress" });

    const activeRounds = useMemo(
        () => [...inProgressRounds, ...plannedRounds],
        [inProgressRounds, plannedRounds],
    );

    /** Tous les stops (commandes des tournées actives) avec coords valides.
     *  Une même commande peut apparaître dans un round de collecte ET un round
     *  de livraison — on disambigue via une clé composite (roundId + orderId). */
    const stops: MapStop[] = useMemo(() => {
        const list: MapStop[] = [];
        for (const round of activeRounds) {
            const isDelivery = round.type === "delivery";
            for (const order of round.orders) {
                if (order.pickupGeoLat == null || order.pickupGeoLng == null) continue;
                const doneTimestamp = isDelivery ? order.deliveredAt : order.collectedAt;
                list.push({
                    id: `${round.id}-${order.id}`,
                    orderId: order.id,
                    roundId: round.id,
                    name: order.client?.name || order.orderNumber,
                    address: order.client?.address ?? "",
                    status: doneTimestamp ? "completed" : "pending",
                    geoLat: order.pickupGeoLat,
                    geoLng: order.pickupGeoLng,
                    time: format(new Date(order.collectionDate), "HH:mm"),
                    weightKg: Math.round(((order.estimatedWeight ?? 0) / 1000) * 10) / 10,
                    raw: order,
                });
            }
        }
        return list;
    }, [activeRounds]);

    const mapRef = useRef<MapView | null>(null);

    /** Recadre la carte sur l'ensemble des stops à l'apparition. */
    useEffect(() => {
        if (stops.length === 0) return;
        const coords = stops.map((s) => ({
            latitude: s.geoLat,
            longitude: s.geoLng,
        }));
        mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 100, right: 60, bottom: 280, left: 60 },
            animated: true,
        });
    }, [stops]);

    /* ── Drawer animé ── */
    const drawerY = useRef(new Animated.Value(SCREEN_H - SNAP_PEEK)).current;
    const lastSnap = useRef(SCREEN_H - SNAP_PEEK);
    const [snapState, setSnapState] = useState<"peek" | "mid" | "full">("peek");

    const snapTo = (offset: number) => {
        lastSnap.current = offset;
        // Update state pour re-render du chevron (rotation selon position)
        if (offset === SCREEN_H - SNAP_FULL) setSnapState("full");
        else if (offset === SCREEN_H - SNAP_MID) setSnapState("mid");
        else setSnapState("peek");
        Animated.spring(drawerY, {
            toValue: offset,
            useNativeDriver: false,
            tension: 90,
            friction: 14,
        }).start();
    };

    /** Toggle drawer entre peek et full au tap sur le header. */
    const toggleDrawer = () => {
        snapTo(
            snapState === "peek"
                ? SCREEN_H - SNAP_FULL
                : SCREEN_H - SNAP_PEEK,
        );
    };

    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 4,
            onPanResponderMove: (_, g) => {
                const next = Math.max(
                    SCREEN_H - SNAP_FULL,
                    Math.min(SCREEN_H - SNAP_PEEK, lastSnap.current + g.dy),
                );
                drawerY.setValue(next);
            },
            onPanResponderRelease: (_, g) => {
                const settledY = lastSnap.current + g.dy;
                const snaps = [
                    SCREEN_H - SNAP_PEEK,
                    SCREEN_H - SNAP_MID,
                    SCREEN_H - SNAP_FULL,
                ];
                const target = snaps.reduce((best, cur) =>
                    Math.abs(cur - settledY) < Math.abs(best - settledY) ? cur : best,
                );
                snapTo(target);
            },
        }),
    ).current;

    const focusStop = (stop: MapStop) => {
        setSelectedStopId(stop.id);
        mapRef.current?.animateToRegion(
            {
                latitude: stop.geoLat,
                longitude: stop.geoLng,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
            },
            500,
        );
    };

    /** Trace l'itinéraire de la position actuelle vers un stop sur la carte. */
    const navigateToStop = async (stop: MapStop) => {
        setRoutingBusy(true);
        setRoutingStopId(stop.id);
        try {
            const pos = await currentPosition();
            if (!pos) {
                // Pas de GPS : on trace une ligne droite en fallback
                setActiveRoute([
                    { latitude: stop.geoLat, longitude: stop.geoLng },
                ]);
                return;
            }
            const route = await fetchRoute(
                { latitude: pos.lat, longitude: pos.lng },
                { latitude: stop.geoLat, longitude: stop.geoLng },
            );
            if (route && route.coordinates.length > 0) {
                setActiveRoute(route.coordinates);
                // Recadre la carte sur l'ensemble du trajet
                mapRef.current?.fitToCoordinates(route.coordinates, {
                    edgePadding: { top: 80, right: 50, bottom: 250, left: 50 },
                    animated: true,
                });
            } else {
                // Fallback : ligne droite de la position au stop
                setActiveRoute([
                    { latitude: pos.lat, longitude: pos.lng },
                    { latitude: stop.geoLat, longitude: stop.geoLng },
                ]);
            }
        } finally {
            setRoutingBusy(false);
        }
    };

    /** Efface l'itinéraire affiché. */
    const clearRoute = () => {
        setActiveRoute(null);
        setRoutingStopId(null);
    };

    /** Si on arrive sur cet écran avec des params de focus (depuis "Naviguer"
     *  dans Tournée / tour-detail), on déclenche le tracé automatiquement. */
    useEffect(() => {
        const { focusOrderId, focusRoundId, focusLat, focusLng, focusName } =
            params;
        if (!focusOrderId || !focusRoundId || !focusLat || !focusLng) return;
        const lat = parseFloat(focusLat);
        const lng = parseFloat(focusLng);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return;
        const key = `${focusRoundId}-${focusOrderId}`;
        if (lastConsumedFocusKey.current === key) return;
        lastConsumedFocusKey.current = key;

        const stop: MapStop = {
            id: key,
            orderId: focusOrderId,
            roundId: focusRoundId,
            name: focusName || "Stop",
            address: "",
            status: "pending",
            geoLat: lat,
            geoLng: lng,
            time: "",
            weightKg: 0,
            // raw n'est pas utilisé dans navigateToStop, on peut caster
            raw: {} as RoundOrder,
        };
        // Replie le drawer pour bien voir la carte
        snapTo(SCREEN_H - SNAP_PEEK);
        setSelectedStopId(stop.id);
        void navigateToStop(stop);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        params.focusOrderId,
        params.focusRoundId,
        params.focusLat,
        params.focusLng,
        params.focusName,
    ]);

    const totalStops = stops.length;
    const completedStops = stops.filter((s) => s.status === "completed").length;

    return (
        <View style={[styles.container, { backgroundColor: colors.ink900 }]}>
            {/* ─── Carte plein écran ─────────────────────────── */}
            <MapView
                ref={mapRef}
                provider={PROVIDER_DEFAULT}
                style={StyleSheet.absoluteFillObject}
                initialRegion={DEFAULT_REGION}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
            >
                {stops.map((stop) => {
                    const isSelected = stop.id === selectedStopId;
                    const isDone = stop.status === "completed";
                    return (
                        <Marker
                            key={stop.id}
                            coordinate={{
                                latitude: stop.geoLat,
                                longitude: stop.geoLng,
                            }}
                            onPress={() => focusStop(stop)}
                            tracksViewChanges={isSelected}
                            anchor={{ x: 0.5, y: 1 }}
                        >
                            <View style={styles.pinWrap}>
                                {/* Étiquette nom client au-dessus du pin */}
                                <View
                                    style={[
                                        styles.pinLabel,
                                        {
                                            backgroundColor: colors.paper,
                                            borderColor: isDone
                                                ? colors.ok700
                                                : colors.brand800,
                                            transform: [{ scale: isSelected ? 1.05 : 1 }],
                                        },
                                    ]}
                                >
                                    <Text
                                        numberOfLines={1}
                                        style={[
                                            styles.pinLabelText,
                                            { color: colors.ink900 },
                                        ]}
                                    >
                                        {stop.name}
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.pin,
                                        {
                                            backgroundColor: isDone
                                                ? colors.ok700
                                                : colors.brand800,
                                            borderColor: colors.paper,
                                            transform: [{ scale: isSelected ? 1.2 : 1 }],
                                        },
                                    ]}
                                >
                                    <Icon
                                        name={isDone ? "check" : "package"}
                                        size={14}
                                        color={colors.paper}
                                        stroke={2}
                                    />
                                </View>
                                <View
                                    style={[
                                        styles.pinTail,
                                        {
                                            borderTopColor: isDone
                                                ? colors.ok700
                                                : colors.brand800,
                                        },
                                    ]}
                                />
                            </View>
                        </Marker>
                    );
                })}

                {/* Polyline itinéraire actif */}
                {activeRoute && activeRoute.length >= 2 && (
                    <Polyline
                        coordinates={activeRoute}
                        strokeColor={colors.brand800}
                        strokeWidth={5}
                        lineCap="round"
                        lineJoin="round"
                    />
                )}
            </MapView>

            {/* Bandeau itinéraire actif — bouton fermer */}
            {activeRoute && routingStopId && (
                <View style={styles.routeBannerWrap} pointerEvents="box-none">
                    <View
                        style={[
                            styles.routeBanner,
                            {
                                backgroundColor: colors.brand800,
                                shadowColor: "#000",
                            },
                        ]}
                    >
                        <Icon
                            name="navigate"
                            size={16}
                            color={colors.paper}
                            stroke={2}
                        />
                        <Text
                            style={[styles.routeBannerText, { color: colors.paper }]}
                            numberOfLines={1}
                        >
                            Itinéraire vers{" "}
                            {stops.find((s) => s.id === routingStopId)?.name ?? "stop"}
                        </Text>
                        <Pressable
                            onPress={clearRoute}
                            hitSlop={8}
                            style={[
                                styles.routeBannerClose,
                                { backgroundColor: "rgba(255,255,255,0.2)" },
                            ]}
                        >
                            <Icon name="x" size={14} color={colors.paper} />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* ─── Header flottant ────────────────────────────── */}
            <SafeAreaView edges={["top"]} style={styles.floatingTop}>
                <View
                    style={[
                        styles.topBar,
                        { backgroundColor: colors.paper, borderColor: colors.ink200 },
                    ]}
                >
                    <Pressable
                        onPress={() => setDrawerVisible(true)}
                        hitSlop={6}
                        style={[
                            styles.topIcon,
                            { backgroundColor: colors.ink100 },
                        ]}
                    >
                        <Icon name="list" size={18} color={colors.ink800} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.topTitle, { color: colors.ink900 }]}>
                            Mes tournées
                        </Text>
                        <Text style={[styles.topSub, { color: colors.ink500 }]}>
                            {activeRounds.length} tournée
                            {activeRounds.length > 1 ? "s" : ""} · {completedStops}/
                            {totalStops} stop{totalStops > 1 ? "s" : ""}
                        </Text>
                    </View>
                    <NotificationBell onPress={() => setNotifsOpen(true)} />
                </View>
            </SafeAreaView>

            {/* ─── Bottom Drawer ─────────────────────────── */}
            <Animated.View
                style={[
                    styles.drawer,
                    {
                        backgroundColor: colors.paper,
                        transform: [{ translateY: drawerY }],
                        height: SNAP_FULL,
                    },
                ]}
            >
                <Pressable
                    onPress={toggleDrawer}
                    {...panResponder.panHandlers}
                    style={styles.drawerHeader}
                >
                    <View
                        style={[
                            styles.drawerHandle,
                            { backgroundColor: colors.ink300 },
                        ]}
                    />
                    <View style={styles.drawerHeaderRow}>
                        <View style={{ flex: 1 }}>
                            <ThemedText variate="caps" color="ink500">
                                Mes tournées
                            </ThemedText>
                            <Text
                                style={[styles.drawerTitle, { color: colors.ink900 }]}
                            >
                                {activeRounds.length} tournée
                                {activeRounds.length > 1 ? "s" : ""} active
                                {activeRounds.length > 1 ? "s" : ""}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.drawerExpandBtn,
                                {
                                    backgroundColor: colors.ink100,
                                    transform: [
                                        {
                                            rotate:
                                                snapState === "full"
                                                    ? "0deg"
                                                    : "180deg",
                                        },
                                    ],
                                },
                            ]}
                        >
                            <Icon
                                name="chevDown"
                                size={16}
                                color={colors.ink800}
                                stroke={2}
                            />
                        </View>
                    </View>
                </Pressable>

                {/* La ScrollView prend toute la hauteur restante du drawer
                    (flex:1) pour pouvoir scroller sur tout le contenu. */}
                <ScrollView
                    style={styles.drawerScroll}
                    contentContainerStyle={styles.drawerList}
                    showsVerticalScrollIndicator
                    bounces
                    nestedScrollEnabled
                >
                    {activeRounds.length === 0 ? (
                        <View style={styles.empty}>
                            <Icon name="map" size={28} color={colors.ink400} />
                            <Text
                                style={[styles.emptyTitle, { color: colors.ink800 }]}
                            >
                                Aucune tournée
                            </Text>
                            <Text style={[styles.emptySub, { color: colors.ink500 }]}>
                                L'admin t'enverra une notification quand une
                                tournée te sera assignée.
                            </Text>
                        </View>
                    ) : (
                        activeRounds.map((round) => (
                            <RoundCard
                                key={round.id}
                                round={round}
                                onPress={() =>
                                    router.push({
                                        pathname: "/(driver)/tour-detail",
                                        params: { roundId: round.id },
                                    })
                                }
                                onNavigateToFirst={() => {
                                    const first = round.orders.find((o) =>
                                        round.type === "delivery"
                                            ? !o.deliveredAt
                                            : !o.collectedAt,
                                    );
                                    if (
                                        first?.pickupGeoLat != null &&
                                        first?.pickupGeoLng != null
                                    ) {
                                        void navigateToStop({
                                            id: `${round.id}-${first.id}`,
                                            orderId: first.id,
                                            roundId: round.id,
                                            name: first.client?.name || first.orderNumber,
                                            address: first.client?.address ?? "",
                                            status: "pending",
                                            geoLat: first.pickupGeoLat,
                                            geoLng: first.pickupGeoLng,
                                            time: "",
                                            weightKg: 0,
                                            raw: first,
                                        });
                                    }
                                }}
                            />
                        ))
                    )}
                </ScrollView>
            </Animated.View>

            <DrawerMenu
                visible={drawerVisible}
                onClose={() => setDrawerVisible(false)}
            />
            <NotificationsModal
                visible={notifsOpen}
                onClose={() => setNotifsOpen(false)}
            />
        </View>
    );
}

/* ════════════ ROUND CARD ════════════ */

function RoundCard({
    round,
    onPress,
    onNavigateToFirst,
}: {
    round: ApiCollectionRound;
    onPress: () => void;
    onNavigateToFirst: () => void;
}) {
    const colors = useThemeColors();
    const totalKg =
        round.orders.reduce((s, o) => s + (o.estimatedWeight ?? 0), 0) / 1000;
    const isDelivery = round.type === "delivery";
    const done = round.orders.filter((o) =>
        isDelivery ? o.deliveredAt : o.collectedAt,
    ).length;
    const total = round.orders.length;
    const inProgress = round.status === "in_progress";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.round,
                {
                    backgroundColor: inProgress ? colors.baobab100 : colors.paper,
                    borderColor: inProgress ? colors.baobab600 : colors.ink200,
                    borderWidth: inProgress ? 1.5 : StyleSheet.hairlineWidth,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={styles.roundHead}>
                <View style={{ flex: 1 }}>
                    <View style={styles.roundTopRow}>
                        <Text
                            style={[styles.roundNumber, { color: colors.ink900 }]}
                        >
                            {round.number}
                        </Text>
                        <View
                            style={[
                                styles.roundStatusPill,
                                {
                                    backgroundColor: inProgress
                                        ? colors.baobab600
                                        : colors.brand100,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.roundStatusText,
                                    {
                                        color: inProgress ? colors.paper : colors.brand800,
                                    },
                                ]}
                            >
                                {inProgress ? "En cours" : "Planifiée"}
                            </Text>
                        </View>
                    </View>
                    <Text style={[styles.roundDate, { color: colors.ink600 }]}>
                        {format(new Date(round.plannedAt), "EEEE d MMM 'à' HH:mm", {
                            locale: fr,
                        })}
                    </Text>
                </View>
            </View>

            <View style={styles.roundMeta}>
                <View style={styles.metaItem}>
                    <Icon
                        name="package"
                        size={13}
                        color={colors.ink500}
                        stroke={1.75}
                    />
                    <Text style={[styles.metaText, { color: colors.ink700 }]}>
                        {done}/{total} collectée{total > 1 ? "s" : ""}
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon
                        name="weight"
                        size={13}
                        color={colors.ink500}
                        stroke={1.75}
                    />
                    <Text style={[styles.metaText, { color: colors.ink700 }]}>
                        {totalKg.toFixed(1)} kg
                    </Text>
                </View>
                <View style={styles.metaItem}>
                    <Icon
                        name="truck"
                        size={13}
                        color={colors.ink500}
                        stroke={1.75}
                    />
                    <Text style={[styles.metaText, { color: colors.ink700 }]}>
                        {round.vehicle.matricule}
                    </Text>
                </View>
            </View>

            {/* Progress bar */}
            <View
                style={[
                    styles.progressTrack,
                    { backgroundColor: colors.ink200 },
                ]}
            >
                <View
                    style={[
                        styles.progressFill,
                        {
                            backgroundColor: inProgress
                                ? colors.baobab600
                                : colors.brand800,
                            width: total > 0 ? `${(done / total) * 100}%` : "0%",
                        },
                    ]}
                />
            </View>

            <View style={styles.roundActions}>
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onNavigateToFirst();
                    }}
                    style={[
                        styles.navBtnSmall,
                        { backgroundColor: colors.paper, borderColor: colors.ink300 },
                    ]}
                >
                    <Icon
                        name="navigate"
                        size={13}
                        color={colors.brand800}
                        stroke={2}
                    />
                    <Text
                        style={[
                            styles.navBtnText,
                            { color: colors.brand800 },
                        ]}
                    >
                        Naviguer
                    </Text>
                </Pressable>
                <View
                    style={[
                        styles.openBtn,
                        { backgroundColor: colors.brand800 },
                    ]}
                >
                    <Text style={[styles.openBtnText, { color: colors.paper }]}>
                        {inProgress ? "Continuer" : "Voir détails"}
                    </Text>
                    <Icon
                        name="arrowRight"
                        size={13}
                        color={colors.paper}
                        stroke={2}
                    />
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    /* Bandeau itinéraire actif (au-dessus de la carte, sous le header) */
    routeBannerWrap: {
        position: "absolute",
        top: 80,
        left: 12,
        right: 12,
        zIndex: 11,
    },
    routeBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },
    routeBannerText: {
        flex: 1,
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    routeBannerClose: {
        width: 26,
        height: 26,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },

    /* Header flottant sur la carte */
    floatingTop: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 12,
        paddingTop: Platform.OS === "android" ? 8 : 0,
        zIndex: 10,
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 10,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        elevation: 3,
    },
    topIcon: {
        width: 38,
        height: 38,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },
    topTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
    },
    topSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },

    /* Pins */
    pinWrap: { alignItems: "center" },
    pinLabel: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 99,
        borderWidth: 1.5,
        marginBottom: 4,
        maxWidth: 140,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
    },
    pinLabelText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    pin: {
        width: 34,
        height: 34,
        borderRadius: 99,
        borderWidth: 2,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    pinTail: {
        marginTop: -3,
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 8,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
    },

    /* Drawer */
    /* Drawer */
    drawer: {
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: "#e5e7eb",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 8,
        overflow: "hidden",
    },
    drawerHeader: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
    },
    drawerHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        alignSelf: "center",
        marginBottom: 12,
    },
    drawerHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    drawerTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        marginTop: 2,
    },
    drawerExpandBtn: {
        width: 36,
        height: 36,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },
    /* `flex:1` + height fixe sur le parent Animated.View → la ScrollView
       remplit toute la hauteur restante après le drawerHeader et scroll
       indépendamment, peu importe la position du drawer (PEEK/MID/FULL). */
    drawerScroll: {
        flex: 1,
    },
    drawerList: {
        paddingHorizontal: 16,
        paddingTop: 4,
        paddingBottom: 100,
        gap: 12,
    },

    /* Round card */
    round: {
        padding: 14,
        borderRadius: 14,
        gap: 10,
    },
    roundHead: {
        flexDirection: "row",
        alignItems: "center",
    },
    roundTopRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    roundNumber: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    roundStatusPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 99,
    },
    roundStatusText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    roundDate: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
    },
    roundMeta: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 14,
    },
    metaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    metaText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    progressTrack: {
        height: 4,
        borderRadius: 2,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
    },
    roundActions: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    navBtnSmall: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    navBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    openBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 9,
        borderRadius: 10,
    },
    openBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    /* Empty */
    empty: {
        alignItems: "center",
        paddingVertical: 40,
        gap: 8,
    },
    emptyTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        marginTop: 6,
    },
    emptySub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        textAlign: "center",
        paddingHorizontal: 24,
    },
});
