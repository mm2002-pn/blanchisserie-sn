import { useEffect, useState } from "react";
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Icon from "@/components/ui/Icon";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Props {
    visible: boolean;
    /** Valeur initiale affichée à l'ouverture. */
    value: number;
    /** Titre haut de modale (ex: nom de l'article). */
    title?: string;
    /** Sous-titre (ex: poids/pièce). */
    subtitle?: string;
    onClose: () => void;
    onConfirm: (value: number) => void;
}

const MAX_VALUE = 9999;
const ADD_PRESETS = [10, 25, 50, 100, 200];
const KEYS: Array<{ label: string; value: string }> = [
    { label: "1", value: "1" },
    { label: "2", value: "2" },
    { label: "3", value: "3" },
    { label: "4", value: "4" },
    { label: "5", value: "5" },
    { label: "6", value: "6" },
    { label: "7", value: "7" },
    { label: "8", value: "8" },
    { label: "9", value: "9" },
    { label: "C", value: "clear" },
    { label: "0", value: "0" },
    { label: "←", value: "back" },
];

/**
 * Modale pavé numérique pour saisir une quantité.
 * - Affiche la valeur courante en gros
 * - Quick-add chips (+10, +25, +50, +100, +200)
 * - Pavé 0-9 + clear + backspace
 * - Cap à 9999
 */
export function QuantityKeypadModal({
    visible,
    value,
    title,
    subtitle,
    onClose,
    onConfirm,
}: Props) {
    const colors = useThemeColors();
    const [draft, setDraft] = useState<number>(value);

    useEffect(() => {
        if (visible) setDraft(value);
    }, [visible, value]);

    const press = (key: string) => {
        if (key === "clear") {
            setDraft(0);
            return;
        }
        if (key === "back") {
            setDraft((d) => Math.floor(d / 10));
            return;
        }
        const digit = parseInt(key, 10);
        if (isNaN(digit)) return;
        setDraft((d) => Math.min(MAX_VALUE, d * 10 + digit));
    };

    const addPreset = (n: number) => {
        setDraft((d) => Math.min(MAX_VALUE, d + n));
    };

    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable
                    style={[styles.sheet, { backgroundColor: colors.paper }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <SafeAreaView edges={["bottom"]}>
                        {/* Header */}
                        <View
                            style={[styles.header, { borderBottomColor: colors.ink200 }]}
                        >
                            <View style={{ flex: 1, minWidth: 0 }}>
                                {title ? (
                                    <Text
                                        style={[styles.title, { color: colors.ink900 }]}
                                        numberOfLines={1}
                                    >
                                        {title}
                                    </Text>
                                ) : null}
                                {subtitle ? (
                                    <Text
                                        style={[styles.subtitle, { color: colors.ink500 }]}
                                    >
                                        {subtitle}
                                    </Text>
                                ) : null}
                            </View>
                            <Pressable
                                onPress={onClose}
                                hitSlop={16}
                                style={styles.closeBtn}
                            >
                                <Icon name="x" size={20} color={colors.ink800} stroke={2.2} />
                            </Pressable>
                        </View>

                        {/* Value display */}
                        <View style={styles.valueBlock}>
                            <Text
                                style={[
                                    styles.valueText,
                                    { color: draft === 0 ? colors.ink400 : colors.ink900 },
                                ]}
                            >
                                {draft === 0 ? "—" : draft}
                            </Text>
                            <Text style={[styles.valueLabel, { color: colors.ink500 }]}>
                                pièce{draft > 1 ? "s" : ""}
                            </Text>
                        </View>

                        {/* Quick-add chips */}
                        <View style={styles.chipsRow}>
                            {ADD_PRESETS.map((n) => (
                                <Pressable
                                    key={n}
                                    onPress={() => addPreset(n)}
                                    style={[
                                        styles.chip,
                                        {
                                            backgroundColor: colors.brand50,
                                            borderColor: colors.brand100,
                                        },
                                    ]}
                                >
                                    <Text
                                        style={[styles.chipText, { color: colors.brand800 }]}
                                    >
                                        +{n}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Numeric keypad */}
                        <View style={styles.grid}>
                            {KEYS.map((k) => {
                                const isAction = k.value === "clear" || k.value === "back";
                                return (
                                    <Pressable
                                        key={k.value}
                                        onPress={() => press(k.value)}
                                        style={[
                                            styles.key,
                                            {
                                                backgroundColor: isAction
                                                    ? colors.paper2
                                                    : colors.paper,
                                                borderColor: colors.ink200,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.keyText,
                                                {
                                                    color: isAction
                                                        ? colors.ink600
                                                        : colors.ink900,
                                                    fontSize: isAction ? 18 : 24,
                                                },
                                            ]}
                                        >
                                            {k.label}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>

                        {/* Bottom actions */}
                        <View style={styles.actions}>
                            <Pressable
                                onPress={onClose}
                                style={[
                                    styles.cancelBtn,
                                    { borderColor: colors.ink200 },
                                ]}
                            >
                                <Text
                                    style={[styles.cancelText, { color: colors.ink700 }]}
                                >
                                    Annuler
                                </Text>
                            </Pressable>
                            <Pressable
                                onPress={() => {
                                    onConfirm(draft);
                                    onClose();
                                }}
                                style={[
                                    styles.confirmBtn,
                                    { backgroundColor: colors.brand800 },
                                ]}
                            >
                                <Text
                                    style={[styles.confirmText, { color: colors.paper }]}
                                >
                                    Valider
                                </Text>
                            </Pressable>
                        </View>
                    </SafeAreaView>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
        justifyContent: "flex-end",
    },
    sheet: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingHorizontal: 16,
        paddingTop: 16,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
    },
    subtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    closeBtn: {
        width: 44,
        height: 44,
        borderRadius: 99,
        alignItems: "center",
        justifyContent: "center",
    },
    valueBlock: {
        alignItems: "center",
        paddingVertical: 18,
    },
    valueText: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 56,
        lineHeight: 60,
    },
    valueLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        marginTop: 4,
    },
    chipsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 6,
        marginBottom: 14,
    },
    chip: {
        flex: 1,
        paddingVertical: 8,
        borderRadius: 99,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    chipText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 14,
    },
    key: {
        width: "31.5%",
        aspectRatio: 1.8,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    keyText: {
        fontFamily: FontFamily.monoMedium,
    },
    actions: {
        flexDirection: "row",
        gap: 10,
        marginBottom: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    cancelText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
    confirmBtn: {
        flex: 2,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
});
