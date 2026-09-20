import { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { useRouter } from "expo-router";

import Card from "@/components/ui/Card";
import Icon from "@/components/ui/Icon";
import ThemedText from "@/components/ui/ThemedText";
import { StatusBarSpace } from "@/components/shared/StatusBarSpace";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useClients } from "@/hooks/useClients";
import { useLinenTypes } from "@/hooks/useLinenTypes";
import { useCreateOrder } from "@/hooks/useOrders";
import type { ApiClient } from "@/services/clients.service";

/**
 * Création d'une collecte sur place par le chauffeur, quand l'hôtel n'a pas
 * fait de commande à l'avance. Volontairement minimal (pas de photos/tarifs
 * comme côté hôtel) : le détail réel (poids, photos, signature) se fait
 * juste après dans l'écran de collecte habituel.
 */
export default function NewCollectionScreen() {
    const router = useRouter();
    const colors = useThemeColors();
    const { mutateAsync: createOrder, isPending: submitting } = useCreateOrder();

    const [search, setSearch] = useState("");
    const { data: clients = [], isPending: clientsLoading } = useClients(search || undefined);
    const [client, setClient] = useState<ApiClient | null>(null);

    const { data: linenTypes = [], isPending: linenLoading } = useLinenTypes();
    const [quantities, setQuantities] = useState<Record<string, number>>({});
    const [instructions, setInstructions] = useState("");

    const totalItems = useMemo(
        () => Object.values(quantities).reduce((sum, q) => sum + q, 0),
        [quantities],
    );

    const setQty = (code: string, delta: number) => {
        setQuantities((prev) => {
            const next = Math.max(0, (prev[code] ?? 0) + delta);
            return { ...prev, [code]: next };
        });
    };

    const handleSubmit = async () => {
        if (!client) {
            Alert.alert("Client requis", "Choisis d'abord l'établissement.");
            return;
        }
        const items = linenTypes
            .filter((lt) => (quantities[lt.code] ?? 0) > 0)
            .map((lt) => ({
                type: lt.code,
                quantity: quantities[lt.code],
                category: lt.category,
            }));
        if (items.length === 0) {
            Alert.alert("Linge requis", "Ajoute au moins un article collecté.");
            return;
        }
        try {
            const order = await createOrder({
                clientId: client.id,
                services: [{ service: "blanchisserie", items }],
                collectionDate: new Date().toISOString(),
                instructions: instructions.trim() || undefined,
            });
            router.replace({
                pathname: "/(driver)/collect",
                params: { orderId: order.id },
            });
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Erreur inconnue.";
            Alert.alert("Impossible de créer la collecte", message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.paper }]}>
            <StatusBarSpace color={colors.brand900} />
            <View style={[styles.topBar, { borderColor: colors.ink200 }]}>
                <Pressable
                    onPress={() => router.back()}
                    hitSlop={8}
                    style={[styles.backBtn, { backgroundColor: colors.ink100 }]}
                >
                    <Icon name="chevLeft" size={16} color={colors.ink800} stroke={1.8} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Nouvelle collecte</ThemedText>
                    <Text style={[styles.topSub, { color: colors.ink500 }]}>
                        À utiliser quand l'établissement n'a pas planifié de commande.
                    </Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* ── Étape 1 : établissement ─────────────────────── */}
                <Text style={[styles.sectionLabel, { color: colors.ink600 }]}>
                    Établissement
                </Text>
                {client ? (
                    <Card style={styles.selectedClient}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={[styles.clientName, { color: colors.ink900 }]}>
                                {client.name}
                            </Text>
                            {!!client.address && (
                                <Text style={[styles.clientAddress, { color: colors.ink500 }]}>
                                    {client.address}
                                </Text>
                            )}
                        </View>
                        <Pressable onPress={() => setClient(null)} hitSlop={8}>
                            <Text style={[styles.changeLink, { color: colors.terra600 }]}>
                                Changer
                            </Text>
                        </Pressable>
                    </Card>
                ) : (
                    <>
                        <TextInput
                            value={search}
                            onChangeText={setSearch}
                            placeholder="Rechercher un hôtel/restaurant…"
                            placeholderTextColor={colors.ink400}
                            style={[
                                styles.searchInput,
                                { backgroundColor: colors.paper2, borderColor: colors.ink200, color: colors.ink900 },
                            ]}
                        />
                        {clientsLoading ? (
                            <ActivityIndicator style={{ marginTop: 16 }} color={colors.brand800} />
                        ) : (
                            clients.map((c) => (
                                <Pressable
                                    key={c.id}
                                    onPress={() => setClient(c)}
                                    style={[styles.clientRow, { borderColor: colors.ink200 }]}
                                >
                                    <View style={{ flex: 1, minWidth: 0 }}>
                                        <Text style={[styles.clientName, { color: colors.ink900 }]}>
                                            {c.name}
                                        </Text>
                                        {!!c.address && (
                                            <Text style={[styles.clientAddress, { color: colors.ink500 }]}>
                                                {c.address}
                                            </Text>
                                        )}
                                    </View>
                                    <Icon name="chevRight" size={14} color={colors.ink400} stroke={2} />
                                </Pressable>
                            ))
                        )}
                        {!clientsLoading && clients.length === 0 && (
                            <Text style={[styles.emptyText, { color: colors.ink500 }]}>
                                Aucun établissement trouvé.
                            </Text>
                        )}
                    </>
                )}

                {/* ── Étape 2 : linge collecté ─────────────────────── */}
                <Text style={[styles.sectionLabel, { color: colors.ink600, marginTop: 24 }]}>
                    Linge collecté {totalItems > 0 ? `(${totalItems})` : ""}
                </Text>
                {linenLoading ? (
                    <ActivityIndicator style={{ marginTop: 16 }} color={colors.brand800} />
                ) : (
                    linenTypes.map((lt) => (
                        <View key={lt.code} style={[styles.linenRow, { borderColor: colors.ink200 }]}>
                            <Text style={[styles.linenLabel, { color: colors.ink900 }]}>
                                {lt.name}
                            </Text>
                            <View style={styles.stepper}>
                                <Pressable
                                    onPress={() => setQty(lt.code, -1)}
                                    style={[styles.stepperBtn, { backgroundColor: colors.ink100 }]}
                                    hitSlop={6}
                                >
                                    <Icon name="minus" size={14} color={colors.ink800} stroke={2} />
                                </Pressable>
                                <Text style={[styles.stepperValue, { color: colors.ink900 }]}>
                                    {quantities[lt.code] ?? 0}
                                </Text>
                                <Pressable
                                    onPress={() => setQty(lt.code, 1)}
                                    style={[styles.stepperBtn, { backgroundColor: colors.terra100 }]}
                                    hitSlop={6}
                                >
                                    <Icon name="plus" size={14} color={colors.terra700} stroke={2} />
                                </Pressable>
                            </View>
                        </View>
                    ))
                )}

                {/* ── Instructions ─────────────────────────────────── */}
                <Text style={[styles.sectionLabel, { color: colors.ink600, marginTop: 24 }]}>
                    Note (optionnel)
                </Text>
                <TextInput
                    value={instructions}
                    onChangeText={setInstructions}
                    placeholder="Ex : collecte urgente, client absent d'habitude…"
                    placeholderTextColor={colors.ink400}
                    multiline
                    style={[
                        styles.notesInput,
                        { backgroundColor: colors.paper2, borderColor: colors.ink200, color: colors.ink900 },
                    ]}
                />

                <Pressable
                    onPress={handleSubmit}
                    disabled={submitting}
                    style={[
                        styles.submit,
                        { backgroundColor: colors.terra600, opacity: submitting ? 0.7 : 1 },
                    ]}
                >
                    <Text style={styles.submitText}>
                        {submitting ? "Création…" : "Créer et collecter"}
                    </Text>
                </Pressable>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 17,
        alignItems: "center",
        justifyContent: "center",
    },
    topSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12,
        marginTop: 2,
    },
    content: {
        padding: 20,
        paddingBottom: 48,
    },
    sectionLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 12,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 10,
    },
    searchInput: {
        height: 46,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        fontSize: 14,
        fontFamily: FontFamily.uiRegular,
    },
    clientRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    selectedClient: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    clientName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 14,
    },
    clientAddress: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 12,
        marginTop: 2,
    },
    changeLink: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 12.5,
    },
    emptyText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 13,
        marginTop: 12,
        textAlign: "center",
    },
    linenRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    linenLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: 14,
        flex: 1,
    },
    stepper: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    stepperBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    stepperValue: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 14,
        minWidth: 18,
        textAlign: "center",
    },
    notesInput: {
        minHeight: 80,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        fontFamily: FontFamily.uiRegular,
        textAlignVertical: "top",
    },
    submit: {
        marginTop: 28,
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    submitText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: 15,
        color: "#FFFFFF",
    },
});
