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
}

/** Récupère un client par id. Le backend filtre déjà : un user "hotel"
 *  ne peut accéder qu'à son propre client. */
export async function getClient(id: string): Promise<ApiClient> {
    const { data } = await api.get<ApiClient>(`/clients/${id}`);
    return data;
}
