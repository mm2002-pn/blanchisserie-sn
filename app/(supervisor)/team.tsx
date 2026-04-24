import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type ShiftStatus = "En poste" | "Pause" | "Absent" | "Congé";

type Member = {
    id: string;
    name: string;
    role: string;
    team: "Lavage" | "Séchage" | "Calandre" | "Logistique" | "Qualité";
    status: ShiftStatus;
    shift: string;
    productivityPct: number;
};

const FILTERS: { key: "all" | Member["team"]; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "Lavage", label: "Lavage" },
    { key: "Séchage", label: "Séchage" },
    { key: "Calandre", label: "Calandre" },
    { key: "Logistique", label: "Logistique" },
    { key: "Qualité", label: "Qualité" },
];

const MEMBERS: Member[] = [
    {
        id: "1",
        name: "Aminata Diop",
        role: "Responsable qualité",
        team: "Qualité",
        status: "En poste",
        shift: "07:00 – 15:00",
        productivityPct: 96,
    },
    {
        id: "2",
        name: "Mamadou Fall",
        role: "Opérateur senior",
        team: "Lavage",
        status: "En poste",
        shift: "07:00 – 15:00",
        productivityPct: 92,
    },
    {
        id: "3",
        name: "Ndeye Kane",
        role: "Opératrice calandre",
        team: "Calandre",
        status: "Pause",
        shift: "07:00 – 15:00",
        productivityPct: 88,
    },
    {
        id: "4",
        name: "Ibrahima Sy",
        role: "Opérateur séchage",
        team: "Séchage",
        status: "En poste",
        shift: "07:00 – 15:00",
        productivityPct: 84,
    },
    {
        id: "5",
        name: "Fatou Ndiaye",
        role: "Chauffeur-livreur",
        team: "Logistique",
        status: "En poste",
        shift: "06:00 – 14:00",
        productivityPct: 98,
    },
    {
        id: "6",
        name: "Cheikh Bâ",
        role: "Chauffeur-livreur",
        team: "Logistique",
        status: "Absent",
        shift: "—",
        productivityPct: 0,
    },
    {
        id: "7",
        name: "Rokhaya Thiam",
        role: "Contrôleuse qualité",
        team: "Qualité",
        status: "Congé",
        shift: "—",
        productivityPct: 0,
    },
];

const STATUS_TINT: Record<
    ShiftStatus,
    { bgKey: "ok100" | "warn100" | "danger100" | "ink100"; fgKey: "ok700" | "warn700" | "danger600" | "ink500" }
> = {
    "En poste": { bgKey: "ok100", fgKey: "ok700" },
    Pause: { bgKey: "warn100", fgKey: "warn700" },
    Absent: { bgKey: "danger100", fgKey: "danger600" },
    Congé: { bgKey: "ink100", fgKey: "ink500" },
};

