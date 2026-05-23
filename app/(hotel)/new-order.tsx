import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Image,
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
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";

import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { DateTimeSheet } from "@/components/shared/DateTimeSheet";
import { LocationPicker } from "@/components/shared/LocationPicker";
import { QuantityKeypadModal } from "@/components/shared/QuantityKeypadModal";
import { useAuth } from "@/contexts/AuthContext";
import { useClient } from "@/hooks/useClient";
import { useLinenCategories } from "@/hooks/useLinenCategories";
import { useApplicableTariff } from "@/hooks/useTariff";
import { resolveAsset } from "@/lib/assets";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrder } from "@/contexts/OrderContext";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import { useOrder as useOrderQuery } from "@/hooks/useOrders";
import { useServices } from "@/hooks/useServices";
import { useThemeColors } from "@/hooks/useThemeColors";
import type { ApiLinenType, LinenCategoryCode } from "@/services/linenTypes.service";
import type {
    LinenItem,
    OrderService,
    ServiceType,
} from "@/types/order.types";

/** UI dérivée d'un ApiLinenType : ajoute image + label catégorie FR. */
type LinenMeta = {
    id: string; // code du linen type (ex: LP-001)
    label: string;
    /** Label FR de la catégorie (résolu depuis /linen-categories). */
    category: string;
    apiCategory: LinenCategoryCode; // LP / LF / NAE pour envoyer à l'API
    weight: number; // kg/pièce
    image: string;
};

/** Pseudo-catégorie spéciale "tout afficher". */
const CATEGORY_ALL = "Tous";

function frNum(n: number, frac = 1) {
    const s = n.toFixed(frac);
    return frac === 0 ? s : s.replace(".", ",").replace(/,0$/, "");
}

/** Date par défaut = demain (AAAA-MM-JJ). */
function defaultTomorrowDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
}

/** "YYYY-MM-DD" → Date locale à minuit (fallback : aujourd'hui). */
function isoDateToJsDate(iso: string): Date {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return new Date();
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/** Date → "YYYY-MM-DD" (locale, pas UTC). */
function jsDateToIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}

/** "HH:MM" → Date d'aujourd'hui à l'heure indiquée. */
function hhmmToJsDate(hhmm: string): Date {
    const d = new Date();
    const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
    if (m) {
        d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    }
    return d;
}

/** Date → "HH:MM" (24h, locale). */
function jsDateToHhmm(d: Date): string {
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

/** Split d'un ISO datetime → { date, time } extrait en composants UTC.
 *  Convention : l'heure saisie est un wall-clock (16:00 = 16:00 partout) stockée
 *  comme UTC pour éviter toute dérive timezone entre devices. */
function splitIsoDateTime(iso: string | undefined): { date?: string; time?: string } {
    if (!iso) return {};
    const dateOnly = /^(\d{4}-\d{2}-\d{2})$/.exec(iso);
    if (dateOnly) return { date: dateOnly[1] };
    const d = new Date(iso);
    if (isNaN(d.getTime())) return {};
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const hh = String(d.getUTCHours()).padStart(2, "0");
    const mm = String(d.getUTCMinutes()).padStart(2, "0");
    return { date: `${y}-${mo}-${day}`, time: `${hh}:${mm}` };
}

/** Construit un ISO UTC à partir d'une date "YYYY-MM-DD" et d'une heure "HH:MM".
 *  L'heure est interprétée comme wall-clock fixe (pas de conversion locale → UTC). */
function buildIsoFromDateTime(dateIso: string, hhmm: string): string {
    const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateIso);
    const tm = /^(\d{1,2}):(\d{2})$/.exec(hhmm || "08:00");
    if (!dm) return new Date().toISOString();
    const y = Number(dm[1]);
    const mo = Number(dm[2]) - 1;
    const d = Number(dm[3]);
    const h = tm ? Number(tm[1]) : 8;
    const mi = tm ? Number(tm[2]) : 0;
    return new Date(Date.UTC(y, mo, d, h, mi, 0, 0)).toISOString();
}

const FR_DAY = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const FR_MONTH = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
];

/** "2026-05-16" → "Sam. 16 mai 2026" */
function formatHumanDate(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return iso;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return `${FR_DAY[d.getDay()]} ${d.getDate()} ${FR_MONTH[d.getMonth()]} ${d.getFullYear()}`;
}

