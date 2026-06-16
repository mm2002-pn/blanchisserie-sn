import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useOrders, useCreateTriage } from "@/hooks/useOrders";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import type { Order } from "@/types/order.types";

import { FocusKeypad, styles as peseeStyles } from "./pesee";

/**
 * Triage atelier — superviseur mobile.
 * Liste des commandes pesées (status=received) → tap pour ouvrir un form
 * plein écran avec tuiles épurées (uniquement articles avec count>0),
 * drawer pour ajouter un type, focus mode pour saisie quantité.
 */

type LinenType = {
    id: string;
    code: string;
    name: string;
    category: string;
    averageWeight: number;
    billingMode: string;
};

export default function SupervisorTriageScreen() {
    const colors = useThemeColors();
    const qc = useQueryClient();
    const [notifsOpen, setNotifsOpen] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    useOrdersRealtime();
    const { data: orders = [], isLoading } = useOrders();

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await qc.invalidateQueries({ queryKey: ["orders"] });
        } finally {
            setRefreshing(false);
        }
    }, [qc]);

    /** Commandes à trier : status received (pesée faite, pas encore triée). */
    const toTriage = useMemo(
        () => orders.filter((o) => o.apiStatus === "received"),
        [orders],
    );

    const selected = orders.find((o) => o.id === selectedId);

    if (selected) {
        return (
            <TriageForm
                order={selected}
                onClose={() => setSelectedId(null)}
            />
        );
    }

    const totalKg = toTriage.reduce(
        (s, o) => s + (o.actualWeight ?? o.estimatedWeight ?? 0),
        0,
    );
    const totalPieces = toTriage.reduce(
        (s, o) =>
            s +
            (o.services?.reduce(
                (ss, sv) =>
                    ss + (sv.items?.reduce((sss, it) => sss + it.quantity, 0) ?? 0),
                0,
            ) ?? 0),
        0,
    );

    return (
        <SafeAreaView
            edges={["top"]}
            style={[peseeStyles.container, { backgroundColor: colors.paper2 }]}
        >
            <View
                style={[
                    peseeStyles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Triage atelier</ThemedText>
                    <Text style={[peseeStyles.headerSub, { color: colors.ink500 }]}>
                        {toTriage.length} commande{toTriage.length > 1 ? "s" : ""} à trier
                    </Text>
                </View>
                <NotificationBell onPress={() => setNotifsOpen(true)} />
            </View>

            <View style={peseeStyles.kpiRow}>
                <KpiTile
                    icon="boxes"
                    label="Commandes"
                    value={String(toTriage.length)}
                />
                <KpiTile
                    icon="weight"
                    label="Poids pesé"
                    value={`${totalKg.toFixed(1).replace(".", ",")} kg`}
                />
                <KpiTile icon="check" label="Pièces" value={String(totalPieces)} />
            </View>

            <ScrollView
                contentContainerStyle={peseeStyles.list}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={colors.brand800}
                        colors={[colors.brand800]}
                    />
                }
            >
                {isLoading ? (
                    <Empty
                        icon="package"
                        title="Chargement…"
                        sub="Récupération des commandes"
                    />
                ) : toTriage.length === 0 ? (
                    <Empty
                        icon="check"
                        title="Aucune commande à trier"
                        sub="Toutes les commandes pesées ont été triées."
                    />
                ) : (
                    toTriage.map((o) => (
                        <OrderCard
                            key={o.id}
                            order={o}
                            onPress={() => setSelectedId(o.id)}
                        />
                    ))
                )}
            </ScrollView>

            <NotificationsModal
                visible={notifsOpen}
                onClose={() => setNotifsOpen(false)}
            />
        </SafeAreaView>
    );
}

/* ─── Card d'order dans la liste ──────────────────────────────── */

