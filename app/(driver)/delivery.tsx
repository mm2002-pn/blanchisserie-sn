import { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";

/* ---------- Types & mock data ---------- */

type TriageItem = {
    linenTypeCode: string;
    linenTypeName: string;
    weight: number;
    pieces: number;
    unitPrice: number;
    totalPrice: number;
};

type DeliveryStatus =
    | "Prêt pour livraison"
    | "En route"
    | "Sur place"
    | "Livraison en cours"
    | "Livrée";

type Photo = { uri: string; timestamp: string };

type DeliveryProgress = {
    startedAt?: string;
    arrivedAt?: string;
    photos: Photo[];
    signatureUri?: string;
    completedAt?: string;
    recipientName?: string;
};

type DeliveryOrder = {
    id: string;
    orderNumber: string;
    clientName: string;
    clientAddress: string;
    status: DeliveryStatus;
    actualWeight: number;
    deliveryDate: string;
    deliveryTime: string;
    triage: {
        completedAt: string;
        items: TriageItem[];
        totalWeight: number;
        totalPieces: number;
        totalAmount: number;
    };
    deliveryProgress?: DeliveryProgress;
};

const mockDeliveries: DeliveryOrder[] = [
    {
        id: "ord-001",
        orderNumber: "CMD-2024-089",
        clientName: "Hôtel Plaza",
        clientAddress: "Route de la Corniche Ouest, Dakar",
        status: "Prêt pour livraison",
        actualWeight: 840000,
        deliveryDate: "2025-12-30",
        deliveryTime: "14:00",
        triage: {
            completedAt: "2024-12-20T10:30:00Z",
            items: [
                {
                    linenTypeCode: "LP-001",
                    linenTypeName: "Drap 2 personnes",
                    weight: 400000,
                    pieces: 500,
                    unitPrice: 300,
                    totalPrice: 120000,
                },
                {
                    linenTypeCode: "LP-002",
                    linenTypeName: "Drap 1 personne",
                    weight: 100000,
                    pieces: 167,
                    unitPrice: 400,
                    totalPrice: 40000,
                },
                {
                    linenTypeCode: "LP-005",
                    linenTypeName: "Grande serviette",
                    weight: 240000,
                    pieces: 480,
                    unitPrice: 250,
                    totalPrice: 60000,
                },
                {
                    linenTypeCode: "LF-009",
                    linenTypeName: "Nappe légère",
                    weight: 0,
                    pieces: 60,
                    unitPrice: 500,
                    totalPrice: 30000,
                },
                {
                    linenTypeCode: "LF-002",
                    linenTypeName: "Chemise",
                    weight: 0,
                    pieces: 40,
                    unitPrice: 400,
                    totalPrice: 16000,
                },
            ],
            totalWeight: 740000,
            totalPieces: 1247,
            totalAmount: 266000,
        },
    },
    {
        id: "ord-002",
        orderNumber: "CMD-2024-088",
        clientName: "Hôtel Savana",
        clientAddress: "Avenue Cheikh Anta Diop, Dakar",
        status: "Prêt pour livraison",
        actualWeight: 820000,
        deliveryDate: "2025-12-30",
        deliveryTime: "16:00",
        triage: {
            completedAt: "2024-12-15T10:30:00Z",
            items: [
                {
                    linenTypeCode: "LP-001",
                    linenTypeName: "Drap 2 personnes",
                    weight: 480000,
                    pieces: 600,
                    unitPrice: 300,
                    totalPrice: 144000,
                },
                {
                    linenTypeCode: "LP-005",
                    linenTypeName: "Grande serviette",
                    weight: 280000,
                    pieces: 560,
                    unitPrice: 250,
                    totalPrice: 70000,
                },
                {
                    linenTypeCode: "LF-009",
                    linenTypeName: "Nappe légère",
                    weight: 0,
                    pieces: 40,
                    unitPrice: 500,
                    totalPrice: 20000,
                },
            ],
            totalWeight: 760000,
            totalPieces: 1200,
            totalAmount: 234000,
        },
    },
];

const STORAGE_KEY = "@driver_deliveries";

/* ---------- Helpers ---------- */

const formatWeight = (g: number) => `${(g / 1000).toFixed(1)} kg`;
const formatCurrency = (n: number) => `${n.toLocaleString("fr-FR")} F CFA`;

const STATUS_TO_UI: Record<DeliveryStatus, string> = {
    "Prêt pour livraison": "Prête",
    "En route": "En attente",
    "Sur place": "Traitement",
    "Livraison en cours": "Traitement",
    "Livrée": "Livrée",
};

/* ---------- Screen ---------- */

export default function DeliveryScreen() {
    const colors = useThemeColors();
    const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
    const [selected, setSelected] = useState<DeliveryOrder | null>(null);
    const [step, setStep] = useState<"list" | "details" | "complete">("list");
    const [showSignatureModal, setShowSignatureModal] = useState(false);
    const [recipientName, setRecipientName] = useState("");

    useEffect(() => {
        void loadDeliveries();
    }, []);

    async function loadDeliveries() {
        try {
            const stored = await AsyncStorage.getItem(STORAGE_KEY);
            if (stored) {
                setDeliveries(JSON.parse(stored));
            } else {
                setDeliveries(mockDeliveries);
                await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mockDeliveries));
            }
        } catch (err) {
            console.error("Error loading deliveries:", err);
            setDeliveries(mockDeliveries);
        }
    }

    async function saveDeliveries(next: DeliveryOrder[]) {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setDeliveries(next);
        } catch (err) {
            console.error("Error saving deliveries:", err);
        }
    }

    function updateDeliveryStatus(
        id: string,
        newStatus: DeliveryStatus,
        progress?: DeliveryProgress,
    ) {
        const next = deliveries.map((d) =>
            d.id === id
                ? { ...d, status: newStatus, deliveryProgress: progress ?? d.deliveryProgress }
                : d,
        );
        void saveDeliveries(next);
        if (selected?.id === id) {
            const updated = next.find((d) => d.id === id);
            if (updated) setSelected(updated);
        }
    }

    const handleSelect = (d: DeliveryOrder) => {
        setSelected(d);
        setStep("details");
    };

    const handleStartRoute = () => {
        if (!selected) return;
        Alert.alert("Démarrer la tournée", "Êtes-vous prêt à commencer la livraison ?", [
            { text: "Annuler", style: "cancel" },
            {
                text: "Démarrer",
                onPress: () => {
                    updateDeliveryStatus(selected.id, "En route", {
                        startedAt: new Date().toISOString(),
                        photos: [],
                    });
                    Alert.alert("En route", "Livraison démarrée. Bonne route !");
                },
            },
        ]);
    };

    const handleArrived = () => {
        if (!selected) return;
        updateDeliveryStatus(selected.id, "Sur place", {
            ...selected.deliveryProgress,
            arrivedAt: new Date().toISOString(),
            photos: selected.deliveryProgress?.photos ?? [],
        });
        Alert.alert("Sur place", "Vous êtes arrivé chez le client");
    };

    const handleStartDelivery = () => {
        if (!selected) return;
        updateDeliveryStatus(selected.id, "Livraison en cours", {
            ...selected.deliveryProgress,
            photos: selected.deliveryProgress?.photos ?? [],
        });
        setStep("complete");
    };

    const handleTakePhoto = () => {
        if (!selected) return;
        const newPhoto: Photo = {
            uri: `photo_${Date.now()}.jpg`,
            timestamp: new Date().toISOString(),
        };
        const photos = [...(selected.deliveryProgress?.photos ?? []), newPhoto];
        updateDeliveryStatus(selected.id, selected.status, {
            ...selected.deliveryProgress,
            photos,
        });
        Alert.alert("Photo ajoutée", `Photo ${photos.length} enregistrée`);
    };

    const handleSaveSignature = () => {
        if (!selected || !recipientName.trim()) {
            Alert.alert("Attention", "Veuillez entrer le nom du destinataire");
            return;
        }
        updateDeliveryStatus(selected.id, selected.status, {
            ...selected.deliveryProgress,
            signatureUri: `signature_${Date.now()}.png`,
            recipientName: recipientName.trim(),
            photos: selected.deliveryProgress?.photos ?? [],
        });
        setShowSignatureModal(false);
        setRecipientName("");
        Alert.alert("Signature enregistrée", `Signé par : ${recipientName.trim()}`);
    };

    const handleCompleteDelivery = () => {
        if (!selected) return;
        const photos = selected.deliveryProgress?.photos ?? [];
        const signature = selected.deliveryProgress?.signatureUri;
        if (photos.length === 0 || !signature) {
            Alert.alert(
                "Attention",
                "Veuillez ajouter au moins une photo et obtenir la signature",
            );
            return;
        }
        Alert.alert(
            "Confirmer la livraison",
            `Confirmer la livraison ${selected.orderNumber} ?\n\nRécipient : ${selected.deliveryProgress?.recipientName}\nPhotos : ${photos.length}`,
            [
                { text: "Annuler", style: "cancel" },
                {
                    text: "Confirmer",
                    onPress: () => {
                        updateDeliveryStatus(selected.id, "Livrée", {
                            ...selected.deliveryProgress,
                            completedAt: new Date().toISOString(),
                            photos,
                            signatureUri: signature,
                        });
                        Alert.alert(
                            "Livraison terminée",
                            "La livraison a été enregistrée avec succès",
                            [
                                {
                                    text: "OK",
                                    onPress: () => {
                                        setSelected(null);
                                        setStep("list");
                                    },
                                },
                            ],
                        );
                    },
                },
            ],
        );
    };

    const active = deliveries.filter((d) => d.status !== "Livrée");
    const done = deliveries.filter((d) => d.status === "Livrée");

    /* ---------- LIST VIEW ---------- */
    if (step === "list") {
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
                    <ThemedText variate="title">Livraisons</ThemedText>
                    <View
                        style={[
                            styles.countBadge,
                            { backgroundColor: colors.baobab100, borderColor: colors.baobab600 },
                        ]}
                    >
                        <Text
                            style={[styles.countBadgeText, { color: colors.baobab700 }]}
                        >
                            {active.length}
                        </Text>
                    </View>
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {active.length > 0 && (
                        <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                            En cours · {active.length}
                        </ThemedText>
                    )}

                    <View style={{ gap: 10 }}>
                        {active.map((d, i) => (
                            <DeliveryListItem
                                key={d.id}
                                delivery={d}
                                index={i + 1}
                                onPress={() => handleSelect(d)}
                            />
                        ))}
                    </View>

                    {active.length === 0 && done.length === 0 && (
                        <View style={styles.emptyState}>
                            <Icon name="package" size={40} color={colors.ink400} />
                            <Text
                                style={[styles.emptyText, { color: colors.ink500 }]}
                            >
                                Aucune livraison pour aujourd'hui
                            </Text>
                        </View>
                    )}

                    {done.length > 0 && (
                        <>
                            <ThemedText
                                variate="caps"
                                color="ink500"
                                style={[styles.sectionLabel, { marginTop: 20 }]}
                            >
                                Terminées · {done.length}
                            </ThemedText>
                            <View style={{ gap: 10 }}>
                                {done.map((d, i) => (
                                    <DeliveryListItem
                                        key={d.id}
                                        delivery={d}
                                        index={i + 1}
                                        onPress={() => handleSelect(d)}
                                        compact
                                    />
                                ))}
                            </View>
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    /* ---------- DETAILS VIEW ---------- */
    if (step === "details" && selected) {
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
                    <Pressable onPress={() => setStep("list")} hitSlop={8}>
                        <Icon name="chevLeft" size={20} color={colors.ink800} />
                    </Pressable>
                    <ThemedText variate="title">Bordereau</ThemedText>
                    <View style={{ width: 20 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Order header */}
                    <Card
                        padding={16}
                        style={[
                            styles.orderHeaderCard,
                            {
                                backgroundColor: colors.brand900,
                                borderColor: colors.brand900,
                            },
                        ]}
                    >
                        <View style={styles.orderHeaderTop}>
                            <Text style={[styles.orderCaps, { color: colors.brand100 }]}>
                                Commande
                            </Text>
                            <StatusBadge status={STATUS_TO_UI[selected.status]} />
                        </View>
                        <Text
                            style={[styles.orderNumber, { color: colors.paper }]}
                        >
                            {selected.orderNumber}
                        </Text>
                        <Text style={[styles.orderClient, { color: colors.brand100 }]}>
                            {selected.clientName}
                        </Text>

                        <View style={styles.addressRow}>
                            <Icon name="map" size={12} color={colors.brand100} />
                            <Text
                                style={[styles.addressText, { color: colors.brand100 }]}
                            >
                                {selected.clientAddress}
                            </Text>
                        </View>

                        <View
                            style={[
                                styles.orderTotals,
                                { borderTopColor: colors.brand700 },
                            ]}
                        >
                            <Total label="Poids total" value={formatWeight(selected.triage.totalWeight)} colors={colors} />
                            <Total label="Pièces" value={`${selected.triage.totalPieces}`} colors={colors} />
                            <Total
                                label="Montant"
                                value={formatCurrency(selected.triage.totalAmount)}
                                colors={colors}
                                accent
                            />
                        </View>
                    </Card>

                    {/* Triage */}
                    <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                        Détail du linge
                    </ThemedText>

                    <Card padding={0} style={{ marginBottom: 14, overflow: "hidden" }}>
                        <View
                            style={[
                                styles.tableHead,
                                { backgroundColor: colors.paper2, borderBottomColor: colors.ink200 },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tableHeadCell,
                                    styles.cellType,
                                    { color: colors.ink600 },
                                ]}
                            >
                                Article
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeadCell,
                                    styles.cellQty,
                                    { color: colors.ink600 },
                                ]}
                            >
                                Pcs
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeadCell,
                                    styles.cellWeight,
                                    { color: colors.ink600 },
                                ]}
                            >
                                Poids
                            </Text>
                            <Text
                                style={[
                                    styles.tableHeadCell,
                                    styles.cellPrice,
                                    { color: colors.ink600 },
                                ]}
                            >
                                Montant
                            </Text>
                        </View>

                        {selected.triage.items.map((item, i) => (
                            <View
                                key={item.linenTypeCode}
                                style={[
                                    styles.tableRow,
                                    {
                                        borderBottomColor: colors.ink200,
                                        backgroundColor:
                                            i % 2 === 0 ? colors.paper : colors.paper2,
                                    },
                                ]}
                            >
                                <View style={[styles.tableCell, styles.cellType]}>
                                    <Text
                                        style={[styles.itemCode, { color: colors.ink900 }]}
                                    >
                                        {item.linenTypeCode}
                                    </Text>
                                    <Text
                                        style={[styles.itemName, { color: colors.ink500 }]}
                                    >
                                        {item.linenTypeName}
                                    </Text>
                                </View>
                                <Text
                                    style={[
                                        styles.tableCell,
                                        styles.cellQty,
                                        styles.mono,
                                        { color: colors.ink900 },
                                    ]}
                                >
                                    {item.pieces}
                                </Text>
                                <Text
                                    style={[
                                        styles.tableCell,
                                        styles.cellWeight,
                                        styles.mono,
                                        { color: colors.ink700 },
                                    ]}
                                >
                                    {item.weight > 0 ? formatWeight(item.weight) : "—"}
                                </Text>
                                <Text
                                    style={[
                                        styles.tableCell,
                                        styles.cellPrice,
                                        styles.mono,
                                        { color: colors.ink900 },
                                    ]}
                                >
                                    {formatCurrency(item.totalPrice)}
                                </Text>
                            </View>
                        ))}

                        <View
                            style={[
                                styles.tableFooter,
                                { backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.cellType,
                                    styles.footerLabel,
                                    { color: colors.ink900 },
                                ]}
                            >
                                TOTAL
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.cellQty,
                                    styles.footerValue,
                                    { color: colors.ink900 },
                                ]}
                            >
                                {selected.triage.totalPieces}
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.cellWeight,
                                    styles.footerValue,
                                    { color: colors.ink900 },
                                ]}
                            >
                                {formatWeight(selected.triage.totalWeight)}
                            </Text>
                            <Text
                                style={[
                                    styles.tableCell,
                                    styles.cellPrice,
                                    styles.footerValue,
                                    { color: colors.brand800 },
                                ]}
                            >
                                {formatCurrency(selected.triage.totalAmount)}
                            </Text>
                        </View>
                    </Card>

                    {/* Progress */}
                    <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                        État de la livraison
                    </ThemedText>

                    <Card padding={16} style={styles.progressCard}>
                        <Timeline status={selected.status} />
                    </Card>

                    {/* Actions */}
                    {selected.status === "Prêt pour livraison" && (
                        <CtaPrimary
                            icon="truck"
                            label="Démarrer la livraison"
                            onPress={handleStartRoute}
                        />
                    )}
                    {selected.status === "En route" && (
                        <CtaPrimary
                            icon="map"
                            label="Je suis arrivé"
                            onPress={handleArrived}
                        />
                    )}
                    {(selected.status === "Sur place" ||
                        selected.status === "Livraison en cours") && (
                        <CtaPrimary
                            icon="package"
                            label="Commencer la remise"
                            onPress={handleStartDelivery}
                        />
                    )}
                    {selected.status === "Livrée" && (
                        <View
                            style={[
                                styles.doneBanner,
                                { backgroundColor: colors.ok100, borderColor: colors.ok600 },
                            ]}
                        >
                            <Icon name="check" size={16} color={colors.ok700} />
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.doneTitle, { color: colors.ok700 }]}
                                >
                                    Livraison terminée
                                </Text>
                                <Text
                                    style={[styles.doneSubtitle, { color: colors.ink600 }]}
                                >
                                    Récipient : {selected.deliveryProgress?.recipientName}
                                </Text>
                            </View>
                        </View>
                    )}
                </ScrollView>
            </SafeAreaView>
        );
    }

    /* ---------- COMPLETE VIEW ---------- */
    if (step === "complete" && selected) {
        const photoCount = selected.deliveryProgress?.photos.length ?? 0;
        const signed = Boolean(selected.deliveryProgress?.signatureUri);
        const canComplete = photoCount > 0 && signed;

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
                    <Pressable onPress={() => setStep("details")} hitSlop={8}>
                        <Icon name="chevLeft" size={20} color={colors.ink800} />
                    </Pressable>
                    <ThemedText variate="title">Finaliser</ThemedText>
                    <View style={{ width: 20 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Card padding={14} style={{ marginBottom: 14 }}>
                        <Text style={[styles.clientInfoName, { color: colors.ink900 }]}>
                            {selected.clientName}
                        </Text>
                        <Text style={[styles.clientInfoCode, { color: colors.ink500 }]}>
                            {selected.orderNumber}
                        </Text>
                    </Card>

                    {/* Photos */}
                    <Card padding={16} style={{ marginBottom: 12 }}>
                        <StepHeader
                            index={1}
                            title="Photos de livraison"
                            subtitle="Preuve visuelle de la remise"
                            done={photoCount > 0}
                        />
                        <Pressable
                            onPress={handleTakePhoto}
                            style={[
                                styles.dashedBox,
                                { borderColor: colors.ink300, backgroundColor: colors.paper2 },
                            ]}
                        >
                            <Icon name="camera" size={22} color={colors.ink500} />
                            <Text
                                style={[styles.dashedBoxText, { color: colors.ink700 }]}
                            >
                                {photoCount === 0
                                    ? "Ajouter une photo"
                                    : `Ajouter une autre photo · ${photoCount} ajoutée${photoCount > 1 ? "s" : ""}`}
                            </Text>
                        </Pressable>
                        {photoCount > 0 && (
                            <View style={styles.photoList}>
                                {selected.deliveryProgress?.photos.map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.photoTile,
                                            {
                                                backgroundColor: colors.paper2,
                                                borderColor: colors.ink200,
                                            },
                                        ]}
                                    >
                                        <Icon name="camera" size={14} color={colors.ink600} />
                                        <Text
                                            style={[styles.photoTileText, { color: colors.ink700 }]}
                                        >
                                            Photo {i + 1}
                                        </Text>
                                    </View>
                                ))}
                            </View>
                        )}
                    </Card>

                    {/* Signature */}
                    <Card padding={16} style={{ marginBottom: 14 }}>
                        <StepHeader
                            index={2}
                            title="Signature du client"
                            subtitle="Validation de la réception"
                            done={signed}
                        />
                        {!signed ? (
                            <Pressable
                                onPress={() => setShowSignatureModal(true)}
                                style={[
                                    styles.dashedBox,
                                    { borderColor: colors.ink300, backgroundColor: colors.paper2 },
                                ]}
                            >
                                <Icon name="signature" size={22} color={colors.ink500} />
                                <Text
                                    style={[styles.dashedBoxText, { color: colors.ink700 }]}
                                >
                                    Demander la signature
                                </Text>
                            </Pressable>
                        ) : (
                            <View
                                style={[
                                    styles.signedRow,
                                    { backgroundColor: colors.ok100, borderColor: colors.ok600 },
                                ]}
                            >
                                <Icon name="check" size={14} color={colors.ok700} />
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.signedTitle, { color: colors.ok700 }]}
                                    >
                                        Signature enregistrée
                                    </Text>
                                    <Text
                                        style={[styles.signedSub, { color: colors.ink600 }]}
                                    >
                                        Par : {selected.deliveryProgress?.recipientName}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </Card>

                    <Pressable
                        onPress={handleCompleteDelivery}
                        disabled={!canComplete}
                        style={[
                            styles.completeCta,
                            {
                                backgroundColor: canComplete ? colors.baobab600 : colors.ink300,
                            },
                        ]}
                    >
                        <Icon name="check" size={16} color={colors.paper} />
                        <Text
                            style={[styles.completeCtaText, { color: colors.paper }]}
                        >
                            Terminer la livraison
                        </Text>
                    </Pressable>

                    {/* Signature modal */}
                    <Modal
                        visible={showSignatureModal}
                        transparent
                        animationType="slide"
                        onRequestClose={() => setShowSignatureModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View
                                style={[
                                    styles.modalContent,
                                    { backgroundColor: colors.paper },
                                ]}
                            >
                                <ThemedText variate="title" style={{ marginBottom: 14 }}>
                                    Signature du client
                                </ThemedText>

                                <Text
                                    style={[styles.fieldLabel, { color: colors.ink700 }]}
                                >
                                    Nom du destinataire
                                </Text>
                                <TextInput
                                    value={recipientName}
                                    onChangeText={setRecipientName}
                                    placeholder="Ex: M. Diallo"
                                    placeholderTextColor={colors.ink400}
                                    style={[
                                        styles.modalInput,
                                        {
                                            backgroundColor: colors.paper2,
                                            borderColor: colors.ink200,
                                            color: colors.ink900,
                                        },
                                    ]}
                                />

                                <View
                                    style={[
                                        styles.signaturePad,
                                        {
                                            backgroundColor: colors.paper2,
                                            borderColor: colors.ink300,
                                        },
                                    ]}
                                >
                                    <Icon name="signature" size={36} color={colors.ink400} />
                                    <Text
                                        style={[styles.signaturePadText, { color: colors.ink500 }]}
                                    >
                                        Zone de signature
                                    </Text>
                                </View>

                                <View style={styles.modalButtons}>
                                    <Pressable
                                        onPress={() => {
                                            setShowSignatureModal(false);
                                            setRecipientName("");
                                        }}
                                        style={[
                                            styles.modalBtn,
                                            {
                                                backgroundColor: colors.paper2,
                                                borderColor: colors.ink200,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[styles.modalBtnText, { color: colors.ink700 }]}
                                        >
                                            Annuler
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        onPress={handleSaveSignature}
                                        style={[
                                            styles.modalBtn,
                                            {
                                                backgroundColor: colors.brand800,
                                                borderColor: colors.brand800,
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[styles.modalBtnText, { color: colors.paper }]}
                                        >
                                            Valider
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </Modal>
                </ScrollView>
            </SafeAreaView>
        );
    }

    return null;
}

/* ---------- Sub-components ---------- */

function DeliveryListItem({
    delivery,
    index,
    onPress,
    compact = false,
}: {
    delivery: DeliveryOrder;
    index: number;
    onPress: () => void;
    compact?: boolean;
}) {
    const colors = useThemeColors();
    const isDone = delivery.status === "Livrée";
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.deliveryItem,
                {
                    backgroundColor: colors.paper,
                    borderColor: colors.ink200,
                    opacity: pressed ? 0.8 : compact ? 0.85 : 1,
                },
            ]}
        >
            <View style={styles.deliveryTop}>
                <View
                    style={[
                        styles.deliveryIndex,
                        {
                            backgroundColor: isDone ? colors.ok100 : colors.brand100,
                        },
                    ]}
                >
                    {isDone ? (
                        <Icon name="check" size={12} color={colors.ok700} />
                    ) : (
                        <Text
                            style={[styles.deliveryIndexText, { color: colors.brand800 }]}
                        >
                            {index}
                        </Text>
                    )}
                </View>
                <View style={{ flex: 1 }}>
                    <Text
                        style={[styles.deliveryCode, { color: colors.ink900 }]}
                    >
                        {delivery.orderNumber}
                    </Text>
                    <Text style={[styles.deliveryClient, { color: colors.ink600 }]}>
                        {delivery.clientName}
                    </Text>
                </View>
                <View style={styles.deliveryRight}>
                    <Text
                        style={[styles.deliveryTime, { color: colors.ink900 }]}
                    >
                        {delivery.deliveryTime}
                    </Text>
                    <Text
                        style={[styles.deliveryDate, { color: colors.ink500 }]}
                    >
                        {new Date(delivery.deliveryDate).toLocaleDateString("fr-FR", {
                            day: "2-digit",
                            month: "short",
                        })}
                    </Text>
                </View>
            </View>

            {!compact && (
                <View style={styles.deliveryMetaRow}>
                    <MetaLight icon="weight" label={formatWeight(delivery.actualWeight)} />
                    <MetaLight icon="package" label={`${delivery.triage.totalPieces} pcs`} />
                    <MetaLight icon="tag" label={formatCurrency(delivery.triage.totalAmount)} />
                </View>
            )}

            <View style={styles.deliveryAddress}>
                <Icon name="map" size={11} color={colors.ink500} />
                <Text
                    style={[styles.deliveryAddressText, { color: colors.ink500 }]}
                    numberOfLines={1}
                >
                    {delivery.clientAddress}
                </Text>
            </View>

            <View style={styles.deliveryFooter}>
                <StatusBadge status={STATUS_TO_UI[delivery.status]} />
                {isDone && delivery.deliveryProgress?.recipientName && (
                    <Text
                        style={[styles.deliverySigned, { color: colors.ink500 }]}
                    >
                        Signé : {delivery.deliveryProgress.recipientName}
                    </Text>
                )}
            </View>
        </Pressable>
    );
}

