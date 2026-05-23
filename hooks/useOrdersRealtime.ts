import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtime } from '@/services/realtime';
import { ordersKeys } from './useOrders';

const ORDER_EVENTS = [
  'order:created',
  'order:confirmed',
  'order:collection_scheduled',
  'order:collected',
  'order:received',
  'order:ready',
  'order:delivery_scheduled',
  'order:delivered',
  'order:cancelled',
] as const;

const ROUND_EVENTS = [
  'round:created',
  'round:started',
  'round:updated',
  'round:completed',
  'round:cancelled',
] as const;

/**
 * Branche le socket sur le cache react-query.
 * - Events order:* → invalide orders + tournées (la progress dépend des orders)
 * - Events round:* → invalide tournées
 */
export function useOrdersRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();

  useEffect(() => {
    if (!socket) return;

    const orderHandler = (payload: { orderId?: string }) => {
      void qc.invalidateQueries({ queryKey: ordersKeys.all });
      if (payload?.orderId) {
        void qc.invalidateQueries({ queryKey: ordersKeys.detail(payload.orderId) });
      }
      // Une commande dans une tournée a changé → invalider les tournées
      // (progress 0/3 → 1/3 etc.)
      void qc.invalidateQueries({ queryKey: ['collection-rounds'] });
    };

    const roundHandler = () => {
      void qc.invalidateQueries({ queryKey: ['collection-rounds'] });
    };

    for (const ev of ORDER_EVENTS) socket.on(ev, orderHandler);
    for (const ev of ROUND_EVENTS) socket.on(ev, roundHandler);
    return () => {
      for (const ev of ORDER_EVENTS) socket.off(ev, orderHandler);
      for (const ev of ROUND_EVENTS) socket.off(ev, roundHandler);
    };
  }, [socket, qc]);
}