function OrderCard({
    order,
    onPress,
}: {
    order: Order;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    const totalPieces =
        order.services?.reduce(
            (s, sv) =>
                s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
            0,
        ) ?? 0;
    const kg = order.actualWeight ?? order.estimatedWeight ?? 0;
    const receivedAt = order.updatedAt
        ? format(new Date(order.updatedAt), "d MMM 'à' HH:mm", { locale: fr })
        : "—";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                peseeStyles.card,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={peseeStyles.cardHead}>
                <View style={{ flex: 1 }}>
                    <Text style={[peseeStyles.cardOrderNum, { color: colors.ink500 }]}>
                        {order.orderNumber}
                    </Text>
                    <View style={peseeStyles.cardClientRow}>
                        <Icon name="building" size={14} color={colors.brand800} />
                        <Text
                            style={[peseeStyles.cardClient, { color: colors.ink900 }]}
                            numberOfLines={1}
                        >
                            {order.hotelName || "—"}
                        </Text>
                    </View>
                </View>
                <View
                    style={[
                        peseeStyles.badge,
                        { backgroundColor: colors.baobab100 },
                    ]}
                >
                    <View
                        style={[
                            peseeStyles.badgeDot,
                            { backgroundColor: colors.baobab600 },
                        ]}
                    />
                    <Text
                        style={[
                            peseeStyles.badgeText,
                            { color: colors.baobab600 },
                        ]}
                    >
                        À trier
                    </Text>
                </View>
            </View>

            <View style={peseeStyles.cardStatsRow}>
                <StatTile
                    label="Poids pesé"
                    value={`${kg.toFixed(1).replace(".", ",")} kg`}
                />
                <StatTile label="Pièces" value={String(totalPieces)} />
            </View>

            <View style={peseeStyles.cardFooter}>
                <Text style={[peseeStyles.cardFooterText, { color: colors.ink500 }]}>
                    Pesée {receivedAt}
                </Text>
                <Text style={[peseeStyles.cardCta, { color: colors.brand800 }]}>
                    Trier →
                </Text>
            </View>
        </Pressable>
    );
}

