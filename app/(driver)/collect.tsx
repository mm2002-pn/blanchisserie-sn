import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect, useLocalSearchParams } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { G, Path, Rect } from "react-native-svg";

import Icon from "@/components/ui/Icon";
import { SignaturePad } from "@/components/shared/SignaturePad";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useCollectOrder, useOrder, useOrders } from "@/hooks/useOrders";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { ApiError } from "@/services/api";
import { capturePhoto, currentPosition } from "@/services/capture.service";
import { uploadPhotos } from "@/services/uploads.service";
import { formatDayHeader, formatHour, isToday } from "@/lib/date";
import { openMapsNavigation } from "@/lib/maps";
import type { Order } from "@/types/order.types";

const FRAME_SIZE = 240;

/** Libellés FR pour les types de linge (clé = LinenType côté API/types). */
const LINEN_LABEL: Record<string, string> = {
    drap: "Drap",
    taie: "Taie d'oreiller",
    serviette: "Serviette",
    nappe: "Nappe",
    torchon: "Torchon",
    rideau: "Rideau",
    couverture: "Couverture",
    housse: "Housse de couette",
    peignoir: "Peignoir",
    tapis: "Tapis",
};

export default function CollectScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams<{
        orderId?: string;
        mode?: string;
        roundId?: string;
    }>();
    const [permission, requestPermission] = useCameraPermissions();

    /** Mode liste = écran d'accueil avec collectes du jour. Mode scan = caméra QR. */
    const [mode, setMode] = useState<"list" | "scan">("list");
    const [dayFilter, setDayFilter] = useState<"today" | "all">("today");

    const [scanned, setScanned] = useState(false);
    const [scannedId, setScannedId] = useState<string | null>(null);
    const [showItemsDetail, setShowItemsDetail] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualInput, setManualInput] = useState("");
    const [photoUrls, setPhotoUrls] = useState<string[]>([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
    const [signaturePadOpen, setSignaturePadOpen] = useState(false);

    useOrdersRealtime();
    const { data: liveOrders } = useOrders();

    const collects = useMemo<Order[]>(() => {
        if (!liveOrders) return [];
        const collectStatuses: Order["status"][] = [
            "pending",
            "confirmed",
            "collected",
        ];
        return liveOrders.filter((o) => collectStatuses.includes(o.status));
    }, [liveOrders]);

    const collectsToday = useMemo(
        () => collects.filter((o) => isToday(o.collectionPlannedAt ?? o.collectionDate)),
        [collects],
    );
    const visibleCollects = dayFilter === "today" ? collectsToday : collects;

    /** Reset complet à chaque ouverture de l'écran (focus), peu importe
     *  comment on est arrivé. Évite que les données d'une collecte précédente
     *  (photos, signature, quantités) suivent sur la commande suivante. */
    useFocusEffect(
        useCallback(() => {
            // Toujours reset les inputs utilisateur
            setManualMode(false);
            setManualInput("");
            setPhotoUrls([]);
            setSignatureUrl(null);
            setSignaturePadOpen(false);
            setReceivedByType({});
            setShowItemsDetail(false);

            // Mode / commande active : dépend des params
            if (params.orderId) {
                setMode("scan");
                setScanned(true);
                setScannedId(String(params.orderId));
            } else {
                setMode("list");
                setScanned(false);
                setScannedId(null);
            }
        }, [params.orderId]),
    );

    const photosCount = photoUrls.length;
    const signed = !!signatureUrl;

    /** Récupère la commande dès qu'un QR est scanné. Le QR encode l'ID API. */
    const { data: order } = useOrder(scannedId ?? undefined);
    const collect = useCollectOrder();

    /** Total déclaré par le client (somme des items de la commande). */
    const declaredTotalPieces =
        (order?.services ?? []).reduce(
            (s, sv) => s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
            0,
        ) || 0;

    /** Données affichées : depuis l'API si l'ordre est chargé, sinon placeholder.
     *  Priorité poids : actualWeight (pesée atelier déjà faite) > estimatedWeight (calcul depuis items). */
    const client = {
        code: order?.orderNumber ?? "—",
        name: order?.hotelName || "Hôtel",
        estimatedWeight: order?.actualWeight ?? order?.estimatedWeight ?? 0,
        pieces: declaredTotalPieces,
        stopIndex: 1,
        stopTotal: 1,
        geoLat: order?.pickupGeoLat,
        geoLng: order?.pickupGeoLng,
    };

    /** Items déclarés par le client, agrégés par type. */
    const linenItems = useMemo(() => {
        const acc: Record<string, number> = {};
        for (const sv of order?.services ?? []) {
            for (const it of sv.items ?? []) {
                acc[it.type] = (acc[it.type] ?? 0) + (it.quantity ?? 0);
            }
        }
        return Object.entries(acc)
            .filter(([, q]) => q > 0)
            .map(([type, declared]) => ({ type, declared }));
    }, [order]);

    /** Quantités réellement reçues par le chauffeur (modifiables).
     *  Par défaut = ce que le client a déclaré. */
    const [receivedByType, setReceivedByType] = useState<Record<string, number>>({});
    useEffect(() => {
        const init: Record<string, number> = {};
        for (const it of linenItems) init[it.type] = it.declared;
        setReceivedByType(init);
    }, [linenItems]);

    const totalReceivedPieces = useMemo(
        () => Object.values(receivedByType).reduce((s, n) => s + (n || 0), 0),
        [receivedByType],
    );

    /** Catalogue API : permet d'afficher le nom réel saisi par le client
     *  (ex: "Drap 2 personnes" au lieu du legacy "Drap" générique). */
    const { data: apiLinens = [] } = useLinenTypes();
    const labelByCode = useMemo(() => {
        const m: Record<string, string> = { ...LINEN_LABEL };
        for (const lt of apiLinens) m[lt.code] = lt.name;
        return m;
    }, [apiLinens]);

    const scanLineY = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!permission) requestPermission();
    }, [permission, requestPermission]);

    useEffect(() => {
        if (scanned) return;
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanLineY, {
                    toValue: 1,
                    duration: 2200,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
                Animated.timing(scanLineY, {
                    toValue: 0,
                    duration: 2200,
                    easing: Easing.inOut(Easing.quad),
                    useNativeDriver: true,
                }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [scanLineY, scanned]);

    const lineTranslateY = scanLineY.interpolate({
        inputRange: [0, 1],
        outputRange: [-FRAME_SIZE / 2 + 12, FRAME_SIZE / 2 - 12],
    });

    const handleBarcode = ({ data, type }: { data: string; type?: string }) => {
        console.log("[scan]", { type, data });
        if (scanned || !data) return;
        setScanned(true);
        setScannedId(data.trim());
    };

    const handleSimulate = () => {
        // Bascule vers le mode saisie manuelle
        setManualMode(true);
    };

    const handleManualSubmit = () => {
        const id = manualInput.trim();
        if (!id) {
            Alert.alert("Code requis", "Saisis l'ID de la commande à collecter.");
            return;
        }
        setScannedId(id);
        setScanned(true);
        setManualMode(false);
    };

    const handleAddPhoto = async () => {
        if (uploadingPhoto) return;
        try {
            const uri = await capturePhoto();
            if (!uri) return;
            setUploadingPhoto(true);
            const [uploaded] = await uploadPhotos([uri]);
            if (uploaded) setPhotoUrls((prev) => [...prev, uploaded.url]);
        } catch (err) {
            Alert.alert("Échec photo", err instanceof Error ? err.message : "Upload échoué.");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleSign = () => setSignaturePadOpen(true);

    const handleValidate = async () => {
        if (!scannedId) {
            Alert.alert("Aucune commande", "Scanne un QR de commande d'abord.");
            return;
        }
        if (photosCount === 0 || !signed) {
            Alert.alert(
                "Incomplet",
                "Ajoute au moins une photo et la signature avant de valider.",
            );
            return;
        }
        try {
            const geo = await currentPosition();
            // Détail par type : priorité au tableau saisi par le chauffeur,
            // fallback sur les items déclarés (si l'utilisateur valide sans avoir
            // ouvert le panneau de vérification).
            const fromReceived = Object.entries(receivedByType)
                .filter(([, q]) => q > 0)
                .map(([type, quantity]) => ({ type, quantity }));
            const driverItemsPayload =
                fromReceived.length > 0
                    ? fromReceived
                    : linenItems.map((it) => ({
                          type: it.type,
                          quantity: it.declared,
                      }));
            await collect.mutateAsync({
                id: scannedId,
                data: {
                    driverWeight: Math.max(1, Math.round((client.estimatedWeight || 1) * 1000)),
                    driverPieces: Math.max(1, totalReceivedPieces || client.pieces || 1),
                    driverItems:
                        driverItemsPayload.length > 0 ? driverItemsPayload : undefined,
                    visualEstimation: "M",
                    collectionPhotos: photoUrls,
                    signatureUrl: signatureUrl ?? undefined,
                    recipientName: client.name,
                    geoLat: geo?.lat,
                    geoLng: geo?.lng,
                },
            });
            Alert.alert(
                "Collecte validée",
                `${client.name} · ${client.pieces} pièces · ${client.estimatedWeight
                    .toFixed(1)
                    .replace(".", ",")} kg`,
                // Retour explicite à tour-detail si on en vient (sinon back).
                [
                    {
                        text: "OK",
                        onPress: () => {
                            if (params.roundId) {
                                router.replace({
                                    pathname: "/(driver)/tour-detail",
                                    params: { roundId: params.roundId as string },
                                });
                            } else {
                                router.back();
                            }
                        },
                    },
                ],
            );
        } catch (err) {
            console.error("[collect]", err);
            let message = "Erreur API lors de la collecte.";
            if (err instanceof ApiError) {
                message = err.message;
                const details = err.details as
                    | { fieldErrors?: Record<string, string[]> }
                    | undefined;
                const fields = details?.fieldErrors;
                if (fields) {
                    const lines = Object.entries(fields)
                        .map(([k, v]) => `• ${k}: ${v.join(", ")}`)
                        .join("\n");
                    if (lines) message += `\n\n${lines}`;
                }
            } else if (err instanceof Error) {
                message = err.message;
            }
            Alert.alert("Échec", message);
        }
    };

    const handleClose = () => {
        // Avec les Tabs d'expo-router, router.back() peut switcher de tab au
        // lieu de pop le stack. On redirige explicitement vers tour-detail
        // pour garantir le bon retour.
        if (params.roundId) {
            router.replace({
                pathname: "/(driver)/tour-detail",
                params: { roundId: params.roundId },
            });
        } else {
            router.back();
        }
    };

    const handlePickFromList = (orderId: string) => {
        setMode("scan");
        setScanned(true);
        setScannedId(orderId);
    };

    /* ========= MODE LIST ========= */
    if (mode === "list") {
        return (
            <SafeAreaView
                edges={["top"]}
                style={{ flex: 1, backgroundColor: colors.paper2 }}
            >
                <View
                    style={[
                        styles.listHeader,
                        { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                    ]}
                >
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.listTitle, { color: colors.ink900 }]}>
                            Collectes
                        </Text>
                        <Text style={[styles.listSub, { color: colors.ink500 }]}>
                            {dayFilter === "today" ? formatDayHeader() : "Toutes les collectes"}
                        </Text>
                    </View>
                    <View
                        style={[
                            styles.countBadge,
                            { backgroundColor: colors.brand100, borderColor: colors.brand800 },
                        ]}
                    >
                        <Text
                            style={[styles.countBadgeText, { color: colors.brand800 }]}
                        >
                            {visibleCollects.length}
                        </Text>
                    </View>
                </View>

                <View style={[styles.filterBar, { backgroundColor: colors.paper, borderBottomColor: colors.ink200 }]}>
                    <DayChip
                        label={`Aujourd'hui · ${collectsToday.length}`}
                        active={dayFilter === "today"}
                        onPress={() => setDayFilter("today")}
                    />
                    <DayChip
                        label={`Toutes · ${collects.length}`}
                        active={dayFilter === "all"}
                        onPress={() => setDayFilter("all")}
                    />
                </View>

                <ScrollView
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                >
                    {visibleCollects.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Icon name="package" size={40} color={colors.ink400} />
                            <Text style={[styles.emptyText, { color: colors.ink500 }]}>
                                {dayFilter === "today"
                                    ? "Aucune collecte pour aujourd'hui"
                                    : "Aucune collecte"}
                            </Text>
                            {dayFilter === "today" && collects.length > 0 && (
                                <Pressable onPress={() => setDayFilter("all")} hitSlop={8}>
                                    <Text style={[styles.emptyLink, { color: colors.brand800 }]}>
                                        Voir toutes ({collects.length})
                                    </Text>
                                </Pressable>
                            )}
                        </View>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {visibleCollects.map((o) => {
                                const totalPieces = (o.services ?? []).reduce(
                                    (s, sv) =>
                                        s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
                                    0,
                                );
                                const isCollected = o.status === "collected";
                                return (
                                    <Pressable
                                        key={o.id}
                                        onPress={() => handlePickFromList(o.id)}
                                        style={({ pressed }) => [
                                            styles.collectItem,
                                            {
                                                backgroundColor: colors.paper,
                                                borderColor: isCollected ? colors.ok600 : colors.ink200,
                                                opacity: pressed ? 0.85 : 1,
                                            },
                                        ]}
                                    >
                                        <View style={styles.collectTop}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={[styles.collectClient, { color: colors.ink900 }]}>
                                                    {o.hotelName || "Hôtel"}
                                                </Text>
                                                <Text style={[styles.collectCode, { color: colors.ink500 }]}>
                                                    {o.orderNumber}
                                                </Text>
                                            </View>
                                            <View style={styles.collectRight}>
                                                <Text style={[styles.collectTime, { color: colors.ink900 }]}>
                                                    {formatHour(o.collectionPlannedAt ?? o.collectionDate)}
                                                </Text>
                                                {isCollected && (
                                                    <View
                                                        style={[
                                                            styles.donePill,
                                                            { backgroundColor: colors.ok100 },
                                                        ]}
                                                    >
                                                        <Icon name="check" size={10} color={colors.ok700} />
                                                        <Text style={[styles.donePillText, { color: colors.ok700 }]}>
                                                            Collectée
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View style={styles.collectMetaRow}>
                                            <Text style={[styles.collectMeta, { color: colors.ink500 }]}>
                                                {totalPieces} pcs
                                                {o.actualWeight ? ` · ${o.actualWeight.toFixed(1)} kg` : ""}
                                            </Text>
                                        </View>
                                    </Pressable>
                                );
                            })}
                        </View>
                    )}
                </ScrollView>

                <View style={[styles.scanBar, { backgroundColor: colors.paper, borderTopColor: colors.ink200 }]}>
                    <Pressable
                        onPress={() => {
                            setMode("scan");
                            setScanned(false);
                            setScannedId(null);
                        }}
                        style={[styles.scanCta, { backgroundColor: colors.brand800 }]}
                    >
                        <Icon name="qr" size={16} color={colors.paper} />
                        <Text style={[styles.scanCtaText, { color: colors.paper }]}>
                            Scanner un QR
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        );
    }

    /* ========= MODE SCAN =========
     * Note : le QR scanner n'est plus utilisé depuis que le chauffeur entre
     * dans cet écran uniquement via tour-detail (orderId déjà connu).
     * On commente toute la partie caméra/scanner et on rend la sheet en
     * plein écran avec le formulaire de collecte directement. */
    return (
        <View style={[styles.root, { backgroundColor: colors.paper2 }]}>
            {/* Top bar — bouton fermer + titre */}
            <SafeAreaView
                edges={["top"]}
                style={[
                    styles.topBarLight,
                    {
                        backgroundColor: colors.paper,
                        borderBottomColor: colors.ink200,
                    },
                ]}
            >
                <Pressable
                    onPress={handleClose}
                    style={[styles.topBtnLight, { backgroundColor: colors.ink100 }]}
                    hitSlop={8}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.topTitleLight, { color: colors.ink900 }]}>
                        Collecte
                    </Text>
                    <Text style={[styles.topSubLight, { color: colors.ink500 }]}>
                        {client.name} · {client.code}
                    </Text>
                </View>
            </SafeAreaView>

            {/* Sheet en plein écran avec formulaire */}
            <View
                style={[
                    styles.sheetFull,
                    { backgroundColor: colors.paper },
                ]}
            >
                <ScrollView
                    contentContainerStyle={styles.sheetScroll}
                    showsVerticalScrollIndicator={false}
                >
                {scanned ? (
                    <>
                        <View style={styles.sheetTop}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.sheetCaps, { color: colors.ok700 }]}>
                                    ✓ Hôtel identifié
                                </Text>
                                <Text
                                    style={[styles.sheetName, { color: colors.ink900 }]}
                                >
                                    {client.name}
                                </Text>
                                <Text
                                    style={[styles.sheetCode, { color: colors.ink500 }]}
                                >
                                    {client.code}
                                </Text>
                            </View>
                            {client.geoLat != null && client.geoLng != null ? (
                                <Pressable
                                    onPress={() =>
                                        openMapsNavigation(
                                            client.geoLat!,
                                            client.geoLng!,
                                            client.name,
                                        )
                                    }
                                    hitSlop={6}
                                    style={[
                                        styles.sheetAvatar,
                                        {
                                            backgroundColor: colors.brand800,
                                        },
                                    ]}
                                >
                                    <Icon
                                        name="navigate"
                                        size={20}
                                        color={colors.paper}
                                        stroke={2}
                                    />
                                </Pressable>
                            ) : (
                                <View
                                    style={[
                                        styles.sheetAvatar,
                                        { backgroundColor: colors.brand100 },
                                    ]}
                                >
                                    <Icon
                                        name="building"
                                        size={20}
                                        color={colors.brand800}
                                    />
                                </View>
                            )}
                        </View>

                        <View style={styles.tilesRow}>
                            <View
                                style={[
                                    styles.tile,
                                    styles.tilePrimary,
                                    {
                                        backgroundColor: colors.brand50,
                                        borderColor: colors.brand800,
                                    },
                                ]}
                            >
                                <Text
                                    style={[styles.tileCaps, { color: colors.brand700 }]}
                                >
                                    Poids estimé
                                </Text>
                                <Text
                                    style={[styles.tileValue, { color: colors.ink900 }]}
                                >
                                    {client.estimatedWeight.toFixed(1).replace(".", ",")}
                                    <Text
                                        style={[styles.tileUnit, { color: colors.ink500 }]}
                                    >
                                        {" kg"}
                                    </Text>
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.tile,
                                    {
                                        backgroundColor: colors.paper,
                                        borderColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Text style={[styles.tileCaps, { color: colors.ink500 }]}>
                                    Nb pièces
                                </Text>
                                <Text
                                    style={[styles.tileValue, { color: colors.ink900 }]}
                                >
                                    {client.pieces}
                                </Text>
                            </View>
                        </View>

                        {linenItems.length > 0 && (
                            <View
                                style={[
                                    styles.itemsBox,
                                    {
                                        backgroundColor: colors.paper,
                                        borderColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Pressable
                                    onPress={() => setShowItemsDetail((v) => !v)}
                                    style={styles.itemsToggle}
                                    hitSlop={6}
                                >
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text
                                            style={[
                                                styles.itemsCaps,
                                                { color: colors.ink700 },
                                            ]}
                                        >
                                            Vérifier les pièces · reçu{" "}
                                            {totalReceivedPieces} / annoncé{" "}
                                            {linenItems.reduce(
                                                (s, it) => s + it.declared,
                                                0,
                                            )}
                                        </Text>
                                    </View>
                                    <Icon
                                        name={showItemsDetail ? "chevDown" : "chevRight"}
                                        size={14}
                                        color={colors.ink600}
                                        stroke={2}
                                    />
                                </Pressable>
                                {showItemsDetail && (
                                    <View style={[styles.itemsList, { marginTop: 8 }]}>
                                        {linenItems.map((it) => {
                                            const received = receivedByType[it.type] ?? it.declared;
                                            const diff = received - it.declared;
                                            return (
                                                <View key={it.type} style={styles.itemRowEdit}>
                                                    <View style={{ flex: 1, minWidth: 0 }}>
                                                        <Text
                                                            style={[
                                                                styles.itemLabel,
                                                                { color: colors.ink800 },
                                                            ]}
                                                            numberOfLines={1}
                                                        >
                                                            {labelByCode[it.type] ?? it.type}
                                                        </Text>
                                                        <Text
                                                            style={[
                                                                styles.itemSub,
                                                                {
                                                                    color:
                                                                        diff === 0
                                                                            ? colors.ink500
                                                                            : diff > 0
                                                                              ? colors.ok700
                                                                              : colors.danger600,
                                                                },
                                                            ]}
                                                        >
                                                            Annoncé {it.declared}
                                                            {diff !== 0
                                                                ? ` · ${diff > 0 ? "+" : ""}${diff}`
                                                                : ""}
                                                        </Text>
                                                    </View>
                                                    <View style={styles.qtyStepper}>
                                                        <Pressable
                                                            onPress={() =>
                                                                setReceivedByType((prev) => ({
                                                                    ...prev,
                                                                    [it.type]: Math.max(
                                                                        0,
                                                                        (prev[it.type] ?? it.declared) - 1,
                                                                    ),
                                                                }))
                                                            }
                                                            hitSlop={6}
                                                            style={[
                                                                styles.qtyBtn,
                                                                {
                                                                    backgroundColor: colors.paper2,
                                                                    borderColor: colors.ink200,
                                                                },
                                                            ]}
                                                        >
                                                            <Icon
                                                                name="minus"
                                                                size={12}
                                                                color={colors.ink800}
                                                                stroke={2.2}
                                                            />
                                                        </Pressable>
                                                        <TextInput
                                                            value={String(received)}
                                                            onChangeText={(txt) => {
                                                                const n =
                                                                    parseInt(
                                                                        txt.replace(/[^0-9]/g, ""),
                                                                        10,
                                                                    ) || 0;
                                                                setReceivedByType((prev) => ({
                                                                    ...prev,
                                                                    [it.type]: Math.max(
                                                                        0,
                                                                        Math.min(9999, n),
                                                                    ),
                                                                }));
                                                            }}
                                                            keyboardType="number-pad"
                                                            selectTextOnFocus
                                                            style={[
                                                                styles.qtyInput,
                                                                {
                                                                    color: colors.ink900,
                                                                    borderColor:
                                                                        diff === 0
                                                                            ? colors.ink300
                                                                            : colors.brand800,
                                                                },
                                                            ]}
                                                        />
                                                        <Pressable
                                                            onPress={() =>
                                                                setReceivedByType((prev) => ({
                                                                    ...prev,
                                                                    [it.type]: Math.min(
                                                                        9999,
                                                                        (prev[it.type] ?? it.declared) + 1,
                                                                    ),
                                                                }))
                                                            }
                                                            hitSlop={6}
                                                            style={[
                                                                styles.qtyBtn,
                                                                { backgroundColor: colors.brand800 },
                                                            ]}
                                                        >
                                                            <Icon
                                                                name="plus"
                                                                size={12}
                                                                color={colors.paper}
                                                                stroke={2.2}
                                                            />
                                                        </Pressable>
                                                    </View>
                                                </View>
                                            );
                                        })}
                                    </View>
                                )}
                            </View>
                        )}

                        <View style={styles.miniRow}>
                            <Pressable
                                onPress={handleAddPhoto}
                                style={[
                                    styles.miniTile,
                                    {
                                        borderColor:
                                            photosCount > 0
                                                ? colors.baobab600
                                                : colors.ink300,
                                        borderStyle: photosCount > 0 ? "solid" : "dashed",
                                    },
                                ]}
                            >
                                <Icon
                                    name="camera"
                                    size={15}
                                    color={
                                        photosCount > 0 ? colors.baobab700 : colors.ink600
                                    }
                                />
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.miniTitle, { color: colors.ink900 }]}
                                    >
                                        Photo colis
                                    </Text>
                                    <Text
                                        style={[styles.miniSub, { color: colors.ink500 }]}
                                    >
                                        {photosCount > 0 ? `${photosCount} / 3` : "0 / 3"}
                                    </Text>
                                </View>
                            </Pressable>
                            <Pressable
                                onPress={handleSign}
                                style={[
                                    styles.miniTile,
                                    {
                                        borderColor: signed
                                            ? colors.baobab600
                                            : colors.ink300,
                                        borderStyle: signed ? "solid" : "dashed",
                                    },
                                ]}
                            >
                                <Icon
                                    name="signature"
                                    size={15}
                                    color={signed ? colors.baobab700 : colors.ink600}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.miniTitle, { color: colors.ink900 }]}
                                    >
                                        Signature
                                    </Text>
                                    <Text
                                        style={[styles.miniSub, { color: colors.ink500 }]}
                                    >
                                        {signed ? "Signée" : "À signer"}
                                    </Text>
                                </View>
                            </Pressable>
                        </View>

                        <Pressable
                            onPress={handleValidate}
                            style={[
                                styles.validateBtn,
                                { backgroundColor: colors.brand800 },
                            ]}
                        >
                            <Icon name="check" size={15} color={colors.paper} />
                            <Text
                                style={[styles.validateText, { color: colors.paper }]}
                            >
                                Valider la collecte
                            </Text>
                        </Pressable>
                    </>
                ) : (
                    <>
                        <Text style={[styles.hintTitle, { color: colors.ink900 }]}>
                            Positionne le QR dans le cadre
                        </Text>
                        <Text style={[styles.hintSub, { color: colors.ink500 }]}>
                            La détection se fait automatiquement. Si le scan échoue, utilise la saisie manuelle.
                        </Text>

                        {!permission?.granted && (
                            <Pressable
                                onPress={() => {
                                    requestPermission().then((res) => {
                                        if (!res.granted) {
                                            Alert.alert(
                                                "Permission refusée",
                                                "Active la caméra dans les réglages pour scanner.",
                                            );
                                        }
                                    });
                                }}
                                style={[
                                    styles.permissionBtn,
                                    { backgroundColor: colors.terra600 },
                                ]}
                            >
                                <Icon name="camera" size={14} color={colors.paper} />
                                <Text
                                    style={[styles.validateText, { color: colors.paper }]}
                                >
                                    Autoriser la caméra
                                </Text>
                            </Pressable>
                        )}

                        {manualMode ? (
                            <View style={styles.manualWrap}>
                                <TextInput
                                    value={manualInput}
                                    onChangeText={setManualInput}
                                    placeholder="ID de la commande (ex: cmoeef…)"
                                    placeholderTextColor={colors.ink400}
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    style={[
                                        styles.manualInput,
                                        {
                                            backgroundColor: colors.paper2,
                                            color: colors.ink900,
                                            borderColor: colors.ink200,
                                        },
                                    ]}
                                />
                                <Pressable
                                    onPress={handleManualSubmit}
                                    style={[
                                        styles.manualSubmit,
                                        { backgroundColor: colors.brand800 },
                                    ]}
                                >
                                    <Text style={[styles.validateText, { color: colors.paper }]}>
                                        Charger
                                    </Text>
                                </Pressable>
                            </View>
                        ) : (
                            <Pressable
                                onPress={handleSimulate}
                                style={[
                                    styles.manualBtn,
                                    {
                                        backgroundColor: colors.paper2,
                                        borderColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Icon name="qr" size={14} color={colors.ink700} />
                                <Text style={[styles.manualText, { color: colors.ink700 }]}>
                                    Saisir le code manuellement
                                </Text>
                            </Pressable>
                        )}
                    </>
                )}
                </ScrollView>
            </View>

            <SignaturePad
                visible={signaturePadOpen}
                onClose={() => setSignaturePadOpen(false)}
                onSign={(url) => setSignatureUrl(url)}
                title={`Signature client · ${client.code}`}
            />
        </View>
    );
}

function DayChip({
    label,
    active,
    onPress,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.dayChip,
                {
                    backgroundColor: active ? colors.brand800 : colors.paper2,
                    borderColor: active ? colors.brand800 : colors.ink200,
                },
            ]}
        >
            <Text
                style={[
                    styles.dayChipText,
                    { color: active ? colors.paper : colors.ink700 },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1 },

    /* Top bar light (mode plein écran sans caméra) */
    topBarLight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    topBtnLight: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    topTitleLight: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 17,
        letterSpacing: -0.3,
    },
    topSubLight: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },

    /* Sheet en plein écran (remplace l'ancienne bottom sheet) */
    sheetFull: {
        flex: 1,
    },
    sheetScroll: {
        padding: 16,
        paddingBottom: 40,
    },

    /* List mode */
    listHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
    },
    listTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        letterSpacing: -0.3,
    },
    listSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
        textTransform: "capitalize",
    },
    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    countBadgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    filterBar: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    dayChip: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    dayChipText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    listContent: { padding: 16, paddingBottom: 100 },
    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    emptyLink: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        textDecorationLine: "underline",
    },
    collectItem: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 14,
        gap: 8,
    },
    collectTop: { flexDirection: "row", alignItems: "center", gap: 12 },
    collectClient: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    collectCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    collectRight: { alignItems: "flex-end", gap: 6 },
    collectTime: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
    },
    donePill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 7,
        paddingVertical: 3,
        borderRadius: 999,
    },
    donePillText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    collectMetaRow: { flexDirection: "row", gap: 12 },
    collectMeta: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    scanBar: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    scanCta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    scanCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },


    topBar: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 12,
        zIndex: 10,
    },
    topBtn: {
        width: 34,
        height: 34,
        borderRadius: 99,
        backgroundColor: "rgba(255,255,255,0.12)",
        alignItems: "center",
        justifyContent: "center",
    },
    topTitle: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        color: "#FFF",
    },
    topStatus: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        color: "rgba(255,255,255,0.6)",
        marginTop: 2,
    },

    frameArea: {
        position: "absolute",
        top: "15%",
        left: 0,
        right: 0,
        alignItems: "center",
    },
    frameWrap: {
        width: FRAME_SIZE,
        height: FRAME_SIZE,
        overflow: "hidden",
        justifyContent: "center",
    },
    scanLine: {
        position: "absolute",
        left: 20,
        right: 20,
        height: 2,
        top: "50%",
        marginTop: -1,
        opacity: 0.9,
    },
    detectedFlash: {
        ...StyleSheet.absoluteFillObject,
        borderWidth: 3,
        borderRadius: 8,
        margin: 6,
    },
    frameLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        color: "#FFF",
        marginTop: 18,
    },
    frameSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        color: "rgba(255,255,255,0.55)",
        marginTop: 4,
        textDecorationLine: "underline",
    },

    sheet: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 28,
    },
    handle: {
        width: 40,
        height: 4,
        borderRadius: 99,
        alignSelf: "center",
        marginBottom: 14,
    },

    sheetTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 14,
    },
    sheetCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    sheetName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
        marginTop: 3,
    },
    sheetCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    sheetAvatar: {
        width: 48,
        height: 48,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    tilesRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    itemsBox: {
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 12,
    },
    itemsToggle: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    itemsCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    itemsList: { gap: 4 },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 4,
    },
    itemRowEdit: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingVertical: 6,
    },
    itemSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },
    qtyStepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    qtyBtn: {
        width: 26,
        height: 26,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: StyleSheet.hairlineWidth,
    },
    qtyInput: {
        minWidth: 44,
        height: 26,
        paddingHorizontal: 6,
        textAlign: "center",
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
        borderRadius: 7,
        borderWidth: 1,
        padding: 0,
    },
    itemLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    itemQty: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    tile: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    tilePrimary: { borderWidth: 1.5 },
    tileCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    tileValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 26,
        letterSpacing: -0.5,
        marginTop: 4,
    },
    tileUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: 14,
    },

    miniRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
    miniTile: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.25,
    },
    miniTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    miniSub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },

    validateBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    validateText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },

    hintTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        letterSpacing: -0.3,
    },
    hintSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
        marginBottom: 14,
        lineHeight: Typography.fontSize.tiny * 1.5,
    },
    permissionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        marginBottom: 10,
    },
    manualBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    manualText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    manualWrap: {
        flexDirection: "row",
        gap: 8,
        alignItems: "center",
    },
    manualInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    manualSubmit: {
        paddingHorizontal: 16,
        paddingVertical: 11,
        borderRadius: 10,
    },
});
