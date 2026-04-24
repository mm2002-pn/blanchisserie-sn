import { useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ChangePasswordScreen() {
    const router = useRouter();
    const colors = useThemeColors();

    const [current, setCurrent] = useState("");
    const [next, setNext] = useState("");
    const [confirm, setConfirm] = useState("");
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNext, setShowNext] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const strength = scoreStrength(next);

    const handleSubmit = () => {
        if (!current || !next || !confirm) {
            Alert.alert("Champs incomplets", "Renseigne tous les champs.");
            return;
        }
        if (next.length < 8) {
            Alert.alert(
                "Mot de passe trop court",
                "Il doit contenir au moins 8 caractères.",
            );
            return;
        }
        if (next !== confirm) {
            Alert.alert(
                "Confirmation incorrecte",
                "Les deux mots de passe ne correspondent pas.",
            );
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            Alert.alert(
                "Mot de passe modifié",
                "Ton mot de passe a été mis à jour avec succès.",
                [
                    {
                        text: "OK",
                        onPress: () => router.back(),
                    },
                ],
            );
        }, 600);
    };

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
                <Pressable onPress={() => router.back()} hitSlop={8}>
                    <Icon name="chevLeft" size={20} color={colors.ink800} />
                </Pressable>
                <ThemedText variate="title">Mot de passe</ThemedText>
                <View style={{ width: 20 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Card
                    padding={18}
                    style={[
                        styles.hero,
                        { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                    ]}
                >
                    <Text style={[styles.heroCaps, { color: colors.brand100 }]}>
                        Sécurité
                    </Text>
                    <Text style={[styles.heroTitle, { color: colors.paper }]}>
                        Modifier le mot de passe
                    </Text>
                    <Text style={[styles.heroSub, { color: colors.brand100 }]}>
                        Choisis un mot de passe d'au moins 8 caractères, avec des chiffres
                        et symboles.
                    </Text>
                </Card>

                <PasswordField
                    label="Mot de passe actuel"
                    value={current}
                    onChangeText={setCurrent}
                    visible={showCurrent}
                    onToggle={() => setShowCurrent((v) => !v)}
                />

                <PasswordField
                    label="Nouveau mot de passe"
                    value={next}
                    onChangeText={setNext}
                    visible={showNext}
                    onToggle={() => setShowNext((v) => !v)}
                />

                {next.length > 0 && (
                    <View style={styles.strengthRow}>
                        {[0, 1, 2, 3].map((i) => (
                            <View
                                key={i}
                                style={[
                                    styles.strengthSeg,
                                    {
                                        backgroundColor:
                                            i < strength.level
                                                ? strength.color === "ok"
                                                    ? colors.ok600
                                                    : strength.color === "warn"
                                                      ? colors.warn600
                                                      : colors.danger600
                                                : colors.ink200,
                                    },
                                ]}
                            />
                        ))}
                        <Text
                            style={[
                                styles.strengthLabel,
                                {
                                    color:
                                        strength.color === "ok"
                                            ? colors.ok700
                                            : strength.color === "warn"
                                              ? colors.warn700
                                              : colors.danger600,
                                },
                            ]}
                        >
                            {strength.label}
                        </Text>
                    </View>
                )}

                <PasswordField
                    label="Confirmer le nouveau mot de passe"
                    value={confirm}
                    onChangeText={setConfirm}
                    visible={showNext}
                    onToggle={() => setShowNext((v) => !v)}
                />

                <Pressable
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={[
                        styles.cta,
                        {
                            backgroundColor: submitting ? colors.ink300 : colors.brand800,
                        },
                    ]}
                >
                    <Icon name="check" size={15} color={colors.paper} />
                    <Text style={[styles.ctaText, { color: colors.paper }]}>
                        {submitting ? "Mise à jour…" : "Enregistrer"}
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
}

function PasswordField({
    label,
    value,
    onChangeText,
    visible,
    onToggle,
}: {
    label: string;
    value: string;
    onChangeText: (v: string) => void;
    visible: boolean;
    onToggle: () => void;
}) {
    const colors = useThemeColors();
    const eye: IconName = visible ? "x" : "check";
    return (
        <View style={{ marginBottom: 14 }}>
            <Text style={[styles.label, { color: colors.ink700 }]}>{label}</Text>
            <View
                style={[
                    styles.input,
                    { backgroundColor: colors.paper, borderColor: colors.ink200 },
                ]}
            >
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    placeholder="••••••••"
                    placeholderTextColor={colors.ink400}
                    secureTextEntry={!visible}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[styles.inputText, { color: colors.ink900 }]}
                />
                <Pressable onPress={onToggle} hitSlop={8}>
                    <Icon name={eye} size={14} color={colors.ink500} />
                </Pressable>
            </View>
        </View>
    );
}

function scoreStrength(pw: string) {
    let score = 0;
    if (pw.length >= 8) score += 1;
    if (pw.length >= 12) score += 1;
    if (/[0-9]/.test(pw) && /[A-Za-z]/.test(pw)) score += 1;
    if (/[^A-Za-z0-9]/.test(pw)) score += 1;

    if (score <= 1) return { level: 1, color: "danger", label: "Faible" } as const;
    if (score === 2) return { level: 2, color: "warn", label: "Moyen" } as const;
    if (score === 3) return { level: 3, color: "warn", label: "Correct" } as const;
    return { level: 4, color: "ok", label: "Solide" } as const;
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    content: { padding: 16, paddingBottom: 60 },

    hero: { marginBottom: 18 },
    heroCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    heroTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        letterSpacing: -0.3,
        marginTop: 6,
    },
    heroSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        lineHeight: Typography.fontSize.tiny * 1.5,
        marginTop: 6,
    },

    label: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 6,
    },
    input: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    inputText: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
    },

    strengthRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginBottom: 14,
        marginTop: -8,
    },
    strengthSeg: {
        flex: 1,
        height: 4,
        borderRadius: 2,
    },
    strengthLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        marginLeft: 10,
        minWidth: 60,
        textAlign: "right",
    },

    cta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
        marginTop: 6,
    },
    ctaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },
});
