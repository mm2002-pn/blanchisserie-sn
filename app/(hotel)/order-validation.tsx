import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrder } from "@/contexts/OrderContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import { useApplicableTariff } from "@/hooks/useTariff";
import { useThemeColors } from "@/hooks/useThemeColors";
import {
    LinenType,
    OrderFormData,
    OrderService,
    ServiceType,
} from "@/types/order.types";

const SERVICES_MAP: Record<
    ServiceType,
    { label: string; icon: IconName; tone: "brand" | "baobab" | "terra" }
> = {
    nettoyage: { label: "Nettoyage", icon: "droplet", tone: "terra" },
    blanchisserie: { label: "Blanchisserie", icon: "package", tone: "brand" },
    aqua_clean: { label: "Aqua Clean", icon: "spark", tone: "baobab" },
};

export default function OrderValidationScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const { createOrder, isLoading } = useOrder();

    const pickupLatStr = (params.pickupGeoLat as string | undefined) ?? "";
    const pickupLngStr = (params.pickupGeoLng as string | undefined) ?? "";
    const pickupGeoLat = pickupLatStr ? Number(pickupLatStr) : undefined;
    const pickupGeoLng = pickupLngStr ? Number(pickupLngStr) : undefined;

    const orderData: OrderFormData = {
        services: JSON.parse(params.services as string) as OrderService[],
        collectionDate: params.collectionDate as string,
        instructions: params.instructions as string,
        photos: params.photos ? JSON.parse(params.photos as string) : undefined,
        pickupGeoLat:
            Number.isFinite(pickupGeoLat) ? (pickupGeoLat as number) : undefined,
        pickupGeoLng:
            Number.isFinite(pickupGeoLng) ? (pickupGeoLng as number) : undefined,
    };

    const [loading, setLoading] = useState(false);

    /** Catalogue API : alimente nom + poids moyen par code de linen type.
     *  Aucun fallback codé — l'admin doit gérer le catalogue via le back-office. */
    const { data: apiLinens = [] } = useLinenTypes();
    const linenLabelByCode = useMemo(() => {
        const m: Record<string, string> = {};
        for (const lt of apiLinens) m[lt.code] = lt.name;
        return m;
    }, [apiLinens]);
    const linenWeightByCode = useMemo(() => {
        const m: Record<string, number> = {};
        for (const lt of apiLinens) m[lt.code] = (lt.averageWeight ?? 0) / 1000;
        return m;
    }, [apiLinens]);

    const weightForItem = (typeCode: string): number =>
        linenWeightByCode[typeCode] ?? 0;
    const labelForItem = (typeCode: string): string =>
        linenLabelByCode[typeCode] ?? typeCode;

    const estimatedWeight = orderData.services.reduce((sum, service) => {
        return (
            sum +
            service.items.reduce(
                (acc, item) => acc + weightForItem(item.type) * item.quantity,
                0,
            )
        );
    }, 0);

    const totalItems = orderData.services.reduce(
        (acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0),
        0,
    );

    /** Estimation prix : utilise le vrai tarif du client (idem new-order.tsx).
     *  Si un type n'a pas de ligne tarif, il est exclu — pas de fallback codé. */
    const { user } = useAuth();
    const { data: tariff } = useApplicableTariff(user?.clientId);
    const tariffByCode = useMemo(() => {
        const m: Record<
            string,
            {
                pricePerKg: number | null;
                pricePerPiece: number | null;
                billingMode: "weight" | "piece";
            }
        > = {};
        for (const it of tariff?.items ?? []) {
            m[it.linenTypeCode] = {
                pricePerKg: it.pricePerKg != null ? Number(it.pricePerKg) : null,
                pricePerPiece:
                    it.pricePerPiece != null ? Number(it.pricePerPiece) : null,
                billingMode: it.billingMode,
            };
        }
        return m;
    }, [tariff]);

    const estimatedPrice = useMemo(() => {
        let total = 0;
        for (const svc of orderData.services) {
            for (const it of svc.items) {
                const t = tariffByCode[it.type];
                if (!t) continue;
                if (t.billingMode === "piece" && t.pricePerPiece != null) {
                    total += it.quantity * t.pricePerPiece;
                } else if (t.billingMode === "weight" && t.pricePerKg != null) {
                    total += it.quantity * weightForItem(it.type) * t.pricePerKg;
                }
            }
        }
        return Math.round(total);
    }, [orderData.services, tariffByCode, linenWeightByCode]);

    const handleConfirm = async () => {
        try {
            setLoading(true);
            const newOrder = await createOrder(orderData);

            Alert.alert(
                "Commande créée",
                `Votre commande ${newOrder.orderNumber} a été créée avec succès`,
                [
                    {
                        text: "Voir mes commandes",
                        onPress: () => router.replace("/(hotel)/orders"),
                    },
                    {
                        text: "Retour à l'accueil",
                        onPress: () => router.replace("/(hotel)/dashboard"),
                    },
                ],
            );
        } catch (err) {
            Alert.alert("Erreur", "Impossible de créer la commande. Veuillez réessayer.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Convention wall-clock : la date/heure saisie est stockée en UTC pour
    // éviter la dérive timezone entre devices — on l'affiche donc en UTC.
    const formatDate = (iso: string) =>
        new Date(iso).toLocaleDateString("fr-FR", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
        });

    const formatTime = (iso: string) =>
        new Date(iso).toLocaleTimeString("fr-FR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "UTC",
        });

    const busy = loading || isLoading;

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
                <ThemedText variate="title">Validation</ThemedText>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero price card */}
                <Card
                    padding={18}
                    style={[
                        styles.hero,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                        Estimation
                    </Text>
                    <Text style={[styles.heroValue, { color: colors.paper }]}>
                        ≈ {Math.round(estimatedPrice).toLocaleString("fr-FR")}
                        <Text style={[styles.heroUnit, { color: colors.brand100 }]}>
                            {" F CFA"}
                        </Text>
                    </Text>
                    <Text style={[styles.heroNote, { color: colors.brand100 }]}>
                        Prix indicatif · facturation au poids réel après collecte
                    </Text>

                    <View
                        style={[styles.heroStats, { borderTopColor: colors.brand700 }]}
                    >
                        <HeroStat value={`${totalItems}`} label="Articles" />
                        <HeroStat
                            value={`${estimatedWeight.toFixed(1)} kg`}
                            label="Poids estimé"
                        />
                        <HeroStat
                            value={`${orderData.services.length}`}
                            label={orderData.services.length > 1 ? "Services" : "Service"}
                        />
                    </View>
                </Card>

                {/* Services + items */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Détail de la commande
                </ThemedText>

                <View style={{ gap: 12, marginBottom: 18 }}>
                    {orderData.services.map((service, idx) => {
                        const info = SERVICES_MAP[service.service];
                        const toneBg =
                            info.tone === "brand"
                                ? colors.brand100
                                : info.tone === "baobab"
                                  ? colors.baobab100
                                  : colors.terra100;
                        const toneFg =
                            info.tone === "brand"
                                ? colors.brand800
                                : info.tone === "baobab"
                                  ? colors.baobab700
                                  : colors.terra700;

                        return (
                            <Card key={idx} padding={14}>
                                <View style={styles.serviceHead}>
                                    <View
                                        style={[styles.serviceIcon, { backgroundColor: toneBg }]}
                                    >
                                        <Icon name={info.icon} size={15} color={toneFg} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[styles.serviceLabel, { color: colors.ink900 }]}
                                        >
                                            {info.label}
                                        </Text>
                                        <Text
                                            style={[styles.servicePrice, { color: colors.ink500 }]}
                                        >
                                            Facturation au poids réel
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={[styles.itemsList, { borderTopColor: colors.ink200 }]}
                                >
                                    {service.items.map((item, i) => (
                                        <View
                                            key={i}
                                            style={[
                                                styles.itemRow,
                                                i < service.items.length - 1 && {
                                                    borderBottomColor: colors.ink200,
                                                    borderBottomWidth: StyleSheet.hairlineWidth,
                                                },
                                            ]}
                                        >
                                            <Text
                                                style={[styles.itemName, { color: colors.ink900 }]}
                                            >
                                                {labelForItem(item.type)}
                                            </Text>
                                            <View style={styles.itemRight}>
                                                <Text
                                                    style={[
                                                        styles.itemQty,
                                                        { color: colors.brand800 },
                                                    ]}
                                                >
                                                    × {item.quantity}
                                                </Text>
                                                <Text
                                                    style={[
                                                        styles.itemWeight,
                                                        { color: colors.ink500 },
                                                    ]}
                                                >
                                                    ≈ {(weightForItem(item.type) * item.quantity).toFixed(1)} kg
                                                </Text>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            </Card>
                        );
                    })}
                </View>

                {/* Instructions */}
                {orderData.instructions?.trim() && (
                    <>
                        <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                            Instructions spéciales
                        </ThemedText>
                        <Card padding={14} style={{ marginBottom: 14 }}>
                            <Text
                                style={[styles.instructions, { color: colors.ink700 }]}
                            >
                                {orderData.instructions}
                            </Text>
                        </Card>
                    </>
                )}

                {/* Photos */}
                {orderData.photos && orderData.photos.length > 0 && (
                    <>
                        <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                            Photos jointes
                        </ThemedText>
                        <Card padding={14} style={{ marginBottom: 14 }}>
                            <View style={styles.photoRow}>
                                <Icon name="camera" size={15} color={colors.ink600} />
                                <Text style={[styles.photoText, { color: colors.ink700 }]}>
                                    {orderData.photos.length} photo
                                    {orderData.photos.length > 1 ? "s" : ""} ajoutée
                                    {orderData.photos.length > 1 ? "s" : ""}
                                </Text>
                            </View>
                        </Card>
                    </>
                )}

                {/* Notice */}
                <Card
                    padding={14}
                    style={[
                        styles.notice,
                        { backgroundColor: colors.warn100, borderColor: colors.warn600 },
                    ]}
                >
                    <Icon name="alert" size={14} color={colors.warn700} />
                    <Text style={[styles.noticeText, { color: colors.warn700 }]}>
                        Le prix final sera calculé après pesée lors de la collecte. Un devis détaillé vous sera envoyé.
                    </Text>
                </Card>
            </ScrollView>

            {/* Footer */}
            <View
                style={[
                    styles.footer,
                    { backgroundColor: colors.paper, borderTopColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={[
                        styles.backBtn,
                        { backgroundColor: colors.paper2, borderColor: colors.ink200 },
                    ]}
                >
                    <Icon name="chevLeft" size={14} color={colors.ink700} />
                    <Text style={[styles.backBtnText, { color: colors.ink700 }]}>
                        Retour
                    </Text>
                </Pressable>
                <Pressable
                    onPress={handleConfirm}
                    disabled={busy}
                    style={[
                        styles.confirmBtn,
                        { backgroundColor: busy ? colors.ink300 : colors.brand800 },
                    ]}
                >
                    <Icon name="check" size={15} color={colors.paper} />
                    <Text style={[styles.confirmBtnText, { color: colors.paper }]}>
                        {busy ? "Création…" : "Confirmer la commande"}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

function HeroStat({ value, label }: { value: string; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.heroStatValue, { color: colors.paper }]}>
                {value}
            </Text>
            <Text style={[styles.heroStatLabel, { color: colors.brand100 }]}>
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
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, marginTop: 4, paddingLeft: 4 },

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
        fontSize: 32,
        letterSpacing: -0.5,
        marginTop: 6,
    },
    heroUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.md,
    },
    heroNote: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 6,
    },
    heroStats: {
        flexDirection: "row",
        gap: 16,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    heroStatValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 18,
    },
    heroStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Service card
    serviceHead: { flexDirection: "row", alignItems: "center", gap: 12 },
    serviceIcon: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    serviceLabel: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.md,
    },
    servicePrice: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    itemsList: {
        marginTop: 12,
        paddingTop: 8,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 9,
    },
    itemName: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    itemRight: { flexDirection: "row", alignItems: "baseline", gap: 10 },
    itemQty: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    itemWeight: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },

    // Date
    dateRow: { flexDirection: "row", alignItems: "center", gap: 12 },
    dateIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    dateValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.md,
        textTransform: "capitalize",
    },
    dateTimeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 3,
    },
    dateTime: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },

    // Instructions
    instructions: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * 1.45,
    },

    // Photos
    photoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    photoText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },

    // Notice
    notice: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    noticeText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
        lineHeight: Typography.fontSize.tiny * 1.5,
        flex: 1,
    },

    // Footer
    footer: {
        flexDirection: "row",
        gap: 10,
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 20,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 13,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    backBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    confirmBtn: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 13,
        borderRadius: 12,
    },
    confirmBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
});