function Total({
    label,
    value,
    colors,
    accent = false,
}: {
    label: string;
    value: string;
    colors: ReturnType<typeof useThemeColors>;
    accent?: boolean;
}) {
    return (
        <View style={{ flex: 1 }}>
            <Text
                style={[
                    styles.totalValue,
                    { color: accent ? colors.terra600 : colors.paper },
                ]}
            >
                {value}
            </Text>
            <Text style={[styles.totalLabel, { color: colors.brand100 }]}>
                {label}
            </Text>
        </View>
    );
}

function Timeline({ status }: { status: DeliveryStatus }) {
    const colors = useThemeColors();
    const steps: { key: DeliveryStatus | "ready"; label: string; icon: IconName }[] = [
        { key: "ready", label: "Prêt", icon: "check" },
        { key: "En route", label: "En route", icon: "truck" },
        { key: "Sur place", label: "Sur place", icon: "map" },
        { key: "Livrée", label: "Livrée", icon: "check" },
    ];
    const statusIndex: Record<DeliveryStatus, number> = {
        "Prêt pour livraison": 0,
        "En route": 1,
        "Sur place": 2,
        "Livraison en cours": 2,
        Livrée: 3,
    };
    const current = statusIndex[status];

    return (
        <View style={styles.timelineRow}>
            {steps.map((s, i) => {
                const done = i <= current;
                const active = i === current;
                return (
                    <View key={s.label} style={styles.timelineStep}>
                        <View
                            style={[
                                styles.timelineDot,
                                {
                                    backgroundColor: done
                                        ? active
                                            ? colors.baobab600
                                            : colors.ok600
                                        : colors.ink100,
                                    borderColor: active ? colors.baobab600 : "transparent",
                                    borderWidth: active ? 3 : 0,
                                },
                            ]}
                        >
                            <Icon
                                name={s.icon}
                                size={13}
                                color={done ? colors.paper : colors.ink500}
                            />
                        </View>
                        <Text
                            style={[
                                styles.timelineLabel,
                                { color: done ? colors.ink900 : colors.ink500 },
                            ]}
                        >
                            {s.label}
                        </Text>
                        {i < steps.length - 1 && (
                            <View
                                style={[
                                    styles.timelineLine,
                                    {
                                        backgroundColor:
                                            i < current ? colors.ok600 : colors.ink200,
                                    },
                                ]}
                            />
                        )}
                    </View>
                );
            })}
        </View>
    );
}

