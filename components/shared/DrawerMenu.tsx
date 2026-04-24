import { useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    Easing,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Icon, { IconName } from "@/components/ui/Icon";
import { useAuth } from "@/contexts/AuthContext";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

interface DrawerMenuProps {
    visible: boolean;
    onClose: () => void;
}

type MenuEntry = {
    id: string;
    label: string;
    icon: IconName;
    route: string;
};

const HOTEL_MENU: MenuEntry[] = [
    { id: "dashboard", label: "Accueil", icon: "home", route: "/(hotel)/dashboard" },
    { id: "new-order", label: "Nouvelle commande", icon: "plus", route: "/(hotel)/new-order" },
    { id: "orders", label: "Mes commandes", icon: "package", route: "/(hotel)/orders" },
    { id: "invoices", label: "Mes factures", icon: "receipt", route: "/(hotel)/invoices" },
    { id: "planning", label: "Planning contractuel", icon: "calendar", route: "/(hotel)/planning" },
    { id: "support", label: "Support & aide", icon: "msg", route: "/(hotel)/support" },
    { id: "profile", label: "Mon profil", icon: "user", route: "/(hotel)/profile" },
];

const DRIVER_MENU: MenuEntry[] = [
    { id: "route", label: "Ma tournée", icon: "route", route: "/(driver)/route" },
    { id: "collect", label: "Collecte · Scan QR", icon: "qr", route: "/(driver)/collect" },
    { id: "delivery", label: "Livraison", icon: "truck", route: "/(driver)/delivery" },
    { id: "navigation", label: "Navigation", icon: "map", route: "/(driver)/navigation" },
    { id: "messages", label: "Messages", icon: "msg", route: "/(driver)/messages" },
    { id: "profile", label: "Mon profil", icon: "user", route: "/(driver)/profile" },
];

const SUPERVISOR_MENU: MenuEntry[] = [
    { id: "production", label: "Production", icon: "boxes", route: "/(supervisor)/production" },
    { id: "machines", label: "Machines", icon: "settings", route: "/(supervisor)/machines" },
    { id: "quality", label: "Qualité", icon: "spark", route: "/(supervisor)/quality" },
    { id: "team", label: "Équipe", icon: "user", route: "/(supervisor)/team" },
    { id: "reports", label: "Rapports", icon: "chart", route: "/(supervisor)/reports" },
    { id: "profile", label: "Mon profil", icon: "settings", route: "/(supervisor)/profile" },
];

const DRAWER_WIDTH = Math.min(340, Dimensions.get("window").width * 0.86);

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();

    // Keep Modal mounted through the close animation
    const [rendered, setRendered] = useState(visible);

    const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
    const overlayOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setRendered(true);
            Animated.parallel([
                Animated.spring(translateX, {
                    toValue: 0,
                    damping: 22,
                    stiffness: 220,
                    mass: 0.9,
                    overshootClamping: true,
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 1,
                    duration: 220,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(translateX, {
                    toValue: -DRAWER_WIDTH,
                    duration: 220,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(overlayOpacity, {
                    toValue: 0,
                    duration: 200,
                    easing: Easing.in(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(({ finished }) => {
                if (finished) setRendered(false);
            });
        }
    }, [visible, translateX, overlayOpacity]);

    const menu = getMenu(user?.role);
    const accent = getAccent(user?.role, colors);

    const initials =
        (user?.name ?? "")
            .split(" ")
            .map((w) => w.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "U";

    const handleNavigate = (route: string) => {
        router.push(route as never);
        onClose();
    };

    const handleLogout = async () => {
        onClose();
        await logout();
        router.replace("/(auth)/sign-in");
    };

    const roleLabel =
        user?.role === "driver"
            ? "Chauffeur"
            : user?.role === "supervisor"
              ? "Superviseur"
              : "Établissement";

    return (
        <Modal
            visible={rendered}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
            hardwareAccelerated
        >
            <View style={styles.root}>
                <Animated.View
                    style={[
                        styles.overlay,
                        { opacity: overlayOpacity, backgroundColor: "#1a1712CC" },
                    ]}
                >
                    <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
                </Animated.View>

                <Animated.View
                    style={[
                        styles.drawer,
                        {
                            width: DRAWER_WIDTH,
                            backgroundColor: colors.paper,
                            borderRightColor: colors.ink200,
                            transform: [{ translateX }],
                        },
                    ]}
                >
                    <SafeAreaView edges={["top"]} style={{ flex: 1 }}>
                        {/* Header */}
                        <View
                            style={[
                                styles.header,
                                { backgroundColor: colors.brand900 },
                            ]}
                        >
                            <Pressable
                                onPress={onClose}
                                style={[styles.closeBtn, { backgroundColor: colors.brand700 }]}
                                hitSlop={8}
                            >
                                <Icon name="x" size={14} color={colors.paper} />
                            </Pressable>

                            <View style={styles.identity}>
                                <View
                                    style={[styles.avatar, { backgroundColor: accent }]}
                                >
                                    <Text
                                        style={[styles.avatarText, { color: colors.paper }]}
                                    >
                                        {initials}
                                    </Text>
                                </View>
                                <Text
                                    style={[styles.identityName, { color: colors.paper }]}
                                >
                                    {user?.name ?? "Utilisateur"}
                                </Text>
                                <Text
                                    style={[styles.identityRole, { color: colors.brand100 }]}
                                >
                                    {roleLabel}
                                </Text>
                                {user?.email && (
                                    <Text
                                        style={[styles.identityEmail, { color: colors.brand100 }]}
                                        numberOfLines={1}
                                    >
                                        {user.email}
                                    </Text>
                                )}
                            </View>
                        </View>

                        {/* Menu */}
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={styles.menuContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text
                                style={[styles.sectionCaps, { color: colors.ink500 }]}
                            >
                                Navigation
                            </Text>
                            <View style={styles.menuList}>
                                {menu.map((item) => (
                                    <Pressable
                                        key={item.id}
                                        onPress={() => handleNavigate(item.route)}
                                        style={({ pressed }) => [
                                            styles.menuItem,
                                            {
                                                backgroundColor: pressed
                                                    ? colors.paper2
                                                    : "transparent",
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.menuIcon,
                                                { backgroundColor: colors.paper2 },
                                            ]}
                                        >
                                            <Icon
                                                name={item.icon}
                                                size={15}
                                                color={colors.ink700}
                                            />
                                        </View>
                                        <Text
                                            style={[styles.menuLabel, { color: colors.ink900 }]}
                                        >
                                            {item.label}
                                        </Text>
                                        <Icon name="chevRight" size={14} color={colors.ink400} />
                                    </Pressable>
                                ))}
                            </View>

                            <View
                                style={[styles.divider, { backgroundColor: colors.ink200 }]}
                            />

                            <Pressable
                                onPress={handleLogout}
                                style={({ pressed }) => [
                                    styles.menuItem,
                                    {
                                        backgroundColor: pressed
                                            ? colors.danger100
                                            : "transparent",
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.menuIcon,
                                        { backgroundColor: colors.danger100 },
                                    ]}
                                >
                                    <Icon name="logout" size={15} color={colors.danger600} />
                                </View>
                                <Text
                                    style={[styles.menuLabel, { color: colors.danger600 }]}
                                >
                                    Se déconnecter
                                </Text>
                                <Icon name="chevRight" size={14} color={colors.danger600} />
                            </Pressable>
                        </ScrollView>

                        {/* Footer */}
                        <View
                            style={[
                                styles.footer,
                                {
                                    borderTopColor: colors.ink200,
                                    backgroundColor: colors.paper,
                                },
                            ]}
                        >
                            <Text style={[styles.brand, { color: colors.ink900 }]}>
                                Blanchisserie SN
                            </Text>
                            <Text style={[styles.version, { color: colors.ink500 }]}>
                                v1.0.0 · Dakar
                            </Text>
                        </View>
                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
}

function getMenu(role: string | undefined): MenuEntry[] {
    switch (role) {
        case "driver":
            return DRIVER_MENU;
        case "supervisor":
            return SUPERVISOR_MENU;
        default:
            return HOTEL_MENU;
    }
}

function getAccent(
    role: string | undefined,
    colors: ReturnType<typeof useThemeColors>,
) {
    switch (role) {
        case "driver":
            return colors.baobab600;
        case "supervisor":
            return colors.terra600;
        default:
            return colors.brand500;
    }
}

const styles = StyleSheet.create({
    root: { flex: 1, flexDirection: "row" },
    overlay: { ...StyleSheet.absoluteFillObject },
    drawer: {
        height: "100%",
        borderRightWidth: StyleSheet.hairlineWidth,
    },

    header: {
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 20,
    },
    closeBtn: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: "center",
        justifyContent: "center",
        alignSelf: "flex-end",
    },
    identity: { marginTop: 10 },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 20,
    },
    identityName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
        marginTop: 12,
    },
    identityRole: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },
    identityEmail: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Menu
    menuContent: { paddingHorizontal: 12, paddingVertical: 14 },
    sectionCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
        paddingHorizontal: 8,
        marginBottom: 10,
    },
    menuList: { gap: 2 },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 11,
        paddingHorizontal: 10,
        borderRadius: 10,
    },
    menuIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    menuLabel: {
        flex: 1,
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginVertical: 12,
        marginHorizontal: 6,
    },

    // Footer
    footer: {
        paddingHorizontal: 18,
        paddingTop: 12,
        paddingBottom: 18,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    brand: {
        fontFamily: FontFamily.serifMedium,
        fontSize: Typography.fontSize.sm,
    },
    version: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
});
