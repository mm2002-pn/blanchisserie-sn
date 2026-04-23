import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    Alert,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Card from '@/components/ui/Card';
import ThemedText from '@/components/ui/ThemedText';
import Button from '@/components/ui/Button';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();

    // Settings state
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [smsNotifications, setSmsNotifications] = useState(false);
    const [productionAlerts, setProductionAlerts] = useState(true);
    const [qualityAlerts, setQualityAlerts] = useState(true);

    const handleLogout = () => {
        Alert.alert(
            'Déconnexion',
            'Êtes-vous sûr de vouloir vous déconnecter?',
            [
                {
                    text: 'Annuler',
                    style: 'cancel',
                },
                {
                    text: 'Déconnexion',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                        router.replace('/(auth)/sign-in');
                    },
                },
            ]
        );
    };

    const handleEditProfile = () => {
        Alert.alert('Modifier le profil', 'Fonctionnalité en cours de développement');
    };

    const handleChangePassword = () => {
        router.push('/(auth)/change-password');
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.content}
            >
            {/* Header with Avatar */}
            <View style={styles.header}>
                <View style={[styles.avatar, { backgroundColor: colors.supervisorPrimary }]}>
                    <Text style={styles.avatarText}>
                        {user?.name?.charAt(0).toUpperCase() || 'S'}
                    </Text>
                </View>
                <ThemedText variate="headline" color="textPrimary">
                    {user?.name || 'Superviseur'}
                </ThemedText>
                <ThemedText variate="body3" color="textSecondary">
                    {user?.email}
                </ThemedText>
                <TouchableOpacity
                    style={[styles.editButton, { borderColor: colors.supervisorPrimary }]}
                    onPress={handleEditProfile}
                >
                    <Text style={[styles.editButtonText, { color: colors.supervisorPrimary }]}>
                        ✏️ Modifier le profil
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Supervisor Information */}
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Informations personnelles
                </ThemedText>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>👤</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="caption" color="textSecondary">
                            Nom complet
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            {user?.name || 'Superviseur Production'}
                        </ThemedText>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>📞</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="caption" color="textSecondary">
                            Téléphone
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            {user?.phone || '+221 77 123 45 67'}
                        </ThemedText>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>✉️</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="caption" color="textSecondary">
                            Email
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            {user?.email}
                        </ThemedText>
                    </View>
                </View>
                <View style={styles.infoRow}>
                    <Text style={styles.infoIcon}>🏭</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="caption" color="textSecondary">
                            Département
                        </ThemedText>
                        <ThemedText variate="body2" color="textPrimary">
                            Production et Qualité
                        </ThemedText>
                    </View>
                </View>
            </Card>

            {/* Notifications Settings */}
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Notifications
                </ThemedText>
                <View style={styles.settingRow}>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="body2" color="textPrimary">
                            Activer les notifications
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Recevoir toutes les notifications
                        </ThemedText>
                    </View>
                    <Switch
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                        trackColor={{ false: '#D1D5DB', true: colors.supervisorPrimary + '50' }}
                        thumbColor={notificationsEnabled ? colors.supervisorPrimary : '#9CA3AF'}
                    />
                </View>

                {notificationsEnabled && (
                    <>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="body3" color="textPrimary">
                                    Notifications par email
                                </ThemedText>
                            </View>
                            <Switch
                                value={emailNotifications}
                                onValueChange={setEmailNotifications}
                                trackColor={{ false: '#D1D5DB', true: colors.supervisorPrimary + '50' }}
                                thumbColor={emailNotifications ? colors.supervisorPrimary : '#9CA3AF'}
                            />
                        </View>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="body3" color="textPrimary">
                                    Notifications par SMS
                                </ThemedText>
                            </View>
                            <Switch
                                value={smsNotifications}
                                onValueChange={setSmsNotifications}
                                trackColor={{ false: '#D1D5DB', true: colors.supervisorPrimary + '50' }}
                                thumbColor={smsNotifications ? colors.supervisorPrimary : '#9CA3AF'}
                            />
                        </View>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="body3" color="textPrimary">
                                    Alertes de production
                                </ThemedText>
                            </View>
                            <Switch
                                value={productionAlerts}
                                onValueChange={setProductionAlerts}
                                trackColor={{ false: '#D1D5DB', true: colors.supervisorPrimary + '50' }}
                                thumbColor={productionAlerts ? colors.supervisorPrimary : '#9CA3AF'}
                            />
                        </View>
                        <View style={styles.settingRow}>
                            <View style={{ flex: 1 }}>
                                <ThemedText variate="body3" color="textPrimary">
                                    Alertes de qualité
                                </ThemedText>
                            </View>
                            <Switch
                                value={qualityAlerts}
                                onValueChange={setQualityAlerts}
                                trackColor={{ false: '#D1D5DB', true: colors.supervisorPrimary + '50' }}
                                thumbColor={qualityAlerts ? colors.supervisorPrimary : '#9CA3AF'}
                            />
                        </View>
                    </>
                )}
            </Card>

            {/* Preferences */}
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Préférences
                </ThemedText>
                <TouchableOpacity style={styles.preferenceRow}>
                    <Text style={styles.preferenceIcon}>🌐</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="body2" color="textPrimary">
                            Langue
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Français
                        </ThemedText>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.preferenceRow}>
                    <Text style={styles.preferenceIcon}>🎨</Text>
                    <View style={{ flex: 1 }}>
                        <ThemedText variate="body2" color="textPrimary">
                            Thème
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            Clair
                        </ThemedText>
                    </View>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
            </Card>

            {/* Account Actions */}
            <Card>
                <ThemedText variate="subtitle1" color="textPrimary" style={styles.sectionTitle}>
                    Compte
                </ThemedText>
                <TouchableOpacity
                    style={styles.actionRow}
                    onPress={handleChangePassword}
                >
                    <Text style={styles.actionIcon}>🔒</Text>
                    <ThemedText variate="body2" color="textPrimary" style={{ flex: 1 }}>
                        Modifier le mot de passe
                    </ThemedText>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow}>
                    <Text style={styles.actionIcon}>📄</Text>
                    <ThemedText variate="body2" color="textPrimary" style={{ flex: 1 }}>
                        Conditions d'utilisation
                    </ThemedText>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionRow}>
                    <Text style={styles.actionIcon}>🔐</Text>
                    <ThemedText variate="body2" color="textPrimary" style={{ flex: 1 }}>
                        Politique de confidentialité
                    </ThemedText>
                    <Text style={styles.arrowIcon}>›</Text>
                </TouchableOpacity>
            </Card>

            {/* App Info */}
            <Card style={{ backgroundColor: '#F3F4F6' }}>
                <View style={styles.appInfo}>
                    <ThemedText variate="caption" color="textSecondary">
                        LaundryKing v1.0.0
                    </ThemedText>
                    <ThemedText variate="caption" color="textSecondary">
                        © 2024 LaundryKing. Tous droits réservés.
                    </ThemedText>
                </View>
            </Card>

            {/* Logout Button */}
            <Button
                title="Se déconnecter"
                onPress={handleLogout}
                variant="outline"
                style={styles.logoutButton}
            />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: Spacing.padding.screen,
        paddingBottom: 100, // Espace pour la navigation flottante
    },
    header: {
        alignItems: 'center',
        marginBottom: Spacing.xl,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 32,
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    editButton: {
        marginTop: Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
        borderRadius: Spacing.borderRadius.full,
        borderWidth: 2,
    },
    editButtonText: {
        fontSize: Typography.fontSize.sm,
        fontWeight: Typography.fontWeight.semibold,
    },
    sectionTitle: {
        marginBottom: Spacing.md,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md,
        paddingVertical: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    infoIcon: {
        fontSize: 20,
        marginTop: 2,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    preferenceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    preferenceIcon: {
        fontSize: 24,
        marginRight: Spacing.md,
    },
    arrowIcon: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    actionIcon: {
        fontSize: 20,
        marginRight: Spacing.md,
    },
    appInfo: {
        alignItems: 'center',
        gap: Spacing.xs,
    },
    logoutButton: {
        marginTop: Spacing.lg,
    },
});
