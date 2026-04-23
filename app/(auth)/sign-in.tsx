import { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useRouter } from "expo-router";
import Svg, { Defs, Path, Pattern, Rect } from "react-native-svg";

import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { Spacing } from "@/constants/Spacing";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeColors } from "@/hooks/useThemeColors";

export default function SignInScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colors = useThemeColors();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [remember, setRemember] = useState(true);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: "", password: "" });

    const validate = () => {
        let valid = true;
        const newErrors = { email: "", password: "" };

        if (!email) {
            newErrors.email = "Email requis";
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = "Email invalide";
            valid = false;
        }

        if (!password) {
            newErrors.password = "Mot de passe requis";
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = "Minimum 6 caractères";
            valid = false;
        }

        setErrors(newErrors);
        return valid;
    };

    const handleSignIn = async () => {
        if (!validate()) return;

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
                err instanceof Error
                    ? err.message
                    : "Email ou mot de passe incorrect";
            Alert.alert("Erreur de connexion", message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.brand800 }]}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.scroll}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                {/* Bannière haute — motif onde en filigrane + logo */}
                <View style={[styles.banner, { backgroundColor: colors.brand800 }]}>
                    <Svg
                        style={StyleSheet.absoluteFillObject}
                        width="100%"
                        height="100%"
                        viewBox="0 0 390 280"
                        preserveAspectRatio="xMidYMid slice"
                        opacity={0.12}
                    >
                        <Defs>
                            <Pattern
                                id="wave"
                                width="80"
                                height="40"
                                patternUnits="userSpaceOnUse"
                            >
                                <Path
                                    d="M0 20 Q20 0 40 20 T80 20"
                                    stroke="white"
                                    strokeWidth="1"
                                    fill="none"
                                />
                            </Pattern>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#wave)" />
                    </Svg>

                    <View style={styles.logoWrap}>
                        <View
                            style={[styles.logoBox, { backgroundColor: colors.terra600 }]}
                        >
                            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                                <Path
                                    d="M3 5h18v14H3zM7 5v14M17 5v14M3 10h18M3 14h18"
                                    stroke="white"
                                    strokeWidth={1.8}
                                    strokeLinecap="round"
                                />
                            </Svg>
                        </View>
                        <Text style={[styles.logoText, { color: colors.paper }]}>
                            Blanchisserie SN
                        </Text>
                    </View>
                </View>

                {/* Feuille basse — form */}
                <View style={[styles.sheet, { backgroundColor: colors.paper }]}>
                    <ThemedText variate="titleLg" style={styles.welcome}>
                        Bon retour.
                    </ThemedText>
                    <ThemedText
                        variate="caption"
                        color="ink500"
                        style={styles.welcomeSub}
                    >
                        Connectez-vous à votre espace pro.
                    </ThemedText>

                    <Input
                        label="Email professionnel"
                        placeholder="awa.ndiaye@pullman-teranga.sn"
                        value={email}
                        onChangeText={setEmail}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                    />

                    <Input
                        label="Mot de passe"
                        placeholder="••••••••••"
                        value={password}
                        onChangeText={setPassword}
                        error={errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                    />

                    <View style={styles.row}>
                        <Pressable
                            onPress={() => setRemember((v) => !v)}
                            style={styles.checkboxRow}
                            hitSlop={6}
                        >
                            <View
                                style={[
                                    styles.checkbox,
                                    {
                                        backgroundColor: remember
                                            ? colors.brand800
                                            : "transparent",
                                        borderColor: remember
                                            ? colors.brand800
                                            : colors.ink300,
                                    },
                                ]}
                            >
                                {remember && (
                                    <Icon
                                        name="check"
                                        size={10}
                                        color={colors.paper}
                                        stroke={3}
                                    />
                                )}
                            </View>
                            <Text style={[styles.checkLabel, { color: colors.ink700 }]}>
                                Se souvenir de moi
                            </Text>
                        </Pressable>

                        <Pressable hitSlop={6}>
                            <Text style={[styles.forgot, { color: colors.brand700 }]}>
                                Mot de passe oublié ?
                            </Text>
                        </Pressable>
                    </View>

                    <Button
                        title="Se connecter"
                        onPress={handleSignIn}
                        loading={loading}
                        fullWidth
                        size="large"
                        style={styles.submit}
                    />

                    <View style={styles.signupRow}>
                        <Text style={[styles.signupText, { color: colors.ink500 }]}>
                            Pas encore de compte ?{" "}
                        </Text>
                        <Pressable hitSlop={6}>
                            <Text style={[styles.signupLink, { color: colors.terra700 }]}>
                                Demander l'accès
                            </Text>
                        </Pressable>
                    </View>

                    {/* Test accounts — à retirer à l'intégration de l'API réelle */}
                    <View
                        style={[
                            styles.helper,
                            { backgroundColor: colors.paper2, borderColor: colors.ink200 },
                        ]}
                    >
                        <Text style={[styles.helperTitle, { color: colors.ink600 }]}>
                            Comptes de test
                        </Text>
                        {[
                            ["Hôtel", "hotel@test.com"],
                            ["Chauffeur", "driver@test.com"],
                            ["Superviseur", "supervisor@test.com"],
                        ].map(([role, mail]) => (
                            <View key={role} style={styles.helperRow}>
                                <Text style={[styles.helperRole, { color: colors.ink700 }]}>
                                    {role}
                                </Text>
                                <Text style={[styles.helperMail, { color: colors.ink500 }]}>
                                    {mail} · password
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const BANNER_HEIGHT = 260;

const styles = StyleSheet.create({
    container: { flex: 1 },
    scroll: { flexGrow: 1 },
    banner: {
        height: BANNER_HEIGHT,
        overflow: "hidden",
    },
    logoWrap: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        paddingTop: 40,
    },
    logoBox: {
        width: 56,
        height: 56,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    logoText: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 26,
        letterSpacing: -0.3,
        marginTop: 14,
    },
    sheet: {
        marginTop: -24,
        padding: 24,
        paddingTop: 28,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        flex: 1,
    },
    welcome: {
        marginBottom: 6,
    },
    welcomeSub: {
        marginBottom: 22,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginTop: 6,
        marginBottom: 22,
    },
    checkboxRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    checkbox: {
        width: 18,
        height: 18,
        borderRadius: 4,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    checkLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
    },
    forgot: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.xs,
    },
    submit: {
        borderRadius: 12,
    },
    signupRow: {
        flexDirection: "row",
        justifyContent: "center",
        marginTop: 20,
    },
    signupText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.xs,
    },
    signupLink: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },
    helper: {
        marginTop: Spacing.xl,
        padding: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    helperTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: Typography.letterSpacing.wide,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    helperRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 2,
    },
    helperRole: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.xs,
    },
    helperMail: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.xs,
    },
});
