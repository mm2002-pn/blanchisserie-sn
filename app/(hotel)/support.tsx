import { Fragment, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Linking,
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
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge, { OrderStatus as UIStatus } from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type TicketStatus = "open" | "in_progress" | "resolved" | "closed";
type Priority = "low" | "medium" | "high";
type CategoryId = "complaint" | "billing" | "delivery" | "quality" | "other";

const MOCK_TICKETS = [
    {
        id: "1",
        subject: "Linge endommagé · TRG-2304-002",
        category: "complaint" as CategoryId,
        status: "open" as TicketStatus,
        priority: "high" as Priority,
        createdAt: "2026-04-22T10:30:00Z",
        lastUpdate: "2026-04-23T14:20:00Z",
        messages: 3,
    },
    {
        id: "2",
        subject: "Question sur la facture FAC-2504-012",
        category: "billing" as CategoryId,
        status: "in_progress" as TicketStatus,
        priority: "medium" as Priority,
        createdAt: "2026-04-19T15:00:00Z",
        lastUpdate: "2026-04-21T09:15:00Z",
        messages: 5,
    },
    {
        id: "3",
        subject: "Retard de livraison",
        category: "delivery" as CategoryId,
        status: "resolved" as TicketStatus,
        priority: "low" as Priority,
        createdAt: "2026-04-14T08:45:00Z",
        lastUpdate: "2026-04-15T16:30:00Z",
        messages: 7,
    },
];

const CATEGORIES: { id: CategoryId; label: string; icon: IconName }[] = [
    { id: "complaint", label: "Réclamation", icon: "alert" },
    { id: "billing", label: "Facturation", icon: "receipt" },
    { id: "delivery", label: "Livraison", icon: "truck" },
    { id: "quality", label: "Qualité", icon: "spark" },
    { id: "other", label: "Autre", icon: "msg" },
];

const STATUS_TO_UI: Record<TicketStatus, UIStatus> = {
    open: "En attente",
    in_progress: "Traitement",
    resolved: "Validée",
    closed: "Annulée",
};

const FAQ_ITEMS = [
    {
        q: "Quels sont les délais de traitement ?",
        a: "Le délai standard est de 48 h pour le lavage et pliage, 72 h pour le nettoyage à sec.",
    },
    {
        q: "Comment suivre ma commande ?",
        a: "Depuis « Mes commandes », ouvrez une commande pour voir la timeline de production en temps réel.",
    },
    {
        q: "Que faire en cas de linge endommagé ?",
        a: "Créez un ticket « Réclamation » avec photos. Nous traitons votre demande sous 24 h.",
    },
    {
        q: "Comment modifier mon planning de collecte ?",
        a: "Contactez-nous par téléphone ou créez un ticket. Les modifications demandent un préavis de 48 h.",
    },
];

type Tab = "tickets" | "new" | "faq";

export default function SupportScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [tab, setTab] = useState<Tab>("tickets");
    const [expanded, setExpanded] = useState<number | null>(0);

    // New ticket form
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState<CategoryId | null>(null);
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = () => {
        if (!subject || !category || !description) {
            Alert.alert("Erreur", "Remplissez tous les champs du ticket.");
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert("Ticket créé", "Nous revenons vers vous rapidement.", [
                {
                    text: "OK",
                    onPress: () => {
                        setSubject("");
                        setCategory(null);
                        setDescription("");
                        setTab("tickets");
                    },
                },
            ]);
        }, 600);
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
                    <ThemedText variate="title">Support & aide</ThemedText>
                    <ThemedText variate="caption" color="ink500" style={{ marginTop: 2 }}>
                        24 h / 24 · 7 j / 7
                    </ThemedText>
                </View>
            </View>

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Contact hero */}
                    <View style={styles.heroRow}>
                        <ContactCTA
                            icon="phone"
                            label="Appeler"
                            sub="+221 33 123 45 67"
                            bg={colors.brand900}
                            fg={colors.paper}
                            accent={colors.brand100}
                            onPress={() => Linking.openURL("tel:+221331234567")}
                        />
                        <ContactCTA
                            icon="msg"
                            label="WhatsApp"
                            sub="+221 77 987 65 43"
                            bg={colors.baobab100}
                            fg={colors.baobab700}
                            accent={colors.baobab700}
                            onPress={() =>
                                Linking.openURL("https://wa.me/221779876543")
                            }
                        />
                    </View>

                    {/* Tabs */}
                    <View style={styles.tabsWrap}>
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.tabs}
                        >
                            {(
                                [
                                    ["tickets", "Mes tickets"],
                                    ["new", "Nouveau"],
                                    ["faq", "FAQ"],
                                ] as [Tab, string][]
                            ).map(([id, label]) => {
                                const active = tab === id;
                                return (
                                    <Pressable
                                        key={id}
                                        onPress={() => setTab(id)}
                                        style={[
                                            styles.tab,
                                            {
                                                backgroundColor: active
                                                    ? colors.ink900
                                                    : colors.paper,
                                                borderColor: active ? colors.ink900 : colors.ink200,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.tabText,
                                                {
                                                    color: active ? colors.paper : colors.ink700,
                                                },
                                            ]}
                                        >
                                            {label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </ScrollView>
                    </View>

                    {/* Content */}
                    {tab === "tickets" && <TicketsList />}
                    {tab === "new" && (
                        <NewTicketForm
                            subject={subject}
                            setSubject={setSubject}
                            category={category}
                            setCategory={setCategory}
                            description={description}
                            setDescription={setDescription}
                            submitting={submitting}
                            onSubmit={handleSubmit}
                        />
                    )}
                    {tab === "faq" && (
                        <FAQ expanded={expanded} setExpanded={setExpanded} />
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function ContactCTA({
    icon,
    label,
    sub,
    bg,
    fg,
    accent,
    onPress,
}: {
    icon: IconName;
    label: string;
    sub: string;
    bg: string;
    fg: string;
    accent: string;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            style={[styles.contactCTA, { backgroundColor: bg }]}
        >
            <View style={styles.contactCTAHead}>
                <Icon name={icon} size={18} color={fg} stroke={1.8} />
                <Text style={[styles.contactCTALabel, { color: fg }]}>{label}</Text>
            </View>
            <Text style={[styles.contactCTASub, { color: accent }]}>{sub}</Text>
        </Pressable>
    );
}

function TicketsList() {
    const colors = useThemeColors();
    return (
        <View style={{ gap: 8 }}>
            <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                Tickets · {MOCK_TICKETS.length}
            </ThemedText>
            {MOCK_TICKETS.map((t) => (
                <Card key={t.id} padding={14}>
                    <View style={styles.ticketHead}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.ticketCode, { color: colors.ink500 }]}>
                                #{t.id} · {formatRelative(t.createdAt)}
                            </Text>
                            <Text style={[styles.ticketSubject, { color: colors.ink900 }]}>
                                {t.subject}
                            </Text>
                        </View>
                        <View
                            style={[
                                styles.priorityDot,
                                { backgroundColor: priorityColor(t.priority, colors) },
                            ]}
                        />
                    </View>
                    <View style={styles.ticketFoot}>
                        <StatusBadge status={STATUS_TO_UI[t.status]} />
                        <View style={styles.ticketMsg}>
                            <Icon name="msg" size={12} color={colors.ink500} />
                            <Text style={[styles.ticketMsgText, { color: colors.ink500 }]}>
                                {t.messages} messages
                            </Text>
                        </View>
                        <Text style={[styles.ticketLastUpdate, { color: colors.ink500 }]}>
                            · maj {formatRelative(t.lastUpdate)}
                        </Text>
                    </View>
                </Card>
            ))}
        </View>
    );
}

function NewTicketForm({
    subject,
    setSubject,
    category,
    setCategory,
    description,
    setDescription,
    submitting,
    onSubmit,
}: {
    subject: string;
    setSubject: (v: string) => void;
    category: CategoryId | null;
    setCategory: (v: CategoryId) => void;
    description: string;
    setDescription: (v: string) => void;
    submitting: boolean;
    onSubmit: () => void;
}) {
    const colors = useThemeColors();
    return (
        <View>
            <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                Catégorie
            </ThemedText>
            <View style={styles.catGrid}>
                {CATEGORIES.map((c) => {
                    const active = category === c.id;
                    return (
                        <Pressable
                            key={c.id}
                            onPress={() => setCategory(c.id)}
                            style={[
                                styles.catCard,
                                {
                                    backgroundColor: active ? colors.brand100 : colors.paper,
                                    borderColor: active ? colors.brand800 : colors.ink200,
                                },
                            ]}
                        >
                            <View
                                style={[
                                    styles.catIcon,
                                    {
                                        backgroundColor: active ? colors.brand800 : colors.paper2,
                                    },
                                ]}
                            >
                                <Icon
                                    name={c.icon}
                                    size={14}
                                    color={active ? colors.paper : colors.ink700}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.catLabel,
                                    {
                                        color: active ? colors.brand800 : colors.ink800,
                                    },
                                ]}
                            >
                                {c.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            <ThemedText
                variate="caps"
                color="ink500"
                style={[styles.sectionLabel, { marginTop: 16 }]}
            >
                Sujet
            </ThemedText>
            <View
                style={[
                    styles.inputWrap,
                    { backgroundColor: colors.paper, borderColor: colors.ink200 },
                ]}
            >
                <TextInput
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Ex. Problème avec ma commande"
                    placeholderTextColor={colors.ink400}
                    style={[styles.input, { color: colors.ink800 }]}
                />
            </View>

            <ThemedText
                variate="caps"
                color="ink500"
                style={[styles.sectionLabel, { marginTop: 16 }]}
            >
                Description
            </ThemedText>
            <View
                style={[
                    styles.textareaWrap,
                    { backgroundColor: colors.paper, borderColor: colors.ink200 },
                ]}
            >
                <TextInput
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Décrivez votre demande en détail…"
                    placeholderTextColor={colors.ink400}
                    multiline
                    style={[styles.textarea, { color: colors.ink800 }]}
                />
            </View>

            <Pressable
                onPress={onSubmit}
                disabled={submitting}
                style={[
                    styles.submit,
                    {
                        backgroundColor: colors.brand800,
                        opacity: submitting ? 0.6 : 1,
                    },
                ]}
            >
                <Text style={[styles.submitText, { color: colors.paper }]}>
                    {submitting ? "Envoi…" : "Envoyer le ticket"}
                </Text>
                <Icon name="arrowRight" size={16} color={colors.paper} stroke={2} />
            </Pressable>
        </View>
    );
}

function FAQ({
    expanded,
    setExpanded,
}: {
    expanded: number | null;
    setExpanded: (v: number | null) => void;
}) {
    const colors = useThemeColors();
    return (
        <View>
            <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                Questions fréquentes
            </ThemedText>
            <Card padding={0} style={{ overflow: "hidden" }}>
                {FAQ_ITEMS.map((it, i) => {
                    const open = expanded === i;
                    return (
                        <Fragment key={i}>
                            <Pressable
                                onPress={() => setExpanded(open ? null : i)}
                                style={styles.faqHeader}
                            >
                                <Text style={[styles.faqQ, { color: colors.ink900 }]}>
                                    {it.q}
                                </Text>
                                <Icon
                                    name={open ? "chevDown" : "chevRight"}
                                    size={14}
                                    color={colors.ink500}
                                />
                            </Pressable>
                            {open && (
                                <View
                                    style={[
                                        styles.faqBody,
                                        { backgroundColor: colors.paper2 },
                                    ]}
                                >
                                    <Text style={[styles.faqA, { color: colors.ink700 }]}>
                                        {it.a}
                                    </Text>
                                </View>
                            )}
                            {i < FAQ_ITEMS.length - 1 && (
                                <View
                                    style={[
                                        styles.faqDivider,
                                        { backgroundColor: colors.ink200 },
                                    ]}
                                />
                            )}
                        </Fragment>
                    );
                })}
            </Card>
        </View>
    );
}

function priorityColor(p: Priority, colors: ReturnType<typeof useThemeColors>) {
    if (p === "high") return colors.danger600;
    if (p === "medium") return colors.warn600;
    return colors.ok600;
}

function formatRelative(iso: string) {
    const d = new Date(iso);
    const today = new Date();
    const diffH = Math.round((today.getTime() - d.getTime()) / 3600000);
    if (diffH < 24) return `il y a ${diffH} h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `il y a ${diffD} j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
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

    // Contact CTAs
    heroRow: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 16,
    },
    contactCTA: {
        flex: 1,
        padding: 14,
        borderRadius: 12,
    },
    contactCTAHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    contactCTALabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    contactCTASub: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 6,
    },

    // Tabs
    tabsWrap: {
        marginBottom: 14,
    },
    tabs: { gap: 6 },
    tab: {
        paddingHorizontal: 13,
        paddingVertical: 7,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    tabText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
    },

    sectionLabel: {
        marginBottom: 8,
        paddingLeft: 2,
    },

    // Tickets
    ticketHead: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
    },
    ticketCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    ticketSubject: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
        marginTop: 3,
    },
    priorityDot: {
        width: 8,
        height: 8,
        borderRadius: 99,
        marginTop: 6,
    },
    ticketFoot: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 10,
    },
    ticketMsg: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    ticketMsgText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },
    ticketLastUpdate: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
    },

    // Categories grid
    catGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    catCard: {
        width: "30.5%",
        padding: 10,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        gap: 6,
    },
    catIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    catLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        textAlign: "center",
    },

    // Inputs
    inputWrap: {
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    input: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },
    textareaWrap: {
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 12,
        minHeight: 120,
    },
    textarea: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        textAlignVertical: "top",
        padding: 0,
    },
    submit: {
        marginTop: 18,
        paddingVertical: 14,
        paddingHorizontal: 18,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    submitText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },

    // FAQ
    faqHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 14,
        gap: 10,
    },
    faqQ: {
        flex: 1,
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    faqBody: {
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    faqA: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        lineHeight: 18,
    },
    faqDivider: {
        height: StyleSheet.hairlineWidth,
    },
});
