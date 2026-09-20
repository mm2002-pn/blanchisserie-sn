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
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import { MarineHeader } from "@/components/shared/MarineHeader";
import { StatusBarSpace } from "@/components/shared/StatusBarSpace";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useClient } from "@/hooks/useClient";

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

const CLIENT_TYPE_LABEL: Record<string, string> = {
    hotel_5_etoiles: "Hôtel 5 étoiles",
    hotel_4_etoiles: "Hôtel 4 étoiles",
    hotel_3_etoiles: "Hôtel 3 étoiles",
    restaurant: "Restaurant",
    autre: "Établissement",
};

const BILLING_MODE_LABEL: Record<string, string> = {
    per_order: "À la commande livrée",
    monthly: "Facturation groupée mensuelle",
};

export default function HotelProfileScreen() {
    const router = useRouter();
    const { user, logout } = useAuth();
    const colors = useThemeColors();
    const { data: client } = useClient(user?.clientId);

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

    const displayName = client?.name ?? user?.name ?? "Établissement";
    const initials = displayName
        .split(" ")
        .map((w) => w.charAt(0))
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase() || "ET";

    const clientRef = client ? `Client ${client.id.slice(-6).toUpperCase()}` : "";
    const typeLabel = client ? (CLIENT_TYPE_LABEL[client.type] ?? client.type) : "";

    const profileRows: { k: string; v: string }[] = client
        ? [
              { k: "Raison sociale", v: client.name },
              { k: "NINEA", v: client.ninea || "—" },
              { k: "Adresse", v: [client.address, client.city].filter(Boolean).join(", ") || "—" },
              { k: "Contact", v: client.contactPerson || "—" },
              { k: "Tarif", v: client.tariff?.name || "Tarif standard" },
              {
                  k: "Facturation",
                  v: client.billingMode ? (BILLING_MODE_LABEL[client.billingMode] ?? client.billingMode) : "—",
              },
          ]
        : [];

    const groups: MenuGroup[] = [
        {
            title: "Compte",
            items: [
                { icon: "tag", label: "Conditions d'utilisation" },
                { icon: "tag", label: "Politique de confidentialité" },
            ],
        },
    ];

    return (
        <View style={[styles.container, { backgroundColor: colors.paper }]}>
            <StatusBarSpace color={colors.brand900} />
            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
                overScrollMode="never"
            >
                {/* Header marine — identité établissement */}
                <MarineHeader style={styles.header}>
                    <View style={styles.headerRow}>
                        <View style={[styles.avatar, { backgroundColor: colors.brand800, borderColor: colors.brand700 }]}>
                            <Text style={[styles.avatarText, { color: colors.terra600 }]}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.headerName}>{displayName}</Text>
                            <Text style={[styles.headerSub, { color: colors.ink400 }]}>
                                {[clientRef, typeLabel].filter(Boolean).join(" · ")}
                            </Text>
                        </View>
                    </View>
                </MarineHeader>

                {/* Informations établissement — données réelles */}
                {profileRows.length > 0 && (
                    <Card padding={0} style={[styles.infoCard, { borderColor: colors.ink200 }]}>
                        {profileRows.map((r, i) => (
                            <View
                                key={r.k}
                                style={[
                                    styles.infoRow,
                                    i < profileRows.length - 1 && {
                                        borderBottomWidth: StyleSheet.hairlineWidth,
                                        borderBottomColor: colors.ink200,
                                    },
                                ]}
                            >
                                <Text style={[styles.infoKey, { color: colors.ink600 }]}>{r.k}</Text>
                                <Text style={[styles.infoValue, { color: colors.ink900 }]} numberOfLines={2}>
                                    {r.v}
                                </Text>
                            </View>
                        ))}
                    </Card>
                )}

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
                        { backgroundColor: colors.paper, borderColor: colors.danger100 },
                    ]}
                >
                    <Icon name="logout" size={16} color={colors.danger600} />
                    <Text style={[styles.logoutText, { color: colors.danger600 }]}>
                        Se déconnecter
                    </Text>
                </Pressable>

                <Text style={[styles.version, { color: colors.ink500 }]}>
                    B&amp;C Teranga · v1.0.0
                </Text>
            </ScrollView>
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

    content: {
        paddingBottom: 120,
    },

    // Header marine
    header: {
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 30,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
    },
    avatar: {
        width: 54,
        height: 54,
        borderRadius: 27,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    avatarText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 17,
    },
    headerName: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 19,
        color: "#FFFFFF",
    },
    headerSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
        marginTop: 3,
    },

    // Info card
    infoCard: {
        marginHorizontal: 20,
        marginTop: 20,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 18,
        overflow: "hidden",
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
        paddingVertical: 13,
    },
    infoKey: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        flexShrink: 0,
    },
    infoValue: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
        textAlign: "right",
        flexShrink: 1,
    },

    // Group label + container
    groupLabel: {
        marginHorizontal: 20,
        marginBottom: 8,
        marginTop: 14,
        paddingLeft: 4,
    },
    group: {
        marginHorizontal: 20,
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
        marginHorizontal: 20,
        marginTop: 18,
        padding: 12,
        borderRadius: 16,
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
