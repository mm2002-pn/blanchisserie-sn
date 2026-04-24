import { useEffect, useRef, useState } from "react";
import {
    Alert,
    Animated,
    Easing,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import Svg, { G, Path, Rect } from "react-native-svg";

import Icon from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

const FRAME_SIZE = 240;

const MOCK_CLIENT = {
    code: "TRB-2504-041",
    name: "Terrou-Bi",
    estimatedWeight: 24.5,
    pieces: 96,
    stopIndex: 3,
    stopTotal: 6,
};

export default function CollectScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [permission, requestPermission] = useCameraPermissions();

    const [scanned, setScanned] = useState(false);
    const [photosCount, setPhotosCount] = useState(0);
    const [signed, setSigned] = useState(false);

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

    const handleBarcode = ({ data }: { data: string }) => {
        if (scanned || !data) return;
        setScanned(true);
    };

    const handleSimulate = () => setScanned(true);

    const handleAddPhoto = () => setPhotosCount((n) => n + 1);

    const handleSign = () => {
        setSigned(true);
    };

    const handleValidate = () => {
        if (photosCount === 0 || !signed) {
            Alert.alert(
                "Incomplet",
                "Ajoute au moins une photo et la signature avant de valider.",
            );
            return;
        }
        Alert.alert(
            "Collecte validée",
            `${MOCK_CLIENT.name} · ${MOCK_CLIENT.pieces} pièces · ${MOCK_CLIENT.estimatedWeight.toFixed(1).replace(".", ",")} kg`,
            [
                {
                    text: "OK",
                    onPress: () => {
                        router.replace("/(driver)/route");
                    },
                },
            ],
        );
    };

    const handleClose = () => router.back();

    return (
        <View style={styles.root}>
            {/* Camera feed */}
            {permission?.granted ? (
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarcode}
                    barcodeScannerSettings={{
                        barcodeTypes: ["qr", "code128", "ean13", "ean8", "upc_a"],
                    }}
                />
            ) : (
                <View
                    style={[StyleSheet.absoluteFill, { backgroundColor: "#0A0A0A" }]}
                />
            )}

            {/* Vignette */}
            <View
                style={[StyleSheet.absoluteFill, { backgroundColor: "#0A0A0A90" }]}
                pointerEvents="none"
            />

            {/* Top bar */}
            <SafeAreaView edges={["top"]} style={styles.topBar}>
                <Pressable onPress={handleClose} style={styles.topBtn} hitSlop={8}>
                    <Icon name="x" size={16} color="#FFF" />
                </Pressable>
                <Text style={styles.topTitle}>
                    Collecte · Arrêt {MOCK_CLIENT.stopIndex}/{MOCK_CLIENT.stopTotal}
                </Text>
                <Pressable style={styles.topBtn} hitSlop={8}>
                    <Icon name="spark" size={16} color="#FFF" />
                </Pressable>
            </SafeAreaView>

            {/* Scanner frame */}
            <View style={styles.frameArea}>
                <View style={styles.frameWrap}>
                    <Svg width={FRAME_SIZE} height={FRAME_SIZE} viewBox="0 0 240 240">
                        <G
                            stroke={colors.terra600}
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                        >
                            <Path d="M8 40 L8 8 L40 8" />
                            <Path d="M200 8 L232 8 L232 40" />
                            <Path d="M232 200 L232 232 L200 232" />
                            <Path d="M40 232 L8 232 L8 200" />
                        </G>
                        <G transform="translate(60 60)" opacity={scanned ? 0 : 0.22}>
                            <Rect
                                width={120}
                                height={120}
                                fill="none"
                                stroke="#FFF"
                                strokeWidth={0.5}
                            />
                            {Array.from({ length: 9 }).flatMap((_, r) =>
                                Array.from({ length: 9 }).map((_, c) => {
                                    const fill = (r * c + r) % 3 === 0;
                                    return fill ? (
                                        <Rect
                                            key={`${r}-${c}`}
                                            x={c * 13}
                                            y={r * 13}
                                            width={11}
                                            height={11}
                                            fill="#FFF"
                                        />
                                    ) : null;
                                }),
                            )}
                        </G>
                    </Svg>

                    {!scanned && (
                        <Animated.View
                            style={[
                                styles.scanLine,
                                {
                                    backgroundColor: colors.terra600,
                                    transform: [{ translateY: lineTranslateY }],
                                },
                            ]}
                        />
                    )}

                    {scanned && (
                        <View
                            style={[
                                styles.detectedFlash,
                                { borderColor: colors.baobab600 },
                            ]}
                        />
                    )}
                </View>

                <Text style={styles.frameLabel}>
                    {scanned ? "QR code détecté" : "Scanne le QR de l'hôtel"}
                </Text>
                {!scanned && (
                    <Pressable onPress={handleSimulate} hitSlop={8}>
                        <Text style={styles.frameSub}>
                            ou saisis le code manuellement
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Bottom sheet */}
            <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                <View style={[styles.handle, { backgroundColor: colors.ink200 }]} />

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
                                    {MOCK_CLIENT.name}
                                </Text>
                                <Text
                                    style={[styles.sheetCode, { color: colors.ink500 }]}
                                >
                                    {MOCK_CLIENT.code}
                                </Text>
                            </View>
                            <View
                                style={[
                                    styles.sheetAvatar,
                                    { backgroundColor: colors.brand100 },
                                ]}
                            >
                                <Icon name="building" size={20} color={colors.brand800} />
                            </View>
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
                                    {MOCK_CLIENT.estimatedWeight.toFixed(1).replace(".", ",")}
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
                                    {MOCK_CLIENT.pieces}
                                </Text>
                            </View>
                        </View>

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
                                Simuler un scan
                            </Text>
                        </Pressable>
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: "#0A0A0A" },

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
});
