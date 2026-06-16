import { Pressable, StyleSheet, Text, View } from "react-native";

import Icon from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Props {
    onPress: () => void;
    /** Override couleur de l'icône (par défaut ink800). */
    color?: string;
}

/** Cloche avec badge de notifications non lues. */
export function NotificationBell({ onPress, color }: Props) {
    const colors = useThemeColors();
    const { unreadCount } = useNotifications();
    const iconColor = color ?? colors.ink800;

    return (
        <Pressable onPress={onPress} hitSlop={10} style={styles.wrap}>
            <Icon name="bell" size={20} color={iconColor} stroke={1.6} />
            {unreadCount > 0 && (
                <View
                    style={[
                        styles.badge,
                        {
                            backgroundColor: colors.danger600,
                            borderColor: colors.paper,
                        },
                    ]}
                >
                    <Text style={[styles.badgeText, { color: colors.paper }]}>
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </Text>
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    wrap: {
        width: 36,
        height: 36,
        alignItems: "center",
        justifyContent: "center",
    },
    badge: {
        position: "absolute",
        top: 2,
        right: 2,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    badgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 9,
        lineHeight: 12,
    },
});
