import { useState } from "react";
import {
    FlatList,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

type Tab = "messages" | "incidents" | "checklist";

type Message = {
    id: string;
    sender: string;
    text: string;
    time: string;
    isOwn: boolean;
    isUrgent?: boolean;
};

type ChecklistItem = {
    id: string;
    text: string;
    completed: boolean;
};

const TABS: { key: Tab; label: string; icon: IconName }[] = [
    { key: "messages", label: "Messages", icon: "msg" },
    { key: "incidents", label: "Incidents", icon: "alert" },
    { key: "checklist", label: "Checklist", icon: "check" },
];

export default function MessagesScreen() {
    const colors = useThemeColors();

    const [activeTab, setActiveTab] = useState<Tab>("messages");
    const [messageInput, setMessageInput] = useState("");
    const [incidentSubject, setIncidentSubject] = useState("");
    const [incidentDescription, setIncidentDescription] = useState("");

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "Superviseur",
            text: "Bonjour ! N'oubliez pas de prendre des photos à chaque collecte.",
            time: "08:15",
            isOwn: false,
            isUrgent: true,
        },
        {
            id: "2",
            sender: "Vous",
            text: "Compris, merci.",
            time: "08:17",
            isOwn: true,
        },
        {
            id: "3",
            sender: "Équipe",
            text: "Le client King Fahd Palace a une livraison supplémentaire.",
            time: "09:30",
            isOwn: false,
        },
        {
            id: "4",
            sender: "Vous",
            text: "OK, je vais m'en occuper.",
            time: "09:32",
            isOwn: true,
        },
    ]);

    const [checklist, setChecklist] = useState<ChecklistItem[]>([
        { id: "1", text: "Vérifier le niveau de carburant", completed: true },
        { id: "2", text: "Nettoyer le véhicule", completed: true },
        { id: "3", text: "Charger le téléphone", completed: true },
        { id: "4", text: "Préparer les documents de collecte", completed: false },
        { id: "5", text: "Vérifier scanner et appareil photo", completed: false },
        { id: "6", text: "Confirmer les adresses de livraison", completed: false },
    ]);

    const handleSendMessage = () => {
        if (!messageInput.trim()) return;
        const newMessage: Message = {
            id: Date.now().toString(),
            sender: "Vous",
            text: messageInput,
            time: new Date().toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
            }),
            isOwn: true,
        };
        setMessages((prev) => [...prev, newMessage]);
        setMessageInput("");
    };

    const toggleChecklistItem = (id: string) => {
        setChecklist((prev) =>
            prev.map((it) =>
                it.id === id ? { ...it, completed: !it.completed } : it,
            ),
        );
    };

    const completedCount = checklist.filter((it) => it.completed).length;
    const progress = completedCount / checklist.length;

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
                <ThemedText variate="title">Communications</ThemedText>
            </View>

            {/* Pill tabs */}
            <View
                style={[
                    styles.tabsWrapper,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                {TABS.map((t) => {
                    const active = activeTab === t.key;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => setActiveTab(t.key)}
                            style={[
                                styles.tab,
                                {
                                    backgroundColor: active ? colors.brand800 : colors.paper2,
                                    borderColor: active ? colors.brand800 : colors.ink200,
                                },
                            ]}
                        >
                            <Icon
                                name={t.icon}
                                size={13}
                                color={active ? colors.paper : colors.ink700}
                            />
                            <Text
                                style={[
                                    styles.tabLabel,
                                    { color: active ? colors.paper : colors.ink700 },
                                ]}
                            >
                                {t.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {/* Messages */}
            {activeTab === "messages" && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={styles.messagesList}
                        renderItem={({ item }) => <Bubble message={item} />}
                    />

                    <View
                        style={[
                            styles.inputBar,
                            {
                                backgroundColor: colors.paper,
                                borderTopColor: colors.ink200,
                            },
                        ]}
                    >
                        <TextInput
                            value={messageInput}
                            onChangeText={setMessageInput}
                            placeholder="Écrire un message…"
                            placeholderTextColor={colors.ink400}
                            multiline
                            style={[
                                styles.messageInput,
                                {
                                    backgroundColor: colors.paper2,
                                    borderColor: colors.ink200,
                                    color: colors.ink900,
                                },
                            ]}
                        />
                        <Pressable
                            onPress={handleSendMessage}
                            style={[
                                styles.sendBtn,
                                { backgroundColor: colors.brand800 },
                            ]}
                        >
                            <Icon name="arrowRight" size={15} color={colors.paper} />
                        </Pressable>
                    </View>
                </View>
            )}

            {/* Incidents */}
            {activeTab === "incidents" && (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Card padding={16} style={{ marginBottom: 14 }}>
                        <View style={styles.incidentHead}>
                            <View
                                style={[
                                    styles.incidentIcon,
                                    { backgroundColor: colors.danger100 },
                                ]}
                            >
                                <Icon name="alert" size={14} color={colors.danger600} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.incidentTitle, { color: colors.ink900 }]}
                                >
                                    Signaler un incident
                                </Text>
                                <Text
                                    style={[styles.incidentSub, { color: colors.ink500 }]}
                                >
                                    Retard, panne, client absent, etc.
                                </Text>
                            </View>
                        </View>

                        <Text style={[styles.fieldLabel, { color: colors.ink700 }]}>
                            Type d'incident
                        </Text>
                        <TextInput
                            value={incidentSubject}
                            onChangeText={setIncidentSubject}
                            placeholder="Ex : Véhicule en panne"
                            placeholderTextColor={colors.ink400}
                            style={[
                                styles.input,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.ink200,
                                    color: colors.ink900,
                                },
                            ]}
                        />

                        <Text
                            style={[
                                styles.fieldLabel,
                                { color: colors.ink700, marginTop: 12 },
                            ]}
                        >
                            Description détaillée
                        </Text>
                        <TextInput
                            value={incidentDescription}
                            onChangeText={setIncidentDescription}
                            placeholder="Décrivez l'incident en détail…"
                            placeholderTextColor={colors.ink400}
                            multiline
                            numberOfLines={5}
                            style={[
                                styles.textArea,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: colors.ink200,
                                    color: colors.ink900,
                                },
                            ]}
                        />

                        <Pressable
                            style={[
                                styles.reportBtn,
                                { backgroundColor: colors.danger600 },
                            ]}
                        >
                            <Icon name="alert" size={14} color={colors.paper} />
                            <Text
                                style={[styles.reportBtnText, { color: colors.paper }]}
                            >
                                Envoyer le rapport
                            </Text>
                        </Pressable>
                    </Card>

                    <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                        Incidents récents
                    </ThemedText>

                    <View style={{ gap: 10 }}>
                        <IncidentRow
                            status="Validée"
                            title="Client absent"
                            desc="Le client Hôtel Teranga était absent. J'ai laissé un avis de passage."
                            date="23 déc. 2024 · 14:30"
                        />
                        <IncidentRow
                            status="En attente"
                            title="Embouteillage"
                            desc="Retard de 30 minutes dû à un embouteillage sur la Corniche."
                            date="22 déc. 2024 · 09:15"
                        />
                    </View>
                </ScrollView>
            )}

            {/* Checklist */}
            {activeTab === "checklist" && (
                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Card padding={16} style={{ marginBottom: 14 }}>
                        <View style={styles.checklistHeader}>
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.checklistTitle, { color: colors.ink900 }]}
                                >
                                    Checklist du jour
                                </Text>
                                <Text
                                    style={[styles.checklistSub, { color: colors.ink500 }]}
                                >
                                    À compléter avant la tournée
                                </Text>
                            </View>
                            <Text
                                style={[styles.checklistCount, { color: colors.ink900 }]}
                            >
                                {completedCount}
                                <Text
                                    style={[
                                        styles.checklistDiv,
                                        { color: colors.ink500 },
                                    ]}
                                >
                                    {` / ${checklist.length}`}
                                </Text>
                            </Text>
                        </View>
                        <View
                            style={[styles.progressBar, { backgroundColor: colors.ink200 }]}
                        >
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress * 100}%`,
                                        backgroundColor: colors.baobab600,
                                    },
                                ]}
                            />
                        </View>
                    </Card>

                    <Card padding={0} style={{ overflow: "hidden" }}>
                        {checklist.map((item, i) => (
                            <Pressable
                                key={item.id}
                                onPress={() => toggleChecklistItem(item.id)}
                                style={[
                                    styles.checklistRow,
                                    i < checklist.length - 1 && {
                                        borderBottomColor: colors.ink200,
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            backgroundColor: item.completed
                                                ? colors.baobab600
                                                : "transparent",
                                            borderColor: item.completed
                                                ? colors.baobab600
                                                : colors.ink300,
                                        },
                                    ]}
                                >
                                    {item.completed && (
                                        <Icon name="check" size={12} color={colors.paper} />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.checklistText,
                                        {
                                            color: item.completed
                                                ? colors.ink500
                                                : colors.ink900,
                                            textDecorationLine: item.completed
                                                ? "line-through"
                                                : "none",
                                        },
                                    ]}
                                >
                                    {item.text}
                                </Text>
                            </Pressable>
                        ))}
                    </Card>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

/* ---------- sous-composants ---------- */

function Bubble({ message }: { message: Message }) {
    const colors = useThemeColors();
    const own = message.isOwn;
    const urgent = message.isUrgent;

    return (
        <View style={[styles.bubbleRow, own && styles.bubbleRowOwn]}>
            <View
                style={[
                    styles.bubble,
                    {
                        backgroundColor: own ? colors.brand800 : colors.paper,
                        borderColor: urgent && !own ? colors.danger600 : colors.ink200,
                        borderWidth: urgent && !own ? 1.5 : StyleSheet.hairlineWidth,
                    },
                ]}
            >
                {!own && (
                    <View style={styles.bubbleSender}>
                        <Text
                            style={[
                                styles.bubbleSenderText,
                                {
                                    color: urgent ? colors.danger600 : colors.brand800,
                                },
                            ]}
                        >
                            {message.sender}
                        </Text>
                        {urgent && (
                            <View
                                style={[
                                    styles.urgentDot,
                                    { backgroundColor: colors.danger600 },
                                ]}
                            />
                        )}
                    </View>
                )}
                <Text
                    style={[
                        styles.bubbleText,
                        { color: own ? colors.paper : colors.ink900 },
                    ]}
                >
                    {message.text}
                </Text>
                <Text
                    style={[
                        styles.bubbleTime,
                        {
                            color: own ? colors.brand100 : colors.ink500,
                        },
                    ]}
                >
                    {message.time}
                </Text>
            </View>
        </View>
    );
}

function IncidentRow({
    status,
    title,
    desc,
    date,
}: {
    status: "Validée" | "En attente" | "En retard";
    title: string;
    desc: string;
    date: string;
}) {
    const colors = useThemeColors();
    return (
        <Card padding={14}>
            <View style={styles.incidentRowHead}>
                <StatusBadge status={status} />
                <Text style={[styles.incidentDate, { color: colors.ink500 }]}>
                    {date}
                </Text>
            </View>
            <Text style={[styles.incidentRowTitle, { color: colors.ink900 }]}>
                {title}
            </Text>
            <Text style={[styles.incidentRowDesc, { color: colors.ink600 }]}>
                {desc}
            </Text>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    // Tabs
    tabsWrapper: {
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 5,
        paddingVertical: 9,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    tabLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    // Messages
    messagesList: { padding: 16, paddingBottom: 16 },
    bubbleRow: { marginBottom: 10, alignItems: "flex-start" },
    bubbleRowOwn: { alignItems: "flex-end" },
    bubble: {
        maxWidth: "80%",
        padding: 12,
        borderRadius: 14,
    },
    bubbleSender: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginBottom: 4,
    },
    bubbleSenderText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },
    urgentDot: { width: 6, height: 6, borderRadius: 3 },
    bubbleText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        lineHeight: Typography.fontSize.sm * 1.45,
    },
    bubbleTime: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 4,
    },

    inputBar: {
        flexDirection: "row",
        alignItems: "flex-end",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    messageInput: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        maxHeight: 100,
    },
    sendBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },

    // Incidents
    incidentHead: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    incidentIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    incidentTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    incidentSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    fieldLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 5,
    },
    input: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    textArea: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        minHeight: 96,
        textAlignVertical: "top",
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
    },
    reportBtn: {
        marginTop: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 10,
    },
    reportBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    incidentRowHead: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    incidentDate: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    incidentRowTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    incidentRowDesc: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },

    // Checklist
    checklistHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    checklistTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    checklistSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    checklistCount: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 18,
    },
    checklistDiv: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },

    checklistRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 6,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    checklistText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
});
