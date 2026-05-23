import { useCallback, useMemo, useState } from "react";
import {
    Modal,
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
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
import { useOrders, useReceiveOrder } from "@/hooks/useOrders";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import type { Order } from "@/types/order.types";

/**
 * Pesée atelier — superviseur mobile.
 * Liste des commandes collectées (status=collected, pas encore reçues) → tap
 * pour ouvrir un form plein écran avec 2 grosses tuiles (kg / pcs), chacune
 * ouvre un pavé numérique. Pré-rempli depuis driverWeight / driverPieces.
 */

export default function SupervisorPeseeScreen() {
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

    /** Commandes à peser : status collected, pas encore reçues. */
    const toWeigh = useMemo(
        () =>
            orders.filter(
                (o) => o.apiStatus === "collected" && o.actualWeight == null,
            ),
        [orders],
    );

    const selected = orders.find((o) => o.id === selectedId);

    if (selected) {
        return (
            <WeighForm
                order={selected}
                onClose={() => setSelectedId(null)}
            />
        );
    }

    const totalKg = toWeigh.reduce((s, o) => s + (o.estimatedWeight ?? 0), 0);

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Header */}
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Pesée atelier</ThemedText>
                    <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                        {toWeigh.length} commande{toWeigh.length > 1 ? "s" : ""} à peser
                    </Text>
                </View>
                <NotificationBell onPress={() => setNotifsOpen(true)} />
            </View>

            {/* KPI strip */}
            <View style={styles.kpiRow}>
                <KpiTile
                    icon="boxes"
                    label="Commandes"
                    value={String(toWeigh.length)}
                />
                <KpiTile
                    icon="weight"
                    label="Poids estimé"
                    value={`${totalKg.toFixed(1).replace(".", ",")} kg`}
                />
            </View>

            <ScrollView
                contentContainerStyle={styles.list}
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
                ) : toWeigh.length === 0 ? (
                    <Empty
                        icon="check"
                        title="Aucune commande à peser"
                        sub="Tout est à jour pour le moment."
                    />
                ) : (
                    toWeigh.map((o) => (
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
    const kg = order.estimatedWeight ?? 0;
    const collectedAt = order.updatedAt
        ? format(new Date(order.updatedAt), "d MMM 'à' HH:mm", { locale: fr })
        : "—";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={styles.cardHead}>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.cardOrderNum, { color: colors.ink500 }]}>
                        {order.orderNumber}
                    </Text>
                    <View style={styles.cardClientRow}>
                        <Icon name="building" size={14} color={colors.brand800} />
                        <Text
                            style={[styles.cardClient, { color: colors.ink900 }]}
                            numberOfLines={1}
                        >
                            {order.hotelName || "—"}
                        </Text>
                    </View>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.brand100 }]}>
                    <View style={[styles.badgeDot, { backgroundColor: colors.brand800 }]} />
                    <Text style={[styles.badgeText, { color: colors.brand800 }]}>
                        À peser
                    </Text>
                </View>
            </View>

            <View style={styles.cardStatsRow}>
                <StatTile
                    label="Poids driver"
                    value={`${kg.toFixed(1).replace(".", ",")} kg`}
                />
                <StatTile label="Pièces" value={String(totalPieces)} />
            </View>

            <View style={styles.cardFooter}>
                <Text style={[styles.cardFooterText, { color: colors.ink500 }]}>
                    Collectée {collectedAt}
                </Text>
                <Text style={[styles.cardCta, { color: colors.brand800 }]}>
                    Peser →
                </Text>
            </View>
        </Pressable>
    );
}

