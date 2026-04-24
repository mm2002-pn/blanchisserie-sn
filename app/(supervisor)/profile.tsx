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

export default function SupervisorProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();

    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [productionAlerts, setProductionAlerts] = useState(true);
    const [qualityAlerts, setQualityAlerts] = useState(true);

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

    const initials =
        (user?.name ?? "")
            .split(" ")
            .map((w) => w.charAt(0))
            .filter(Boolean)
            .slice(0, 2)
            .join("")
            .toUpperCase() || "SP";

    const groups: MenuGroup[] = [
        {
            title: "Informations personnelles",
            items: [
                { icon: "phone", label: "Téléphone", sub: user?.phone ?? "+221 77 123 45 67" },
                { icon: "msg", label: "Email", sub: user?.email ?? "superviseur@example.sn" },
                { icon: "building", label: "Département", sub: "Production & Qualité" },
            ],
        },
        {
            title: "Compte & sécurité",
            items: [
                {
                    icon: "settings",
                    label: "Modifier le mot de passe",
                    onPress: () => router.push("/(auth)/change-password"),
                },
                { icon: "receipt", label: "Conditions d'utilisation" },
                { icon: "tag", label: "Politique de confidentialité" },
            ],
        },
        {
            title: "Liens rapides",
            items: [
                {
                    icon: "chart",
                    label: "Rapports complets",
                    onPress: () => router.push("/(supervisor)/reports"),
                },
                {
                    icon: "spark",
                    label: "Centre qualité",
                    onPress: () => router.push("/(supervisor)/quality"),
                },
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
                        <View
                            style={[
                                styles.avatar,
                                { backgroundColor: colors.terra600 },
                            ]}
                        >
                            <Text style={[styles.avatarText, { color: colors.paper }]}>
                                {initials}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.identityName, { color: colors.paper }]}>
                                {user?.name ?? "Superviseur"}
                            </Text>
                            <Text style={[styles.identityRole, { color: colors.brand100 }]}>
                                Superviseur production
                            </Text>
                            <Text style={[styles.identitySub, { color: colors.brand100 }]}>
                                {user?.email ?? ""}
                            </Text>
                        </View>
                    </View>

                    <View
                        style={[styles.identityStats, { borderTopColor: colors.brand700 }]}
                    >
                        <Stat value="1 248" label="Commandes / mois" />
                        <Stat value="98,6 %" label="Conformité qualité" />
                        <Stat value="2022" label="En poste depuis" />
                    </View>
                </Card>

                {/* Preferences */}
                <ThemedText variate="caps" color="ink500" style={styles.groupLabel}>
                    Préférences
                </ThemedText>
                <Card padding={0} style={styles.group}>
                    <ToggleRow
                        icon="bell"
                        label="Notifications générales"
                        sub="Centraliser toutes les alertes"
                        value={notificationsEnabled}
                        onValueChange={setNotificationsEnabled}
                    />
                    {notificationsEnabled && (
                        <>
                            <Divider />
                            <ToggleRow
                                icon="msg"
                                label="Notifications email"
                                sub="Rapports quotidiens"
                                value={emailNotifications}
                                onValueChange={setEmailNotifications}
                            />
                            <Divider />
                            <ToggleRow
                                icon="boxes"
                                label="Alertes production"
                                sub="Machines, cycles, consommables"
                                value={productionAlerts}
                                onValueChange={setProductionAlerts}
                            />
                            <Divider />
                            <ToggleRow
                                icon="spark"
                                label="Alertes qualité"
                                sub="Défauts, reprises, seuils"
                                value={qualityAlerts}
                                onValueChange={setQualityAlerts}
                            />
                        </>
                    )}
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

/* ---------- sous-composants ---------- */

function Stat({ value, label }: { value: string; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={{ flex: 1 }}>
            <Text style={[styles.statValue, { color: colors.paper }]}>
                {value}
            </Text>
            <Text style={[styles.statLabel, { color: colors.brand100 }]}>
                {label}
            </Text>
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
                <Text style={[styles.rowLabel, { color: colors.ink900 }]}>
                    {label}
                </Text>
                {sub && (
                    <Text style={[styles.rowSub, { color: colors.ink500 }]}>
                        {sub}
                    </Text>
                )}
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
                <Text style={[styles.rowLabel, { color: colors.ink900 }]}>
                    {label}
                </Text>
                {sub && (
                    <Text style={[styles.rowSub, { color: colors.ink500 }]}>
                        {sub}
                    </Text>
                )}
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: colors.ink200, true: colors.terra600 }}
                thumbColor={value ? colors.terra700 : colors.paper}
            />
        </View>
    );
}

function Divider() {
    const colors = useThemeColors();
    return (
        <View style={[styles.divider, { backgroundColor: colors.ink200 }]} />
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    content: { padding: 16, paddingBottom: 120 },

    // Identity
    identity: { marginBottom: 14 },
    identityTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
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
    },
    identityRole: {
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
    statValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
    },
    statLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Groups
    groupLabel: {
        marginBottom: 8,
        marginTop: 14,
        paddingLeft: 4,
    },
    group: { overflow: "hidden" },

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
