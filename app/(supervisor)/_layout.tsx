import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';

export default function SupervisorLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.supervisorPrimary,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tabs.Screen
                name="production"
                options={{
                    title: 'Production',
                    tabBarIcon: ({ color }) => <TabIcon icon="🏭" color={color} />,
                }}
            />
            <Tabs.Screen
                name="machines"
                options={{
                    title: 'Machines',
                    tabBarIcon: ({ color }) => <TabIcon icon="⚙️" color={color} />,
                }}
            />
            <Tabs.Screen
                name="quality"
                options={{
                    title: 'Qualité',
                    tabBarIcon: ({ color }) => <TabIcon icon="✅" color={color} />,
                }}
            />
            <Tabs.Screen
                name="team"
                options={{
                    title: 'Équipe',
                    tabBarIcon: ({ color }) => <TabIcon icon="👥" color={color} />,
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
                name="reports"
                options={{
                    href: null,
                    title: 'Rapports',
                }}
            />
        </Tabs>
    );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
    return <Text style={{ fontSize: 24, color }}>{icon}</Text>;
}