/** Convertit un linen type API → meta UI (image + label catégorie FR).
 *  Le label catégorie est résolu via la map fournie (vient de /linen-categories).
 *  L'image vient de `linenType.imageUrl` (uploadé en back-office) — sinon undefined,
 *  l'UI affichera un placeholder neutre. */
function toLinenMeta(
    lt: ApiLinenType,
    categoryLabels: Record<string, string>,
): LinenMeta {
    return {
        id: lt.code,
        label: lt.name,
        category: categoryLabels[lt.category] ?? lt.category,
        apiCategory: lt.category,
        weight: (lt.averageWeight ?? 0) / 1000,
        image: resolveAsset(lt.imageUrl) ?? "",
    };
}

export default function NewOrderScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const params = useLocalSearchParams();
    const editingOrderId = (params.orderId as string | undefined) ?? null;
    const isEditing = Boolean(editingOrderId);
    const { saveDraft, draftOrder, updateOrder: ctxUpdateOrder } = useOrder();
    const { data: existingOrder } = useOrderQuery(editingOrderId ?? undefined);
    const { user } = useAuth();
    const { data: clientData } = useClient(user?.clientId);
    const { data: tariff } = useApplicableTariff(user?.clientId);
    const hotelGeo =
        clientData?.geoLat != null && clientData?.geoLng != null
            ? { lat: clientData.geoLat, lng: clientData.geoLng }
            : null;

    /** Map tarif : code linenType → { pricePerKg, pricePerPiece, billingMode }. */
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
                pricePerKg:
                    it.pricePerKg != null ? Number(it.pricePerKg) : null,
                pricePerPiece:
                    it.pricePerPiece != null ? Number(it.pricePerPiece) : null,
                billingMode: it.billingMode,
            };
        }
        return m;
    }, [tariff]);

    // Catalogue catégories de linge (LP/LF/NAE + label FR + emoji).
    const { data: linenCategories = [] } = useLinenCategories();
    const categoryLabels = useMemo(() => {
        const m: Record<string, string> = {};
        for (const c of linenCategories) m[c.code] = c.label;
        return m;
    }, [linenCategories]);

    // Liste des onglets : "Tous" + catégories actives triées par sortOrder.
    const CATEGORIES = useMemo(() => {
        return [CATEGORY_ALL, ...linenCategories.map((c) => c.label)];
    }, [linenCategories]);

    // Catalogue linen types depuis l'API (avec image + libellé FR).
    const { data: apiLinens = [], isLoading: linensLoading } = useLinenTypes();
    const LINENS: LinenMeta[] = useMemo(
        () => apiLinens.map((lt) => toLinenMeta(lt, categoryLabels)),
        [apiLinens, categoryLabels],
    );

    // Catalogue services (blanchisserie, nettoyage, aqua_clean, …) depuis l'API.
    const { data: apiServices = [], isLoading: servicesLoading } = useServices();
    const SERVICES = useMemo<{ id: ServiceType; label: string }[]>(
        () =>
            apiServices.map((s) => ({
                id: s.code as ServiceType,
                label: s.label,
            })),
        [apiServices],
    );

    const [selectedServices, setSelectedServices] = useState<OrderService[]>(
        draftOrder?.services ?? [{ service: "blanchisserie", items: [] }],
    );
    const draftSplit = splitIsoDateTime(draftOrder?.collectionDate);
    const [collectionDate, setCollectionDate] = useState(
        draftSplit.date ?? defaultTomorrowDate(),
    );
    const [collectionTime, setCollectionTime] = useState<string>(
        draftSplit.time ?? "08:00",
    );
    const [deliveryTime, setDeliveryTime] = useState<string>("08:00");
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const [collectTimePickerOpen, setCollectTimePickerOpen] = useState(false);
    const [deliveryTimePickerOpen, setDeliveryTimePickerOpen] = useState(false);
    const [instructions, setInstructions] = useState(draftOrder?.instructions ?? "");
    const [pickupGeo, setPickupGeo] = useState<{ lat: number; lng: number } | null>(
        draftOrder?.pickupGeoLat != null && draftOrder?.pickupGeoLng != null
            ? { lat: draftOrder.pickupGeoLat, lng: draftOrder.pickupGeoLng }
            : null,
    );
    const [category, setCategory] = useState<string>(CATEGORY_ALL);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<1 | 2>(1);

    /** Mode édition : pré-remplit le formulaire depuis la commande chargée. */
    useEffect(() => {
        if (!isEditing || !existingOrder) return;
        // services + items depuis l'order existante
        const items: LinenItem[] = (existingOrder.services ?? []).flatMap((s) =>
            (s.items ?? []).map((it) => ({
                type: it.type,
                quantity: it.quantity,
            })),
        );
        setSelectedServices([
            { service: existingOrder.services?.[0]?.service ?? "blanchisserie", items },
        ]);
        const split = splitIsoDateTime(existingOrder.collectionDate);
        if (split.date) setCollectionDate(split.date);
        if (split.time) setCollectionTime(split.time);
        setInstructions(existingOrder.instructions ?? "");
        if (existingOrder.pickupGeoLat != null && existingOrder.pickupGeoLng != null) {
            setPickupGeo({
                lat: existingOrder.pickupGeoLat,
                lng: existingOrder.pickupGeoLng,
            });
        }
    }, [isEditing, existingOrder]);

    /** Reset du formulaire quand l'écran reprend le focus APRÈS qu'une commande
     *  a été créée (draftOrder devient null = signal que createOrder a réussi).
     *  Sans ça, les tabs gardent l'état précédent et l'utilisateur voit ses anciens
     *  items pré-remplis. Ignoré en mode édition. */
    useFocusEffect(
        useCallback(() => {
            if (isEditing) return;
            if (draftOrder) return; // brouillon en cours → on ne touche pas
            // Pas de brouillon = soit nouvelle session, soit commande tout juste créée → reset
            setSelectedServices([{ service: "blanchisserie", items: [] }]);
            setCollectionDate(defaultTomorrowDate());
            setCollectionTime("08:00");
            setInstructions("");
            setPickupGeo(null);
            setCategory(CATEGORY_ALL);
            setStep(1);
        }, [isEditing, draftOrder]),
    );

    /** Livraison auto = collecte + 24h. La date est calculée à la volée. */
    const deliveryDate = useMemo(() => {
        if (!collectionDate) return "";
        try {
            // Wall-clock fix : reconstruit en UTC pour éviter la dérive timezone
            const iso = buildIsoFromDateTime(collectionDate, collectionTime);
            const d = new Date(iso);
            if (isNaN(d.getTime())) return "";
            d.setUTCDate(d.getUTCDate() + 1);
            return d.toISOString().slice(0, 10);
        } catch {
            return "";
        }
    }, [collectionDate, collectionTime]);

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

    const getQty = (id: string): number => {
        for (const s of selectedServices) {
            const item = s.items.find((i) => i.type === id);
            if (item) return item.quantity;
        }
        return 0;
    };

    const setQty = (id: string, qty: number) => {
        const meta = LINENS.find((l) => l.id === id);
        setSelectedServices((prev) => {
            // Affecte au premier service sélectionné
            const first = prev[0];
            if (!first) return prev;
            const items = [...first.items];
            const idx = items.findIndex((i) => i.type === id);
            if (qty <= 0) {
                if (idx >= 0) items.splice(idx, 1);
            } else if (idx >= 0) {
                items[idx] = { type: id, quantity: qty, category: meta?.apiCategory };
            } else {
                items.push({ type: id, quantity: qty, category: meta?.apiCategory });
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
    void linensLoading;

    /** Estimation prix : utilise le vrai tarif du client.
     *  - billingMode "piece" → qty × pricePerPiece
     *  - billingMode "weight" → qty × averageWeight × pricePerKg
     *  Si un type n'a pas de ligne tarif, il est exclu de l'estimation (pas de fallback codé). */
    const estimate = useMemo(() => {
        let total = 0;
        for (const it of allItems) {
            const meta = LINENS.find((l) => l.id === it.type);
            const t = tariffByCode[it.type];
            if (!meta || !t) continue;
            if (t.billingMode === "piece" && t.pricePerPiece != null) {
                total += it.quantity * t.pricePerPiece;
            } else if (t.billingMode === "weight" && t.pricePerKg != null) {
                total += it.quantity * meta.weight * t.pricePerKg;
            }
        }
        return Math.round(total);
    }, [allItems, LINENS, tariffByCode]);

    const visibleLinens = useMemo(
        () =>
            category === CATEGORY_ALL
                ? LINENS
                : LINENS.filter((l) => l.category === category),
        [category, LINENS],
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
            const collectIso = buildIsoFromDateTime(
                collectionDate,
                collectionTime,
            );
            const data = {
                services: selectedServices,
                collectionDate: collectIso,
                instructions: instructions || undefined,
                photos: undefined,
                pickupGeoLat: pickupGeo?.lat,
                pickupGeoLng: pickupGeo?.lng,
            };

            // Mode édition : PATCH direct, retour au détail
            if (isEditing && editingOrderId) {
                const updated = await ctxUpdateOrder(editingOrderId, data);
                Alert.alert(
                    "Commande mise à jour",
                    `Votre commande ${updated.orderNumber} a bien été modifiée.`,
                    [
                        {
                            text: "OK",
                            onPress: () =>
                                router.replace({
                                    pathname: "/(hotel)/order-details",
                                    params: { id: editingOrderId },
                                }),
                        },
                    ],
                );
                return;
            }

            // Mode création : passage par l'écran de validation
            await saveDraft(data);
            router.push({
                pathname: "/(hotel)/order-validation",
                params: {
                    services: JSON.stringify(selectedServices),
                    collectionDate: collectIso,
                    instructions: instructions || "",
                    photos: JSON.stringify([]),
                    pickupGeoLat:
                        pickupGeo?.lat != null ? String(pickupGeo.lat) : "",
                    pickupGeoLng:
                        pickupGeo?.lng != null ? String(pickupGeo.lng) : "",
                },
            });
        } catch (e) {
            const msg = e instanceof Error ? e.message : "Échec de la sauvegarde.";
            Alert.alert("Erreur", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Top bar avec indicateur d'étape */}
            <View
                style={[
                    styles.topBar,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={() => (step === 2 ? setStep(1) : router.back())}
                    style={[styles.iconChip, { backgroundColor: colors.ink100 }]}
                    hitSlop={6}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} stroke={2} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">
                        {isEditing
                            ? step === 1
                                ? "Modifier articles"
                                : "Modifier la date"
                            : step === 1
                              ? "Quels articles ?"
                              : "Quand ?"}
                    </ThemedText>
                    <ThemedText variate="caption" color="ink500" style={{ marginTop: 2 }}>
                        Étape {step}/2 ·{" "}
                        {step === 1
                            ? totalPieces === 0
                                ? "Ajoutez vos articles"
                                : `${totalPieces} pièces · ${frNum(totalKg)} kg`
                            : "Date et heure de collecte"}
                    </ThemedText>
                </View>
            </View>

            {/* Progress bar 2 segments */}
            <View
                style={[
                    styles.progressBar,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <View
                    style={[
                        styles.progressSeg,
                        { backgroundColor: colors.brand800 },
                    ]}
                />
                <View
                    style={[
                        styles.progressSeg,
                        {
                            backgroundColor:
                                step === 2 ? colors.brand800 : colors.ink200,
                        },
                    ]}
                />
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
                    {step === 2 && (
                    <>
                    {/* Services */}
                    <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                        Type de service
                    </ThemedText>
                    {servicesLoading && SERVICES.length === 0 ? (
                        <Text style={[styles.loadingHint, { color: colors.ink500 }]}>
                            Chargement des services…
                        </Text>
                    ) : SERVICES.length === 0 ? (
                        <Text style={[styles.loadingHint, { color: colors.danger600 }]}>
                            Aucun service disponible. Contactez l'administrateur.
                        </Text>
                    ) : null}
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

                    {/* Schedule : pickup time (above articles for quick access) */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 18 }]}
                    >
                        Collecte
                    </ThemedText>
                    <View style={styles.scheduleRow}>
                        <Pressable
                            onPress={() => setDatePickerOpen(true)}
                            style={[
                                styles.dateField,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.ink200,
                                },
                            ]}
                        >
                            <Icon name="calendar" size={14} color={colors.ink600} />
                            <Text
                                style={[
                                    styles.dateInput,
                                    {
                                        color: collectionDate ? colors.ink800 : colors.ink400,
                                    },
                                ]}
                            >
                                {collectionDate
                                    ? formatHumanDate(collectionDate)
                                    : "Choisir une date…"}
                            </Text>
                            <Icon name="chevRight" size={14} color={colors.ink500} />
                        </Pressable>
                        <Pressable
                            onPress={() => setCollectTimePickerOpen(true)}
                            style={[
                                styles.timeField,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.ink200,
                                },
                            ]}
                        >
                            <Text style={[styles.timeInput, { color: colors.ink800 }]}>
                                {collectionTime || "HH:MM"}
                            </Text>
                        </Pressable>
                    </View>
                    {/* Localisation collecte — aide le chauffeur sur la carte */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 18 }]}
                    >
                        Localisation collecte · optionnel
                    </ThemedText>
                    <LocationPicker
                        value={pickupGeo}
                        onChange={setPickupGeo}
                        hotelGeo={hotelGeo}
                    />

                    {/* Instructions — placées dans l'étape "Quand" pour libérer la liste articles */}
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
                    </>
                    )}

                    {step === 1 && (
                    <>
                    {/* Category filter */}
                    <ThemedText
                        variate="caps"
                        color="ink500"
                        style={[styles.sectionLabel, { marginTop: 22 }]}
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

                    {/* Articles — liste compacte 1 colonne */}
                    <View style={styles.linenList}>
                        {visibleLinens.map((linen) => (
                            <LinenCard
                                key={linen.id}
                                linen={linen}
                                qty={getQty(linen.id)}
                                onChange={(q) => setQty(linen.id, q)}
                            />
                        ))}
                    </View>
                    </>
                    )}

                    {/* Spacer for sticky footer */}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Sticky footer — CTA dynamique selon l'étape */}
                <View
                    style={[
                        styles.footer,
                        {
                            backgroundColor: colors.paper,
                            borderTopColor: colors.ink200,
                        },
                    ]}
                >
                    {/* Récap toujours visible côté articles ou date */}
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
                    {step === 1 ? (
                        <Pressable
                            onPress={() => {
                                if (totalPieces === 0) {
                                    Alert.alert("Articles requis", "Ajoutez au moins un article.");
                                    return;
                                }
                                setStep(2);
                            }}
                            disabled={totalPieces === 0}
                            style={[
                                styles.cta,
                                {
                                    backgroundColor: colors.brand800,
                                    opacity: totalPieces === 0 ? 0.5 : 1,
                                },
                            ]}
                        >
                            <Text style={[styles.ctaText, { color: colors.paper }]}>
                                Suivant · Date et heure
                            </Text>
                            <Icon name="arrowRight" size={16} color={colors.paper} stroke={2} />
                        </Pressable>
                    ) : (
                        <Pressable
                            onPress={handleSubmit}
                            disabled={loading || !collectionDate}
                            style={[
                                styles.cta,
                                {
                                    backgroundColor: colors.brand800,
                                    opacity: loading || !collectionDate ? 0.5 : 1,
                                },
                            ]}
                        >
                            <Text style={[styles.ctaText, { color: colors.paper }]}>
                                {loading
                                    ? "Enregistrement…"
                                    : isEditing
                                      ? "Enregistrer les modifications"
                                      : "Continuer · Validation"}
                            </Text>
                            <Icon name="arrowRight" size={16} color={colors.paper} stroke={2} />
                        </Pressable>
                    )}
                </View>
            </KeyboardAvoidingView>

            <DateTimeSheet
                visible={datePickerOpen}
                mode="date"
                value={isoDateToJsDate(collectionDate)}
                minimumDate={new Date()}
                title="Date de collecte"
                onClose={() => setDatePickerOpen(false)}
                onChange={(d) => setCollectionDate(jsDateToIsoDate(d))}
            />
            <DateTimeSheet
                visible={collectTimePickerOpen}
                mode="time"
                value={hhmmToJsDate(collectionTime)}
                title="Heure de collecte"
                onClose={() => setCollectTimePickerOpen(false)}
                onChange={(d) => setCollectionTime(jsDateToHhmm(d))}
            />
            <DateTimeSheet
                visible={deliveryTimePickerOpen}
                mode="time"
                value={hhmmToJsDate(deliveryTime)}
                title="Heure de livraison"
                onClose={() => setDeliveryTimePickerOpen(false)}
                onChange={(d) => setDeliveryTime(jsDateToHhmm(d))}
            />
        </SafeAreaView>
    );
}

function LinenCard({
    linen,
    qty,
    onChange,
}: {
    linen: LinenMeta;
    qty: number;
    onChange: (q: number) => void;
}) {
    const colors = useThemeColors();
    const active = qty > 0;
    const [keypadOpen, setKeypadOpen] = useState(false);

    return (
        <>
            <View
                style={[
                    styles.row,
                    {
                        backgroundColor: active ? colors.brand50 : colors.paper,
                        borderColor: active ? colors.brand800 : colors.ink200,
                        borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                    },
                ]}
            >
                {linen.image ? (
                    <Image
                        source={{ uri: linen.image }}
                        style={styles.rowThumb}
                        resizeMode="cover"
                    />
                ) : (
                    <View
                        style={[
                            styles.rowThumb,
                            styles.rowThumbPlaceholder,
                            { backgroundColor: colors.ink100 },
                        ]}
                    >
                        <Icon name="package" size={20} color={colors.ink400} stroke={1.5} />
                    </View>
                )}
                <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                        style={[styles.rowLabel, { color: colors.ink900 }]}
                        numberOfLines={1}
                    >
                        {linen.label}
                    </Text>
                    <Text style={[styles.rowSub, { color: colors.ink500 }]}>
                        {frNum(linen.weight)} kg/pièce
                    </Text>
                </View>
                <View style={styles.rowStepper}>
                    <Pressable
                        onPress={() => onChange(Math.max(0, qty - 1))}
                        disabled={qty === 0}
                        hitSlop={6}
                        style={[
                            styles.gridStepBtn,
                            {
                                backgroundColor: colors.paper,
                                borderColor: colors.ink200,
                                opacity: qty === 0 ? 0.4 : 1,
                            },
                        ]}
                    >
                        <Icon name="minus" size={14} color={colors.ink800} stroke={2.2} />
                    </Pressable>

                    {/* Champ qty : grand, bordure visible → tap = modale clavier */}
                    <Pressable
                        onPress={() => setKeypadOpen(true)}
                        style={[
                            styles.qtyField,
                            {
                                backgroundColor: active ? colors.paper : colors.paper2,
                                borderColor: active ? colors.brand800 : colors.ink300,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                styles.qtyValue,
                                { color: qty === 0 ? colors.ink400 : colors.ink900 },
                            ]}
                        >
                            {qty === 0 ? "0" : qty}
                        </Text>
                    </Pressable>

                    <Pressable
                        onPress={() => onChange(qty + 1)}
                        hitSlop={6}
                        style={[styles.gridStepBtn, { backgroundColor: colors.brand800 }]}
                    >
                        <Icon name="plus" size={14} color={colors.paper} stroke={2.2} />
                    </Pressable>
                </View>
            </View>

            <QuantityKeypadModal
                visible={keypadOpen}
                value={qty}
                title={linen.label}
                subtitle={`${frNum(linen.weight)} kg/pièce`}
                onClose={() => setKeypadOpen(false)}
                onConfirm={(n) => onChange(n)}
            />
        </>
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

    progressBar: {
        flexDirection: "row",
        gap: 4,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    progressSeg: {
        flex: 1,
        height: 4,
        borderRadius: 2,
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
    loadingHint: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        marginBottom: 8,
        paddingHorizontal: 2,
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
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 10,
        borderRadius: 14,
    },
    rowThumb: {
        width: 56,
        height: 56,
        borderRadius: 10,
    },
    rowThumbPlaceholder: {
        alignItems: "center",
        justifyContent: "center",
    },
    rowLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    rowSub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    rowStepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    gridStepBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    gridQty: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        minWidth: 38,
        textAlign: "center",
        padding: 0,
    },
    qtyField: {
        minWidth: 56,
        height: 36,
        paddingHorizontal: 10,
        borderRadius: 10,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 18,
        lineHeight: 22,
    },
    mono: { fontFamily: FontFamily.monoRegular },

    scheduleRow: {
        flexDirection: "row",
        gap: 8,
    },
    dateField: {
        flex: 1.4,
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    timeField: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 12,
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
    timeInput: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        padding: 0,
        textAlign: "center",
        minWidth: 60,
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
