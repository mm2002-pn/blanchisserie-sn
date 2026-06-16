import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

/** Jours de collecte contractuels — 0 = lundi */
const SCHEDULED_COLLECTIONS = [
    { dayOfWeek: 0, time: "09:00" }, // lundi
    { dayOfWeek: 2, time: "09:00" }, // mercredi
    { dayOfWeek: 4, time: "14:00" }, // vendredi
];

const MONTHS = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
];

const DAYS_LONG = [
    "lundi",
    "mardi",
    "mercredi",
    "jeudi",
    "vendredi",
    "samedi",
    "dimanche",
];
const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"];

type CalendarCell =
    | { kind: "empty" }
    | {
          kind: "day";
          day: number;
          isToday: boolean;
          isPast: boolean;
          collection?: { time: string };
      };

function buildCalendar(year: number, month: number): CalendarCell[] {
    const firstDayRaw = new Date(year, month, 1).getDay();
    // Aligne sur lundi : dim=0 → 6, sinon jour-1
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells: CalendarCell[] = [];
    for (let i = 0; i < firstDay; i++) cells.push({ kind: "empty" });
    for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
        const sched = SCHEDULED_COLLECTIONS.find((s) => s.dayOfWeek === dow);
        cells.push({
            kind: "day",
            day,
            isToday:
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear(),
            isPast: d < today,
            collection: sched ? { time: sched.time } : undefined,
        });
    }
    return cells;
}

function getNextCollection(): { date: Date; time: string } | null {
    const today = new Date();
    for (let i = 0; i < 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dow = d.getDay() === 0 ? 6 : d.getDay() - 1;
        const sched = SCHEDULED_COLLECTIONS.find((s) => s.dayOfWeek === dow);
        if (sched && (i > 0 || today.getHours() < parseInt(sched.time, 10))) {
            return { date: d, time: sched.time };
        }
    }
    return null;
}

