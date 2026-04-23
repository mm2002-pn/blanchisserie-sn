import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    SafeAreaView,
    TextInput,
    FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

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

export default function MessagesScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [activeTab, setActiveTab] = useState<'messages' | 'incidents' | 'checklist'>('messages');
    const [messageInput, setMessageInput] = useState('');
    const [incidentSubject, setIncidentSubject] = useState('');
    const [incidentDescription, setIncidentDescription] = useState('');

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            sender: 'Superviseur',
            text: 'Bonjour! N\'oubliez pas de prendre des photos à chaque collecte.',
            time: '08:15',
            isOwn: false,
            isUrgent: true,
        },
        {
            id: '2',
            sender: 'Vous',
            text: 'Compris, merci!',
            time: '08:17',
            isOwn: true,
        },
        {
            id: '3',
            sender: 'Équipe',
            text: 'Le client King Fahd Palace a une livraison supplémentaire.',
            time: '09:30',
            isOwn: false,
        },
        {
            id: '4',
            sender: 'Vous',
            text: 'OK, je vais m\'en occuper.',
            time: '09:32',
            isOwn: true,
        },
    ]);

    const [checklist, setChecklist] = useState<ChecklistItem[]>([
        { id: '1', text: 'Vérifier le niveau de carburant', completed: true },
        { id: '2', text: 'Nettoyer le véhicule', completed: true },
        { id: '3', text: 'Charger le téléphone', completed: true },
        { id: '4', text: 'Préparer les documents de collecte', completed: false },
        { id: '5', text: 'Vérifier les équipements (scanner, appareil photo)', completed: false },
        { id: '6', text: 'Confirmer toutes les adresses de livraison', completed: false },
    ]);

    const handleSendMessage = () => {
        if (messageInput.trim()) {
            const newMessage: Message = {
                id: Date.now().toString(),
                sender: 'Vous',
                text: messageInput,
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
                isOwn: true,
            };
            setMessages([...messages, newMessage]);
            setMessageInput('');
        }
    };

    const handleToggleChecklistItem = (id: string) => {
        setChecklist(checklist.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        ));
    };

    const completedCount = checklist.filter(item => item.completed).length;
    const totalCount = checklist.length;
    const progress = (completedCount / totalCount) * 100;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText variate="headline" color="textPrimary">
                    Communications
                </ThemedText>
            </View>

            {/* Tabs */}
            <View style={styles.tabsContainer}>
                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'messages' && { borderBottomColor: colors.driverPrimary, borderBottomWidth: 3 },
                    ]}
                    onPress={() => setActiveTab('messages')}
                >
                    <Text style={styles.tabIcon}>💬</Text>
                    <ThemedText
                        variate="body3"
                        style={{
                            color: activeTab === 'messages' ? colors.driverPrimary : colors.textSecondary,
                            fontWeight: activeTab === 'messages' ? Typography.fontWeight.semibold : Typography.fontWeight.regular,
                        }}
                    >
                        Messages
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'incidents' && { borderBottomColor: colors.driverPrimary, borderBottomWidth: 3 },
                    ]}
                    onPress={() => setActiveTab('incidents')}
                >
                    <Text style={styles.tabIcon}>⚠️</Text>
                    <ThemedText
                        variate="body3"
                        style={{
                            color: activeTab === 'incidents' ? colors.driverPrimary : colors.textSecondary,
                            fontWeight: activeTab === 'incidents' ? Typography.fontWeight.semibold : Typography.fontWeight.regular,
                        }}
                    >
                        Incidents
                    </ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        activeTab === 'checklist' && { borderBottomColor: colors.driverPrimary, borderBottomWidth: 3 },
                    ]}
                    onPress={() => setActiveTab('checklist')}
                >
                    <Text style={styles.tabIcon}>✓</Text>
                    <ThemedText
                        variate="body3"
                        style={{
                            color: activeTab === 'checklist' ? colors.driverPrimary : colors.textSecondary,
                            fontWeight: activeTab === 'checklist' ? Typography.fontWeight.semibold : Typography.fontWeight.regular,
                        }}
                    >
                        Checklist
                    </ThemedText>
                </TouchableOpacity>
            </View>

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={messages}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.messagesList}
                        renderItem={({ item }) => (
                            <View
                                style={[
                                    styles.messageItem,
                                    item.isOwn && styles.messageItemOwn,
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        item.isOwn && { backgroundColor: colors.driverPrimary },
                                        !item.isOwn && { backgroundColor: '#F3F4F6' },
                                        item.isUrgent && !item.isOwn && { borderColor: '#DC2626', borderWidth: 2 },
                                    ]}
                                >
                                    {!item.isOwn && (
                                        <ThemedText
                                            variate="caption"
                                            style={{
                                                color: item.isUrgent ? '#DC2626' : colors.driverPrimary,
                                                fontWeight: Typography.fontWeight.semibold,
                                                marginBottom: Spacing.xs,
                                            }}
                                        >
                                            {item.sender} {item.isUrgent && '🔴'}
                                        </ThemedText>
                                    )}
                                    <ThemedText
                                        variate="body3"
                                        style={{ color: item.isOwn ? '#FFFFFF' : colors.textPrimary }}
                                    >
                                        {item.text}
                                    </ThemedText>
                                    <ThemedText
                                        variate="caption"
                                        style={{
                                            color: item.isOwn ? '#FFFFFF' : colors.textSecondary,
                                            marginTop: Spacing.xs,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {item.time}
                                    </ThemedText>
                                </View>
                            </View>
                        )}
                    />

                    {/* Message Input */}
                    <View style={[styles.inputContainer, { borderTopColor: colors.border }]}>
                        <TextInput
                            style={[styles.messageInput, { color: colors.textPrimary, borderColor: colors.border }]}
                            placeholder="Écrire un message..."
                            placeholderTextColor={colors.textSecondary}
                            value={messageInput}
                            onChangeText={setMessageInput}
                            multiline
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, { backgroundColor: colors.driverPrimary }]}
                            onPress={handleSendMessage}
                        >
                            <Text style={styles.sendButtonText}>➤</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Incidents Tab */}
            {activeTab === 'incidents' && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                    <Card style={styles.incidentCard}>
                        <View style={styles.incidentHeader}>
                            <Text style={styles.incidentIcon}>⚠️</Text>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Signaler un incident
                            </ThemedText>
                        </View>

                        <ThemedText variate="caption" color="textSecondary" style={{ marginBottom: Spacing.md }}>
                            Utilisez ce formulaire pour signaler tout problème rencontré pendant votre tournée.
                        </ThemedText>

                        <View style={styles.incidentForm}>
                            <ThemedText variate="body3" color="textPrimary" style={{ marginBottom: Spacing.xs }}>
                                Type d'incident
                            </ThemedText>
                            <TextInput
                                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="Ex: Retard, Véhicule en panne, Client absent..."
                                placeholderTextColor={colors.textSecondary}
                                value={incidentSubject}
                                onChangeText={setIncidentSubject}
                            />

                            <ThemedText variate="body3" color="textPrimary" style={{ marginBottom: Spacing.xs, marginTop: Spacing.md }}>
                                Description détaillée
                            </ThemedText>
                            <TextInput
                                style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border }]}
                                placeholder="Décrivez l'incident en détail..."
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                numberOfLines={6}
                                value={incidentDescription}
                                onChangeText={setIncidentDescription}
                            />

                            <TouchableOpacity
                                style={[styles.reportButton, { backgroundColor: '#DC2626' }]}
                            >
                                <Text style={styles.reportButtonText}>📢 Envoyer le rapport</Text>
                            </TouchableOpacity>
                        </View>
                    </Card>

                    {/* Recent Incidents */}
                    <View style={styles.recentIncidents}>
                        <ThemedText variate="subtitle2" color="textPrimary" style={{ marginBottom: Spacing.md }}>
                            Incidents récents
                        </ThemedText>

                        <Card style={styles.incidentItem}>
                            <View style={styles.incidentItemHeader}>
                                <View style={[styles.incidentBadge, { backgroundColor: '#FEF2F2' }]}>
                                    <Text style={[styles.incidentBadgeText, { color: '#DC2626' }]}>
                                        Résolu
                                    </Text>
                                </View>
                                <ThemedText variate="caption" color="textSecondary">
                                    23 Déc 2024, 14:30
                                </ThemedText>
                            </View>
                            <ThemedText variate="subtitle3" color="textPrimary" style={{ marginTop: Spacing.xs }}>
                                Client absent
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Le client Hôtel Teranga était absent. J'ai laissé un avis de passage.
                            </ThemedText>
                        </Card>

                        <Card style={styles.incidentItem}>
                            <View style={styles.incidentItemHeader}>
                                <View style={[styles.incidentBadge, { backgroundColor: '#FFF7ED' }]}>
                                    <Text style={[styles.incidentBadgeText, { color: '#EA580C' }]}>
                                        En cours
                                    </Text>
                                </View>
                                <ThemedText variate="caption" color="textSecondary">
                                    22 Déc 2024, 09:15
                                </ThemedText>
                            </View>
                            <ThemedText variate="subtitle3" color="textPrimary" style={{ marginTop: Spacing.xs }}>
                                Embouteillage
                            </ThemedText>
                            <ThemedText variate="caption" color="textSecondary">
                                Retard de 30 minutes dû à un embouteillage sur la Corniche.
                            </ThemedText>
                        </Card>
                    </View>
                </ScrollView>
            )}

            {/* Checklist Tab */}
            {activeTab === 'checklist' && (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
                    {/* Progress Card */}
                    <Card style={styles.progressCard}>
                        <View style={styles.progressHeader}>
                            <ThemedText variate="subtitle2" color="textPrimary">
                                Checklist du jour
                            </ThemedText>
                            <ThemedText variate="subtitle2" style={{ color: colors.driverPrimary }}>
                                {completedCount}/{totalCount}
                            </ThemedText>
                        </View>
                        <View style={styles.progressBar}>
                            <View
                                style={[
                                    styles.progressFill,
                                    {
                                        width: `${progress}%`,
                                        backgroundColor: colors.driverPrimary,
                                    },
                                ]}
                            />
                        </View>
                        <ThemedText variate="caption" color="textSecondary" style={{ marginTop: Spacing.sm }}>
                            Complétez tous les items avant de commencer votre tournée
                        </ThemedText>
                    </Card>

                    {/* Checklist Items */}
                    <Card style={styles.checklistCard}>
                        {checklist.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.checklistItem}
                                onPress={() => handleToggleChecklistItem(item.id)}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        item.completed && { backgroundColor: colors.driverPrimary },
                                    ]}
                                >
                                    {item.completed && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                                <ThemedText
                                    variate="body3"
                                    style={{
                                        color: item.completed ? colors.textSecondary : colors.textPrimary,
                                        textDecorationLine: item.completed ? 'line-through' : 'none',
                                        flex: 1,
                                    }}
                                >
                                    {item.text}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}
                    </Card>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.padding.screen,
        paddingTop: Spacing.xl,
        paddingBottom: Spacing.md,
    },
    tabsContainer: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingVertical: Spacing.md,
        borderBottomWidth: 3,
        borderBottomColor: 'transparent',
    },
    tabIcon: {
        fontSize: 20,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    messagesList: {
        padding: Spacing.padding.screen,
        paddingBottom: Spacing.lg,
    },
    messageItem: {
        marginBottom: Spacing.md,
        alignItems: 'flex-start',
    },
    messageItemOwn: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        maxWidth: '75%',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: Spacing.sm,
        padding: Spacing.padding.screen,
        borderTopWidth: 1,
        backgroundColor: '#FFFFFF',
    },
    messageInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: Typography.fontSize.sm,
        maxHeight: 100,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 20,
    },
    incidentCard: {
        marginBottom: Spacing.lg,
    },
    incidentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    incidentIcon: {
        fontSize: 28,
    },
    incidentForm: {
        marginTop: Spacing.md,
    },
    input: {
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.sm,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    reportButton: {
        marginTop: Spacing.lg,
        paddingVertical: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        alignItems: 'center',
    },
    reportButtonText: {
        color: '#FFFFFF',
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    recentIncidents: {
        marginTop: Spacing.lg,
    },
    incidentItem: {
        marginBottom: Spacing.md,
    },
    incidentItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    incidentBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: 2,
        borderRadius: Spacing.borderRadius.sm,
    },
    incidentBadgeText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    progressCard: {
        marginBottom: Spacing.lg,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    checklistCard: {
        padding: 0,
    },
    checklistItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: Typography.fontWeight.bold,
    },
});
