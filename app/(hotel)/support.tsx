import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

// Mock tickets data
const MOCK_TICKETS = [
    {
        id: '1',
        subject: 'Linge endommagé',
        category: 'complaint',
        status: 'open',
        priority: 'high',
        createdAt: '2024-01-22T10:30:00Z',
        lastUpdate: '2024-01-22T14:20:00Z',
        messages: 3,
    },
    {
        id: '2',
        subject: 'Question sur la facture INV-2024-002',
        category: 'billing',
        status: 'in_progress',
        priority: 'medium',
        createdAt: '2024-01-20T15:00:00Z',
        lastUpdate: '2024-01-21T09:15:00Z',
        messages: 5,
    },
    {
        id: '3',
        subject: 'Retard de livraison',
        category: 'delivery',
        status: 'resolved',
        priority: 'low',
        createdAt: '2024-01-18T08:45:00Z',
        lastUpdate: '2024-01-19T16:30:00Z',
        messages: 7,
    },
];

const TICKET_CATEGORIES = [
    { id: 'complaint', label: 'Réclamation', icon: '⚠️' },
    { id: 'billing', label: 'Facturation', icon: '💰' },
    { id: 'delivery', label: 'Livraison', icon: '🚚' },
    { id: 'quality', label: 'Qualité', icon: '✨' },
    { id: 'other', label: 'Autre', icon: '💬' },
];

const STATUS_COLORS = {
    open: '#FFA500',
    in_progress: '#1E90FF',
    resolved: '#228B22',
    closed: '#6B7280',
};

const STATUS_LABELS = {
    open: 'Ouvert',
    in_progress: 'En cours',
    resolved: 'Résolu',
    closed: 'Fermé',
};

const PRIORITY_COLORS = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
};

const FAQ_ITEMS = [
    {
        question: 'Quels sont les délais de traitement?',
        answer: 'Le délai standard est de 48h pour le lavage et pliage, 72h pour le nettoyage à sec.',
    },
    {
        question: 'Comment suivre ma commande?',
        answer: 'Rendez-vous dans "Mes Commandes" pour voir le statut en temps réel de vos commandes.',
    },
    {
        question: 'Que faire en cas de linge endommagé?',
        answer: 'Créez immédiatement un ticket de réclamation avec photos. Nous traiterons votre demande sous 24h.',
    },
    {
        question: 'Comment modifier mon planning de collecte?',
        answer: 'Contactez-nous par téléphone ou créez un ticket. Les modifications nécessitent un préavis de 48h.',
    },
];

