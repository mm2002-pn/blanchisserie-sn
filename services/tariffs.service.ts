import { api } from './api';

export interface ApiTariffItem {
    id: string;
    linenTypeCode: string;
    linenTypeName: string;
    pricePerKg: string | number | null;
    pricePerPiece: string | number | null;
    billingMode: 'weight' | 'piece';
}

export interface ApiTariff {
    id: string;
    code: string;
    name: string;
    type: string;
    isDefault: boolean;
    isActive: boolean;
    items: ApiTariffItem[];
}

/**
 * Récupère le tarif applicable à un client : assigné ou défaut.
 * Le backend filtre par scope (un user hotel ne peut accéder qu'à son tarif).
 */
export async function getApplicableTariff(clientId: string): Promise<ApiTariff> {
    const { data } = await api.get<ApiTariff>(`/tariffs/applicable/${clientId}`);
    return data;
}