export default function TeamScreen() {
    const colors = useThemeColors();
    const [filter, setFilter] = useState<"all" | Member["team"]>("all");

    const visible = useMemo(
        () => (filter === "all" ? MEMBERS : MEMBERS.filter((m) => m.team === filter)),
        [filter],
    );

    const active = MEMBERS.filter((m) => m.status === "En poste").length;
    const paused = MEMBERS.filter((m) => m.status === "Pause").length;
    const absent = MEMBERS.filter(
        (m) => m.status === "Absent" || m.status === "Congé",
    ).length;

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
                <ThemedText variate="title">Équipe</ThemedText>
                <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                    Atelier Dakar · {MEMBERS.length} collaborateurs
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero */}
                <Card
                    padding={18}
                    style={[
                        styles.hero,
                        {
                            backgroundColor: colors.brand900,
                            borderColor: colors.brand900,
                        },
                    ]}
                >
                    <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                        Présence du jour
                    </Text>
                    <View style={styles.heroStatsRow}>
                        <HeroStat value={`${active}`} label="En poste" />
                        <HeroStat value={`${paused}`} label="En pause" />
                        <HeroStat value={`${absent}`} label="Absent / congé" />
                    </View>
                </Card>

                {/* Filter pills */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterRow}
                >
                    {FILTERS.map((f) => {
                        const active = filter === f.key;
                        return (
                            <Pressable
                                key={f.key}
                                onPress={() => setFilter(f.key)}
                                style={[
                                    styles.filterPill,
                                    {
                                        backgroundColor: active
                                            ? colors.brand800
                                            : colors.paper,
                                        borderColor: active
                                            ? colors.brand800
                                            : colors.ink200,
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.filterLabel,
                                        { color: active ? colors.paper : colors.ink700 },
                                    ]}
                                >
                                    {f.label}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>

                <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                    Liste · {visible.length}
                </ThemedText>

                <View style={{ gap: 10 }}>
                    {visible.map((m) => (
                        <MemberRow key={m.id} member={m} />
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

function HeroStat({ value, label }: { value: string; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.heroValue, { color: colors.paper }]}>
                {value}
            </Text>
            <Text style={[styles.heroLabel, { color: colors.brand100 }]}>
                {label}
            </Text>
        </View>
    );
}

function MemberRow({ member }: { member: Member }) {
    const colors = useThemeColors();
    const tint = STATUS_TINT[member.status];

    const initials = member.name
        .split(" ")
        .map((w) => w.charAt(0))
        .slice(0, 2)
        .join("")
        .toUpperCase();

    const teamIcon: IconName =
        member.team === "Lavage"
            ? "droplet"
            : member.team === "Séchage"
              ? "thermo"
              : member.team === "Calandre"
                ? "spark"
                : member.team === "Logistique"
                  ? "truck"
                  : "check";

    return (
        <Pressable
            style={({ pressed }) => [
                styles.memberRow,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    opacity: pressed ? 0.85 : 1,
                },
            ]}
        >
            <View
                style={[styles.avatar, { backgroundColor: colors.terra600 }]}
            >
                <Text style={[styles.avatarText, { color: colors.paper }]}>
                    {initials}
                </Text>
            </View>

            <View style={{ flex: 1 }}>
                <View style={styles.memberHeader}>
                    <Text style={[styles.memberName, { color: colors.ink900 }]}>
                        {member.name}
                    </Text>
                    <View
                        style={[
                            styles.statusPill,
                            { backgroundColor: colors[tint.bgKey] },
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                { backgroundColor: colors[tint.fgKey] },
                            ]}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: colors[tint.fgKey] },
                            ]}
                        >
                            {member.status}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.memberRole, { color: colors.ink500 }]}>
                    {member.role}
                </Text>

                <View style={styles.memberMeta}>
                    <View style={styles.metaItem}>
                        <Icon name={teamIcon} size={11} color={colors.ink500} />
                        <Text style={[styles.metaText, { color: colors.ink700 }]}>
                            {member.team}
                        </Text>
                    </View>
                    <View style={styles.metaItem}>
                        <Icon name="clock" size={11} color={colors.ink500} />
                        <Text style={[styles.metaText, { color: colors.ink700 }]}>
                            {member.shift}
                        </Text>
                    </View>
                    {member.productivityPct > 0 && (
                        <Text
                            style={[styles.productivityText, { color: colors.ink900 }]}
                        >
                            {member.productivityPct}%
                        </Text>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    // Hero
    hero: { marginBottom: 14 },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    heroStatsRow: {
        flexDirection: "row",
        gap: 16,
        marginTop: 14,
    },
    heroValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 28,
        letterSpacing: -0.5,
    },
    heroLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Filters
    filterRow: { gap: 8, paddingRight: 16, marginBottom: 14 },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    filterLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    // Member row
    memberRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 42,
        height: 42,
        borderRadius: 11,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    memberHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    memberName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        flex: 1,
        marginRight: 8,
    },
    memberRole: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    memberMeta: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        marginTop: 6,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
    },
    productivityText: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
        marginLeft: "auto",
    },

    // Status pill
    statusPill: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 999,
    },
    statusDot: { width: 5, height: 5, borderRadius: 3 },
    statusText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
});