function StatTile({ label, value }: { label: string; value: string }) {
    const colors = useThemeColors();
    return (
        <View style={[styles.statTile, { backgroundColor: colors.paper2 }]}>
            <Text style={[styles.statValue, { color: colors.ink900 }]}>{value}</Text>
            <Text style={[styles.statLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
        </View>
    );
}

/* ─── Form plein écran : 2 grosses tuiles + keypad modal ─────── */

function WeighForm({
    order,
    onClose,
}: {
    order: Order;
    onClose: () => void;
}) {
    const colors = useThemeColors();
    const receive = useReceiveOrder();
    const { data: linenTypes = [] } = useLinenTypes();

    const driverKg = order.estimatedWeight ?? 0;
    const driverPieces =
        order.services?.reduce(
            (s, sv) =>
                s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
            0,
        ) ?? 0;

    const [weightKg, setWeightKg] = useState<number>(driverKg);
    const [pieces, setPieces] = useState<number>(driverPieces);
    const [focused, setFocused] = useState<"weight" | "pieces" | null>(null);
    const [error, setError] = useState<string | null>(null);

    const valid = weightKg > 0 && pieces > 0;

    const handleSubmit = async () => {
        if (!valid) {
            setError("Saisis un poids et un nombre de pièces valides.");
            return;
        }
        setError(null);
        try {
            await receive.mutateAsync({
                id: order.id,
                data: {
                    receivedWeight: Math.round(weightKg * 1000),
                    receivedPieces: pieces,
                    acceptDeviation: true,
                },
            });
            onClose();
        } catch (err) {
            const e = err as { message?: string };
            setError(e.message ?? "Échec de la pesée.");
        }
    };

    const labelByCode = useMemo(() => {
        const m: Record<string, string> = {};
        for (const lt of linenTypes) m[lt.code] = lt.name;
        return m;
    }, [linenTypes]);

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            {/* Header */}
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <Pressable
                    onPress={onClose}
                    style={[styles.backBtn, { backgroundColor: colors.paper2 }]}
                >
                    <Icon name="chevLeft" size={18} color={colors.ink700} />
                </Pressable>
                <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                        Pesée atelier
                    </Text>
                    <Text style={[styles.headerOrderNum, { color: colors.ink900 }]}>
                        {order.orderNumber}
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.formContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero client */}
                <Card padding={16}>
                    <View style={styles.heroRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.caps, { color: colors.ink500 }]}>
                                Client
                            </Text>
                            <View style={styles.heroClient}>
                                <Icon name="building" size={18} color={colors.brand800} />
                                <Text
                                    style={[styles.heroClientName, { color: colors.ink900 }]}
                                    numberOfLines={1}
                                >
                                    {order.hotelName || "—"}
                                </Text>
                            </View>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.caps, { color: colors.ink500 }]}>
                                Ref chauffeur
                            </Text>
                            <Text style={[styles.heroDriverKg, { color: colors.ink700 }]}>
                                {driverKg.toFixed(1).replace(".", ",")} kg
                            </Text>
                            <Text style={[styles.heroDriverPcs, { color: colors.ink500 }]}>
                                {driverPieces} pièces
                            </Text>
                        </View>
                    </View>
                </Card>

                {/* 2 grosses tuiles tappables */}
                <BigInputTile
                    label="Pesée atelier"
                    unit="kg"
                    value={
                        weightKg > 0
                            ? weightKg.toFixed(1).replace(".", ",")
                            : "—"
                    }
                    subline={
                        driverKg > 0
                            ? `Référence : ${driverKg.toFixed(1).replace(".", ",")} kg`
                            : "Aucune référence"
                    }
                    icon="weight"
                    highlight={weightKg > 0}
                    onTap={() => setFocused("weight")}
                />
                <BigInputTile
                    label="Nombre de pièces"
                    unit="pcs"
                    value={pieces > 0 ? String(pieces) : "—"}
                    subline={
                        driverPieces > 0
                            ? `Référence : ${driverPieces} pièces`
                            : "Aucune référence"
                    }
                    icon="boxes"
                    highlight={pieces > 0}
                    onTap={() => setFocused("pieces")}
                />

                {/* Détail items chauffeur */}
                {order.services && order.services.length > 0 && (
                    <Card padding={14}>
                        <Text style={[styles.caps, { color: colors.ink500, marginBottom: 8 }]}>
                            Détail comptage chauffeur
                        </Text>
                        {order.services.flatMap((sv) =>
                            sv.items.map((it, i) => (
                                <View
                                    key={`${sv.service}-${it.type}-${i}`}
                                    style={styles.itemRow}
                                >
                                    <Text style={[styles.itemName, { color: colors.ink700 }]}>
                                        {labelByCode[it.type] ?? it.type}
                                    </Text>
                                    <Text
                                        style={[styles.itemQty, { color: colors.ink900 }]}
                                    >
                                        {it.quantity}
                                    </Text>
                                </View>
                            )),
                        )}
                    </Card>
                )}

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

            {/* Footer sticky avec validation */}
            <View
                style={[
                    styles.footer,
                    { backgroundColor: colors.paper, borderTopColor: colors.ink200 },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <Text style={[styles.footerLabel, { color: colors.ink500 }]}>
                        Pesée en cours
                    </Text>
                    <Text style={[styles.footerValue, { color: colors.ink900 }]}>
                        {weightKg > 0
                            ? `${weightKg.toFixed(1).replace(".", ",")} kg`
                            : "—"}{" "}
                        · {pieces > 0 ? `${pieces} pcs` : "—"}
                    </Text>
                </View>
                <Pressable
                    onPress={handleSubmit}
                    disabled={!valid || receive.isPending}
                    style={[
                        styles.validateBtn,
                        {
                            backgroundColor: valid && !receive.isPending
                                ? colors.brand800
                                : colors.ink300,
                        },
                    ]}
                >
                    <Icon name="check" size={16} color={colors.paper} />
                    <Text style={[styles.validateBtnText, { color: colors.paper }]}>
                        {receive.isPending ? "Envoi…" : "Valider"}
                    </Text>
                </Pressable>
            </View>

            {/* Keypad modal */}
            {focused === "weight" && (
                <FocusKeypad
                    mode="decimal"
                    title="Pesée atelier"
                    subtitle={
                        driverKg > 0
                            ? `Référence : ${driverKg.toFixed(1).replace(".", ",")} kg`
                            : undefined
                    }
                    unit="kg"
                    initialValue={weightKg}
                    onClose={() => setFocused(null)}
                    onValidate={(v) => {
                        setWeightKg(v);
                        setFocused(null);
                    }}
                />
            )}
            {focused === "pieces" && (
                <FocusKeypad
                    mode="integer"
                    title="Nombre de pièces"
                    subtitle={
                        driverPieces > 0
                            ? `Référence : ${driverPieces} pièces`
                            : undefined
                    }
                    unit="pcs"
                    initialValue={pieces}
                    onClose={() => setFocused(null)}
                    onValidate={(v) => {
                        setPieces(Math.round(v));
                        setFocused(null);
                    }}
                />
            )}
        </SafeAreaView>
    );
}

