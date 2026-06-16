import { useMemo, useState } from "react";
import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import Card from "@/components/ui/Card";
import Icon, { IconName } from "@/components/ui/Icon";
import StatusBadge from "@/components/ui/StatusBadge";
import ThemedText from "@/components/ui/ThemedText";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { NotificationsModal } from "@/components/shared/NotificationsModal";
import { FontFamily, Typography } from "@/constants/Typography";
import { useThemeColors } from "@/hooks/useThemeColors";
import { useOrders } from "@/hooks/useOrders";
import { useOrdersRealtime } from "@/hooks/useOrdersRealtime";

type WorkflowStep = 1 | 2 | 3 | 4 | 5;

const WORKFLOW: { step: WorkflowStep; label: string; icon: IconName }[] = [
    { step: 1, label: "Commandes", icon: "boxes" },
    { step: 2, label: "Lavage", icon: "droplet" },
    { step: 3, label: "Séchage", icon: "thermo" },
    { step: 4, label: "Calandrage", icon: "spark" },
    { step: 5, label: "Préparation", icon: "list" },
];

const formatCurrency = (n: number) => `${n.toLocaleString("fr-FR")} F CFA`;

export default function SupervisorProductionScreen() {
    const colors = useThemeColors();
    const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);
    const [notifsOpen, setNotifsOpen] = useState(false);
    useOrdersRealtime();

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
                <View style={{ flex: 1 }}>
                    <ThemedText variate="title">Production</ThemedText>
                    <Text style={[styles.headerSub, { color: colors.ink500 }]}>
                        Atelier Dakar · Cycle du jour
                    </Text>
                </View>
                <NotificationBell onPress={() => setNotifsOpen(true)} />
            </View>

            {/* Stepper */}
            <View
                style={[
                    styles.stepperWrap,
                    { backgroundColor: colors.paper, borderBottomColor: colors.ink200 },
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.stepperRow}
                >
                    {WORKFLOW.map((w) => {
                        const isActive = currentStep === w.step;
                        const isCompleted = currentStep > w.step;
                        const isLocked = w.step > currentStep;
                        return (
                            <Pressable
                                key={w.step}
                                onPress={() => !isLocked && setCurrentStep(w.step)}
                                disabled={isLocked}
                                style={styles.stepperItem}
                            >
                                <View
                                    style={[
                                        styles.stepCircle,
                                        {
                                            backgroundColor: isCompleted
                                                ? colors.ok600
                                                : isActive
                                                  ? colors.brand800
                                                  : colors.ink100,
                                            borderColor: isActive
                                                ? colors.terra600
                                                : "transparent",
                                            borderWidth: isActive ? 2 : 0,
                                            opacity: isLocked ? 0.5 : 1,
                                        },
                                    ]}
                                >
                                    {isCompleted ? (
                                        <Icon name="check" size={14} color={colors.paper} />
                                    ) : (
                                        <Icon
                                            name={w.icon}
                                            size={14}
                                            color={isActive ? colors.paper : colors.ink500}
                                        />
                                    )}
                                </View>
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        {
                                            color: isActive
                                                ? colors.brand800
                                                : isCompleted
                                                  ? colors.ok700
                                                  : colors.ink500,
                                            opacity: isLocked ? 0.5 : 1,
                                        },
                                    ]}
                                >
                                    {w.label}
                                </Text>
                                <Text
                                    style={[
                                        styles.stepIndex,
                                        {
                                            color: isActive
                                                ? colors.brand800
                                                : colors.ink400,
                                        },
                                    ]}
                                >
                                    {w.step.toString().padStart(2, "0")}
                                </Text>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {currentStep === 1 && (
                    <CommandesStep onNext={() => setCurrentStep(2)} />
                )}
                {currentStep === 2 && (
                    <DispatchStep
                        kind="lavage"
                        onNext={() => setCurrentStep(3)}
                        onBack={() => setCurrentStep(1)}
                    />
                )}
                {currentStep === 3 && (
                    <DispatchStep
                        kind="sechage"
                        onNext={() => setCurrentStep(4)}
                        onBack={() => setCurrentStep(2)}
                    />
                )}
                {currentStep === 4 && (
                    <DispatchStep
                        kind="calandrage"
                        onNext={() => setCurrentStep(5)}
                        onBack={() => setCurrentStep(3)}
                    />
                )}
                {currentStep === 5 && (
                    <PreparationStep onBack={() => setCurrentStep(4)} />
                )}
            </ScrollView>
            <NotificationsModal
                visible={notifsOpen}
                onClose={() => setNotifsOpen(false)}
            />
        </SafeAreaView>
    );
}

/* ---------- STEP 1 : COMMANDES ---------- */

function CommandesStep({ onNext }: { onNext: () => void }) {
    const colors = useThemeColors();
    const [selected, setSelected] = useState<string[]>([]);
    const { data: allOrders = [], isLoading } = useOrders();

    /** Production démarrable uniquement sur commandes déjà pesées (received) ET triées (triaged).
     *  Côté API : apiStatus === 'triaged' = pesée atelier faite + triage validé.
     *  Les statuts antérieurs (collected, received) → non éligibles. */
    const readyOrders = useMemo(
        () => allOrders.filter((o) => o.apiStatus === "triaged"),
        [allOrders],
    );

    const toggle = (id: string) =>
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
        );

    return (
        <>
            <StepHeader
                caps="Étape 1 · Commandes"
                title="Sélection des commandes"
                subtitle="Commandes pesées et triées prêtes pour la production"
            />

            {isLoading ? (
                <View style={{ paddingVertical: 40, alignItems: "center" }}>
                    <Text style={{ color: colors.ink500, fontFamily: FontFamily.uiRegular }}>
                        Chargement…
                    </Text>
                </View>
            ) : readyOrders.length === 0 ? (
                <Card
                    padding={20}
                    style={{
                        marginTop: 14,
                        backgroundColor: colors.paper2,
                        borderColor: colors.ink200,
                        alignItems: "center",
                    }}
                >
                    <Icon name="boxes" size={28} color={colors.ink400} />
                    <Text
                        style={{
                            marginTop: 10,
                            fontFamily: FontFamily.uiSemibold,
                            fontSize: Typography.fontSize.sm,
                            color: colors.ink800,
                            textAlign: "center",
                        }}
                    >
                        Aucune commande prête
                    </Text>
                    <Text
                        style={{
                            marginTop: 4,
                            fontFamily: FontFamily.uiRegular,
                            fontSize: Typography.fontSize.tiny,
                            color: colors.ink500,
                            textAlign: "center",
                        }}
                    >
                        La production ne peut démarrer qu'une fois les commandes pesées et triées par l'atelier.
                    </Text>
                </Card>
            ) : (
                <View style={{ gap: 10, marginTop: 14 }}>
                    {readyOrders.map((o) => {
                        const picked = selected.includes(o.id);
                        const totalPieces =
                            o.services?.reduce(
                                (s, sv) =>
                                    s + (sv.items?.reduce((ss, it) => ss + it.quantity, 0) ?? 0),
                                0,
                            ) ?? 0;
                        const kg = o.actualWeight ?? o.estimatedWeight;
                        const collectedAt = o.collectionDate
                            ? format(new Date(o.collectionDate), "d MMM", { locale: fr })
                            : "—";
                        return (
                            <Pressable
                                key={o.id}
                                onPress={() => toggle(o.id)}
                                style={[
                                    styles.pickRow,
                                    {
                                        backgroundColor: picked ? colors.brand100 : colors.paper,
                                        borderColor: picked ? colors.brand800 : colors.ink200,
                                        borderWidth: picked ? 1.5 : StyleSheet.hairlineWidth,
                                    },
                                ]}
                            >
                                <View
                                    style={[
                                        styles.checkbox,
                                        {
                                            backgroundColor: picked
                                                ? colors.brand800
                                                : "transparent",
                                            borderColor: picked ? colors.brand800 : colors.ink300,
                                        },
                                    ]}
                                >
                                    {picked && (
                                        <Icon name="check" size={12} color={colors.paper} />
                                    )}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.pickClient, { color: colors.ink900 }]}
                                    >
                                        {o.hotelName}
                                    </Text>
                                    <Text
                                        style={[styles.pickMeta, { color: colors.ink500 }]}
                                    >
                                        {o.orderNumber} · {totalPieces} pièces
                                        {kg != null ? ` · ${kg.toFixed(1).replace(".", ",")} kg` : ""}
                                        {" · "}
                                        {collectedAt}
                                    </Text>
                                </View>
                                <Icon
                                    name="building"
                                    size={16}
                                    color={picked ? colors.brand800 : colors.ink500}
                                />
                            </Pressable>
                        );
                    })}
                </View>
            )}

            <CtaRow
                nextLabel={`Continuer · ${selected.length} sélectionnée${selected.length > 1 ? "s" : ""}`}
                nextDisabled={selected.length === 0}
                onNext={onNext}
            />
        </>
    );
}

