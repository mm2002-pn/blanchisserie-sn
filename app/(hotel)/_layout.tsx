import { Tabs } from "expo-router";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function HotelLayout() {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    useOrderNotifications();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: colors.brand800,
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
                name="dashboard"
                options={{
                    title: "Accueil",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="home" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="orders"
                options={{
                    title: "Commandes",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="package" color={color} focused={focused} />
                    ),
                }}
            />
            <Tabs.Screen
                name="invoices"
                options={{
                    title: "Factures",
                    tabBarIcon: ({ color, focused }) => (
                        <TabIcon name="receipt" color={color} focused={focused} />
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

            <Tabs.Screen name="new-order" options={{ href: null, title: "Nouvelle commande" }} />
            <Tabs.Screen
                name="order-validation"
                options={{ href: null, title: "Validation" }}
            />
            <Tabs.Screen name="order-details" options={{ href: null, title: "Détail commande" }} />
            <Tabs.Screen name="planning" options={{ href: null, title: "Planning" }} />
            <Tabs.Screen name="support" options={{ href: null, title: "Support" }} />
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