/* ─── BigInputTile ────────────────────────────────────────────── */

function BigInputTile({
    label,
    value,
    unit,
    subline,
    icon,
    highlight,
    onTap,
}: {
    label: string;
    value: string;
    unit: string;
    subline?: string;
    icon: "weight" | "boxes";
    highlight?: boolean;
    onTap: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onTap}
            style={({ pressed }) => [
                styles.bigInput,
                {
                    backgroundColor: highlight ? colors.brand100 : colors.paper,
                    borderColor: highlight ? colors.brand800 : colors.ink300,
                    borderStyle: highlight ? "solid" : "dashed",
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View style={styles.bigInputHead}>
                <View style={styles.bigInputLabel}>
                    <Icon name={icon} size={14} color={colors.brand800} />
                    <Text style={[styles.caps, { color: colors.ink500 }]}>
                        {label}
                    </Text>
                </View>
                <Icon
                    name="settings"
                    size={14}
                    color={highlight ? colors.brand800 : colors.ink400}
                />
            </View>

            <View style={styles.bigInputValueRow}>
                <Text
                    style={[
                        styles.bigInputValue,
                        { color: highlight ? colors.brand800 : colors.ink400 },
                    ]}
                >
                    {value}
                </Text>
                <Text
                    style={[
                        styles.bigInputUnit,
                        { color: highlight ? colors.brand800 : colors.ink400 },
                    ]}
                >
                    {unit}
                </Text>
            </View>

            {subline && (
                <Text style={[styles.bigInputSub, { color: colors.ink500 }]}>
                    {subline}
                </Text>
            )}
        </Pressable>
    );
}

/* ─── Focus mode plein écran avec pavé numérique ─────────────── */

export function FocusKeypad({
    mode,
    title,
    subtitle,
    unit,
    initialValue,
    onClose,
    onValidate,
}: {
    mode: "decimal" | "integer";
    title: string;
    subtitle?: string;
    unit: string;
    initialValue: number;
    onClose: () => void;
    onValidate: (n: number) => void;
}) {
    const colors = useThemeColors();
    const [draft, setDraft] = useState<string>(() => {
        if (initialValue === 0) return "";
        if (mode === "decimal") return initialValue.toString().replace(".", ",");
        return String(Math.round(initialValue));
    });

    const parsed =
        mode === "decimal"
            ? parseFloat(draft.replace(",", ".")) || 0
            : parseInt(draft, 10) || 0;

    const pressDigit = (d: string) => {
        setDraft((prev) => {
            if (prev === "0" && d !== ",") return d;
            if (prev === "" && d === ",") return "0,";
            if (d === "," && prev.includes(",")) return prev;
            const next = `${prev}${d}`;
            if (next.length > 7) return prev;
            return next;
        });
    };
    const pressBack = () => setDraft((prev) => prev.slice(0, -1));
    const pressClear = () => setDraft("");

    const digits = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

    return (
        <Modal
            visible
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={[styles.modalBackdrop, { backgroundColor: "#00000099" }]}>
                <View
                    style={[
                        styles.modalSheet,
                        { backgroundColor: colors.paper, borderColor: colors.brand800 },
                    ]}
                >
                    {/* Header */}
                    <View
                        style={[styles.modalHead, { borderBottomColor: colors.ink200 }]}
                    >
                        <View style={{ flex: 1 }}>
                            <Text
                                style={[styles.modalTitle, { color: colors.ink900 }]}
                                numberOfLines={1}
                            >
                                {title}
                            </Text>
                            {subtitle && (
                                <Text
                                    style={[styles.modalSubtitle, { color: colors.ink500 }]}
                                >
                                    {subtitle}
                                </Text>
                            )}
                        </View>
                        <Pressable
                            onPress={onClose}
                            style={[styles.modalClose, { backgroundColor: colors.paper2 }]}
                        >
                            <Icon name="x" size={18} color={colors.ink700} />
                        </Pressable>
                    </View>

                    {/* Display */}
                    <View style={[styles.keypadDisplay, { backgroundColor: colors.brand100 }]}>
                        <Text style={[styles.caps, { color: colors.ink500, textAlign: "center" }]}>
                            Saisie
                        </Text>
                        <View style={styles.keypadValueRow}>
                            <Text style={[styles.keypadValue, { color: colors.brand800 }]}>
                                {draft || "0"}
                            </Text>
                            <Text style={[styles.keypadUnit, { color: colors.brand800 }]}>
                                {unit}
                            </Text>
                        </View>
                    </View>

                    {/* Keypad */}
                    <View style={styles.keypadGrid}>
                        {digits.map((d) => (
                            <KeyBtn key={d} onPress={() => pressDigit(d)}>
                                {d}
                            </KeyBtn>
                        ))}
                        {mode === "decimal" ? (
                            <KeyBtn muted onPress={() => pressDigit(",")}>
                                ,
                            </KeyBtn>
                        ) : (
                            <KeyBtn muted onPress={pressClear}>
                                C
                            </KeyBtn>
                        )}
                        <KeyBtn onPress={() => pressDigit("0")}>0</KeyBtn>
                        <KeyBtn muted onPress={pressBack}>
                            ⌫
                        </KeyBtn>
                    </View>

                    {mode === "decimal" && (
                        <Pressable
                            onPress={pressClear}
                            style={[styles.clearBtn, { backgroundColor: colors.paper2 }]}
                        >
                            <Text style={[styles.clearBtnText, { color: colors.ink700 }]}>
                                Effacer
                            </Text>
                        </Pressable>
                    )}

                    {/* Actions */}
                    <View
                        style={[styles.modalActions, { borderTopColor: colors.ink200 }]}
                    >
                        <Pressable
                            onPress={onClose}
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: colors.paper2,
                                    borderColor: colors.ink300,
                                    flex: 1,
                                },
                            ]}
                        >
                            <Text style={[styles.actionBtnText, { color: colors.ink700 }]}>
                                Annuler
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => onValidate(parsed)}
                            disabled={parsed <= 0}
                            style={[
                                styles.actionBtn,
                                {
                                    backgroundColor: parsed > 0 ? colors.brand800 : colors.ink300,
                                    flex: 2,
                                },
                            ]}
                        >
                            <Icon name="check" size={16} color={colors.paper} />
                            <Text style={[styles.actionBtnText, { color: colors.paper }]}>
                                Valider
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

