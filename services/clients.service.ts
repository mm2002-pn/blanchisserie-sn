import { api } from './api';

export interface ApiClient {
    id: string;
    name: string;
    type: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    email?: string | null;
    geoLat?: number | null;
    geoLng?: number | null;
    ninea?: string | null;
    contactPerson?: string | null;
    billingMode?: 'per_order' | 'monthly';
    createdAt?: string;
    tariff?: { name: string } | null;
    _count?: { orders: number; invoices: number };
}

/** Récupère un client par id. Le backend filtre déjà : un user "hotel"
 *  ne peut accéder qu'à son propre client. */
export async function getClient(id: string): Promise<ApiClient> {
    const { data } = await api.get<ApiClient>(`/clients/${id}`);
    return data;
}

/** Liste des clients (hôtels/restos) — réservé aux rôles internes + chauffeur
 *  (permet au chauffeur de choisir pour qui créer une collecte sur place). */
export async function listClients(search?: string): Promise<ApiClient[]> {
    const { data } = await api.get<{ items: ApiClient[] }>('/clients', {
        params: { pageSize: 100, ...(search ? { search } : {}) },
    });
    return data.items;
}
