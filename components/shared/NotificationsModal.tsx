import {
    FlatList,
    Modal,
    Platform,
    Pressable,
    StatusBar,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import {
    useNotifications,
    type NotifItem,
    type NotifVariant,
} from "@/contexts/NotificationsContext";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Props {
    visible: boolean;
    onClose: () => void;
}

export function NotificationsModal({ visible, onClose }: Props) {
    const colors = useThemeColors();
    const insets = useSafeAreaInsets();
    const { items, unreadCount, markRead, markAllRead, clear } = useNotifications();

    // Android : Modal couvre la status bar → on ajoute manuellement la hauteur.
    const topPadding =
        Platform.OS === "android"
            ? Math.max(insets.top, StatusBar.currentHeight ?? 24)
            : insets.top;

    return (
        <Modal
            transparent={false}
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <SafeAreaView
                edges={["bottom"]}
                style={{ flex: 1, backgroundColor: colors.paper2 }}
            >
                {/* Header */}
                <View
                    style={[
                        styles.header,
                        {
                            backgroundColor: colors.paper,
                            borderBottomColor: colors.ink200,
                            paddingTop: topPadding + 8,
                        },
                    ]}
                >
                    <Pressable onPress={onClose} hitSlop={16} style={styles.iconBtn}>
                        <Icon name="x" size={20} color={colors.ink800} stroke={2.2} />
                    </Pressable>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.title, { color: colors.ink900 }]}>
                            Notifications
                        </Text>
                        {items.length > 0 ? (
                            <Text style={[styles.sub, { color: colors.ink500 }]}>
                                {unreadCount > 0
                                    ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                                    : "Tout est lu"}
                            </Text>
                        ) : null}
                    </View>
                    {items.length > 0 && (
                        <Pressable
                            onPress={unreadCount > 0 ? markAllRead : clear}
                            hitSlop={8}
                            style={[styles.actionBtn, { borderColor: colors.ink200 }]}
                        >
                            <Text style={[styles.actionText, { color: colors.ink700 }]}>
                                {unreadCount > 0 ? "Tout lire" : "Effacer"}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {/* List */}
                {items.length === 0 ? (
                    <View style={styles.empty}>
                        <Icon
                            name="bell"
                            size={40}
                            color={colors.ink300}
                            stroke={1.3}
                        />
                        <Text style={[styles.emptyTitle, { color: colors.ink700 }]}>
                            Aucune notification
                        </Text>
                        <Text style={[styles.emptySub, { color: colors.ink500 }]}>
                            Vous serez prévenu à chaque étape de vos commandes.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={items}
                        keyExtractor={(n) => n.id}
                        contentContainerStyle={styles.listContent}
                        renderItem={({ item }) => (
                            <NotifRow item={item} onPress={() => markRead(item.id)} />
                        )}
                    />
                )}
            </SafeAreaView>
        </Modal>
    );
}

function NotifRow({ item, onPress }: { item: NotifItem; onPress: () => void }) {
    const colors = useThemeColors();
    const tint = TINT[item.variant];
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.row,
                {
                    backgroundColor: item.read ? colors.paper : colors.brand50,
                    borderColor: colors.ink200,
                },
            ]}
        >
            <View
                style={[
                    styles.iconWrap,
                    { backgroundColor: colors[tint.bg] as string },
                ]}
            >
                <Icon
                    name={tint.icon}
                    size={16}
                    color={colors[tint.fg] as string}
                    stroke={2}
                />
            </View>
            <View style={{ flex: 1 }}>
                <View style={styles.rowTop}>
                    <Text
                        style={[
                            styles.rowTitle,
                            {
                                color: colors.ink900,
                                fontFamily: item.read
                                    ? FontFamily.uiMedium
                                    : FontFamily.uiSemibold,
                            },
                        ]}
                        numberOfLines={1}
                    >
                        {item.title}
                    </Text>
                    <Text style={[styles.rowTime, { color: colors.ink500 }]}>
                        {formatRelative(item.createdAt)}
                    </Text>
                </View>
                {item.message ? (
                    <Text
                        style={[styles.rowMsg, { color: colors.ink600 }]}
                        numberOfLines={2}
                    >
                        {item.message}
                    </Text>
                ) : null}
            </View>
            {!item.read && (
                <View
                    style={[styles.dot, { backgroundColor: colors.brand800 }]}
                />
            )}
        </Pressable>
    );
}

function formatRelative(ms: number): string {
    const diff = Date.now() - ms;
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return "à l'instant";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} h`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} j`;
    return new Date(ms).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
    });
}

const TINT: Record<
    NotifVariant,
    {
        icon: IconName;
        bg: "brand100" | "ok100" | "warn100" | "danger100";
        fg: "brand800" | "ok700" | "warn700" | "danger600";
    }
> = {
    info: { icon: "package", bg: "brand100", fg: "brand800" },
    success: { icon: "check", bg: "ok100", fg: "ok700" },
    warning: { icon: "alert", bg: "warn100", fg: "warn700" },
    error: { icon: "x", bg: "danger100", fg: "danger600" },
};

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    iconBtn: {
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 99,
    },
    title: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
    },
    sub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 1,
    },
    actionBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
    },
    actionText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    listContent: {
        padding: 12,
        gap: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    rowTop: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 8,
    },
    rowTitle: {
        fontSize: Typography.fontSize.sm,
        flex: 1,
    },
    rowTime: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    rowMsg: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 6,
    },
    empty: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingHorizontal: 24,
    },
    emptyTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
        marginTop: 8,
    },
    emptySub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        textAlign: "center",
    },
});