function KeyBtn({
    children,
    onPress,
    muted,
}: {
    children: React.ReactNode;
    onPress: () => void;
    muted?: boolean;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.keyBtn,
                {
                    backgroundColor: muted ? colors.paper2 : colors.paper,
                    borderColor: colors.ink200,
                    borderWidth: muted ? 0 : StyleSheet.hairlineWidth,
                    transform: [{ scale: pressed ? 0.95 : 1 }],
                },
            ]}
        >
            <Text style={[styles.keyBtnText, { color: colors.ink900 }]}>
                {children}
            </Text>
        </Pressable>
    );
}

/* ─── KPI + Empty ─────────────────────────────────────────────── */

function KpiTile({
    icon,
    label,
    value,
}: {
    icon: "boxes" | "weight";
    label: string;
    value: string;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.kpi,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View style={[styles.kpiIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name={icon} size={14} color={colors.brand800} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.kpiLabel, { color: colors.ink500 }]}>
                    {label}
                </Text>
                <Text style={[styles.kpiValue, { color: colors.ink900 }]}>
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
        <View style={styles.empty}>
            <Icon name={icon} size={36} color={colors.ink400} />
            <Text style={[styles.emptyTitle, { color: colors.ink800 }]}>
                {title}
            </Text>
            <Text style={[styles.emptySub, { color: colors.ink500 }]}>{sub}</Text>
        </View>
    );
}

