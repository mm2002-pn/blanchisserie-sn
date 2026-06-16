import { useRef, useState } from "react";
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
import { useLocalSearchParams, useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

const CODE_LENGTH = 6;

export default function VerificationScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { email } = useLocalSearchParams<{ email?: string }>();
    const inputs = useRef<Array<TextInput | null>>([]);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(""));
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (i: number, v: string) => {
        const clean = v.replace(/\D/g, "").slice(0, 1);
        setDigits((prev) => {
            const next = [...prev];
            next[i] = clean;
            return next;
        });
        if (clean && i < CODE_LENGTH - 1) {
            inputs.current[i + 1]?.focus();
        }
    };

    const handleKey = (i: number, key: string) => {
        if (key === "Backspace" && !digits[i] && i > 0) {
            inputs.current[i - 1]?.focus();
        }
    };

    const handleVerify = () => {
        if (digits.some((d) => !d)) {
            Alert.alert("Code incomplet", "Saisis les 6 chiffres reçus par email.");
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            setSubmitting(false);
            router.replace("/(auth)/change-password");
        }, 500);
    };

    const handleResend = () => {
        Alert.alert("Code renvoyé", "Un nouveau code vient d'être envoyé.");
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
                <ThemedText variate="title">Vérification</ThemedText>
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
                        Code à 6 chiffres
                    </Text>
                    <Text style={[styles.heroTitle, { color: colors.paper }]}>
                        Saisis le code reçu
                    </Text>
                    {email && (
                        <Text style={[styles.heroSub, { color: colors.brand100 }]}>
                            Envoyé à {email}
                        </Text>
                    )}
                </Card>

                <View style={styles.codeRow}>
                    {digits.map((d, i) => (
                        <TextInput
                            key={i}
                            ref={(el) => {
                                inputs.current[i] = el;
                            }}
                            value={d}
                            onChangeText={(v) => handleChange(i, v)}
                            onKeyPress={({ nativeEvent }) =>
                                handleKey(i, nativeEvent.key)
                            }
                            keyboardType="number-pad"
                            maxLength={1}
                            textAlign="center"
                            style={[
                                styles.codeCell,
                                {
                                    backgroundColor: colors.paper,
                                    borderColor: d ? colors.brand800 : colors.ink200,
                                    color: colors.ink900,
                                },
                            ]}
                        />
                    ))}
                </View>

                <Pressable
                    onPress={handleVerify}
                    disabled={submitting}
                    style={[
                        styles.cta,
                        {
                            backgroundColor: submitting ? colors.ink300 : colors.brand800,
                        },
                    ]}
                >
                    <Text style={[styles.ctaText, { color: colors.paper }]}>
                        {submitting ? "Vérification…" : "Vérifier"}
                    </Text>
                    {!submitting && (
                        <Icon name="arrowRight" size={14} color={colors.paper} />
                    )}
                </Pressable>

                <Pressable onPress={handleResend} style={styles.resend}>
                    <Text style={[styles.resendText, { color: colors.ink700 }]}>
                        Pas reçu ?
                        <Text style={{ color: colors.brand800 }}> Renvoyer le code</Text>
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    );
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
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 6,
    },

    codeRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 8,
        marginBottom: 24,
    },
    codeCell: {
        flex: 1,
        height: 54,
        borderRadius: 12,
        borderWidth: 1.5,
        fontFamily: FontFamily.monoMedium,
        fontSize: 22,
    },

    cta: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },

    resend: {
        marginTop: 18,
        alignItems: "center",
    },
    resendText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
});