function StepHeader({
    index,
    title,
    subtitle,
    done,
}: {
    index: number;
    title: string;
    subtitle: string;
    done: boolean;
}) {
    const colors = useThemeColors();
    return (
        <View style={styles.stepHeaderRow}>
            <View
                style={[
                    styles.stepNumber,
                    {
                        backgroundColor: done ? colors.baobab600 : colors.ink100,
                        borderColor: done ? colors.baobab600 : colors.ink200,
                    },
                ]}
            >
                {done ? (
                    <Icon name="check" size={13} color={colors.paper} />
                ) : (
                    <Text style={[styles.stepNumberText, { color: colors.ink700 }]}>
                        {index}
                    </Text>
                )}
            </View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.stepTitle, { color: colors.ink900 }]}>
                    {title}
                </Text>
                <Text style={[styles.stepSubtitle, { color: colors.ink500 }]}>
                    {subtitle}
                </Text>
            </View>
        </View>
    );
}

function MetaLight({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={styles.metaLight}>
            <Icon name={icon} size={11} color={colors.ink500} />
            <Text style={[styles.metaLightText, { color: colors.ink700 }]}>
                {label}
            </Text>
        </View>
    );
}

function CtaPrimary({
    icon,
    label,
    onPress,
}: {
    icon: IconName;
    label: string;
    onPress: () => void;
}) {
    const colors = useThemeColors();
    return (
        <Pressable
            onPress={onPress}
            style={[styles.ctaPrimary, { backgroundColor: colors.brand800 }]}
        >
            <Icon name={icon} size={15} color={colors.paper} />
            <Text style={[styles.ctaPrimaryText, { color: colors.paper }]}>
                {label}
            </Text>
            <Icon name="arrowRight" size={14} color={colors.paper} />
        </Pressable>
    );
}

