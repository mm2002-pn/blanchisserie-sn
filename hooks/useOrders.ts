import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  cancelOrder as cancelOrderApi,
  collectOrder as collectOrderApi,
  createOrder as createOrderApi,
  deliverOrder as deliverOrderApi,
  fetchOrderVersion,
  getOrder,
  listOrders,
  receiveOrder as receiveOrderApi,
  updateOrder as updateOrderApi,
  type CollectInput,
  type DeliverInput,
  type ReceiveInput,
} from '@/services/orders.service';
import { createTriage as createTriageApi, type TriageInput } from '@/services/triage.service';
import type { OrderFormData } from '@/types/order.types';

export const ordersKeys = {
  all: ['orders'] as const,
  list: (clientId?: string) => [...ordersKeys.all, 'list', clientId ?? null] as const,
  detail: (id: string) => [...ordersKeys.all, 'detail', id] as const,
};

export function useOrders(clientId?: string) {
  return useQuery({
    queryKey: ordersKeys.list(clientId),
    queryFn: () => listOrders(clientId ? { clientId } : {}),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ordersKeys.detail(id ?? ''),
    queryFn: () => getOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (form: OrderFormData) => createOrderApi(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/**
 * Édition d'une commande (client). Récupère la version la plus fraîche pour
 * éviter le 409 CONCURRENT_UPDATE puis appelle PATCH.
 */
export function useUpdateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; form: OrderFormData }) => {
      const version = await fetchOrderVersion(vars.id);
      return updateOrderApi(vars.id, vars.form, version);
    },
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      qc.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

/**
 * Cancel d'une commande — récupère la version la plus récente avant l'appel
 * pour éviter le 409 CONCURRENT_UPDATE en cas de race.
 */
export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { id: string; reason?: string }) => {
      const version = await fetchOrderVersion(vars.id);
      return cancelOrderApi(vars.id, vars.reason ?? 'Annulée par le client', version);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}

/** Collecte (driver) — gère version + invalidation. */
export function useCollectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: CollectInput }) =>
      collectOrderApi(vars.id, vars.data),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      // Invalide aussi les tournées (progress 0/3 → 1/3 à mettre à jour)
      void qc.invalidateQueries({ queryKey: ['collection-rounds'] });
      qc.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

/** Livraison (driver) — gère version + invalidation. */
export function useDeliverOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: DeliverInput }) =>
      deliverOrderApi(vars.id, vars.data),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      // Invalide aussi les tournées (progress livraison à mettre à jour)
      void qc.invalidateQueries({ queryKey: ['collection-rounds'] });
      qc.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

/** Pesée atelier (supervisor) — gère version + invalidation. */
export function useReceiveOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data: ReceiveInput }) =>
      receiveOrderApi(vars.id, vars.data),
    onSuccess: (order) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      qc.setQueryData(ordersKeys.detail(order.id), order);
    },
  });
}

/** Triage atelier (supervisor) — gère version + invalidation. */
export function useCreateTriage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { orderId: string; data: TriageInput }) =>
      createTriageApi(vars.orderId, vars.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
    },
  });
}
