import { api } from './api';

export type LinenCategoryCode = 'LP' | 'LF' | 'NAE';
export type BillingMode = 'weight' | 'piece';

export interface ApiLinenType {
  id: string;
  code: string;
  name: string;
  category: LinenCategoryCode;
  averageWeight: number; // grammes
  billingMode: BillingMode;
  unitPrice: string | number;
  treatmentMinutes?: number | null;
  notes?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
}

interface ListResult {
  items: ApiLinenType[];
  count: number;
}

/** Liste des types de linge actifs depuis l'API ; mobile filtre isActive=true. */
export async function listLinenTypes(): Promise<ApiLinenType[]> {
  const { data } = await api.get<ListResult>('/linen-types', {
    params: { isActive: true },
  });
  return data.items.filter((l) => l.isActive);
}
