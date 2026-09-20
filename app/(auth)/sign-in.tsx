import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRouter } from "expo-router";

import { BrandMark } from "@/components/ui/BrandMark";
import { FontFamily, Typography } from "@/constants/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SignInScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colors = useThemeColors();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSignIn = async () => {
        if (!email || !password) {
            setError("Renseigne ton email et ton mot de passe.");
            return;
        }
        setError("");
        setLoading(true);
        try {
            const user = await login(email, password);

            if (user.role === "hotel") {
                router.replace("/(hotel)/dashboard");
            } else if (user.role === "driver") {
                router.replace("/(driver)/route");
            } else if (user.role === "supervisor") {
                router.replace("/(supervisor)/production");
            } else {
                router.replace("/(hotel)/dashboard");
            }
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "Identifiants incorrects.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Fond marine fixe, plein écran, INDÉPENDANT du KeyboardAvoidingView —
        // "height" (Android) réduit la vraie hauteur du composant quand le
        // clavier s'ouvre ; sans ce fond derrière, la zone libérée en bas
        // laisse voir le blanc de la fenêtre native.
        <View style={[styles.container, { backgroundColor: colors.brand900 }]}>
        <KeyboardAvoidingView
            style={styles.container}
            // Android : le clavier resize déjà la fenêtre nativement
            // (windowSoftInputMode="adjustResize", par défaut sur Expo). Ajouter
            // behavior="height" ici fait doublement compenser la même ouverture
            // (fenêtre ET vue) → le contenu "saute"/se déforme à la frappe.
            // undefined = on laisse l'OS gérer, KeyboardAvoidingView ne touche à rien.
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                <View style={styles.hero}>
                    <View style={styles.brandRow}>
                        <BrandMark size={46} variant="full" />
                        <View style={[styles.brandDivider, { backgroundColor: colors.brand600 }]} />
                        <View>
                            <Text style={styles.brandName}>B&C</Text>
                            <Text style={styles.brandSuffix}>TERANGA</Text>
                        </View>
                    </View>
                    <Text style={styles.title}>
                        L'Art du Blanc{"\n"}
                        <Text style={styles.titleAccent}>et de la Couleur.</Text>
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.ink400 }]}>
                        Connecte-toi pour accéder à ton espace.
                    </Text>
                </View>

                <View style={styles.form}>
                    <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="Adresse e-mail"
                        placeholderTextColor={colors.ink500}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        style={[
                            styles.input,
                            { backgroundColor: colors.brand800, borderColor: colors.brand700, color: "#FFFFFF" },
                        ]}
                    />
                    <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Mot de passe"
                        placeholderTextColor={colors.ink500}
                        secureTextEntry
                        autoCapitalize="none"
                        style={[
                            styles.input,
                            { backgroundColor: colors.brand800, borderColor: colors.brand700, color: "#FFFFFF" },
                        ]}
                    />

                    {error && (
                        <View style={[styles.errorBox, { backgroundColor: "#3A1108", borderColor: "#8A3016" }]}>
                            <View style={[styles.errorDot, { backgroundColor: colors.terra600 }]}>
                                <Text style={styles.errorDotText}>!</Text>
                            </View>
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    <Pressable
                        onPress={handleSignIn}
                        disabled={loading}
                        style={[
                            styles.submit,
                            { backgroundColor: colors.terra600, opacity: loading ? 0.7 : 1 },
                        ]}
                    >
                        <Text style={styles.submitText}>
                            {loading ? "Connexion…" : "Se connecter"}
                        </Text>
                    </Pressable>

                    <Pressable hitSlop={6} style={styles.forgotWrap}>
                        <Text style={[styles.forgot, { color: colors.ink400 }]}>
                            Mot de passe oublié ?
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // `flexGrow:1` + `justifyContent:'space-between'` : hero en haut, formulaire
    // en bas SUR GRAND écran/clavier fermé, mais les deux redeviennent
    // simplement empilés (pas de centrage concurrent) dès que l'espace se
    // réduit (clavier ouvert) — le ScrollView prend le relais sans jamais
    // masquer le bouton.
    scroll: {
        flexGrow: 1,
        justifyContent: "space-between",
        paddingHorizontal: 30,
        paddingTop: 70,
        paddingBottom: 34,
    },

    hero: {
        marginBottom: 40,
    },
    brandRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 13,
    },
    brandDivider: {
        width: 1,
        height: 34,
    },
    brandName: {
        fontFamily: FontFamily.uiBold,
        fontSize: 19,
        lineHeight: 19,
        letterSpacing: -0.5,
        color: "#FFFFFF",
    },
    brandSuffix: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 9,
        letterSpacing: 2.3,
        color: "#F0A03D",
        marginTop: 5,
    },
    title: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 32,
        lineHeight: 36,
        color: "#FFFFFF",
        marginTop: 26,
        letterSpacing: -0.5,
    },
    titleAccent: {
        color: "#F0A03D",
        fontFamily: FontFamily.serifRegular,
        fontWeight: "300",
    },
    subtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.md,
        marginTop: 14,
        lineHeight: 22,
    },

    form: {
        gap: 11,
    },
    input: {
        height: 60,
        borderRadius: 16,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 18,
        fontSize: 15,
        fontFamily: FontFamily.serifRegular,
    },
    errorBox: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 15,
        paddingVertical: 13,
    },
    errorDot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        alignItems: "center",
        justifyContent: "center",
    },
    errorDotText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 12,
        color: "#3A1108",
    },
    errorText: {
        flex: 1,
        fontSize: 13,
        color: "#F5CDBF",
        fontFamily: FontFamily.uiRegular,
    },
    submit: {
        marginTop: 5,
        height: 60,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    submitText: {
        fontFamily: FontFamily.serifSemibold,
        fontSize: 15,
        color: "#FFFFFF",
    },
    forgotWrap: {
        paddingTop: 4,
    },
    forgot: {
        textAlign: "center",
        fontFamily: FontFamily.uiRegular,
        fontSize: 13,
    },
});