function StatTile({ label, value }: { label: string; value: string }) {
    const colors = useThemeColors();
    return (
        <View style={[peseeStyles.statTile, { backgroundColor: colors.paper2 }]}>
            <Text style={[peseeStyles.statValue, { color: colors.ink900 }]}>
                {value}
            </Text>
            <Text style={[peseeStyles.statLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
        </View>
    );
}

/* ─── Form de triage ──────────────────────────────────────────── */

function TriageForm({
    order,
    onClose,
}: {
    order: Order;
    onClose: () => void;
}) {
    const colors = useThemeColors();
    const { data: linenTypes = [] } = useLinenTypes();
    const triage = useCreateTriage();

    const [counts, setCounts] = useState<Record<string, number>>({});
    const [focusedId, setFocusedId] = useState<string | null>(null);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [recapOpen, setRecapOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const prefilledRef = useRef(false);

    /** Pré-remplissage depuis items annoncés par le client (services). */
    useEffect(() => {
        if (prefilledRef.current) return;
        if (linenTypes.length === 0) return;
        const idByCode: Record<string, string> = {};
        for (const lt of linenTypes) idByCode[lt.code] = lt.id;
        const declared: { type: string; quantity: number }[] = [];
        for (const sv of order.services ?? []) {
            for (const it of sv.items ?? []) {
                declared.push({ type: it.type, quantity: it.quantity });
            }
        }
        if (declared.length === 0) return;
        const next: Record<string, number> = {};
        for (const it of declared) {
            const id = idByCode[it.type];
            if (id && it.quantity > 0) {
                next[id] = (next[id] ?? 0) + it.quantity;
            }
        }
        if (Object.keys(next).length > 0) {
            setCounts(next);
            prefilledRef.current = true;
        }
    }, [linenTypes, order.services]);

    const setCount = (id: string, value: number) => {
        setCounts((prev) => {
            const n = { ...prev };
            if (value <= 0) delete n[id];
            else n[id] = value;
            return n;
        });
    };

    const ltById = useMemo(() => {
        const m: Record<string, LinenType> = {};
        for (const lt of linenTypes) m[lt.id] = lt as LinenType;
        return m;
    }, [linenTypes]);

    const totals = useMemo(() => {
        let pieces = 0;
        let weightG = 0;
        for (const [id, n] of Object.entries(counts)) {
            const lt = ltById[id];
            if (!lt) continue;
            pieces += n;
            weightG += n * (lt.averageWeight ?? 0);
        }
        return { pieces, weightG, weightKg: weightG / 1000 };
    }, [counts, ltById]);

    const expectedKg = order.actualWeight ?? order.estimatedWeight ?? 0;
    const valid = totals.pieces > 0;

    const visibleIds = useMemo(
        () =>
            Object.keys(counts).filter(
                (id) => ltById[id] !== undefined && counts[id] > 0,
            ),
        [counts, ltById],
    );

    const remainingTypes = useMemo(
        () =>
            linenTypes.filter(
                (lt) => !counts[lt.id] || counts[lt.id] === 0,
            ) as LinenType[],
        [linenTypes, counts],
    );

    const handleSubmit = async () => {
        if (!valid) {
            setError("Saisis au moins une pièce.");
            return;
        }
        setError(null);
        const items = Object.entries(counts).map(([linenTypeId, n]) => ({
            linenTypeId,
            pieces: n,
            weight: n * (ltById[linenTypeId]?.averageWeight ?? 0),
        }));
        try {
            await triage.mutateAsync({
                orderId: order.id,
                data: { items, acceptDeviation: true },
            });
            onClose();
        } catch (err) {
            const e = err as { message?: string };
            setError(e.message ?? "Échec du triage.");
            setRecapOpen(false);
        }
    };

    const focusedLinen = focusedId ? ltById[focusedId] : null;

    return (
        <SafeAreaView
            edges={["top"]}
            style={[peseeStyles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Header */}
            <View
                style={[
                    peseeStyles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={onClose}
                    style={[peseeStyles.backBtn, { backgroundColor: colors.paper2 }]}
                >
                    <Icon name="chevLeft" size={18} color={colors.ink700} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[peseeStyles.headerSub, { color: colors.ink500 }]}>
                        Triage
                    </Text>
                    <Text
                        style={[peseeStyles.headerOrderNum, { color: colors.ink900 }]}
                    >
                        {order.orderNumber}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={peseeStyles.formContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <Card padding={16}>
                    <View style={peseeStyles.heroRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[peseeStyles.caps, { color: colors.ink500 }]}>
                                Client
                            </Text>
                            <View style={peseeStyles.heroClient}>
                                <Icon name="building" size={18} color={colors.brand800} />
                                <Text
                                    style={[
                                        peseeStyles.heroClientName,
                                        { color: colors.ink900 },
                                    ]}
                                    numberOfLines={1}
                                >
                                    {order.hotelName || "—"}
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[peseeStyles.caps, { color: colors.ink500 }]}>
                                Pesée atelier
                            </Text>
                            <Text
                                style={[peseeStyles.heroDriverKg, { color: colors.ink900 }]}
                            >
                                {expectedKg.toFixed(1).replace(".", ",")} kg
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* Totaux live */}
                <View style={triageStyles.bigStatRow}>
                    <BigStat
                        label="Pièces comptées"
                        value={String(totals.pieces)}
                        highlight
                    />
                    <BigStat
                        label="Poids calculé"
                        value={`${totals.weightKg.toFixed(1).replace(".", ",")} kg`}
                    />
                </View>

                {/* Articles à confirmer */}
                <View style={{ marginTop: 4 }}>
                    <View style={triageStyles.sectionHead}>
                        <Text style={[peseeStyles.caps, { color: colors.ink500 }]}>
                            Articles à confirmer
                        </Text>
                        <Text
                            style={[triageStyles.sectionCount, { color: colors.ink500 }]}
                        >
                            {visibleIds.length} type{visibleIds.length > 1 ? "s" : ""}
                        </Text>
                    </View>

                    {visibleIds.length === 0 ? (
                        <Card
                            padding={20}
                            style={[
                                triageStyles.emptyTypes,
                                { backgroundColor: colors.paper2, borderColor: colors.ink200 },
                            ]}
                        >
                            <Icon name="package" size={28} color={colors.ink400} />
                            <Text
                                style={[triageStyles.emptyTitle, { color: colors.ink800 }]}
                            >
                                Aucun article pré-rempli
                            </Text>
                            <Text
                                style={[triageStyles.emptySub, { color: colors.ink500 }]}
                            >
                                Appuie sur "Ajouter un type" pour démarrer.
                            </Text>
                        </Card>
                    ) : (
                        <View style={{ gap: 10 }}>
                            {visibleIds.map((id) => {
                                const lt = ltById[id];
                                if (!lt) return null;
                                return (
                                    <LinenChip
                                        key={id}
                                        linenType={lt}
                                        count={counts[id] ?? 0}
                                        onTap={() => setFocusedId(id)}
                                        onClear={() => setCount(id, 0)}
                                    />
                                );
                            })}
                        </View>
                    )}

                    <Pressable
                        onPress={() => setDrawerOpen(true)}
                        style={({ pressed }) => [
                            triageStyles.addBtn,
                            {
                                borderColor: colors.ink300,
                                backgroundColor: colors.paper,
                                opacity: pressed ? 0.85 : 1,
                            },
                        ]}
                    >
                        <Icon name="plus" size={18} color={colors.ink700} />
                        <Text
                            style={[triageStyles.addBtnText, { color: colors.ink700 }]}
                        >
                            Ajouter un type d'article
                        </Text>
                    </Pressable>
                </View>

                {error && (
                    <Card
                        padding={12}
                        style={{
                            backgroundColor: colors.danger100,
                            borderColor: colors.danger600,
                        }}
                    >
                        <Text style={{ color: colors.danger600, fontSize: 13 }}>
                            {error}
                        </Text>
                    </Card>
                )}
            </ScrollView>

            {/* Footer sticky */}
            <View
                style={[
                    peseeStyles.footer,
                    { backgroundColor: colors.paper, borderTopColor: colors.ink200 },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[peseeStyles.footerLabel, { color: colors.ink500 }]}>
                        Triage en cours
                    </Text>
                    <Text style={[peseeStyles.footerValue, { color: colors.ink900 }]}>
                        {totals.pieces} pcs ·{" "}
                        {totals.weightKg.toFixed(1).replace(".", ",")} kg
                    </Text>
                </View>
                <Pressable
                    onPress={() => {
                        if (!valid) {
                            setError("Saisis au moins une pièce.");
                            return;
                        }
                        setError(null);
                        setRecapOpen(true);
                    }}
                    disabled={!valid || triage.isPending}
                    style={[
                        peseeStyles.validateBtn,
                        {
                            backgroundColor:
                                valid && !triage.isPending
                                    ? colors.brand800
                                    : colors.ink300,
                        },
                    ]}
                >
                    <Icon name="check" size={16} color={colors.paper} />
                    <Text
                        style={[peseeStyles.validateBtnText, { color: colors.paper }]}
                    >
                        Valider
                    </Text>
                </Pressable>
            </View>

            {/* Focus keypad pour la quantité */}
            {focusedLinen && (
                <FocusKeypad
                    mode="integer"
                    title={focusedLinen.name}
                    subtitle={`${focusedLinen.code} · ${focusedLinen.averageWeight}g/pièce`}
                    unit="pcs"
                    initialValue={counts[focusedLinen.id] ?? 0}
                    onClose={() => setFocusedId(null)}
                    onValidate={(v) => {
                        setCount(focusedLinen.id, v);
                        setFocusedId(null);
                    }}
                />
            )}

            {/* Drawer ajout type */}
            {drawerOpen && (
                <AddTypeDrawer
                    types={remainingTypes}
                    onClose={() => setDrawerOpen(false)}
                    onPick={(id) => {
                        setDrawerOpen(false);
                        setFocusedId(id);
                    }}
                />
            )}

            {/* Recap */}
            {recapOpen && (
                <RecapModal
                    counts={counts}
                    ltById={ltById}
                    totals={totals}
                    expectedKg={expectedKg}
                    isPending={triage.isPending}
                    onCancel={() => setRecapOpen(false)}
                    onEdit={(id) => {
                        setRecapOpen(false);
                        setFocusedId(id);
                    }}
                    onConfirm={handleSubmit}
                />
            )}
        </SafeAreaView>
    );
}

/* ─── LinenChip ───────────────────────────────────────────────── */

function LinenChip({
    linenType,
    count,
    onTap,
    onClear,
}: {
    linenType: LinenType;
    count: number;
    onTap: () => void;
    onClear: () => void;
}) {
    const colors = useThemeColors();
    const subKg = (count * (linenType.averageWeight ?? 0)) / 1000;
    return (
        <Pressable
            onPress={onTap}
            style={({ pressed }) => [
                triageStyles.chip,
                {
                    backgroundColor: colors.brand100,
                    borderColor: colors.brand800,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={triageStyles.chipHead}>
                <View style={{ flex: 1 }}>
                    <Text
                        style={[triageStyles.chipName, { color: colors.ink900 }]}
                        numberOfLines={1}
                    >
                        {linenType.name}
                    </Text>
                    <Text style={[triageStyles.chipCode, { color: colors.ink500 }]}>
                        {linenType.code} · {linenType.averageWeight}g
                    </Text>
                </View>
                <Pressable
                    onPress={onClear}
                    hitSlop={8}
                    style={triageStyles.chipClear}
                >
                    <Icon name="x" size={14} color={colors.ink400} />
                </Pressable>
            </View>

            <View style={triageStyles.chipValueRow}>
                <Text style={[triageStyles.chipValue, { color: colors.brand800 }]}>
                    {count}
                </Text>
                <Text style={[triageStyles.chipSubKg, { color: colors.ink500 }]}>
                    {subKg > 0 ? `${subKg.toFixed(1).replace(".", ",")} kg` : "—"}
                </Text>
            </View>
        </Pressable>
    );
}

/* ─── BigStat ─────────────────────────────────────────────────── */

function BigStat({
    label,
    value,
    highlight,
}: {
    label: string;
    value: string;
    highlight?: boolean;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                triageStyles.bigStat,
                {
                    backgroundColor: highlight ? colors.brand100 : colors.paper2,
                    borderColor: highlight ? colors.brand800 : colors.ink200,
                },
            ]}
        >
            <Text style={[peseeStyles.caps, { color: colors.ink500 }]}>{label}</Text>
            <Text
                style={[
                    triageStyles.bigStatValue,
                    { color: highlight ? colors.brand800 : colors.ink900 },
                ]}
            >
                {value}
            </Text>
        </View>
    );
}

/* ─── Drawer ajout type ───────────────────────────────────────── */

function AddTypeDrawer({
    types,
    onClose,
    onPick,
}: {
    types: LinenType[];
    onClose: () => void;
    onPick: (id: string) => void;
}) {
    const colors = useThemeColors();
    const [query, setQuery] = useState("");

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return types;
        return types.filter(
            (lt) =>
                lt.name.toLowerCase().includes(q) ||
                lt.code.toLowerCase().includes(q),
        );
    }, [types, query]);

    return (
        <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View
                style={[peseeStyles.modalBackdrop, { backgroundColor: "#00000099" }]}
            >
                <View
                    style={[
                        peseeStyles.modalSheet,
                        {
                            backgroundColor: colors.paper,
                            borderColor: colors.brand800,
                            maxHeight: "85%",
                        },
                    ]}
                >
                    <View
                        style={[
                            peseeStyles.modalHead,
                            { borderBottomColor: colors.ink200 },
                        ]}
                    >
                        <Text
                            style={[peseeStyles.modalTitle, { color: colors.ink900 }]}
                        >
                            Ajouter un type d'article
                        </Text>
                        <Pressable
                            onPress={onClose}
                            style={[
                                peseeStyles.modalClose,
                                { backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Icon name="x" size={18} color={colors.ink700} />
                        </Pressable>
                    </View>

                    <View
                        style={[
                            triageStyles.searchWrap,
                            { borderBottomColor: colors.ink200 },
                        ]}
                    >
                        <View
                            style={[
                                triageStyles.searchBox,
                                {
                                    backgroundColor: colors.paper2,
                                    borderColor: colors.ink200,
                                },
                            ]}
                        >
                            <Icon name="search" size={16} color={colors.ink400} />
                            <TextInput
                                autoFocus
                                value={query}
                                onChangeText={setQuery}
                                placeholder="Rechercher un article…"
                                placeholderTextColor={colors.ink400}
                                style={[
                                    triageStyles.searchInput,
                                    { color: colors.ink900 },
                                ]}
                            />
                        </View>
                    </View>

                    <ScrollView style={{ maxHeight: 400 }}>
                        {filtered.length === 0 ? (
                            <Text
                                style={[
                                    triageStyles.drawerEmpty,
                                    { color: colors.ink500 },
                                ]}
                            >
                                Aucun article correspondant.
                            </Text>
                        ) : (
                            filtered.map((lt) => (
                                <Pressable
                                    key={lt.id}
                                    onPress={() => onPick(lt.id)}
                                    style={({ pressed }) => [
                                        triageStyles.drawerRow,
                                        {
                                            borderBottomColor: colors.ink100,
                                            backgroundColor: pressed
                                                ? colors.paper2
                                                : "transparent",
                                        },
                                    ]}
                                >
                                    <View style={{ flex: 1 }}>
                                        <Text
                                            style={[
                                                triageStyles.drawerName,
                                                { color: colors.ink900 },
                                            ]}
                                        >
                                            {lt.name}
                                        </Text>
                                        <Text
                                            style={[
                                                triageStyles.drawerCode,
                                                { color: colors.ink500 },
                                            ]}
                                        >
                                            {lt.code} · {lt.averageWeight}g
                                        </Text>
                                    </View>
                                    <Icon name="plus" size={18} color={colors.brand800} />
                                </Pressable>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
}

/* ─── Recap modal ─────────────────────────────────────────────── */

function RecapModal({
    counts,
    ltById,
    totals,
    expectedKg,
    isPending,
    onCancel,
    onEdit,
    onConfirm,
}: {
    counts: Record<string, number>;
    ltById: Record<string, LinenType>;
    totals: { pieces: number; weightKg: number };
    expectedKg: number;
    isPending: boolean;
    onCancel: () => void;
    onEdit: (id: string) => void;
    onConfirm: () => void;
}) {
    const colors = useThemeColors();
    const rows = Object.entries(counts)
        .map(([id, n]) => ({ id, n, lt: ltById[id] }))
        .filter((r) => r.lt && r.n > 0)
        .sort((a, b) => b.n - a.n);

    return (
        <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={onCancel}
        >
            <View
                style={[peseeStyles.modalBackdrop, { backgroundColor: "#00000099" }]}
            >
                <View
                    style={[
                        peseeStyles.modalSheet,
                        {
                            backgroundColor: colors.paper,
                            borderColor: colors.brand800,
                            maxHeight: "90%",
                        },
                    ]}
                >
                    <View
                        style={[
                            peseeStyles.modalHead,
                            { borderBottomColor: colors.ink200 },
                        ]}
                    >
                        <Text
                            style={[peseeStyles.modalTitle, { color: colors.ink900 }]}
                        >
                            Récapitulatif
                        </Text>
                        <Pressable
                            onPress={onCancel}
                            disabled={isPending}
                            style={[
                                peseeStyles.modalClose,
                                { backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Icon name="x" size={18} color={colors.ink700} />
                        </Pressable>
                    </View>

                    <View
                        style={[
                            triageStyles.recapStats,
                            { backgroundColor: colors.paper2 },
                        ]}
                    >
                        <BigStat
                            label="Pièces totales"
                            value={String(totals.pieces)}
                            highlight
                        />
                        <BigStat
                            label="Poids calculé"
                            value={`${totals.weightKg.toFixed(1).replace(".", ",")} kg`}
                        />
                    </View>

                    {expectedKg > 0 && (
                        <Text
                            style={[
                                triageStyles.recapGauge,
                                { color: colors.ink500 },
                            ]}
                        >
                            {totals.weightKg.toFixed(1).replace(".", ",")} kg / cible{" "}
                            {expectedKg.toFixed(1).replace(".", ",")} kg
                        </Text>
                    )}

                    <Text
                        style={[
                            triageStyles.recapDetailLabel,
                            { color: colors.ink500 },
                        ]}
                    >
                        Détail · {rows.length} type{rows.length > 1 ? "s" : ""}
                    </Text>

                    <ScrollView style={{ maxHeight: 280 }}>
                        {rows.map(({ id, n, lt }) => (
                            <Pressable
                                key={id}
                                onPress={() => onEdit(id)}
                                disabled={isPending}
                                style={({ pressed }) => [
                                    triageStyles.recapRow,
                                    {
                                        borderBottomColor: colors.ink100,
                                        backgroundColor: pressed
                                            ? colors.paper2
                                            : "transparent",
                                    },
                                ]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[
                                            triageStyles.recapName,
                                            { color: colors.ink900 },
                                        ]}
                                    >
                                        {lt!.name}
                                    </Text>
                                    <Text
                                        style={[
                                            triageStyles.recapCode,
                                            { color: colors.ink500 },
                                        ]}
                                    >
                                        {lt!.code} ·{" "}
                                        {((n * lt!.averageWeight) / 1000)
                                            .toFixed(2)
                                            .replace(".", ",")}{" "}
                                        kg
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        triageStyles.recapQty,
                                        { color: colors.brand800 },
                                    ]}
                                >
                                    {n}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>

                    <View
                        style={[
                            peseeStyles.modalActions,
                            { borderTopColor: colors.ink200 },
                        ]}
                    >
                        <Pressable
                            onPress={onCancel}
                            disabled={isPending}
                            style={[
                                peseeStyles.actionBtn,
                                {
                                    backgroundColor: colors.paper2,
                                    borderColor: colors.ink300,
                                    flex: 1,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    peseeStyles.actionBtnText,
                                    { color: colors.ink700 },
                                ]}
                            >
                                Modifier
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={onConfirm}
                            disabled={isPending}
                            style={[
                                peseeStyles.actionBtn,
                                {
                                    backgroundColor: isPending
                                        ? colors.ink300
                                        : colors.brand800,
                                    flex: 2,
                                },
                            ]}
                        >
                            <Icon name="check" size={16} color={colors.paper} />
                            <Text
                                style={[
                                    peseeStyles.actionBtnText,
                                    { color: colors.paper },
                                ]}
                            >
                                {isPending ? "Envoi…" : "Confirmer"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* ─── KPI + Empty (réutilisés du pesée) ───────────────────────── */

function KpiTile({
    icon,
    label,
    value,
}: {
    icon: "boxes" | "weight" | "check";
    label: string;
    value: string;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                peseeStyles.kpi,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View style={[peseeStyles.kpiIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name={icon} size={14} color={colors.brand800} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[peseeStyles.kpiLabel, { color: colors.ink500 }]}>
                    {label}
                </Text>
                <Text style={[peseeStyles.kpiValue, { color: colors.ink900 }]}>
                    {value}
                </Text>
            </View>
        </View>
    );
}

function Empty({
    icon,
    title,
    sub,
}: {
    icon: "package" | "check";
    title: string;
    sub: string;
}) {
    const colors = useThemeColors();
    return (
        <View style={peseeStyles.empty}>
            <Icon name={icon} size={36} color={colors.ink400} />
            <Text style={[peseeStyles.emptyTitle, { color: colors.ink800 }]}>
                {title}
            </Text>
            <Text style={[peseeStyles.emptySub, { color: colors.ink500 }]}>
                {sub}
            </Text>
        </View>
    );
}

/* ─── Styles spécifiques triage ───────────────────────────────── */

const triageStyles = StyleSheet.create({
    bigStatRow: {
        flexDirection: "row",
        gap: 10,
    },
    bigStat: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    bigStatValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 28,
        marginTop: 4,
        letterSpacing: -0.5,
    },

    sectionHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginBottom: 8,
    },
    sectionCount: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },

    chip: {
        padding: 14,
        borderRadius: 14,
        borderWidth: 2,
        gap: 8,
    },
    chipHead: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    chipName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    chipCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    chipClear: {
        padding: 4,
        marginTop: -4,
        marginRight: -4,
    },
    chipValueRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },
    chipValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 40,
        letterSpacing: -1,
        lineHeight: 44,
    },
    chipSubKg: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 4,
    },

    emptyTypes: {
        alignItems: "center",
        gap: 6,
        borderStyle: "dashed",
        borderWidth: 2,
    },
    emptyTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        marginTop: 8,
    },
    emptySub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        textAlign: "center",
    },

    addBtn: {
        marginTop: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderStyle: "dashed",
    },
    addBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    searchWrap: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    searchBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    searchInput: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },

    drawerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    drawerName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    drawerCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    drawerEmpty: {
        textAlign: "center",
        padding: 24,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },

    recapStats: {
        flexDirection: "row",
        gap: 10,
        padding: 14,
    },
    recapGauge: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        textAlign: "right",
        paddingHorizontal: 14,
        paddingBottom: 8,
    },
    recapDetailLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
        paddingHorizontal: 14,
        paddingTop: 6,
        paddingBottom: 4,
    },
    recapRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    recapName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    recapCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    recapQty: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 24,
    },
});
