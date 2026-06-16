import { api } from './api';

export interface TriageItemInput {
  linenTypeId: string;
  pieces: number;
  weight: number; // grammes
}

export interface TriageInput {
  items: TriageItemInput[];
  acceptDeviation?: boolean;
}

/** Crée un triage atelier (received → triaged) + génère les ItemTags. */
export async function createTriage(orderId: string, dto: TriageInput) {
  const { data: current } = await api.get<{ version: number }>(`/orders/${orderId}`);
  const { data } = await api.post(`/triage/orders/${orderId}`, {
    ...dto,
    expectedOrderVersion: current.version,
  });
  return data;
}