export default function SupportScreen() {
    const colors = useThemeColors();
    const [activeTab, setActiveTab] = useState<'tickets' | 'new' | 'faq'>('tickets');
    const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);

    // New ticket form
    const [subject, setSubject] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmitTicket = () => {
        if (!subject || !category || !description) {
            Alert.alert('Erreur', 'Veuillez remplir tous les champs');
            return;
        }

        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            Alert.alert(
                'Ticket créé',
                'Votre demande a été enregistrée. Nous vous répondrons dans les plus brefs délais.',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            setSubject('');
                            setCategory('');
                            setDescription('');
                            setActiveTab('tickets');
                        },
                    },
                ]
            );
        }, 1000);
    };

    const renderTicketsList = () => (
        <View>
            {MOCK_TICKETS.map(ticket => (
                <TouchableOpacity
                    key={ticket.id}
                    onPress={() => {
                        // TODO: Navigate to ticket details
                    }}
                >
                    <Card style={styles.ticketCard}>
                        <View style={styles.ticketHeader}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="subtitle2" color="textPrimary">
                                    {ticket.subject}
                                </ThemedText>
                                <ThemedText variate="caption" color="textSecondary">
                                    #{ticket.id} • {new Date(ticket.createdAt).toLocaleDateString('fr-FR')}
                                </ThemedText>
                            </View>
                            <View
                                style={[
                                    styles.priorityBadge,
                                    { backgroundColor: PRIORITY_COLORS[ticket.priority] },
                                ]}
                            />
                        </View>

                        <View style={styles.ticketMeta}>
                            <View
                                style={[
                                    styles.statusBadge,
                                    { backgroundColor: STATUS_COLORS[ticket.status] + '20' },
                                ]}
                            >
                                <Text style={[styles.statusText, { color: STATUS_COLORS[ticket.status] }]}>
                                    {STATUS_LABELS[ticket.status]}
                                </Text>
                            </View>
                            <View style={styles.messagesCount}>
                                <Text style={styles.messageIcon}>💬</Text>
                                <ThemedText variate="caption" color="textSecondary">
                                    {ticket.messages} messages
                                </ThemedText>
                            </View>
                        </View>

                        <ThemedText variate="caption" color="textSecondary">
                            Dernière mise à jour: {new Date(ticket.lastUpdate).toLocaleDateString('fr-FR')}
                        </ThemedText>
                    </Card>
                </TouchableOpacity>
            ))}

            {MOCK_TICKETS.length === 0 && (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📭</Text>
                    <ThemedText variate="subtitle2" color="textSecondary">
                        Aucun ticket
                    </ThemedText>
                    <ThemedText variate="body3" color="textSecondary">
                        Vous n'avez aucun ticket en cours
                    </ThemedText>
                </View>
            )}
        </View>
    );

    const renderNewTicket = () => (
        <View>
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Créer un ticket
                </ThemedText>

                <Input
                    label="Sujet"
                    placeholder="Ex: Problème avec ma commande"
                    value={subject}
                    onChangeText={setSubject}
                    leftIcon={<Text>📝</Text>}
                />

                <View style={{ marginBottom: Spacing.md }}>
                    <ThemedText variate="body3" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
                        Catégorie
                    </ThemedText>
                    <View style={styles.categoriesGrid}>
                        {TICKET_CATEGORIES.map(cat => (
                            <TouchableOpacity
                                key={cat.id}
                                style={[
                                    styles.categoryCard,
                                    {
                                        backgroundColor: category === cat.id
                                            ? colors.hotelPrimary + '20'
                                            : colors.surface,
                                        borderColor: category === cat.id
                                            ? colors.hotelPrimary
                                            : colors.border,
                                    },
                                ]}
                                onPress={() => setCategory(cat.id)}
                            >
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <ThemedText
                                    variate="caption"
                                    color="textPrimary"
                                    style={styles.categoryLabel}
                                >
                                    {cat.label}
                                </ThemedText>
                                {category === cat.id && (
                                    <View style={[styles.checkmark, { backgroundColor: colors.hotelPrimary }]}>
                                        <Text style={styles.checkmarkIcon}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={{ marginBottom: Spacing.md }}>
                    <ThemedText variate="body3" color="textSecondary" style={{ marginBottom: Spacing.sm }}>
                        Description
                    </ThemedText>
                    <TextInput
                        style={[
                            styles.textArea,
                            {
                                backgroundColor: colors.surface,
                                borderColor: colors.border,
                                color: colors.textPrimary,
                            },
                        ]}
                        placeholder="Décrivez votre demande en détail..."
                        placeholderTextColor={colors.textSecondary}
                        value={description}
                        onChangeText={setDescription}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </View>

                <Button
                    title="Envoyer"
                    onPress={handleSubmitTicket}
                    loading={loading}
                />
            </Card>

            <Card style={{ backgroundColor: '#F3F4F6', marginTop: Spacing.md }}>
                <ThemedText variate="subtitle2" color="textPrimary" style={styles.sectionTitle}>
                    Contact direct
                </ThemedText>
                <TouchableOpacity style={styles.contactOption}>
                    <Text style={styles.contactIcon}>📞</Text>
                    <View>
                        <ThemedText variate="body2" color="textPrimary">
                            Téléphone
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            +221 33 123 45 67
                        </ThemedText>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.contactOption}>
                    <Text style={styles.contactIcon}>✉️</Text>
                    <View>
                        <ThemedText variate="body2" color="textPrimary">
                            Email
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            support@laundryking.sn
                        </ThemedText>
                    </View>
                </TouchableOpacity>
            </Card>
        </View>
    );

    const renderFAQ = () => (
        <View>
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Questions fréquentes
                </ThemedText>
                {FAQ_ITEMS.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        style={styles.faqItem}
                        onPress={() => setExpandedFAQ(expandedFAQ === index ? null : index)}
                    >
                        <View style={styles.faqQuestion}>
                            <Text style={styles.faqIcon}>❓</Text>
                            <ThemedText variate="body2" color="textPrimary" style={{ flex: 1 }}>
                                {item.question}
                            </ThemedText>
                            <Text style={styles.expandIcon}>
                                {expandedFAQ === index ? '▼' : '▶'}
                            </Text>
                        </View>
                        {expandedFAQ === index && (
                            <View style={styles.faqAnswer}>
                                <ThemedText variate="body3" color="textSecondary">
                                    {item.answer}
                                </ThemedText>
                            </View>
                        )}
                    </TouchableOpacity>
                ))}
            </Card>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <ThemedText variate="headline" color="textPrimary">
                    Support & Aide
                </ThemedText>
            </View>

            {/* Tabs */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tabsContainer}
                contentContainerStyle={styles.tabsContent}
            >
                <TouchableOpacity
                    style={[
                        styles.tab,
                        {
                            backgroundColor: activeTab === 'tickets'
                                ? colors.hotelPrimary
                                : colors.surface,
                            borderColor: activeTab === 'tickets'
                                ? colors.hotelPrimary
                                : colors.border,
                        },
                    ]}
                    onPress={() => setActiveTab('tickets')}
                >
                    <Text style={styles.tabText}>
                        {activeTab === 'tickets' ? '🎫' : '🎫'}
                    </Text>
                    <Text
                        style={[
                            styles.tabLabel,
                            { color: activeTab === 'tickets' ? '#FFFFFF' : colors.textPrimary },
                        ]}
                    >
                        Mes tickets
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        {
                            backgroundColor: activeTab === 'new'
                                ? colors.hotelPrimary
                                : colors.surface,
                            borderColor: activeTab === 'new'
                                ? colors.hotelPrimary
                                : colors.border,
                        },
                    ]}
                    onPress={() => setActiveTab('new')}
                >
                    <Text style={styles.tabText}>➕</Text>
                    <Text
                        style={[
                            styles.tabLabel,
                            { color: activeTab === 'new' ? '#FFFFFF' : colors.textPrimary },
                        ]}
                    >
                        Nouveau ticket
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[
                        styles.tab,
                        {
                            backgroundColor: activeTab === 'faq'
                                ? colors.hotelPrimary
                                : colors.surface,
                            borderColor: activeTab === 'faq'
                                ? colors.hotelPrimary
                                : colors.border,
                        },
                    ]}
                    onPress={() => setActiveTab('faq')}
                >
                    <Text style={styles.tabText}>❓</Text>
                    <Text
                        style={[
                            styles.tabLabel,
                            { color: activeTab === 'faq' ? '#FFFFFF' : colors.textPrimary },
                        ]}
                    >
                        FAQ
                    </Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Content */}
            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.contentContainer}
            >
                {activeTab === 'tickets' && renderTicketsList()}
                {activeTab === 'new' && renderNewTicket()}
                {activeTab === 'faq' && renderFAQ()}
            </ScrollView>
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
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    tabsContainer: {
        maxHeight: 60,
        marginBottom: Spacing.md,
    },
    tabsContent: {
        paddingHorizontal: Spacing.padding.screen,
        gap: Spacing.sm,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.full,
        borderWidth: 1,
        gap: Spacing.xs,
    },
    tabText: {
        fontSize: 18,
    },
    tabLabel: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.medium,
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.padding.screen,
        paddingBottom: Spacing.xxxl,
    },
    ticketCard: {
        marginBottom: Spacing.md,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    priorityBadge: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    ticketMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: Spacing.borderRadius.sm,
    },
    statusText: {
        fontSize: Typography.fontSize.xs,
        fontWeight: Typography.fontWeight.semibold,
    },
    messagesCount: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    messageIcon: {
        fontSize: 14,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.huge,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    categoriesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    categoryCard: {
        width: '30%',
        padding: Spacing.md,
        borderRadius: Spacing.borderRadius.md,
        borderWidth: 2,
        alignItems: 'center',
        position: 'relative',
    },
    categoryIcon: {
        fontSize: 24,
        marginBottom: Spacing.xs,
    },
    categoryLabel: {
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 4,
        right: 4,
        width: 18,
        height: 18,
        borderRadius: 9,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkIcon: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    textArea: {
        borderWidth: 1,
        borderRadius: Spacing.borderRadius.md,
        padding: Spacing.md,
        fontSize: Typography.fontSize.sm,
        minHeight: 120,
    },
    contactOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    contactIcon: {
        fontSize: 24,
    },
    faqItem: {
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingVertical: Spacing.md,
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    faqIcon: {
        fontSize: 20,
    },
    expandIcon: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    faqAnswer: {
        marginTop: Spacing.sm,
        marginLeft: 28,
        padding: Spacing.md,
        backgroundColor: '#F9FAFB',
        borderRadius: Spacing.borderRadius.md,
    },
});
