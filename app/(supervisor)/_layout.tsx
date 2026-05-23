import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SupervisorLayout() {
    const colors = useThemeColors();
    useOrderNotifications("staff");

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
                name="pesee"
                options={{
                    title: "Pesée",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="weight" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="triage"
                options={{
                    title: "Triage",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="filter" color={color} focused={focused} />
                    ),
                }}
            />
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
                name="profile"
                options={{
                    title: "Profil",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="user" color={color} focused={focused} />
                    ),
                }}
            />

            {/* Push-only (accessibles via lien direct mais hors tabbar) */}
            <Tabs.Screen name="quality" options={{ href: null, title: "Qualité" }} />
            <Tabs.Screen name="team" options={{ href: null, title: "Équipe" }} />
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
