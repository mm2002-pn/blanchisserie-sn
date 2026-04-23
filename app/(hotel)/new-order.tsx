import { useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrder } from "@/contexts/OrderContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import type {
    LinenItem,
    LinenType,
    OrderService,
    ServiceType,
} from "@/types/order.types";

type LinenMeta = {
    id: LinenType;
    label: string;
    category: "Linge plat" | "Éponge" | "Restaurant" | "Autre";
    weight: number; // kg/pièce
};

const SERVICES: { id: ServiceType; label: string }[] = [
    { id: "blanchisserie", label: "Blanchisserie" },
    { id: "nettoyage", label: "Nettoyage" },
    { id: "aqua_clean", label: "Aqua Clean" },
];

const LINENS: LinenMeta[] = [
    { id: "drap", label: "Draps", category: "Linge plat", weight: 0.9 },
    { id: "taie", label: "Taies d'oreiller", category: "Linge plat", weight: 0.2 },
    { id: "housse", label: "Housses de couette", category: "Linge plat", weight: 1.0 },
    { id: "serviette", label: "Serviettes bain", category: "Éponge", weight: 0.6 },
    { id: "peignoir", label: "Peignoirs", category: "Éponge", weight: 0.5 },
    { id: "nappe", label: "Nappes", category: "Restaurant", weight: 0.8 },
    { id: "torchon", label: "Torchons", category: "Restaurant", weight: 0.2 },
    { id: "rideau", label: "Rideaux", category: "Autre", weight: 1.2 },
    { id: "couverture", label: "Couvertures", category: "Autre", weight: 1.8 },
    { id: "tapis", label: "Tapis", category: "Autre", weight: 3.5 },
];

const CATEGORIES = ["Tous", "Linge plat", "Éponge", "Restaurant", "Autre"] as const;
type Category = (typeof CATEGORIES)[number];

const UNIT_PRICE = 900; // F CFA / kg approximatif pour l'estimation

function frNum(n: number, frac = 1) {
    const s = n.toFixed(frac);
    return frac === 0 ? s : s.replace(".", ",").replace(/,0$/, "");
}

