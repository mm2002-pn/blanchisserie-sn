import Svg, { Circle, Path, Rect } from "react-native-svg";

/**
 * Icône de marque B&C Teranga — "La Machine" (piste retenue).
 * Machine à laver de face : hublot, bandeau de commande, voyant.
 *
 * `variant="line"` (défaut) : tracée monochrome (`color`), petits formats/usage
 * générique.
 * `variant="full"` : rendu couleur complet (corps blanc, tambour marine, voyant
 * et vague orange) — celui utilisé sur les écrans de connexion (maquette v3),
 * toujours sur fond sombre. Couleurs fixes, non pilotées par `color`.
 */
export function BrandMark({
    size = 24,
    color = "#17356B",
    variant = "line",
}: {
    size?: number;
    color?: string;
    variant?: "line" | "full";
}) {
    if (variant === "full") {
        return (
            <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
                <Rect x={14} y={10} width={68} height={76} rx={9} fill="#FFFFFF" />
                <Rect x={14} y={10} width={68} height={20} fill="#0B1A2E" opacity={0.14} />
                <Circle cx={27} cy={20} r={4} fill="#DE6B0E" />
                <Rect x={54} y={17} width={20} height={6} rx={3} fill="#0B1A2E" opacity={0.3} />
                <Circle cx={48} cy={57} r={22} fill="#0B1A2E" />
                <Circle cx={48} cy={57} r={15} stroke="#FFFFFF" strokeWidth={3} opacity={0.22} />
                <Path
                    d="M36 60 q6 -7 12 0 t12 0"
                    stroke="#DE6B0E"
                    strokeWidth={5.5}
                    strokeLinecap="round"
                />
            </Svg>
        );
    }
    return (
        <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
            <Rect
                x={16}
                y={12}
                width={64}
                height={72}
                rx={8}
                stroke={color}
                strokeWidth={7}
            />
            <Path d="M16 32 H80" stroke={color} strokeWidth={6} />
            <Circle cx={48} cy={58} r={16} stroke={color} strokeWidth={7} />
            <Circle cx={29} cy={22} r={4} fill={color} />
        </Svg>
    );
}
