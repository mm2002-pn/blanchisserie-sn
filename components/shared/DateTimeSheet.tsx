import { useEffect } from "react";
import {
    Modal,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import DateTimePicker, {
    DateTimePickerAndroid,
    type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";

import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

interface Props {
    visible: boolean;
    mode: "date" | "time";
    value: Date;
    minimumDate?: Date;
    maximumDate?: Date;
    title?: string;
    onClose: () => void;
    onChange: (value: Date) => void;
}

/**
 * Picker date/heure unifié, basé sur le picker natif officiel
 * (`@react-native-community/datetimepicker`).
 *
 * - Android : ouvre le dialog système (date OU heure) via l'API impérative.
 * - iOS     : feuille modale en bas avec le spinner natif + bouton Confirmer.
 *
 * L'appelant garde son state (Date JS) — pas de format string à manipuler.
 */
export function DateTimeSheet({
    visible,
    mode,
    value,
    minimumDate,
    maximumDate,
    title,
    onClose,
    onChange,
}: Props) {
    const colors = useThemeColors();

    /* Android : on déclenche le dialog système quand `visible` passe à true. */
    useEffect(() => {
        if (!visible || Platform.OS !== "android") return;
        DateTimePickerAndroid.open({
            value,
            mode,
            is24Hour: true,
            minimumDate,
            maximumDate,
            onChange: (event: DateTimePickerEvent, date?: Date) => {
                if (event.type === "set" && date) onChange(date);
                onClose();
            },
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible, mode]);

    if (Platform.OS === "android") return null;

    /* iOS : sheet en bas avec spinner natif. */
    return (
        <Modal
            transparent
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
        >
            <Pressable style={styles.backdrop} onPress={onClose}>
                <Pressable
                    style={[styles.sheet, { backgroundColor: colors.paper }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    {title ? (
                        <Text style={[styles.title, { color: colors.ink900 }]}>
                            {title}
                        </Text>
                    ) : null}

                    <View style={styles.pickerWrap}>
                        <DateTimePicker
                            value={value}
                            mode={mode}
                            display="spinner"
                            minimumDate={minimumDate}
                            maximumDate={maximumDate}
                            locale="fr-FR"
                            is24Hour
                            onChange={(_, date) => {
                                if (date) onChange(date);
                            }}
                            themeVariant="light"
                            textColor={colors.ink900}
                        />
                    </View>

                    <Pressable
                        onPress={onClose}
                        style={[styles.confirmBtn, { backgroundColor: colors.brand800 }]}
                    >
                        <Text style={[styles.confirmText, { color: colors.paper }]}>
                            Confirmer
                        </Text>
                    </Pressable>
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
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 16,
        paddingBottom: 24,
    },
    title: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        textAlign: "center",
        marginBottom: 8,
    },
    pickerWrap: {
        alignItems: "center",
    },
    confirmBtn: {
        marginTop: 8,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: "center",
    },
    confirmText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
});
