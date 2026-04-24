import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SupervisorLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.terra600,
                tabBarInactiveTintColor: colors.ink500,
                tabBarStyle: {
                    backgroundColor: colors.paper,
                    borderTopColor: colors.ink200,
                    borderTopWidth: StyleSheet.hairlineWidth,
                    height: 70,
                    paddingTop: 8,
                    paddingBottom: 10,
                },
                tabBarLabelStyle: {
                    fontFamily: FontFamily.uiMedium,
                    fontSize: Typography.fontSize.micro,
                },
            }}
        >
            <Tabs.Screen
                name="production"
                options={{
                    title: "Production",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="boxes" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="machines"
                options={{
                    title: "Machines",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="settings" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="quality"
                options={{
                    title: "Qualité",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="spark" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="team"
                options={{
                    title: "Équipe",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="user" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="settings" color={color} focused={focused} />
                    ),
                }}
            />

            <Tabs.Screen name="reports" options={{ href: null, title: "Rapports" }} />
        </Tabs>
    );
}

function TabIcon({
    name,
    color,
    focused,
}: {
    name: IconName;
    color: string;
    focused: boolean;
}) {
    return <Icon name={name} size={20} color={color} stroke={focused ? 2 : 1.6} />;
}
