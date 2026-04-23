import { Tabs } from 'expo-router';
import { Text, Platform } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function HotelLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.hotelPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Accueil',
                    tabBarIcon: ({ color }) => <TabIcon icon="🏠" color={color} />,
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: 'Commandes',
                    tabBarIcon: ({ color }) => <TabIcon icon="📦" color={color} />,
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: 'Factures',
                    tabBarIcon: ({ color }) => <TabIcon icon="💵" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
                }}
            />
            {/* Hidden screens - not in bottom tabs */}
            <Tabs.Screen
                name="new-order"
                options={{
                    href: null, // Hide from tabs
                    title: 'Nouvelle Commande',
                }}
            />
            <Tabs.Screen
                name="order-validation"
                options={{
                    href: null, // Hide from tabs
                    title: 'Validation de la commande',
                }}
            />
            <Tabs.Screen
                name="order-details"
                options={{
                    href: null, // Hide from tabs
                    title: 'Détails de la commande',
                }}
            />
            <Tabs.Screen
                name="planning"
                options={{
                    href: null, // Hide from tabs
                    title: 'Planning',
                }}
            />
            <Tabs.Screen
                name="support"
                options={{
                    href: null, // Hide from tabs
                    title: 'Support',
                }}
            />
        </Tabs>
    );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
    return <Text style={{ fontSize: 24, color }}>{icon}</Text>;
}
