import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { FontFamily } from "@/constants/Typography";

const AnimatedG = Animated.createAnimatedComponent(G);

interface Props {
    onDone: () => void;
}

const EASE = Easing.bezier(0.2, 0.8, 0.25, 1);

/**
 * Écran de lancement animé — "La Machine" (cf. maquette "Animation Logo").
 * Séquence unique, jouée une fois au démarrage de l'app avant d'afficher le
 * contenu réel : le corps se pose (0-420ms), le tambour se visse d'un tiers
 * de tour (260-760ms), le voyant s'allume (500-800ms), puis le nom apparaît
 * (720ms→). Règle de la maquette : jamais plus vite, le corps de la machine
 * ne bouge plus une fois posé — seul le tambour tourne.
 */
export function BootAnimation({ onDone }: Props) {
    const body = useRef(new Animated.Value(0)).current;
    const lamp = useRef(new Animated.Value(0)).current;
    const drum = useRef(new Animated.Value(0)).current;
    const wordB = useRef(new Animated.Value(0)).current;
    const rule = useRef(new Animated.Value(0)).current;
    const wordT = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(body, {
                toValue: 1,
                duration: 420,
                easing: EASE,
                useNativeDriver: false,
            }),
            Animated.timing(drum, {
                toValue: 1,
                duration: 500,
                delay: 260,
                easing: EASE,
                useNativeDriver: false,
            }),
            Animated.timing(lamp, {
                toValue: 1,
                duration: 300,
                delay: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(wordB, {
                toValue: 1,
                duration: 400,
                delay: 720,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
            Animated.timing(rule, {
                toValue: 1,
                duration: 340,
                delay: 880,
                easing: EASE,
                useNativeDriver: false,
            }),
            Animated.timing(wordT, {
                toValue: 1,
                duration: 400,
                delay: 940,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false,
            }),
        ]).start();

        const timer = setTimeout(onDone, 1350);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const bodyScale = body.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
    const drumScale = drum.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] });
    const wordBY = wordB.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });
    const wordTY = wordT.interpolate({ inputRange: [0, 1], outputRange: [9, 0] });

    return (
        <View style={styles.container}>
            <Svg width={78} height={78} viewBox="0 0 96 96">
                <AnimatedG opacity={body} scale={bodyScale} origin="48, 48">
                    <Rect x={14} y={10} width={68} height={76} rx={9} fill="#FFFFFF" />
                    <Rect x={14} y={10} width={68} height={20} fill="#0B1A2E" opacity={0.14} />
                    <Rect x={54} y={17} width={20} height={6} rx={3} fill="#0B1A2E" opacity={0.3} />
                </AnimatedG>

                <AnimatedG opacity={lamp}>
                    <Circle cx={27} cy={20} r={4} fill="#DE6B0E" />
                </AnimatedG>

                <AnimatedG opacity={drum} scale={drumScale} origin="48, 57">
                    <Circle cx={48} cy={57} r={22} fill="#0B1A2E" />
                    <Circle cx={48} cy={57} r={15} stroke="#FFFFFF" strokeWidth={3} opacity={0.22} />
                    <Path
                        d="M36 60 q6 -7 12 0 t12 0"
                        stroke="#DE6B0E"
                        strokeWidth={5.5}
                        strokeLinecap="round"
                    />
                </AnimatedG>
            </Svg>

            <View style={styles.wordWrap}>
                <Animated.Text
                    style={[styles.brand, { opacity: wordB, transform: [{ translateY: wordBY }] }]}
                >
                    B&C
                </Animated.Text>
                <Animated.View style={[styles.rule, { transform: [{ scaleX: rule }] }]} />
                <Animated.Text
                    style={[styles.suffix, { opacity: wordT, transform: [{ translateY: wordTY }] }]}
                >
                    TERANGA
                </Animated.Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0B1A2E",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
    },
    wordWrap: { alignItems: "center" },
    brand: {
        fontFamily: FontFamily.uiBold,
        fontSize: 26,
        letterSpacing: -0.6,
        lineHeight: 26,
        color: "#FFFFFF",
    },
    rule: {
        height: 1,
        width: 62,
        backgroundColor: "#DE6B0E",
        marginTop: 11,
    },
    suffix: {
        fontFamily: FontFamily.uiMedium,
        fontSize: 11,
        letterSpacing: 3,
        color: "#F0A03D",
        marginTop: 11,
    },
});
