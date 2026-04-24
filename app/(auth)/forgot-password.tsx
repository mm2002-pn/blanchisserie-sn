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
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!email.trim()) {
            Alert.alert("Attention", "Veuillez entrer votre adresse email.");
            return;
        }
        setSending(true);
        // Simulate API
        setTimeout(() => {
            setSending(false);
            router.push({
                pathname: "/(auth)/verification",
                params: { email: email.trim() },
            });
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
                <ThemedText variate="title">Mot de passe oublié</ThemedText>
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
                        Réinitialisation
                    </Text>
                    <Text style={[styles.heroTitle, { color: colors.paper }]}>
                        On t'envoie un code à 6 chiffres
                    </Text>
                    <Text style={[styles.heroSub, { color: colors.brand100 }]}>
                        Saisis l'email associé à ton compte, tu recevras un code pour
                        réinitialiser ton mot de passe.
                    </Text>
                </Card>

                <Text style={[styles.label, { color: colors.ink700 }]}>Email</Text>
                <View
                    style={[
                        styles.input,
                        { backgroundColor: colors.paper, borderColor: colors.ink200 },
                    ]}
                >
                    <Icon name="msg" size={14} color={colors.ink500} />
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="nom@etablissement.sn"
                        placeholderTextColor={colors.ink400}
                        autoCapitalize="none"
                        keyboardType="email-address"
                        style={[styles.inputText, { color: colors.ink900 }]}
                    />
                </View>

                <Pressable
                    onPress={handleSend}
                    disabled={sending}
                    style={[
                        styles.cta,
                        { backgroundColor: sending ? colors.ink300 : colors.brand800 },
                    ]}
                >
                    <Text style={[styles.ctaText, { color: colors.paper }]}>
                        {sending ? "Envoi en cours…" : "Envoyer le code"}
                    </Text>
                    {!sending && (
                        <Icon name="arrowRight" size={14} color={colors.paper} />
                    )}
                </Pressable>

                <Pressable
                    onPress={() => router.replace("/(auth)/sign-in")}
                    style={styles.back}
                >
                    <Icon name="chevLeft" size={12} color={colors.ink700} />
                    <Text style={[styles.backText, { color: colors.ink700 }]}>
                        Retour à la connexion
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
        marginBottom: 18,
    },
    inputText: {
        flex: 1,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        padding: 0,
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
    back: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 4,
        marginTop: 18,
    },
    backText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },
});