/* ─── Styles ──────────────────────────────────────────────────── */

export const styles = StyleSheet.create({
    container: { flex: 1 },

    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    headerOrderNum: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        marginTop: 1,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    kpiRow: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    kpi: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    kpiIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    kpiLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    kpiValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        marginTop: 2,
    },

    list: { padding: 16, gap: 12, paddingBottom: 120 },

    card: {
        padding: 14,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        gap: 10,
    },
    cardHead: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 8,
    },
    cardOrderNum: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    cardClientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 3,
    },
    cardClient: {
        flex: 1,
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    badge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    badgeDot: { width: 5, height: 5, borderRadius: 3 },
    badgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },

    cardStatsRow: { flexDirection: "row", gap: 8 },
    statTile: {
        flex: 1,
        padding: 10,
        borderRadius: 10,
        alignItems: "center",
    },
    statValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
    },
    statLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    cardFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 2,
    },
    cardFooterText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    cardCta: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    formContent: { padding: 16, gap: 12, paddingBottom: 120 },
    caps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
    },

    heroRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    heroClient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 4,
    },
    heroClientName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    heroDriverKg: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 22,
        marginTop: 4,
    },
    heroDriverPcs: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    bigInput: {
        padding: 18,
        borderRadius: 14,
        borderWidth: 2,
        gap: 10,
    },
    bigInputHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    bigInputLabel: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    bigInputValueRow: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },
    bigInputValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 52,
        letterSpacing: -1,
    },
    bigInputUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: 18,
    },
    bigInputSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },

    itemRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingVertical: 4,
    },
    itemName: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    itemQty: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },

    footer: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        paddingBottom: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    footerValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        marginTop: 2,
    },
    validateBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 12,
    },
    validateBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    /* Modal keypad */
    modalBackdrop: {
        flex: 1,
        justifyContent: "flex-end",
    },
    modalSheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        borderWidth: 2,
        borderBottomWidth: 0,
    },
    modalHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    modalTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
    },
    modalSubtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    modalClose: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },

    keypadDisplay: {
        paddingVertical: 20,
        paddingHorizontal: 16,
    },
    keypadValueRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "center",
        gap: 8,
        marginTop: 6,
    },
    keypadValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 56,
        letterSpacing: -1,
    },
    keypadUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: 22,
    },

    keypadGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        padding: 12,
        gap: 8,
    },
    keyBtn: {
        width: "31%",
        height: 56,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    keyBtnText: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 22,
    },

    clearBtn: {
        marginHorizontal: 12,
        marginBottom: 12,
        height: 44,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    clearBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    modalActions: {
        flexDirection: "row",
        gap: 8,
        padding: 12,
        paddingBottom: 24,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    actionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        height: 52,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    empty: {
        alignItems: "center",
        gap: 8,
        paddingVertical: 50,
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
