import { Fragment, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColors";

type MenuItem = {
    icon: IconName;
    label: string;
    sub?: string;
    onPress?: () => void;
};

type MenuGroup = {
    title: string;
    items: MenuItem[];
};

export default function HotelProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();

    const [pushEnabled, setPushEnabled] = useState(true);
    const [emailEnabled, setEmailEnabled] = useState(true);

    const handleLogout = () =>
        Alert.alert("Déconnexion", "Se déconnecter de votre espace ?", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Déconnexion",
                style: "destructive",
                onPress: async () => {
                    await logout();
                    router.replace("/(auth)/sign-in");
                },
            },
        ]);

    const initials = (user?.name ?? "")
        .split(" ")
        .map((w) => w.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "PT";

    const groups: MenuGroup[] = [
        {
            title: "Établissement",
            items: [
                { icon: "user", label: "Sous-comptes", sub: "4 utilisateurs" },
                {
                    icon: "receipt",
                    label: "Informations facturation",
                    sub: "NINEA · KYC à jour",
                },
                {
                    icon: "calendar",
                    label: "Planning contractuel",
                    sub: "3 collectes / semaine",
                    onPress: () => router.push("/(hotel)/planning"),
                },
            ],
        },
        {
            title: "Support",
            items: [
                {
                    icon: "msg",
                    label: "Contacter le support",
                    sub: "24h/24 · 7j/7",
                    onPress: () => router.push("/(hotel)/support"),
                },
                { icon: "alert", label: "Déclarer un incident" },
            ],
        },
        {
            title: "Compte",
            items: [
                { icon: "settings", label: "Langue & thème", sub: "Français · Clair" },
                { icon: "tag", label: "Conditions d'utilisation" },
                { icon: "tag", label: "Politique de confidentialité" },
            ],
        },
    ];

    return (
        <SafeAreaView
            edges={["top"]}
            style={[styles.container, { backgroundColor: colors.paper2 }]}
        >
            <View
                style={[
                    styles.header,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <ThemedText variate="title">Profil</ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Identity hero */}
                <Card
                    padding={18}
                    style={[
                        styles.identity,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <View style={styles.identityTop}>
                        <View style={[styles.identityAvatar, { backgroundColor: colors.terra600 }]}>
                            <Text style={[styles.identityAvatarText, { color: colors.paper }]}>
                                {initials}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.identityName, { color: colors.paper }]}>
                                {user?.name ?? "Établissement"}
                            </Text>
                            <Text style={[styles.identityMeta, { color: colors.brand100 }]}>
                                ★★★★ · Hôtel 4 étoiles
                            </Text>
                            <Text style={[styles.identitySub, { color: colors.brand100 }]}>
                                {user?.email ?? ""}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.identityStats, { borderTopColor: colors.brand700 }]}>
                        <IdentityStat value="52" label="Commandes / mois" color={colors.paper} sub={colors.brand100} />
                        <IdentityStat value="3,2 t" label="Volume / mois" color={colors.paper} sub={colors.brand100} />
                        <IdentityStat value="2024" label="Client depuis" color={colors.paper} sub={colors.brand100} />
                    </View>
                </Card>

                {/* Préférences */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Préférences
                </ThemedText>
                <Card padding={0} style={styles.group}>
                    <ToggleRow
                        icon="bell"
                        label="Notifications push"
                        sub="Commandes, livraisons, incidents"
                        value={pushEnabled}
                        onValueChange={setPushEnabled}
                    />
                    <Divider />
                    <ToggleRow
                        icon="msg"
                        label="Notifications email"
                        sub="Factures + synthèses hebdo"
                        value={emailEnabled}
                        onValueChange={setEmailEnabled}
                    />
                </Card>

                {/* Menu groups */}
                {groups.map((g) => (
                    <Fragment key={g.title}>
                        <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                            {g.title}
                        </ThemedText>
                        <Card padding={0} style={styles.group}>
                            {g.items.map((item, i) => (
                                <Fragment key={item.label}>
                                    <MenuRow
                                        icon={item.icon}
                                        label={item.label}
                                        sub={item.sub}
                                        onPress={item.onPress}
                                    />
                                    {i < g.items.length - 1 && <Divider />}
                                </Fragment>
                            ))}
                        </Card>
                    </Fragment>
                ))}

                {/* Logout */}
                <Pressable
                    onPress={handleLogout}
                    style={[
                        styles.logout,
                        { backgroundColor: colors.paper, borderColor: colors.danger600 },
                    ]}
                >
                    <Icon name="logout" size={16} color={colors.danger600} />
                    <Text style={[styles.logoutText, { color: colors.danger600 }]}>
                        Déconnexion
                    </Text>
                </Pressable>

                <Text style={[styles.version, { color: colors.ink500 }]}>
                    Blanchisserie SN · v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

function IdentityStat({
    value,
    label,
    color,
    sub,
}: {
    value: string;
    label: string;
    color: string;
    sub: string;
}) {
    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.identityStatValue, { color }]}>{value}</Text>
            <Text style={[styles.identityStatLabel, { color: sub }]}>{label}</Text>
        </View>
    );
}

function MenuRow({
    icon,
    label,
    sub,
    onPress,
}: {
    icon: IconName;
    label: string;
    sub?: string;
    onPress?: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable onPress={onPress} style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name={icon} size={15} color={colors.ink600} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.ink900 }]}>{label}</Text>
                {sub && <Text style={[styles.rowSub, { color: colors.ink500 }]}>{sub}</Text>}
            </View>
            <Icon name="chevRight" size={14} color={colors.ink400} />
        </Pressable>
    );
}

function ToggleRow({
    icon,
    label,
    sub,
    value,
    onValueChange,
}: {
    icon: IconName;
    label: string;
    sub?: string;
    value: boolean;
    onValueChange: (v: boolean) => void;
}) {
    const colors = useThemeColors();
    return (
        <View style={styles.row}>
            <View style={[styles.rowIcon, { backgroundColor: colors.paper2 }]}>
                <Icon name={icon} size={15} color={colors.ink600} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.rowLabel, { color: colors.ink900 }]}>{label}</Text>
                {sub && <Text style={[styles.rowSub, { color: colors.ink500 }]}>{sub}</Text>}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.ink200, true: colors.brand500 }}
                thumbColor={value ? colors.brand800 : colors.paper}
            />
        </View>
    );
}

function Divider() {
    const colors = useThemeColors();
    return <View style={[styles.divider, { backgroundColor: colors.ink200 }]} />;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },

    content: {
        padding: 16,
        paddingBottom: 120,
    },

    // Identity hero
    identity: { marginBottom: 14 },
    identityTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    identityAvatar: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    identityAvatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 20,
    },
    identityName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    identityMeta: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },
    identitySub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    identityStats: {
        flexDirection: "row",
        gap: 20,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    identityStatValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
    },
    identityStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Group label + container
    groupLabel: {
        marginBottom: 8,
        marginTop: 14,
        paddingLeft: 4,
    },
    group: {
        overflow: "hidden",
    },

    // Row
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    rowIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
    rowLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    rowSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    divider: {
        height: StyleSheet.hairlineWidth,
        marginLeft: 58,
    },

    // Logout
    logout: {
        marginTop: 18,
        padding: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    logoutText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    version: {
        textAlign: "center",
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 16,
    },
});