export default function PlanningScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [cursor, setCursor] = useState(new Date());

    const cells = useMemo(
        () => buildCalendar(cursor.getFullYear(), cursor.getMonth()),
        [cursor],
    );

    const next = getNextCollection();

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
                    <ThemedText variate="title">Planning</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={{ marginTop: 2 }}>
                        Collectes contractuelles
                    </ThemedText>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Next collection hero */}
                {next && (
                    <Card
                        padding={18}
                        style={[
                            styles.hero,
                            { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                        ]}
                    >
                        <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                            Prochaine collecte
                        </Text>
                        <Text style={[styles.heroDate, { color: colors.paper }]}>
                            {DAYS_LONG[(next.date.getDay() === 0 ? 6 : next.date.getDay() - 1)]}{" "}
                            {next.date.getDate()}{" "}
                            {MONTHS[next.date.getMonth()].toLowerCase()}
                        </Text>
                        <View style={styles.heroMeta}>
                            <View style={styles.heroMetaItem}>
                                <Icon name="clock" size={14} color={colors.brand100} />
                                <Text style={[styles.heroMetaText, { color: colors.paper }]}>
                                    {next.time}
                                </Text>
                            </View>
                            <View
                                style={[styles.heroDivider, { backgroundColor: colors.brand700 }]}
                            />
                            <View style={styles.heroMetaItem}>
                                <Icon name="truck" size={14} color={colors.brand100} />
                                <Text style={[styles.heroMetaText, { color: colors.paper }]}>
                                    Chauffeur assigné
                                </Text>
                            </View>
                        </View>
                    </Card>
                )}

                {/* Calendar */}
                <Card padding={14} style={{ marginBottom: 14 }}>
                    <View style={styles.calHeader}>
                        <Pressable
                            onPress={() =>
                                setCursor(
                                    new Date(cursor.getFullYear(), cursor.getMonth() - 1),
                                )
                            }
                            style={[styles.navBtn, { backgroundColor: colors.ink100 }]}
                            hitSlop={6}
                        >
                            <Icon name="chevLeft" size={14} color={colors.ink800} stroke={2} />
                        </Pressable>
                        <Text style={[styles.calTitle, { color: colors.ink900 }]}>
                            {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
                        </Text>
                        <Pressable
                            onPress={() =>
                                setCursor(
                                    new Date(cursor.getFullYear(), cursor.getMonth() + 1),
                                )
                            }
                            style={[styles.navBtn, { backgroundColor: colors.ink100 }]}
                            hitSlop={6}
                        >
                            <Icon name="chevRight" size={14} color={colors.ink800} stroke={2} />
                        </Pressable>
                    </View>

                    <View style={styles.weekRow}>
                        {DAYS_SHORT.map((d, i) => (
                            <Text
                                key={i}
                                style={[styles.weekCell, { color: colors.ink500 }]}
                            >
                                {d}
                            </Text>
                        ))}
                    </View>

                    <View style={styles.grid}>
                        {cells.map((cell, i) => (
                            <CalendarDayCell key={i} cell={cell} />
                        ))}
                    </View>

                    <View style={[styles.legend, { borderTopColor: colors.ink200 }]}>
                        <LegendDot color={colors.brand800} label="Collecte prévue" />
                        <LegendDot color={colors.ink300} label="Collecte passée" />
                    </View>
                </Card>

                {/* Horaires contractuels */}
                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Horaires contractuels
                </ThemedText>
                <Card padding={0} style={{ marginBottom: 14, overflow: "hidden" }}>
                    {SCHEDULED_COLLECTIONS.map((s, i) => (
                        <View key={i}>
                            <View style={styles.scheduleRow}>
                                <View style={[styles.scheduleIcon, { backgroundColor: colors.brand100 }]}>
                                    <Icon name="truck" size={14} color={colors.brand800} />
                                </View>
                                <Text style={[styles.scheduleDay, { color: colors.ink900 }]}>
                                    {capitalize(DAYS_LONG[s.dayOfWeek])}
                                </Text>
                                <Text style={[styles.scheduleTime, { color: colors.ink700 }]}>
                                    {s.time}
                                </Text>
                            </View>
                            {i < SCHEDULED_COLLECTIONS.length - 1 && (
                                <View
                                    style={[styles.rowDivider, { backgroundColor: colors.ink200 }]}
                                />
                            )}
                        </View>
                    ))}
                </Card>

                <View style={[styles.note, { backgroundColor: colors.warn100 }]}>
                    <Icon name="alert" size={14} color={colors.warn700} />
                    <Text style={[styles.noteText, { color: colors.ink700 }]}>
                        Préparez votre linge 30 min avant la collecte. Les modifications
                        demandent 48 h de préavis.
                    </Text>
                </View>

                {/* Support CTA */}
                <Pressable
                    onPress={() => router.push("/(hotel)/support")}
                    style={[styles.ctaCard, { backgroundColor: colors.paper, borderColor: colors.ink200 }]}
                >
                    <View style={[styles.ctaIcon, { backgroundColor: colors.terra100 }]}>
                        <Icon name="msg" size={18} color={colors.terra700} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.ctaTitle, { color: colors.ink900 }]}>
                            Modifier mon planning
                        </Text>
                        <Text style={[styles.ctaSub, { color: colors.ink500 }]}>
                            Contactez le support pour ajuster vos créneaux.
                        </Text>
                    </View>
                    <Icon name="chevRight" size={16} color={colors.ink400} />
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function CalendarDayCell({ cell }: { cell: CalendarCell }) {
    const colors = useThemeColors();
    if (cell.kind === "empty") return <View style={styles.cell} />;

    const { day, isToday, isPast, collection } = cell;
    const hasCollection = !!collection;
    const isFuturePlanned = hasCollection && !isPast;
    const isPastPlanned = hasCollection && isPast;

    return (
        <View style={styles.cell}>
            <View
                style={[
                    styles.cellInner,
                    isToday && {
                        borderColor: colors.brand800,
                        borderWidth: 1.5,
                    },
                    isFuturePlanned && { backgroundColor: colors.brand100 },
                    isPastPlanned && { backgroundColor: colors.ink100 },
                ]}
            >
                <Text
                    style={[
                        styles.cellDay,
                        {
                            color: isPast
                                ? colors.ink400
                                : isFuturePlanned
                                ? colors.brand800
                                : colors.ink900,
                            fontFamily: isToday
                                ? FontFamily.monoMedium
                                : FontFamily.monoRegular,
                        },
                    ]}
                >
                    {day}
                </Text>
                {hasCollection && (
                    <View
                        style={[
                            styles.cellDot,
                            {
                                backgroundColor: isPast ? colors.ink400 : colors.brand800,
                            },
                        ]}
                    />
                )}
            </View>
        </View>
    );
}

function LegendDot({ color, label }: { color: string; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={[styles.legendText, { color: colors.ink600 }]}>{label}</Text>
        </View>
    );
}

function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
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
        paddingBottom: 120,
    },

    // Hero
    hero: { marginBottom: 14 },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
    },
    heroDate: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 26,
        lineHeight: 28,
        letterSpacing: -0.3,
        marginTop: 4,
    },
    heroMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginTop: 14,
    },
    heroMetaItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    heroMetaText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
    },
    heroDivider: {
        width: StyleSheet.hairlineWidth,
        height: 14,
    },

    // Calendar
    calHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12,
    },
    navBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    calTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.lg,
        letterSpacing: -0.3,
    },
    weekRow: {
        flexDirection: "row",
        marginBottom: 4,
    },
    weekCell: {
        flex: 1,
        textAlign: "center",
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
        paddingVertical: 6,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
    },
    cell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        padding: 2,
    },
    cellInner: {
        flex: 1,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 4,
    },
    cellDay: {
        fontSize: Typography.fontSize.sm,
    },
    cellDot: {
        marginTop: 2,
        width: 4,
        height: 4,
        borderRadius: 99,
    },

    legend: {
        flexDirection: "row",
        gap: 16,
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: StyleSheet.hairlineWidth,
        justifyContent: "center",
    },
    legendItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 99,
    },
    legendText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },

    // Schedule list
    sectionLabel: {
        marginBottom: 8,
        paddingLeft: 2,
    },
    scheduleRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    scheduleIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    scheduleDay: {
        flex: 1,
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    scheduleTime: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    rowDivider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 58,
    },

    // Note
    note: {
        flexDirection: "row",
        gap: 8,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
    },
    noteText: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        lineHeight: 16,
    },

    // CTA
    ctaCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    ctaIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    ctaTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    ctaSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
});
