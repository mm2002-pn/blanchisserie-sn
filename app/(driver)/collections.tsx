import { useCallback, useMemo, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { StatusBarSpace } from "@/components/shared/StatusBarSpace";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useMyRounds } from "@/hooks/useCollectionRounds";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";
import type { ApiCollectionRound } from "@/services/collectionRounds.service";

type FilterChip = "all" | "today" | "planned" | "in_progress";

/**
 * Liste pure des tournées du chauffeur — vue alternative à la carte.
 * Tap sur une card → tour-detail.
 */
export default function CollectionsScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const qc = useQueryClient();
    const [notifsOpen, setNotifsOpen] = useState(false);
    const [filter, setFilter] = useState<FilterChip>("all");
    const [refreshing, setRefreshing] = useState(false);

    useOrdersRealtime();

    const { data: planned = [] } = useMyRounds({ status: "planned" });
    const { data: inProgress = [] } = useMyRounds({ status: "in_progress" });
    const { data: completed = [] } = useMyRounds({ status: "completed" });

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        try {
            await Promise.all([
                qc.invalidateQueries({ queryKey: ["collection-rounds"] }),
                qc.invalidateQueries({ queryKey: ["orders"] }),
            ]);
        } finally {
            setRefreshing(false);
        }
    }, [qc]);

    const allRounds = useMemo(
        () => [...inProgress, ...planned, ...completed.slice(0, 5)],
        [inProgress, planned, completed],
    );

    const filtered = useMemo(() => {
        if (filter === "all") return allRounds;
        if (filter === "today") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            return allRounds.filter((r) => {
                const d = new Date(r.plannedAt);
                return d >= today && d < tomorrow;
            });
        }
        return allRounds.filter((r) => r.status === filter);
    }, [allRounds, filter]);

    const stats = {
        planned: planned.length,
        inProgress: inProgress.length,
        completed: completed.length,
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.paper2 }]}>
            {/* Bande status bar même couleur que le header → transition invisible */}
            <StatusBarSpace color={colors.paper} />
            {/* Header */}
            <View
                style={[
                    styles.header,
                    {
                        backgroundColor: colors.paper,
                        borderBottomColor: colors.ink200,
                    },
                ]}
            >
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Mes collectes</ThemedText>
                    <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                        {inProgress.length > 0
                            ? `${inProgress.length} en cours · ${planned.length} à venir`
                            : `${planned.length} tournée${planned.length > 1 ? "s" : ""} planifiée${planned.length > 1 ? "s" : ""}`}
                    </Text>
                </View>
                <NotificationBell onPress={() => setNotifsOpen(true)} />
            </View>

            {/* Filter chips */}
            <View style={styles.filterRow}>
                <Chip
                    label={`Tout · ${allRounds.length}`}
                    active={filter === "all"}
                    onPress={() => setFilter("all")}
                />
                <Chip
                    label={`Aujourd'hui`}
                    active={filter === "today"}
                    onPress={() => setFilter("today")}
                />
                {stats.inProgress > 0 && (
                    <Chip
                        label={`En cours · ${stats.inProgress}`}
                        active={filter === "in_progress"}
                        onPress={() => setFilter("in_progress")}
                        tone="baobab"
                    />
                )}
                <Chip
                    label={`Planifiées · ${stats.planned}`}
                    active={filter === "planned"}
                    onPress={() => setFilter("planned")}
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
                {filtered.length === 0 ? (
                    <View style={styles.empty}>
                        <Icon name="package" size={32} color={colors.ink400} />
                        <Text style={[styles.emptyTitle, { color: colors.ink800 }]}>
                            Aucune tournée
                        </Text>
                        <Text style={[styles.emptySub, { color: colors.ink500 }]}>
                            L'admin t'enverra une notification quand une tournée te
                            sera assignée.
                        </Text>
                    </View>
                ) : (
                    filtered.map((round) => (
                        <RoundCard
                            key={round.id}
                            round={round}
                            onPress={() =>
                                router.push({
                                    pathname: "/(driver)/tour-detail",
                                    params: { roundId: round.id },
                                })
                            }
                            onNavigate={() => {
                                const first = round.orders.find((o) =>
                                    round.type === "delivery"
                                        ? !o.deliveredAt
                                        : !o.collectedAt,
                                );
                                if (
                                    first?.pickupGeoLat == null ||
                                    first?.pickupGeoLng == null
                                ) {
                                    return;
                                }
                                // Bascule sur l'onglet Carte avec params de focus
                                // → route.tsx trace l'itinéraire automatiquement.
                                router.push({
                                    pathname: "/(driver)/route",
                                    params: {
                                        focusOrderId: first.id,
                                        focusRoundId: round.id,
                                        focusLat: String(first.pickupGeoLat),
                                        focusLng: String(first.pickupGeoLng),
                                        focusName:
                                            first.client?.name ?? first.orderNumber,
                                    },
                                });
                            }}
                        />
                    ))
                )}
            </ScrollView>

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
    onNavigate,
}: {
    round: ApiCollectionRound;
    onPress: () => void;
    onNavigate: () => void;
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
    const completed = round.status === "completed";

    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.round,
                {
                    backgroundColor: inProgress
                        ? colors.baobab100
                        : completed
                          ? colors.ok100
                          : colors.paper,
                    borderColor: inProgress
                        ? colors.baobab600
                        : completed
                          ? colors.ok600
                          : colors.ink200,
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
                                    backgroundColor: isDelivery
                                        ? colors.terra600
                                        : colors.brand100,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.roundStatusText,
                                    {
                                        color: isDelivery
                                            ? colors.paper
                                            : colors.brand800,
                                    },
                                ]}
                            >
                                {isDelivery ? "Livraison" : "Collecte"}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.roundStatusPill,
                                {
                                    backgroundColor: inProgress
                                        ? colors.baobab600
                                        : completed
                                          ? colors.ok700
                                          : colors.brand100,
                                },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.roundStatusText,
                                    {
                                        color:
                                            inProgress || completed
                                                ? colors.paper
                                                : colors.brand800,
                                    },
                                ]}
                            >
                                {completed
                                    ? "Terminée"
                                    : inProgress
                                      ? "En cours"
                                      : "Planifiée"}
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
                        {done}/{total}{" "}
                        {isDelivery ? "livrée" : "collectée"}
                        {total > 1 ? "s" : ""}
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
                            backgroundColor: completed
                                ? colors.ok700
                                : inProgress
                                  ? colors.baobab600
                                  : colors.brand800,
                            width: total > 0 ? `${(done / total) * 100}%` : "0%",
                        },
                    ]}
                />
            </View>

            {!completed && (
                <View style={styles.roundActions}>
                    <Pressable
                        onPress={(e) => {
                            e.stopPropagation();
                            onNavigate();
                        }}
                        style={[
                            styles.navBtn,
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
            )}
        </Pressable>
    );
}

function Chip({
    label,
    active,
    onPress,
    tone,
}: {
    label: string;
    active: boolean;
    onPress: () => void;
    tone?: "baobab";
}) {
    const colors = useThemeColors();
    const activeBg = tone === "baobab" ? colors.baobab600 : colors.ink900;
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.chip,
                {
                    backgroundColor: active ? activeBg : colors.paper,
                    borderColor: active ? activeBg : colors.ink200,
                },
            ]}
        >
            <Text
                style={[
                    styles.chipText,
                    { color: active ? colors.paper : colors.ink700 },
                ]}
            >
                {label}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
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
    filterRow: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    chipText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    list: {
        padding: 16,
        gap: 12,
        paddingBottom: 100,
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
    navBtn: {
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
        paddingVertical: 60,
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
