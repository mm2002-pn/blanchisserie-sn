import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type NotifVariant = "info" | "success" | "warning" | "error";

export interface NotifItem {
    id: string;
    title: string;
    message?: string;
    variant: NotifVariant;
    eventName?: string;
    orderId?: string;
    createdAt: number; // ms
    read: boolean;
}

interface NotificationsContextValue {
    items: NotifItem[];
    unreadCount: number;
    add: (input: Omit<NotifItem, "id" | "createdAt" | "read">) => void;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clear: () => void;
}

const STORAGE_KEY = "@blanchisserie-sn/notifications";
const MAX_ITEMS = 100;

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

let counter = 1;

export function NotificationsProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<NotifItem[]>([]);

    // Hydrate depuis AsyncStorage au montage.
    useEffect(() => {
        let cancelled = false;
        AsyncStorage.getItem(STORAGE_KEY)
            .then((raw) => {
                if (cancelled || !raw) return;
                try {
                    const parsed = JSON.parse(raw) as NotifItem[];
                    if (Array.isArray(parsed)) setItems(parsed);
                } catch {
                    /* ignore corruption */
                }
            })
            .catch(() => {
                /* ignore read errors */
            });
        return () => {
            cancelled = true;
        };
    }, []);

    // Persiste à chaque changement (truncate à MAX_ITEMS plus récents).
    useEffect(() => {
        const slice = items.slice(0, MAX_ITEMS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(slice)).catch(() => {});
    }, [items]);

    const add = useCallback(
        (input: Omit<NotifItem, "id" | "createdAt" | "read">) => {
            const next: NotifItem = {
                ...input,
                id: `${Date.now()}_${counter++}`,
                createdAt: Date.now(),
                read: false,
            };
            setItems((prev) => [next, ...prev].slice(0, MAX_ITEMS));
        },
        [],
    );

    const markRead = useCallback((id: string) => {
        setItems((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
    }, []);

    const markAllRead = useCallback(() => {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clear = useCallback(() => {
        setItems([]);
    }, []);

    const unreadCount = useMemo(
        () => items.reduce((c, n) => c + (n.read ? 0 : 1), 0),
        [items],
    );

    const value = useMemo<NotificationsContextValue>(
        () => ({ items, unreadCount, add, markRead, markAllRead, clear }),
        [items, unreadCount, add, markRead, markAllRead, clear],
    );

    return (
        <NotificationsContext.Provider value={value}>
            {children}
        </NotificationsContext.Provider>
    );
}

export function useNotifications(): NotificationsContextValue {
    const ctx = useContext(NotificationsContext);
    if (!ctx)
        throw new Error("useNotifications must be used within NotificationsProvider");
    return ctx;
}