/* ---------- Styles ---------- */

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
    content: { padding: 16, paddingBottom: 120 },

    countBadge: {
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 999,
        borderWidth: StyleSheet.hairlineWidth,
    },
    countBadgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
    },

    sectionLabel: { marginBottom: 10, paddingLeft: 4 },

    emptyState: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 60,
        gap: 12,
    },
    emptyText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },

    // List item
    deliveryItem: {
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 14,
    },
    deliveryTop: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
    },
    deliveryIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    deliveryIndexText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    deliveryCode: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },
    deliveryClient: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    deliveryRight: { alignItems: "flex-end" },
    deliveryTime: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
    },
    deliveryDate: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    deliveryMetaRow: {
        flexDirection: "row",
        gap: 14,
        marginBottom: 8,
    },
    metaLight: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaLightText: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    deliveryAddress: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginBottom: 10,
    },
    deliveryAddressText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        flex: 1,
    },
    deliveryFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
    },
    deliverySigned: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    // Order header (bordereau)
    orderHeaderCard: { marginBottom: 14 },
    orderHeaderTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    orderCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    orderNumber: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 20,
        marginTop: 6,
    },
    orderClient: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
        marginTop: 6,
    },
    addressRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        marginTop: 6,
    },
    addressText: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        flex: 1,
    },
    orderTotals: {
        flexDirection: "row",
        gap: 16,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    totalValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: 16,
    },
    totalLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Table
    tableHead: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tableHeadCell: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    tableCell: { paddingHorizontal: 4 },
    cellType: { flex: 2.2 },
    cellQty: { flex: 0.7, textAlign: "right" },
    cellWeight: { flex: 1, textAlign: "right" },
    cellPrice: { flex: 1.4, textAlign: "right" },
    itemCode: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },
    itemName: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },
    mono: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.sm,
    },
    tableFooter: {
        flexDirection: "row",
        paddingVertical: 12,
        paddingHorizontal: 10,
    },
    footerLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    footerValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.sm,
    },

    // Progress / Timeline
    progressCard: { marginBottom: 14 },
    timelineRow: { flexDirection: "row", alignItems: "flex-start" },
    timelineStep: { flex: 1, alignItems: "center", position: "relative" },
    timelineDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    timelineLabel: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.micro,
        marginTop: 6,
        textAlign: "center",
    },
    timelineLine: {
        position: "absolute",
        height: 2,
        top: 15,
        left: "60%",
        right: "-40%",
    },

    // Ctas
    ctaPrimary: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    ctaPrimaryText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },
    doneBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    doneTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    doneSubtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    // Complete view
    clientInfoName: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 16,
    },
    clientInfoCode: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    stepHeaderRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 12,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
        justifyContent: "center",
    },
    stepNumberText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    stepTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.md,
    },
    stepSubtitle: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    dashedBox: {
        borderWidth: 1.25,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 22,
        paddingHorizontal: 16,
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    dashedBoxText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.sm,
    },

    photoList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
    photoTile: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
    },
    photoTileText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },

    signedRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
    },
    signedTitle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    signedSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    completeCta: {
        marginTop: 8,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    completeCtaText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "flex-end",
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: 40,
    },
    fieldLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.tiny,
        marginBottom: 6,
    },
    modalInput: {
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.sm,
        marginBottom: 14,
    },
    signaturePad: {
        borderWidth: 1.25,
        borderStyle: "dashed",
        borderRadius: 12,
        paddingVertical: 36,
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginBottom: 16,
    },
    signaturePadText: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    modalButtons: {
        flexDirection: "row",
        gap: 10,
    },
    modalBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: StyleSheet.hairlineWidth,
        alignItems: "center",
    },
    modalBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
});
