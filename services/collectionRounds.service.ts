import { api } from './api';

export type CollectionRoundStatus =
    | 'planned'
    | 'in_progress'
    | 'completed'
    | 'cancelled';

export type RoundType = 'collect' | 'delivery';

export const ROUND_STATUS_FR: Record<CollectionRoundStatus, string> = {
    planned: 'Planifiée',
    in_progress: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
};

export const ROUND_TYPE_FR: Record<RoundType, string> = {
    collect: 'Collecte',
    delivery: 'Livraison',
};

export interface RoundOrder {
    id: string;
    orderNumber: string;
    status: string;
    clientId: string;
    client: {
        id: string;
        name: string;
        address: string;
        city: string | null;
    } | null;
    collectionDate: string;
    estimatedWeight: number | null;
    pickupGeoLat: number | null;
    pickupGeoLng: number | null;
    collectedAt: string | null;
    /** Timestamp arrivée usine post-collecte (rounds collect uniquement). */
    unloadedAt?: string | null;
    /** Présent pour les rounds de livraison : marque la commande comme livrée. */
    deliveredAt?: string | null;
}

export interface ApiCollectionRound {
    id: string;
    number: string;
    type: RoundType;
    vehicleId: string;
    plannedAt: string;
    status: CollectionRoundStatus;
    unloadedAt?: string | null;
    notes: string | null;
    startedAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    cancelReason: string | null;
    createdAt: string;
    updatedAt: string;
    vehicle: {
        id: string;
        matricule: string;
        brand: string;
        model: string;
        capacityKg: number;
        enrolledDriverId: string | null;
        enrolledPdaId: string | null;
        enrolledDriver: {
            id: string;
            firstName: string;
            lastName: string;
            phone: string | null;
        } | null;
        enrolledPda: {
            id: string;
            reference: string;
            brand: string | null;
            model: string | null;
        } | null;
    };
    orders: RoundOrder[];
}

interface PageResult<T> {
    items: T[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

export interface ListRoundsParams {
    status?: CollectionRoundStatus;
    page?: number;
    pageSize?: number;
}

/** Liste les tournées du chauffeur connecté (scope automatique côté API). */
export async function listMyRounds(params: ListRoundsParams = {}) {
    const { data } = await api.get<PageResult<ApiCollectionRound>>(
        '/collection-rounds',
        { params: { pageSize: 100, ...params } },
    );
    return data.items;
}

export async function getRound(id: string) {
    const { data } = await api.get<ApiCollectionRound>(`/collection-rounds/${id}`);
    return data;
}

export async function startRound(id: string) {
    const { data } = await api.post<ApiCollectionRound>(
        `/collection-rounds/${id}/start`,
    );
    return data;
}

export interface UnloadInput {
    signatureUrl: string;
    recipientName?: string;
}

/** Confirme l'arrivée à l'usine après collecte : débloque la pesée atelier.
 *  Le réceptionnaire usine signe sur le mobile du chauffeur pour valider. */
export async function unloadRound(id: string, input: UnloadInput) {
    const { data } = await api.post<ApiCollectionRound>(
        `/collection-rounds/${id}/unload`,
        input,
    );
    return data;
}
