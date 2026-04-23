import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function DriverLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.driverPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="route"
                options={{
                    title: 'Tournée',
                    tabBarIcon: ({ color }) => <TabIcon icon="🚚" color={color} />,
                }}
            />
            <Tabs.Screen
                name="collect"
                options={{
                    title: 'Collecte',
                    tabBarIcon: ({ color }) => <TabIcon icon="📦" color={color} />,
                }}
            />
            <Tabs.Screen
                name="delivery"
                options={{
                    title: 'Livraison',
                    tabBarIcon: ({ color }) => <TabIcon icon="✅" color={color} />,
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Messages',
                    tabBarIcon: ({ color }) => <TabIcon icon="💬" color={color} />,
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Profil',
                    tabBarIcon: ({ color }) => <TabIcon icon="👤" color={color} />,
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen
                name="navigation"
                options={{
                    href: null,
                    title: 'Navigation',
                }}
            />
        </Tabs>
    );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
    return <Text style={{ fontSize: 24, color }}>{icon}</Text>;
}
