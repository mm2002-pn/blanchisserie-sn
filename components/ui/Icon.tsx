import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import { useThemeColors } from "@/hooks/useThemeColors";

export type IconName =
    | "home"
    | "package"
    | "receipt"
    | "user"
    | "bell"
    | "map"
    | "truck"
    | "qr"
    | "msg"
    | "plus"
    | "minus"
    | "chevRight"
    | "chevLeft"
    | "chevDown"
    | "arrowRight"
    | "check"
    | "x"
    | "search"
    | "camera"
    | "phone"
    | "calendar"
    | "settings"
    | "filter"
    | "droplet"
    | "thermo"
    | "alert"
    | "spark"
    | "grid"
    | "list"
    | "download"
    | "chart"
    | "boxes"
    | "tag"
    | "clock"
    | "building"
    | "route"
    | "signature"
    | "weight"
    | "wrench"
    | "logout";

interface IconProps {
    name: IconName;
    size?: number;
    color?: string;
    stroke?: number;
}

/**
 * Pack d'icônes line Blanchisserie SN — poids 1.6px par défaut.
 * Porte directement depuis les SVG du mockup (ui.jsx).
 */
export default function Icon({
    name,
    size = 18,
    color,
    stroke = 1.6,
}: IconProps) {
    const colors = useThemeColors();
    const c = color ?? colors.ink800;
    const common = {
        stroke: c,
        strokeWidth: stroke,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        fill: "none" as const,
    };

    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <G {...common}>{PATHS[name]}</G>
        </Svg>
    );
}

const PATHS: Record<IconName, React.ReactNode> = {
    home: (
        <>
            <Path d="M3 11l9-8 9 8" />
            <Path d="M5 10v10h14V10" />
        </>
    ),
    package: (
        <>
            <Path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
            <Path d="M3 7l9 4 9-4" />
            <Path d="M12 11v10" />
        </>
    ),
    receipt: (
        <>
            <Path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3z" />
            <Path d="M8 8h8M8 12h8M8 16h5" />
        </>
    ),
    user: (
        <>
            <Circle cx="12" cy="8" r="4" />
            <Path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
        </>
    ),
    bell: (
        <>
            <Path d="M6 16V11a6 6 0 0112 0v5l2 2H4l2-2z" />
            <Path d="M10 20a2 2 0 004 0" />
        </>
    ),
    map: (
        <>
            <Path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6z" />
            <Path d="M9 4v14M15 6v14" />
        </>
    ),
    truck: (
        <>
            <Path d="M1 7h13v9H1z" />
            <Path d="M14 10h4l3 3v3h-7" />
            <Circle cx="6" cy="18" r="2" />
            <Circle cx="17" cy="18" r="2" />
        </>
    ),
    qr: (
        <>
            <Rect x="3" y="3" width="7" height="7" />
            <Rect x="14" y="3" width="7" height="7" />
            <Rect x="3" y="14" width="7" height="7" />
            <Path d="M14 14h3v3M20 14v3M14 20h3M20 20v1" />
        </>
    ),
    msg: <Path d="M21 15a4 4 0 01-4 4H8l-5 3V6a4 4 0 014-4h10a4 4 0 014 4v9z" />,
    plus: <Path d="M12 5v14M5 12h14" />,
    minus: <Path d="M5 12h14" />,
    chevRight: <Path d="M9 6l6 6-6 6" />,
    chevLeft: <Path d="M15 6l-6 6 6 6" />,
    chevDown: <Path d="M6 9l6 6 6-6" />,
    arrowRight: <Path d="M5 12h14M13 6l6 6-6 6" />,
    check: <Path d="M4 12l5 5L20 6" />,
    x: <Path d="M6 6l12 12M18 6L6 18" />,
    search: (
        <>
            <Circle cx="11" cy="11" r="7" />
            <Path d="M21 21l-4-4" />
        </>
    ),
    camera: (
        <>
            <Path d="M4 7h3l2-2h6l2 2h3v12H4V7z" />
            <Circle cx="12" cy="13" r="4" />
        </>
    ),
    phone: (
        <Path d="M21 17v3a2 2 0 01-2 2A17 17 0 012 5a2 2 0 012-2h3l2 5-3 2a12 12 0 006 6l2-3 5 2z" />
    ),
    calendar: (
        <>
            <Rect x="3" y="5" width="18" height="16" rx="1" />
            <Path d="M8 3v4M16 3v4M3 10h18" />
        </>
    ),
    settings: (
        <>
            <Circle cx="12" cy="12" r="3" />
            <Path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />
        </>
    ),
    filter: <Path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />,
    droplet: <Path d="M12 3s7 7 7 12a7 7 0 01-14 0c0-5 7-12 7-12z" />,
    thermo: <Path d="M10 14V4a2 2 0 014 0v10a4 4 0 11-4 0z" />,
    alert: (
        <>
            <Path d="M12 3l10 18H2L12 3z" />
            <Path d="M12 10v5M12 18v.5" />
        </>
    ),
    spark: <Path d="M3 18l5-6 4 3 8-10" />,
    grid: (
        <>
            <Rect x="3" y="3" width="8" height="8" />
            <Rect x="13" y="3" width="8" height="8" />
            <Rect x="3" y="13" width="8" height="8" />
            <Rect x="13" y="13" width="8" height="8" />
        </>
    ),
    list: <Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />,
    download: <Path d="M12 4v12M6 11l6 6 6-6M4 20h16" />,
    chart: (
        <>
            <Path d="M3 3v18h18" />
            <Path d="M7 15l4-4 3 3 6-6" />
        </>
    ),
    boxes: (
        <>
            <Path d="M3 7l4-2 4 2v5l-4 2-4-2V7z" />
            <Path d="M13 7l4-2 4 2v5l-4 2-4-2V7z" />
            <Path d="M8 14l4-2 4 2v5l-4 2-4-2v-5z" />
        </>
    ),
    tag: (
        <>
            <Path d="M3 12V3h9l9 9-9 9-9-9z" />
            <Circle cx="7.5" cy="7.5" r="1" />
        </>
    ),
    clock: (
        <>
            <Circle cx="12" cy="12" r="9" />
            <Path d="M12 7v5l3 3" />
        </>
    ),
    building: (
        <>
            <Rect x="4" y="3" width="16" height="18" />
            <Path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2" />
        </>
    ),
    route: (
        <>
            <Circle cx="5" cy="6" r="2" />
            <Circle cx="19" cy="18" r="2" />
            <Path d="M7 6h6a4 4 0 014 4a4 4 0 01-4 4H9a4 4 0 00-4 4" />
        </>
    ),
    signature: (
        <>
            <Path d="M3 17c3-1 6-6 9-6s3 4 6 4 3-2 3-2" />
            <Path d="M3 21h18" />
        </>
    ),
    weight: (
        <>
            <Path d="M6 8h12l2 12H4L6 8z" />
            <Path d="M9 8a3 3 0 116 0" />
        </>
    ),
    wrench: <Path d="M14 7a4 4 0 005 5l-8 8-4-4 7-9z" />,
    logout: (
        <>
            <Path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h4" />
            <Path d="M16 17l5-5-5-5M21 12H9" />
        </>
    ),
};
