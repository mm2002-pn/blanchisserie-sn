import { api } from './api';
import type {
  Order,
  OrderFormData,
  OrderService,
  OrderStatus,
} from '@/types/order.types';

/**
 * Service Orders (mobile). Mappe l'API REST vers la shape `Order` attendue
 * par les écrans existants — garde la rétro-compat pour ne pas casser
 * `app/(hotel)/orders.tsx`, `order-details`, etc.
 */

interface ApiOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client?: { id: string; name: string; address?: string | null; phone?: string | null };
  status: string;
  workflowState: string;
  estimatedItems: { category: string; type: string; quantity: number }[];
  estimatedWeight: number | null;
  receivedWeight: number | null;
  collectionDate: string;
  collectionPlannedAt?: string | null;
  collectedAt: string | null;
  receivedAt: string | null;
  deliveryPlannedAt?: string | null;
  deliveredAt: string | null;
  instructions: string | null;
  collectionPhotos: string[];
  pickupGeoLat?: number | null;
  pickupGeoLng?: number | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PageResult<T> {
  items: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

/* ─── API status → mobile status ────────────────────────────── */
const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  confirmed: 'confirmed',
  collection_planned: 'confirmed',
  collected: 'collected',
  received: 'in_progress',
  triaged: 'in_progress',
  in_production: 'in_progress',
  ready: 'ready',
  delivered: 'delivered',
  invoiced: 'delivered',
  cancelled: 'cancelled',
};

/** Convertit estimatedItems API en services[] mobile (groupé par "blanchisserie"). */
function itemsToServices(items: ApiOrder['estimatedItems']): OrderService[] {
  if (!items || items.length === 0) return [];
  return [
    {
      service: 'blanchisserie',
      items: items.map((it) => ({
        type: (it.type as Order['services'][number]['items'][number]['type']) ?? 'drap',
        quantity: it.quantity,
      })),
    },
  ];
}

export function mapApiOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    hotelId: o.clientId,
    hotelName: o.client?.name ?? '',
    hotelAddress: o.client?.address ?? undefined,
    hotelPhone: o.client?.phone ?? undefined,
    orderNumber: o.orderNumber,
    status: STATUS_MAP[o.status] ?? 'pending',
    apiStatus: o.status,
    services: itemsToServices(o.estimatedItems),
    actualWeight:
      o.receivedWeight != null ? Math.round(o.receivedWeight / 100) / 10 : undefined,
    estimatedWeight:
      o.estimatedWeight != null ? Math.round(o.estimatedWeight / 100) / 10 : undefined,
    instructions: o.instructions ?? undefined,
    photos: o.collectionPhotos ?? [],
    collectionDate: o.collectionDate,
    deliveryDate: o.deliveredAt ?? undefined,
    deliveryPlannedAt: o.deliveryPlannedAt ?? undefined,
    collectionPlannedAt: o.collectionPlannedAt ?? undefined,
    pickupGeoLat: o.pickupGeoLat ?? undefined,
    pickupGeoLng: o.pickupGeoLng ?? undefined,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

/* ─── API calls ─────────────────────────────────────────────── */

export async function listOrders(params: { clientId?: string; page?: number; pageSize?: number } = {}) {
  const { data } = await api.get<PageResult<ApiOrder>>('/orders', {
    params: { pageSize: 100, ...params },
  });
  return data.items.map(mapApiOrder);
}

export async function getOrder(id: string) {
  const { data } = await api.get<ApiOrder>(`/orders/${id}`);
  return mapApiOrder(data);
}

export async function createOrder(form: OrderFormData) {
  // Aplatit les services → estimatedItems API.
  // Si la catégorie est renseignée par le créateur, on l'envoie, sinon fallback 'LP'.
  const estimatedItems = form.services.flatMap((s) =>
    s.items.map((it) => ({
      category: it.category ?? ('LP' as const),
      type: it.type,
      quantity: it.quantity,
    })),
  );
  const payload = {
    estimatedItems,
    collectionDate: form.collectionDate,
    instructions: form.instructions,
    pickupGeoLat: form.pickupGeoLat,
    pickupGeoLng: form.pickupGeoLng,
  };
  const { data } = await api.post<ApiOrder>('/orders', payload);
  return mapApiOrder(data);
}

/**
 * Édition d'une commande par le client AVANT collecte.
 * Le serveur valide l'état (pending / confirmed / collection_planned) +
 * scope client + version optimiste.
 */
export async function updateOrder(
  id: string,
  form: OrderFormData,
  expectedVersion: number,
) {
  const estimatedItems = form.services.flatMap((s) =>
    s.items.map((it) => ({
      category: it.category ?? ('LP' as const),
      type: it.type,
      quantity: it.quantity,
    })),
  );
  const payload = {
    estimatedItems,
    collectionDate: form.collectionDate,
    instructions: form.instructions,
    pickupGeoLat: form.pickupGeoLat,
    pickupGeoLng: form.pickupGeoLng,
    expectedVersion,
  };
  const { data } = await api.patch<ApiOrder>(`/orders/${id}`, payload);
  return mapApiOrder(data);
}

export async function cancelOrder(id: string, reason: string, expectedVersion: number) {
  const { data } = await api.post<ApiOrder>(`/orders/${id}/cancel`, {
    reason,
    expectedVersion,
  });
  return mapApiOrder(data);
}

export async function fetchOrderVersion(id: string): Promise<number> {
  const { data } = await api.get<ApiOrder>(`/orders/${id}`);
  return data.version;
}

/* ─── Workflow actions (driver / operator) ──────────────────── */

export interface CollectInput {
  driverWeight: number;          // grammes
  driverPieces: number;
  /** Détail par type validé par le chauffeur : [{ type, quantity }]. */
  driverItems?: { type: string; quantity: number }[];
  visualEstimation?: 'S' | 'M' | 'L' | 'XL';
  collectionPhotos?: string[];   // URLs renvoyées par /uploads/photos
  signatureUrl?: string;         // URL renvoyée par /uploads/signatures
  recipientName?: string;
  geoLat?: number;
  geoLng?: number;
}

export async function collectOrder(orderId: string, dto: CollectInput) {
  const version = await fetchOrderVersion(orderId);
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/collect`, {
    ...dto,
    expectedVersion: version,
  });
  return mapApiOrder(data);
}

export interface DeliverInput {
  recipientName: string;
  signatureUrl?: string;
  deliveryPhotos?: string[];
  geoLat?: number;
  geoLng?: number;
}

export async function deliverOrder(orderId: string, dto: DeliverInput) {
  const version = await fetchOrderVersion(orderId);
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/deliver`, {
    ...dto,
    expectedVersion: version,
  });
  return mapApiOrder(data);
}

/** Pesée officielle atelier (collected → received). */
export interface ReceiveInput {
  receivedWeight: number; // grammes
  receivedPieces: number;
  acceptDeviation?: boolean;
}

export async function receiveOrder(orderId: string, dto: ReceiveInput) {
  const version = await fetchOrderVersion(orderId);
  const { data } = await api.post<ApiOrder>(`/orders/${orderId}/receive`, {
    ...dto,
    expectedVersion: version,
  });
  return mapApiOrder(data);
}