/* ---------- STEP 2-3-4 : DISPATCH (shared) ---------- */

type DispatchKind = "lavage" | "sechage" | "calandrage";

function DispatchStep({
    kind,
    onNext,
    onBack,
}: {
    kind: DispatchKind;
    onNext: () => void;
    onBack: () => void;
}) {
    const colors = useThemeColors();
    const config = getDispatchConfig(kind);

    const totalCycles = config.batches.length;
    const totalLoad = config.batches.reduce(
        (s, b) => s + (config.unit === "kg" ? b.totalWeight : b.totalPieces),
        0,
    );
    const avgUtilization =
        config.batches.reduce(
            (s, b) =>
                s +
                ((config.unit === "kg" ? b.totalWeight : b.totalPieces) /
                    b.capacity) *
                    100,
            0,
        ) / totalCycles;
    const totalEnergy = config.batches.reduce((s, b) => s + b.energy, 0);

    return (
        <>
            <StepHeader
                caps={`Étape ${config.stepIndex} · ${config.label}`}
                title={config.title}
                subtitle={config.subtitle}
            />

            {/* KPIs */}
            <View style={styles.dispatchKpiRow}>
                <KpiChip label="Cycles" value={`${totalCycles}`} />
                <KpiChip
                    label={config.unit === "kg" ? "Poids" : "Pièces"}
                    value={
                        config.unit === "kg"
                            ? `${totalLoad.toFixed(0)} kg`
                            : `${totalLoad}`
                    }
                />
                <KpiChip label="Utilisation" value={`${avgUtilization.toFixed(0)}%`} />
            </View>

            <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                Plan optimisé
            </ThemedText>

            <View style={{ gap: 10 }}>
                {config.batches.map((b, i) => {
                    const load = config.unit === "kg" ? b.totalWeight : b.totalPieces;
                    const util = (load / b.capacity) * 100;
                    const utilColor =
                        util > 80
                            ? colors.ok600
                            : util > 60
                              ? colors.warn600
                              : colors.ink500;
                    return (
                        <Card key={b.id} padding={14}>
                            <View style={styles.batchHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text
                                        style={[styles.batchCycle, { color: colors.ink900 }]}
                                    >
                                        Cycle {i + 1}
                                        {b.machineType ? ` · ${b.machineType}` : ""}
                                    </Text>
                                    <Text
                                        style={[styles.batchMachine, { color: colors.ink600 }]}
                                    >
                                        {b.machine}
                                    </Text>
                                    <Text
                                        style={[styles.batchProgram, { color: colors.ink500 }]}
                                    >
                                        {b.program} · {b.duration} min
                                    </Text>
                                </View>
                                <View
                                    style={[
                                        styles.utilBadge,
                                        { backgroundColor: utilColor },
                                    ]}
                                >
                                    <Text
                                        style={[styles.utilBadgeText, { color: colors.paper }]}
                                    >
                                        {util.toFixed(0)}%
                                    </Text>
                                </View>
                            </View>

                            <View style={{ gap: 4, marginTop: 8 }}>
                                {b.items.map((it, idx) => (
                                    <View
                                        key={idx}
                                        style={[
                                            styles.batchItem,
                                            { backgroundColor: colors.paper2 },
                                        ]}
                                    >
                                        <Text
                                            style={[styles.batchItemType, { color: colors.ink900 }]}
                                        >
                                            {it.type}
                                        </Text>
                                        <Text
                                            style={[styles.batchItemQty, { color: colors.ink600 }]}
                                        >
                                            {it.quantity} pcs
                                            {it.weight != null ? ` · ${it.weight.toFixed(1)} kg` : ""}
                                        </Text>
                                    </View>
                                ))}
                            </View>

                            <View
                                style={[
                                    styles.batchFooter,
                                    { borderTopColor: colors.ink200 },
                                ]}
                            >
                                <MetaItem
                                    icon="weight"
                                    label={
                                        config.unit === "kg"
                                            ? `${b.totalWeight.toFixed(1)} kg`
                                            : `${b.totalPieces} pcs`
                                    }
                                />
                                <MetaItem
                                    icon="boxes"
                                    label={`Cap. ${b.capacity} ${config.unit}`}
                                />
                                <MetaItem
                                    icon={config.resourceIcon}
                                    label={`${b.energy} ${config.resourceUnit}`}
                                />
                            </View>
                        </Card>
                    );
                })}
            </View>

            <Card
                padding={14}
                style={[
                    styles.consumptionCard,
                    { backgroundColor: colors.terra600, borderColor: colors.terra600 },
                ]}
            >
                <Icon name={config.resourceIcon} size={14} color={colors.paper} />
                <Text style={[styles.consumptionText, { color: colors.paper }]}>
                    Consommation totale · {totalEnergy} {config.resourceUnit}
                </Text>
            </Card>

            <CtaRow nextLabel={`Lancer le ${config.label.toLowerCase()}`} onNext={onNext} onBack={onBack} />
        </>
    );
}

function getDispatchConfig(kind: DispatchKind) {
    if (kind === "lavage") {
        return {
            stepIndex: 2,
            label: "Lavage",
            title: "Dispatching lavage",
            subtitle: "Optimisation automatique des laveuses",
            unit: "kg" as const,
            resourceIcon: "droplet" as IconName,
            resourceUnit: "L d'eau",
            batches: [
                {
                    id: 1,
                    machine: "PRIMUS FX600",
                    machineType: "",
                    program: "Linge plat blanc 60°",
                    items: [
                        { type: "Drap", quantity: 25, weight: 18.5 },
                        { type: "Taie", quantity: 20, weight: 6.2 },
                    ],
                    totalWeight: 24.7,
                    totalPieces: 45,
                    capacity: 60,
                    duration: 45,
                    energy: 150,
                },
                {
                    id: 2,
                    machine: "GIRBAU HS6057",
                    machineType: "",
                    program: "Linge plat blanc 60°",
                    items: [
                        { type: "Serviette", quantity: 35, weight: 21.0 },
                        { type: "Nappe", quantity: 10, weight: 12.5 },
                    ],
                    totalWeight: 33.5,
                    totalPieces: 45,
                    capacity: 57,
                    duration: 45,
                    energy: 140,
                },
                {
                    id: 3,
                    machine: "PRIMUS FX350",
                    machineType: "",
                    program: "Linge plat couleur 40°",
                    items: [
                        { type: "Nappe", quantity: 5, weight: 6.5 },
                        { type: "Torchon", quantity: 5, weight: 2.8 },
                    ],
                    totalWeight: 9.3,
                    totalPieces: 10,
                    capacity: 35,
                    duration: 40,
                    energy: 80,
                },
            ],
        };
    }
    if (kind === "sechage") {
        return {
            stepIndex: 3,
            label: "Séchage",
            title: "Dispatching séchage",
            subtitle: "Optimisation automatique des sécheuses",
            unit: "kg" as const,
            resourceIcon: "thermo" as IconName,
            resourceUnit: "kWh",
            batches: [
                {
                    id: 1,
                    machine: "PRIMUS I50-320",
                    machineType: "",
                    program: "Séchage standard",
                    items: [
                        { type: "Drap", quantity: 25, weight: 18.5 },
                        { type: "Taie", quantity: 20, weight: 6.2 },
                    ],
                    totalWeight: 24.7,
                    totalPieces: 45,
                    capacity: 145,
                    duration: 35,
                    energy: 18,
                },
                {
                    id: 2,
                    machine: "GIRBAU PB5132",
                    machineType: "",
                    program: "Séchage standard",
                    items: [
                        { type: "Serviette", quantity: 35, weight: 21.0 },
                        { type: "Nappe", quantity: 10, weight: 12.5 },
                    ],
                    totalWeight: 33.5,
                    totalPieces: 45,
                    capacity: 145,
                    duration: 35,
                    energy: 18,
                },
                {
                    id: 3,
                    machine: "PRIMUS T24",
                    machineType: "",
                    program: "Séchage délicat",
                    items: [
                        { type: "Nappe", quantity: 5, weight: 6.5 },
                        { type: "Torchon", quantity: 5, weight: 2.8 },
                    ],
                    totalWeight: 9.3,
                    totalPieces: 10,
                    capacity: 24,
                    duration: 30,
                    energy: 15,
                },
            ],
        };
    }
    // calandrage
    return {
        stepIndex: 4,
        label: "Calandrage",
        title: "Dispatching calandrage",
        subtitle: "Optimisation repassage et finition",
        unit: "pcs" as const,
        resourceIcon: "spark" as IconName,
        resourceUnit: "kWh",
        batches: [
            {
                id: 1,
                machine: "PRIMUS FI280",
                machineType: "Calandre",
                program: "Calandrage standard",
                items: [
                    { type: "Drap", quantity: 45, weight: null },
                    { type: "Nappe", quantity: 15, weight: null },
                ],
                totalWeight: 0,
                totalPieces: 60,
                capacity: 45,
                duration: 30,
                energy: 22,
            },
            {
                id: 2,
                machine: "PRIMUS FI220",
                machineType: "Calandre",
                program: "Calandrage standard",
                items: [
                    { type: "Serviette", quantity: 35, weight: null },
                    { type: "Taie", quantity: 30, weight: null },
                ],
                totalWeight: 0,
                totalPieces: 65,
                capacity: 35,
                duration: 30,
                energy: 22,
            },
            {
                id: 3,
                machine: "GIRBAU MP45",
                machineType: "Presse",
                program: "Pressage chemise",
                items: [{ type: "Torchon", quantity: 5, weight: null }],
                totalWeight: 0,
                totalPieces: 5,
                capacity: 25,
                duration: 20,
                energy: 15,
            },
        ],
    };
}

/* ---------- STEP 7 : PRÉPARATION ---------- */

function PreparationStep({ onBack }: { onBack: () => void }) {
    const colors = useThemeColors();
    const summary = [
        { client: "Hôtel Plaza", weight: 67.5, amount: 135000 },
        { client: "Hôtel Savana", weight: 42.8, amount: 85600 },
        { client: "Hôtel Teranga", weight: 157.2, amount: 314400 },
    ];
    const totalWeight = summary.reduce((s, o) => s + o.weight, 0);
    const totalAmount = summary.reduce((s, o) => s + o.amount, 0);

    const handleFinish = () => {
        Alert.alert(
            "Journée terminée",
            `${summary.length} commandes traitées. Tout est archivé.`,
            [{ text: "OK" }],
        );
    };

    return (
        <>
            <StepHeader
                caps="Étape 5 · Préparation"
                title="Récapitulatif de la journée"
                subtitle="Vérification finale avant génération des factures"
            />

            <View style={{ gap: 10, marginTop: 14 }}>
                {summary.map((o, i) => (
                    <Card key={o.client} padding={14}>
                        <View style={styles.summaryHeader}>
                            <Text
                                style={[styles.summaryIndex, { color: colors.ink500 }]}
                            >
                                {String(i + 1).padStart(2, "0")}
                            </Text>
                            <Text style={[styles.summaryClient, { color: colors.ink900 }]}>
                                {o.client}
                            </Text>
                            <StatusBadge status="Prête" />
                        </View>
                        <View
                            style={[
                                styles.summaryFooter,
                                { borderTopColor: colors.ink200 },
                            ]}
                        >
                            <View style={{ flex: 1 }}>
                                <Text
                                    style={[styles.summaryLabel, { color: colors.ink500 }]}
                                >
                                    Poids traité
                                </Text>
                                <Text
                                    style={[styles.summaryValue, { color: colors.ink900 }]}
                                >
                                    {o.weight.toFixed(1)} kg
                                </Text>
                            </View>
                            <View style={{ flex: 1, alignItems: "flex-end" }}>
                                <Text
                                    style={[styles.summaryLabel, { color: colors.ink500 }]}
                                >
                                    Montant
                                </Text>
                                <Text
                                    style={[styles.summaryAmount, { color: colors.ok700 }]}
                                >
                                    {formatCurrency(o.amount)}
                                </Text>
                            </View>
                        </View>
                    </Card>
                ))}
            </View>

            {/* Grand total */}
            <Card
                padding={18}
                style={[
                    styles.grandTotal,
                    { backgroundColor: colors.brand900, borderColor: colors.brand900 },
                ]}
            >
                <Text style={[styles.grandCaps, { color: colors.brand100 }]}>
                    Total journée
                </Text>
                <Text style={[styles.grandValue, { color: colors.paper }]}>
                    {formatCurrency(totalAmount)}
                </Text>
                <View style={[styles.grandRow, { borderTopColor: colors.brand700 }]}>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={[styles.grandLabel, { color: colors.brand100 }]}
                        >
                            Commandes
                        </Text>
                        <Text style={[styles.grandNumber, { color: colors.paper }]}>
                            {summary.length}
                        </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text
                            style={[styles.grandLabel, { color: colors.brand100 }]}
                        >
                            Poids total
                        </Text>
                        <Text style={[styles.grandNumber, { color: colors.paper }]}>
                            {totalWeight.toFixed(1)} kg
                        </Text>
                    </View>
                </View>
            </Card>

            {/* Production stats */}
            <ThemedText variate="caps" color="ink500" style={styles.sectionLabel}>
                Statistiques de production
            </ThemedText>
            <View style={styles.prodStatsRow}>
                <ProdStat
                    icon="droplet"
                    value="3"
                    label="Cycles lavage"
                    footer="370 L"
                />
                <ProdStat
                    icon="thermo"
                    value="3"
                    label="Cycles séchage"
                    footer="51 kWh"
                />
                <ProdStat
                    icon="spark"
                    value="3"
                    label="Calandrage"
                    footer="59 kWh"
                />
            </View>

            <Pressable
                onPress={handleFinish}
                style={[styles.finishBtn, { backgroundColor: colors.baobab600 }]}
            >
                <Icon name="check" size={15} color={colors.paper} />
                <Text style={[styles.finishBtnText, { color: colors.paper }]}>
                    Terminer la journée
                </Text>
            </Pressable>

            <Pressable
                onPress={onBack}
                style={[
                    styles.secondaryBtn,
                    { backgroundColor: colors.paper, borderColor: colors.ink200 },
                ]}
            >
                <Icon name="chevLeft" size={14} color={colors.ink700} />
                <Text style={[styles.secondaryBtnText, { color: colors.ink700 }]}>
                    Retour
                </Text>
            </Pressable>
        </>
    );
}

/* ---------- sous-composants ---------- */

function StepHeader({
    caps,
    title,
    subtitle,
}: {
    caps: string;
    title: string;
    subtitle: string;
}) {
    const colors = useThemeColors();
    return (
        <View style={styles.stepHeader}>
            <Text style={[styles.stepHeaderCaps, { color: colors.terra700 }]}>
                {caps}
            </Text>
            <Text style={[styles.stepHeaderTitle, { color: colors.ink900 }]}>
                {title}
            </Text>
            <Text style={[styles.stepHeaderSub, { color: colors.ink500 }]}>
                {subtitle}
            </Text>
        </View>
    );
}

function CtaRow({
    nextLabel,
    nextDisabled = false,
    onNext,
    onBack,
}: {
    nextLabel: string;
    nextDisabled?: boolean;
    onNext: () => void;
    onBack?: () => void;
}) {
    const colors = useThemeColors();
    return (
        <View style={styles.ctaRow}>
            {onBack && (
                <Pressable
                    onPress={onBack}
                    style={[
                        styles.backBtn,
                        { backgroundColor: colors.paper, borderColor: colors.ink200 },
                    ]}
                >
                    <Icon name="chevLeft" size={14} color={colors.ink700} />
                    <Text style={[styles.backBtnText, { color: colors.ink700 }]}>
                        Retour
                    </Text>
                </Pressable>
            )}
            <Pressable
                onPress={onNext}
                disabled={nextDisabled}
                style={[
                    styles.nextBtn,
                    {
                        backgroundColor: nextDisabled ? colors.ink300 : colors.brand800,
                    },
                ]}
            >
                <Text style={[styles.nextBtnText, { color: colors.paper }]}>
                    {nextLabel}
                </Text>
                <Icon name="arrowRight" size={14} color={colors.paper} />
            </Pressable>
        </View>
    );
}

function KpiChip({ label, value }: { label: string; value: string }) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.kpiChip,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <Text style={[styles.kpiChipValue, { color: colors.ink900 }]}>
                {value}
            </Text>
            <Text style={[styles.kpiChipLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
        </View>
    );
}

function MetaItem({ icon, label }: { icon: IconName; label: string }) {
    const colors = useThemeColors();
    return (
        <View style={styles.metaItem}>
            <Icon name={icon} size={11} color={colors.ink500} />
            <Text style={[styles.metaText, { color: colors.ink700 }]}>
                {label}
            </Text>
        </View>
    );
}

function ProdStat({
    icon,
    value,
    label,
    footer,
}: {
    icon: IconName;
    value: string;
    label: string;
    footer: string;
}) {
    const colors = useThemeColors();
    return (
        <View
            style={[
                styles.prodStatTile,
                { backgroundColor: colors.paper, borderColor: colors.ink200 },
            ]}
        >
            <View
                style={[styles.prodStatIcon, { backgroundColor: colors.paper2 }]}
            >
                <Icon name={icon} size={13} color={colors.terra700} />
            </View>
            <Text style={[styles.prodStatValue, { color: colors.ink900 }]}>
                {value}
            </Text>
            <Text style={[styles.prodStatLabel, { color: colors.ink500 }]}>
                {label}
            </Text>
            <Text style={[styles.prodStatFooter, { color: colors.ink700 }]}>
                {footer}
            </Text>
        </View>
    );
}

/* ---------- styles ---------- */

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    headerSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    // Stepper
    stepperWrap: {
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    stepperRow: { paddingHorizontal: 16, gap: 18 },
    stepperItem: { alignItems: "center", minWidth: 60 },
    stepCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    stepLabel: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        marginTop: 6,
    },
    stepIndex: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
        letterSpacing: 0.5,
    },

    content: { padding: 16, paddingBottom: 120 },
    sectionLabel: { marginBottom: 10, marginTop: 18, paddingLeft: 4 },

    // Step header
    stepHeader: { marginBottom: 6 },
    stepHeaderCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    stepHeaderTitle: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 22,
        letterSpacing: -0.3,
        marginTop: 4,
    },
    stepHeaderSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 4,
    },

    // Pick rows (Step 1)
    pickRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 14,
        borderRadius: 14,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderRadius: 6,
        borderWidth: 1.5,
        alignItems: "center",
        justifyContent: "center",
    },
    pickClient: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    pickMeta: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },

    // Client context (Step 2-3)
    clientCtx: { marginTop: 14, marginBottom: 14 },
    clientCtxRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    clientCtxName: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    clientCtxSub: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },

    // Weighing (Step 2)
    weighingRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
        gap: 12,
    },
    weighType: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    weighQty: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    weighInput: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        minWidth: 100,
    },
    weighInputText: {
        flex: 1,
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        padding: 0,
        minWidth: 40,
    },
    weighUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },

    // Total card (Step 2)
    totalCard: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 14,
    },
    totalCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    totalPieces: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 3,
    },
    totalValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 28,
        letterSpacing: -0.5,
    },
    totalUnit: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.md,
    },

    // Verify (Step 3)
    verifyRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 14,
    },
    verifyQty: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    verifyWeight: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    verifyDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    verifyBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
    },
    verifyBannerText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Dispatch (Step 4-6)
    dispatchKpiRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 14,
    },
    kpiChip: {
        flex: 1,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 12,
    },
    kpiChipValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 18,
        letterSpacing: -0.3,
    },
    kpiChipLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },

    // Batches
    batchHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 10,
    },
    batchCycle: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    batchMachine: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
        marginTop: 2,
    },
    batchProgram: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 1,
    },
    utilBadge: {
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: 999,
    },
    utilBadgeText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
    },
    batchItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    batchItemType: {
        fontFamily: FontFamily.uiMedium,
        fontSize: Typography.fontSize.tiny,
    },
    batchItemQty: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.tiny,
    },
    batchFooter: {
        flexDirection: "row",
        gap: 14,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
    metaText: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
    },
    consumptionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 14,
    },
    consumptionText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // CTAs
    ctaRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 18,
    },
    backBtn: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    backBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    nextBtn: {
        flex: 2,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    nextBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },

    // Summary (Step 7)
    summaryHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    summaryIndex: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.tiny,
    },
    summaryClient: {
        flex: 1,
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
    summaryFooter: {
        flexDirection: "row",
        gap: 10,
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    summaryLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    summaryValue: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        marginTop: 3,
    },
    summaryAmount: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.md,
        marginTop: 3,
    },

    grandTotal: { marginTop: 14 },
    grandCaps: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.micro,
        letterSpacing: 1.2,
        textTransform: "uppercase",
    },
    grandValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 36,
        letterSpacing: -0.8,
        marginTop: 6,
    },
    grandRow: {
        flexDirection: "row",
        gap: 20,
        marginTop: 14,
        paddingTop: 14,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    grandLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
    },
    grandNumber: {
        fontFamily: FontFamily.monoMedium,
        fontSize: Typography.fontSize.lg,
        marginTop: 3,
    },

    prodStatsRow: { flexDirection: "row", gap: 10 },
    prodStatTile: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    prodStatIcon: {
        width: 28,
        height: 28,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 10,
    },
    prodStatValue: {
        fontFamily: FontFamily.serifMedium,
        fontSize: 20,
        letterSpacing: -0.3,
    },
    prodStatLabel: {
        fontFamily: FontFamily.uiRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 2,
    },
    prodStatFooter: {
        fontFamily: FontFamily.monoRegular,
        fontSize: Typography.fontSize.micro,
        marginTop: 5,
    },

    finishBtn: {
        marginTop: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        paddingVertical: 14,
        borderRadius: 12,
    },
    finishBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.base,
    },
    secondaryBtn: {
        marginTop: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: StyleSheet.hairlineWidth,
    },
    secondaryBtnText: {
        fontFamily: FontFamily.uiSemibold,
        fontSize: Typography.fontSize.sm,
    },
});