export default function NewOrderScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { saveDraft, draftOrder } = useOrder();

    const [selectedServices, setSelectedServices] = useState<OrderService[]>(
        draftOrder?.services ?? [{ service: "blanchisserie", items: [] }],
    );
    const [collectionDate, setCollectionDate] = useState(
        draftOrder?.collectionDate ?? "",
    );
    const [instructions, setInstructions] = useState(draftOrder?.instructions ?? "");
    const [category, setCategory] = useState<Category>("Tous");
    const [loading, setLoading] = useState(false);

    const primaryService: ServiceType =
        selectedServices[0]?.service ?? "blanchisserie";

    const isServiceSelected = (id: ServiceType) =>
        selectedServices.some((s) => s.service === id);

    const toggleService = (id: ServiceType) => {
        setSelectedServices((prev) => {
            if (prev.some((s) => s.service === id)) {
                if (prev.length === 1) return prev; // keep at least one
                return prev.filter((s) => s.service !== id);
            }
            return [...prev, { service: id, items: [] }];
        });
    };

    const getQty = (id: LinenType): number => {
        for (const s of selectedServices) {
            const item = s.items.find((i) => i.type === id);
            if (item) return item.quantity;
        }
        return 0;
    };

    const setQty = (id: LinenType, qty: number) => {
        setSelectedServices((prev) => {
            // Affecte au premier service sélectionné
            const first = prev[0];
            if (!first) return prev;
            const items = [...first.items];
            const idx = items.findIndex((i) => i.type === id);
            if (qty <= 0) {
                if (idx >= 0) items.splice(idx, 1);
            } else if (idx >= 0) {
                items[idx] = { type: id, quantity: qty };
            } else {
                items.push({ type: id, quantity: qty });
            }
            return [{ ...first, items }, ...prev.slice(1)];
        });
    };

    const allItems: LinenItem[] = useMemo(
        () => selectedServices.flatMap((s) => s.items),
        [selectedServices],
    );
    const totalPieces = allItems.reduce((sum, i) => sum + i.quantity, 0);
    const totalKg = allItems.reduce(
        (sum, i) => sum + i.quantity * (LINENS.find((l) => l.id === i.type)?.weight ?? 0.4),
        0,
    );
    const estimate = Math.round(totalKg * UNIT_PRICE);

    const visibleLinens = useMemo(
        () =>
            category === "Tous"
                ? LINENS
                : LINENS.filter((l) => l.category === category),
        [category],
    );

    const handleSubmit = async () => {
        if (totalPieces === 0) {
            Alert.alert("Erreur", "Ajoutez au moins un article.");
            return;
        }
        if (!collectionDate) {
            Alert.alert("Erreur", "Sélectionnez une date de collecte.");
            return;
        }
        try {
            setLoading(true);
            const iso = new Date(collectionDate).toISOString();
            const data = {
                services: selectedServices,
                collectionDate: iso,
                instructions: instructions || undefined,
                photos: undefined,
            };
            await saveDraft(data);
            router.push({
                pathname: "/(hotel)/order-validation",
                params: {
                    services: JSON.stringify(selectedServices),
                    collectionDate: iso,
                    instructions: instructions || "",
                    photos: JSON.stringify([]),
                },
            });
        } catch {
            Alert.alert("Erreur", "Impossible de sauvegarder le brouillon.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Top bar */}
            <View
                style={[
                    styles.topBar,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={() => router.back()}
                    style={[styles.iconChip, { backgroundColor: colors.ink100 }]}
                    hitSlop={6}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} stroke={2} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Nouvelle commande</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={{ marginTop: 2 }}>
                        {totalPieces === 0
                            ? "Ajoutez des articles"
                            : `${totalPieces} pièces · ${frNum(totalKg)} kg`}
                    </ThemedText>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <ThemedText variate="titleLg" style={styles.question}>
                        Quels articles{"\n"}à traiter ?
                    </ThemedText>
                    <ThemedText
                        variate="caption"
                        color="ink500"
                        style={{ marginBottom: 16 }}
                    >
                        Le poids estimé est calculé automatiquement.
                    </ThemedText>

                    {/* Services */}
                    <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                        Type de service
                    </ThemedText>
                    <View style={styles.chipRow}>
                        {SERVICES.map((s) => {
                            const active = isServiceSelected(s.id);
                            return (
                                <Pressable
                                    key={s.id}
                                    onPress={() => toggleService(s.id)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: active ? colors.brand800 : colors.paper,
                                            borderColor: active
                                                ? colors.brand800
                                                : colors.ink200,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.chipText,
                                            { color: active ? colors.paper : colors.ink700 },
                                        ]}
                                    >
                                        {s.label}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Category filter */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 18 }]}
                    >
                        Articles
                    </ThemedText>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.catRow}
                    >
                        {CATEGORIES.map((c) => {
                            const active = category === c;
                            return (
                                <Pressable
                                    key={c}
                                    onPress={() => setCategory(c)}
                                    style={[
                                        styles.catChip,
                                        {
                                            backgroundColor: active ? colors.ink900 : colors.paper,
                                            borderColor: active ? colors.ink900 : colors.ink200,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.catText,
                                            { color: active ? colors.paper : colors.ink700 },
                                        ]}
                                    >
                                        {c}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Item cards */}
                    <View style={styles.linenList}>
                        {visibleLinens.map((linen) => (
                            <LinenRow
                                key={linen.id}
                                linen={linen}
                                qty={getQty(linen.id)}
                                onChange={(q) => setQty(linen.id, q)}
                            />
                        ))}
                    </View>

                    {/* Collection date */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 22 }]}
                    >
                        Date de collecte
                    </ThemedText>
                    <View
                        style={[
                            styles.dateInputWrap,
                            { backgroundColor: colors.paper, borderColor: colors.ink200 },
                        ]}
                    >
                        <Icon name="calendar" size={16} color={colors.ink600} />
                        <TextInput
                            value={collectionDate}
                            onChangeText={setCollectionDate}
                            placeholder="AAAA-MM-JJ"
                            placeholderTextColor={colors.ink400}
                            style={[styles.dateInput, { color: colors.ink800 }]}
                        />
                    </View>

                    {/* Instructions */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 18 }]}
                    >
                        Instructions · optionnel
                    </ThemedText>
                    <View
                        style={[
                            styles.textareaWrap,
                            { backgroundColor: colors.paper, borderColor: colors.ink200 },
                        ]}
                    >
                        <TextInput
                            value={instructions}
                            onChangeText={setInstructions}
                            placeholder="Ex. linge délicat, contact réception avant collecte…"
                            placeholderTextColor={colors.ink400}
                            multiline
                            style={[styles.textarea, { color: colors.ink800 }]}
                        />
                    </View>

                    {/* Spacer for sticky footer */}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Sticky estimation footer */}
                <View
                    style={[
                        styles.footer,
                        {
                            backgroundColor: colors.paper,
                            borderTopColor: colors.ink200,
                        },
                    ]}
                >
                    <View style={styles.footerTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.footerCaps, { color: colors.ink500 }]}>
                                Estimation
                            </Text>
                            <Text style={[styles.footerAmount, { color: colors.ink900 }]}>
                                <Text style={styles.footerAmountNum}>{totalPieces}</Text> articles ·{" "}
                                <Text style={styles.footerAmountNum}>{frNum(totalKg)}</Text> kg
                            </Text>
                        </View>
                        <Text style={[styles.footerPrice, { color: colors.ink700 }]}>
                            ≈ {estimate.toLocaleString("fr-FR")} F
                        </Text>
                    </View>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={loading || totalPieces === 0}
                        style={[
                            styles.cta,
                            {
                                backgroundColor: colors.brand800,
                                opacity: loading || totalPieces === 0 ? 0.5 : 1,
                            },
                        ]}
                    >
                        <Text style={[styles.ctaText, { color: colors.paper }]}>
                            {loading ? "Enregistrement…" : "Continuer · Validation"}
                        </Text>
                        <Icon name="arrowRight" size={16} color={colors.paper} stroke={2} />
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function LinenRow({
    linen,
    qty,
    onChange,
}: {
    linen: LinenMeta;
    qty: number;
    onChange: (q: number) => void;
}) {
    const colors = useThemeColors();
    return (
        <Card padding={12} style={styles.linenCard}>
            <View style={[styles.linenThumb, { borderColor: colors.ink200 }]}>
                <View
                    style={[styles.linenThumbStripe, { backgroundColor: colors.ink100 }]}
                />
                <View
                    style={[styles.linenThumbStripe, { backgroundColor: colors.paper2, marginLeft: 8 }]}
                />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.linenLabel, { color: colors.ink900 }]}>
                    {linen.label}
                </Text>
                <Text style={[styles.linenSub, { color: colors.ink500 }]}>
                    {linen.category} · <Text style={styles.mono}>{frNum(linen.weight)}</Text>{" "}
                    kg/pièce
                </Text>
            </View>
            <View style={styles.counter}>
                <Pressable
                    onPress={() => onChange(Math.max(0, qty - 1))}
                    disabled={qty === 0}
                    style={[
                        styles.counterBtn,
                        {
                            backgroundColor: colors.ink100,
                            opacity: qty === 0 ? 0.5 : 1,
                        },
                    ]}
                    hitSlop={4}
                >
                    <Icon name="minus" size={12} color={colors.ink800} stroke={2.2} />
                </Pressable>
                <Text style={[styles.counterValue, { color: colors.ink900 }]}>{qty}</Text>
                <Pressable
                    onPress={() => onChange(qty + 1)}
                    style={[styles.counterBtn, { backgroundColor: colors.brand800 }]}
                    hitSlop={4}
                >
                    <Icon name="plus" size={12} color={colors.paper} stroke={2.2} />
                </Pressable>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },

    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconChip: {
        width: 34,
        height: 34,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },

    content: {
        padding: 16,
        paddingBottom: 20,
    },

    question: {
        marginBottom: 4,
    },

    sectionLabel: {
        marginBottom: 8,
        paddingLeft: 2,
    },

    chipRow: {
        flexDirection: "row",
        gap: 8,
    },
    chip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    chipText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },

    catRow: {
        gap: 6,
        paddingBottom: 2,
    },
    catChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    catText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    linenList: {
        gap: 8,
        marginTop: 12,
    },
    linenCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    linenThumb: {
        width: 48,
        height: 48,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        overflow: "hidden",
        flexDirection: "row",
    },
    linenThumbStripe: {
        flex: 1,
    },
    linenLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    linenSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    mono: { fontFamily: FontFamily.monoRegular },

    counter: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    counterBtn: {
        width: 26,
        height: 26,
        borderRadius: 7,
        alignItems: "center",
        justifyContent: "center",
    },
    counterValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        minWidth: 22,
        textAlign: "center",
    },

    dateInputWrap: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    dateInput: {
        flex: 1,
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },

    textareaWrap: {
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 12,
        minHeight: 80,
    },
    textarea: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        textAlignVertical: "top",
        padding: 0,
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 10,
    },
    footerCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    footerAmount: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        lineHeight: 24,
        marginTop: 2,
    },
    footerAmountNum: {
        fontFamily: FontFamily.monoMedium,
    },
    footerPrice: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    cta: {
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    ctaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
});
