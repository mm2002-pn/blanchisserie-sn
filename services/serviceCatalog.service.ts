import { api } from './api';

export interface ApiService {
  id: string;
  code: string; // ex: "blanchisserie", "nettoyage", "aqua_clean"
  label: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
}

interface ListResult {
  items: ApiService[];
  count: number;
}

/** Liste des services proposés (blanchisserie, nettoyage, aqua_clean, ...). */
export async function listServiceCatalog(): Promise<ApiService[]> {
  const { data } = await api.get<ListResult>('/services', {
    params: { isActive: true },
  });
  return data.items;
}
