import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icon, { IconName } from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export type ToastVariant = "info" | "success" | "warning" | "error";

interface Toast {
    id: number;
    title: string;
    message?: string;
    variant: ToastVariant;
    durationMs: number;
}

interface ToastInput {
    title: string;
    message?: string;
    variant?: ToastVariant;
    durationMs?: number;
}

interface ToastContextValue {
    showToast: (input: ToastInput) => void;
    hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
    const [current, setCurrent] = useState<Toast | null>(null);
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hideToast = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: -100,
                duration: 220,
                easing: Easing.in(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 180,
                useNativeDriver: true,
            }),
        ]).start(() => setCurrent(null));
    }, [translateY, opacity]);

    const showToast = useCallback(
        (input: ToastInput) => {
            const toast: Toast = {
                id: counter++,
                title: input.title,
                message: input.message,
                variant: input.variant ?? "info",
                durationMs: input.durationMs ?? 4500,
            };
            setCurrent(toast);
            translateY.setValue(-100);
            opacity.setValue(0);
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 280,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();

            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(hideToast, toast.durationMs);
        },
        [translateY, opacity, hideToast],
    );

    useEffect(() => {
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);

    return (
        <ToastContext.Provider value={{ showToast, hideToast }}>
            {children}
            {current && (
                <Animated.View
                    pointerEvents="box-none"
                    style={[
                        styles.wrapper,
                        { opacity, transform: [{ translateY }] },
                    ]}
                >
                    <SafeAreaView edges={["top"]} pointerEvents="box-none">
                        <ToastCard toast={current} onPress={hideToast} />
                    </SafeAreaView>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

function ToastCard({ toast, onPress }: { toast: Toast; onPress: () => void }) {
    const colors = useThemeColors();
    const tint = TINT[toast.variant];
    return (
        <Pressable
            onPress={onPress}
            style={[
                styles.card,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    shadowColor: colors.ink900,
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
                <Text style={[styles.title, { color: colors.ink900 }]}>
                    {toast.title}
                </Text>
                {toast.message ? (
                    <Text style={[styles.message, { color: colors.ink600 }]}>
                        {toast.message}
                    </Text>
                ) : null}
            </View>
        </Pressable>
    );
}

const TINT: Record<
    ToastVariant,
    { icon: IconName; bg: "brand100" | "ok100" | "warn100" | "danger100"; fg: "brand800" | "ok700" | "warn700" | "danger600" }
> = {
    info: { icon: "package", bg: "brand100", fg: "brand800" },
    success: { icon: "check", bg: "ok100", fg: "ok700" },
    warning: { icon: "alert", bg: "warn100", fg: "warn700" },
    error: { icon: "x", bg: "danger100", fg: "danger600" },
};

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

const styles = StyleSheet.create({
    wrapper: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingHorizontal: 12,
    },
    card: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 12,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        marginTop: 8,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 6,
    },
    iconWrap: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
    },
    title: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    message: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
});
