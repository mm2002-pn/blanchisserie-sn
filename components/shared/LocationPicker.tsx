import { useState } from "react";
import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import * as Location from "expo-location";

import Icon from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

interface GeoPoint {
    lat: number;
    lng: number;
}

interface Props {
    /** Coordonnées courantes (null = pas encore renseigné). */
    value: GeoPoint | null;
    onChange: (value: GeoPoint | null) => void;
    /** Coords par défaut de l'hôtel (récupérées via /clients/:id).
     *  Si fournies, on affiche un bouton « Utiliser l'adresse de mon hôtel ». */
    hotelGeo?: GeoPoint | null;
}

/** Parse "lat,lng" ou un lien Google Maps en { lat, lng }. */
function parseGeoString(input: string): GeoPoint | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // "12.345, -67.890" ou "12.345,-67.890"
    const direct = /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/.exec(trimmed);
    if (direct) {
        const lat = Number(direct[1]);
        const lng = Number(direct[2]);
        if (isValidGeo(lat, lng)) return { lat, lng };
    }

    // Google Maps : ".../@lat,lng,Zz/..."
    const atMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(trimmed);
    if (atMatch) {
        const lat = Number(atMatch[1]);
        const lng = Number(atMatch[2]);
        if (isValidGeo(lat, lng)) return { lat, lng };
    }

    // Google Maps short link "?q=lat,lng" ou "&query=lat,lng"
    const qMatch = /[?&](?:q|query|destination)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(
        trimmed,
    );
    if (qMatch) {
        const lat = Number(qMatch[1]);
        const lng = Number(qMatch[2]);
        if (isValidGeo(lat, lng)) return { lat, lng };
    }

    // Google Maps "!3dLAT!4dLNG" (format coordonnées embarquées)
    const dMatch = /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/.exec(trimmed);
    if (dMatch) {
        const lat = Number(dMatch[1]);
        const lng = Number(dMatch[2]);
        if (isValidGeo(lat, lng)) return { lat, lng };
    }

    return null;
}

function isValidGeo(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180
    );
}

function formatGeo(p: GeoPoint): string {
    return `${p.lat.toFixed(5)}, ${p.lng.toFixed(5)}`;
}

export function LocationPicker({ value, onChange, hotelGeo }: Props) {
    const colors = useThemeColors();
    const [pasteInput, setPasteInput] = useState("");
    const [busy, setBusy] = useState(false);

    const handleUseMyLocation = async () => {
        try {
            setBusy(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                Alert.alert(
                    "Permission refusée",
                    "Active la localisation pour utiliser cette option.",
                );
                return;
            }
            const pos = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });
            onChange({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
            });
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Échec localisation";
            Alert.alert("Erreur", msg);
        } finally {
            setBusy(false);
        }
    };

    const handlePasteSubmit = () => {
        const parsed = parseGeoString(pasteInput);
        if (!parsed) {
            Alert.alert(
                "Format invalide",
                "Colle un lien Google Maps ou des coordonnées au format « lat, lng ».",
            );
            return;
        }
        onChange(parsed);
        setPasteInput("");
    };

    const handleUseHotel = () => {
        if (hotelGeo) onChange(hotelGeo);
    };

    const handleClear = () => onChange(null);

    return (
        <View>
            {/* Valeur courante */}
            {value ? (
                <View
                    style={[
                        styles.valueRow,
                        { backgroundColor: colors.brand50, borderColor: colors.brand800 },
                    ]}
                >
                    <Icon name="mapPin" size={14} color={colors.brand800} stroke={2} />
                    <Text
                        style={[styles.valueText, { color: colors.ink900 }]}
                        numberOfLines={1}
                    >
                        {formatGeo(value)}
                    </Text>
                    <Pressable onPress={handleClear} hitSlop={6}>
                        <Icon name="x" size={14} color={colors.ink600} stroke={2} />
                    </Pressable>
                </View>
            ) : (
                <Text style={[styles.hint, { color: colors.ink500 }]}>
                    Aucune position enregistrée — le chauffeur utilisera l'adresse de l'hôtel.
                </Text>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
                <Pressable
                    onPress={handleUseMyLocation}
                    disabled={busy}
                    style={[
                        styles.actionBtn,
                        {
                            backgroundColor: colors.paper,
                            borderColor: colors.ink200,
                            opacity: busy ? 0.6 : 1,
                        },
                    ]}
                >
                    <Icon name="crosshair" size={14} color={colors.brand800} stroke={2} />
                    <Text style={[styles.actionText, { color: colors.ink800 }]}>
                        {busy ? "Localisation…" : "Ma position"}
                    </Text>
                </Pressable>

                {hotelGeo && (
                    <Pressable
                        onPress={handleUseHotel}
                        style={[
                            styles.actionBtn,
                            {
                                backgroundColor: colors.paper,
                                borderColor: colors.ink200,
                            },
                        ]}
                    >
                        <Icon name="building" size={14} color={colors.brand800} stroke={2} />
                        <Text style={[styles.actionText, { color: colors.ink800 }]}>
                            Mon hôtel
                        </Text>
                    </Pressable>
                )}
            </View>

            {/* Coller un lien Maps / coords */}
            <View
                style={[
                    styles.pasteRow,
                    {
                        backgroundColor: colors.paper,
                        borderColor: colors.ink200,
                    },
                ]}
            >
                <Icon name="map" size={14} color={colors.ink500} stroke={2} />
                <TextInput
                    value={pasteInput}
                    onChangeText={setPasteInput}
                    placeholder="Coller lien Maps ou « 14.69, -17.44 »"
                    placeholderTextColor={colors.ink400}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onSubmitEditing={handlePasteSubmit}
                    returnKeyType="done"
                    style={[styles.pasteInput, { color: colors.ink800 }]}
                />
                {pasteInput.length > 0 && (
                    <Pressable onPress={handlePasteSubmit} hitSlop={6}>
                        <Text style={[styles.pasteSubmit, { color: colors.brand800 }]}>
                            OK
                        </Text>
                    </Pressable>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    valueRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        marginBottom: 8,
    },
    valueText: {
        flex: 1,
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    hint: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 8,
        paddingHorizontal: 2,
    },
    actionsRow: {
        flexDirection: "row",
        gap: 8,
        marginBottom: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },
    pasteRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    pasteInput: {
        flex: 1,
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },
    pasteSubmit: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },
});
