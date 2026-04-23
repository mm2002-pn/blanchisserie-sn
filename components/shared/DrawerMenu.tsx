import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    ScrollView,
    Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import ThemedText from '@/components/ui/ThemedText';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

interface DrawerMenuProps {
    visible: boolean;
    onClose: () => void;
}

const HOTEL_MENU_ITEMS = [
    { id: 'dashboard', label: 'Accueil', icon: '🏠', route: '/(hotel)/dashboard' },
    { id: 'new-order', label: 'Nouvelle Commande', icon: '➕', route: '/(hotel)/new-order' },
    { id: 'orders', label: 'Mes Commandes', icon: '📦', route: '/(hotel)/orders' },
    { id: 'invoices', label: 'Mes Factures', icon: '💵', route: '/(hotel)/invoices' },
    { id: 'planning', label: 'Planning Contractuel', icon: '📅', route: '/(hotel)/planning' },
    { id: 'support', label: 'Support & Aide', icon: '💬', route: '/(hotel)/support' },
    { id: 'profile', label: 'Mon Profil', icon: '👤', route: '/(hotel)/profile' },
];

const DRIVER_MENU_ITEMS = [
    { id: 'route', label: 'Ma Tournée', icon: '🚚', route: '/(driver)/route' },
    { id: 'collect', label: 'Collecte', icon: '📦', route: '/(driver)/collect' },
    { id: 'delivery', label: 'Livraison', icon: '✅', route: '/(driver)/delivery' },
    { id: 'navigation', label: 'Navigation', icon: '🗺️', route: '/(driver)/navigation' },
    { id: 'messages', label: 'Messages', icon: '💬', route: '/(driver)/messages' },
    { id: 'profile', label: 'Mon Profil', icon: '👤', route: '/(driver)/profile' },
];

const SUPERVISOR_MENU_ITEMS = [
    { id: 'production', label: 'Production', icon: '🏭', route: '/(supervisor)/production' },
    { id: 'machines', label: 'Machines', icon: '⚙️', route: '/(supervisor)/machines' },
    { id: 'quality', label: 'Qualité', icon: '✓', route: '/(supervisor)/quality' },
    { id: 'team', label: 'Équipe', icon: '👥', route: '/(supervisor)/team' },
    { id: 'interventions', label: 'Interventions', icon: '🔧', route: '/(supervisor)/interventions' },
    { id: 'reports', label: 'Rapports', icon: '📊', route: '/(supervisor)/reports' },
    { id: 'profile', label: 'Mon Profil', icon: '👤', route: '/(supervisor)/profile' },
];

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();

    // Get menu items based on user role
    const getMenuItems = () => {
        switch (user?.role) {
            case 'driver':
                return DRIVER_MENU_ITEMS;
            case 'supervisor':
                return SUPERVISOR_MENU_ITEMS;
            case 'hotel':
            default:
                return HOTEL_MENU_ITEMS;
        }
    };

    const menuItems = getMenuItems();

    // Get avatar color based on user role
    const getAvatarColor = () => {
        switch (user?.role) {
            case 'driver':
                return colors.driverPrimary;
            case 'supervisor':
                return colors.supervisorPrimary;
            case 'hotel':
            default:
                return colors.hotelPrimary;
        }
    };

    const handleNavigate = (route: string) => {
        onClose();
        router.push(route as any);
    };

    const handleLogout = async () => {
        onClose();
        await logout();
        router.replace('/(auth)/sign-in');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[styles.drawer, { backgroundColor: colors.background }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <View style={[styles.header, { borderBottomColor: colors.border }]}>
                        <View style={[styles.avatar, { backgroundColor: getAvatarColor() }]}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </Text>
                        </View>
                        <ThemedText variate="subtitle1" color="textPrimary">
                            {user?.name || 'Hôtel'}
                        </ThemedText>
                        <ThemedText variate="caption" color="textSecondary">
                            {user?.email}
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={onClose}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Menu Items */}
                    <ScrollView style={styles.menu}>
                        {menuItems.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                style={styles.menuItem}
                                onPress={() => handleNavigate(item.route)}
                            >
                                <Text style={styles.menuIcon}>{item.icon}</Text>
                                <ThemedText variate="body2" color="textPrimary">
                                    {item.label}
                                </ThemedText>
                            </TouchableOpacity>
                        ))}

                        <View style={[styles.separator, { backgroundColor: colors.border }]} />

                        {/* Logout */}
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={handleLogout}
                        >
                            <Text style={styles.menuIcon}>🚪</Text>
                            <ThemedText variate="body2" color="error">
                                Se déconnecter
                            </ThemedText>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Footer */}
                    <View style={[styles.footer, { borderTopColor: colors.border }]}>
                        <ThemedText variate="caption" color="textSecondary">
                            LaundryKing v1.0.0
                        </ThemedText>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    drawer: {
        width: '80%',
        height: '100%',
        maxWidth: 320,
    },
    header: {
        padding: Spacing.xl,
        borderBottomWidth: 1,
        position: 'relative',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: Typography.fontWeight.bold,
        color: '#FFFFFF',
    },
    closeButton: {
        position: 'absolute',
        top: Spacing.md,
        right: Spacing.md,
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeIcon: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    menu: {
        flex: 1,
        paddingVertical: Spacing.md,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    menuIcon: {
        fontSize: 24,
    },
    separator: {
        height: 1,
        marginVertical: Spacing.md,
        marginHorizontal: Spacing.xl,
    },
    footer: {
        padding: Spacing.lg,
        borderTopWidth: 1,
        alignItems: 'center',
    },
});
