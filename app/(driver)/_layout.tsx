import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function DriverLayout() {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.baobab600,
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
                name="route"
                options={{
                    title: "Tournée",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="route" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="collect"
                options={{
                    title: "Collecte",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="package" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="delivery"
                options={{
                    title: "Livraison",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="truck" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: "Messages",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="msg" color={color} focused={focused} />
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

            <Tabs.Screen name="navigation" options={{ href: null, title: "Navigation" }} />
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
