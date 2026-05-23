import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function DriverLayout() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    useOrderNotifications("driver");

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
                    // Compense la nav bar système Android (boutons III O <)
                    // sinon le tab bar passe DESSOUS (edgeToEdge activé).
                    height: 70 + insets.bottom,
                    paddingTop: 8,
                    paddingBottom: 10 + insets.bottom,
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
                    title: "Carte",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="map" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="collections"
                options={{
                    title: "Tournée",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="route" color={color} focused={focused} />
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

            {/* Push-only (accessibles via lien direct mais hors tabbar) */}
            <Tabs.Screen name="delivery" options={{ href: null, title: "Livraison" }} />
            <Tabs.Screen name="navigation" options={{ href: null, title: "Navigation" }} />
            <Tabs.Screen name="tour-detail" options={{ href: null, title: "Détail tournée" }} />
            <Tabs.Screen name="collect" options={{ href: null, title: "Scanner & collecter" }} />
            <Tabs.Screen name="deliver" options={{ href: null, title: "Livrer" }} />
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
