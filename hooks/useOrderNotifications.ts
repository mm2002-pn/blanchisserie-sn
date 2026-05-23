import { useEffect } from "react";
import { useRealtime } from "@/services/realtime";
import { useNotifications } from "@/contexts/NotificationsContext";
import { useToast } from "@/contexts/ToastContext";

type Variant = "info" | "success" | "warning" | "error";
type Msg = { title: string; message?: string; variant: Variant };

/** Vue client hôtel : centrée sur le suivi de SA commande. */
const HOTEL_MESSAGES: Record<string, Msg> = {
    "order:created": {
        title: "Commande créée",
        message: "Votre commande a bien été enregistrée.",
        variant: "success",
    },
    "order:confirmed": {
        title: "Commande confirmée",
        message: "Le chauffeur sera planifié sous peu.",
        variant: "info",
    },
    "order:collection_scheduled": {
        title: "Collecte planifiée",
        message: "Un chauffeur est assigné pour la collecte de votre linge.",
        variant: "info",
    },
    "order:collected": {
        title: "Linge collecté",
        message: "Votre linge est parti à l'atelier.",
        variant: "info",
    },
    "order:received": {
        title: "Réceptionné à l'atelier",
        message: "Pesée et triage en cours.",
        variant: "info",
    },
    "order:ready": {
        title: "Votre linge est prêt !",
        message: "Une livraison va être planifiée.",
        variant: "success",
    },
    "order:delivery_scheduled": {
        title: "Livraison planifiée",
        message: "Votre commande sera livrée prochainement.",
        variant: "success",
    },
    "order:delivered": {
        title: "Livré",
        message: "Votre commande a été livrée.",
        variant: "success",
    },
    "order:cancelled": {
        title: "Commande annulée",
        variant: "warning",
    },
};

/** Vue chauffeur : focus sur ses tournées (collecte + livraison). */
const DRIVER_MESSAGES: Record<string, Msg> = {
    "order:collection_scheduled": {
        title: "Nouvelle collecte assignée",
        message: "Une collecte vient d'être ajoutée à ta tournée.",
        variant: "info",
    },
    "order:collected": {
        title: "Collecte validée",
        message: "Le linge est en route vers l'atelier.",
        variant: "success",
    },
    "order:delivery_scheduled": {
        title: "Nouvelle livraison assignée",
        message: "Une livraison vient d'être ajoutée à ta tournée.",
        variant: "info",
    },
    "order:delivered": {
        title: "Livraison validée",
        variant: "success",
    },
    "order:cancelled": {
        title: "Commande annulée",
        variant: "warning",
    },
};

/** Vue superviseur/admin : pipeline complet. */
const STAFF_MESSAGES: Record<string, Msg> = {
    "order:created": { title: "Nouvelle commande", variant: "info" },
    "order:confirmed": { title: "Commande confirmée", variant: "info" },
    "order:collection_scheduled": { title: "Collecte planifiée", variant: "info" },
    "order:collected": { title: "Collectée chez le client", variant: "info" },
    "order:received": { title: "Réceptionnée à l'atelier", variant: "info" },
    "order:ready": { title: "Production terminée", variant: "success" },
    "order:delivery_scheduled": { title: "Livraison planifiée", variant: "info" },
    "order:delivered": { title: "Livrée", variant: "success" },
    "order:cancelled": { title: "Commande annulée", variant: "warning" },
};

const MESSAGES_BY_AUDIENCE = {
    hotel: HOTEL_MESSAGES,
    driver: DRIVER_MESSAGES,
    staff: STAFF_MESSAGES,
} as const;

export type NotificationAudience = keyof typeof MESSAGES_BY_AUDIENCE;

/**
 * Branche le socket sur le système de toast.
 * Sur chaque event order:*, affiche une notification in-app à l'utilisateur,
 * avec une formulation adaptée au rôle (hotel / driver / staff).
 *
 * Le filtrage par utilisateur est délégué au backend Socket.IO (rooms par userId).
 */
export function useOrderNotifications(audience: NotificationAudience = "hotel") {
    const { socket } = useRealtime();
    const { showToast } = useToast();
    const { add: addNotif } = useNotifications();

    useEffect(() => {
        if (!socket) return;
        const messages = MESSAGES_BY_AUDIENCE[audience];
        const events = Object.keys(messages);
        const handler = (eventName: string) => (payload?: { orderId?: string }) => {
            const msg = messages[eventName];
            if (!msg) return;
            showToast(msg);
            addNotif({
                title: msg.title,
                message: msg.message,
                variant: msg.variant,
                eventName,
                orderId: payload?.orderId,
            });
        };
        const handlers: Array<{ ev: string; fn: (p?: { orderId?: string }) => void }> = [];
        for (const ev of events) {
            const fn = handler(ev);
            socket.on(ev, fn);
            handlers.push({ ev, fn });
        }
        return () => {
            for (const { ev, fn } of handlers) socket.off(ev, fn);
        };
    }, [socket, showToast, addNotif, audience]);
}
