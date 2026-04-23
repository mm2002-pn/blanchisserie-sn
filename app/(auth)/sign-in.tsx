import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Alert,
    Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeColors } from '@/hooks/useThemeColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Spacing } from '@/constants/Spacing';
import { Typography } from '@/constants/Typography';

export default function SignInScreen() {
    const router = useRouter();
    const { login } = useAuth();
    const colors = useThemeColors();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({ email: '', password: '' });

    const validate = () => {
        let valid = true;
        const newErrors = { email: '', password: '' };

        if (!email) {
            newErrors.email = 'Email requis';
            valid = false;
        } else if (!/\S+@\S+\.\S+/.test(email)) {
            newErrors.email = 'Email invalide';
            valid = false;
        }

        if (!password) {
            newErrors.password = 'Mot de passe requis';
            valid = false;
        } else if (password.length < 6) {
            newErrors.password = 'Minimum 6 caractères';
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

            // Redirect based on user role
            if (user.role === 'hotel') {
                router.replace('/(hotel)/dashboard');
            } else if (user.role === 'driver') {
                router.replace('/(driver)/route');
            } else if (user.role === 'supervisor') {
                router.replace('/(supervisor)/production');
            } else {
                // Fallback to hotel dashboard if role is unknown
                router.replace('/(hotel)/dashboard');
            }
        } catch (error: any) {
            Alert.alert(
                'Erreur de connexion',
                error.message || 'Email ou mot de passe incorrect'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo/Icon */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoIcon}>🧺</Text>
                    <Text style={[styles.logo, { color: colors.primary }]}>
                        LaundryKing
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        Blanchisserie Hôtelière
                    </Text>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={[styles.title, { color: colors.textPrimary }]}>
                        Connexion
                    </Text>
                    <Text style={[styles.description, { color: colors.textSecondary }]}>
                        Connectez-vous pour accéder à vos services de blanchisserie
                    </Text>

                    <Input
                        label="Email"
                        placeholder="votre@email.com"
                        value={email}
                        onChangeText={setEmail}
                        error={errors.email}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                        leftIcon={<Text>✉️</Text>}
                    />

                    <Input
                        label="Mot de passe"
                        placeholder="••••••••"
                        value={password}
                        onChangeText={setPassword}
                        error={errors.password}
                        secureTextEntry
                        autoCapitalize="none"
                        leftIcon={<Text>🔒</Text>}
                    />

                    <Button
                        title="Se connecter"
                        onPress={handleSignIn}
                        loading={loading}
                        style={styles.button}
                    />

                    {/* Helper text */}
                    <View style={styles.helperContainer}>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                            Comptes de test:
                        </Text>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                            Hôtel: hotel@test.com / password
                        </Text>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                            Chauffeur: driver@test.com / password
                        </Text>
                        <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                            Superviseur: supervisor@test.com / password
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.padding.screen,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    logoIcon: {
        fontSize: 64,
        marginBottom: Spacing.md,
    },
    logo: {
        fontSize: Typography.fontSize.xxxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: Typography.fontSize.sm,
    },
    form: {
        width: '100%',
    },
    title: {
        fontSize: Typography.fontSize.xxl,
        fontWeight: Typography.fontWeight.bold,
        marginBottom: Spacing.xs,
    },
    description: {
        fontSize: Typography.fontSize.sm,
        marginBottom: Spacing.xl,
    },
    button: {
        marginTop: Spacing.lg,
    },
    helperContainer: {
        marginTop: Spacing.xl,
        padding: Spacing.md,
        backgroundColor: '#F3F4F6',
        borderRadius: Spacing.borderRadius.md,
    },
    helperText: {
        fontSize: Typography.fontSize.xs,
        marginVertical: 2,
    },
});
