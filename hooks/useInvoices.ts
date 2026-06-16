import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listInvoices } from '@/services/invoices.service';
import { useRealtime } from '@/services/realtime';

export const invoicesKeys = {
  all: ['invoices'] as const,
  list: (clientId?: string) => [...invoicesKeys.all, 'list', clientId ?? null] as const,
};

export function useInvoices(clientId?: string) {
  return useQuery({
    queryKey: invoicesKeys.list(clientId),
    queryFn: () => listInvoices(clientId ? { clientId } : {}),
  });
}

export function useInvoicesRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = ['invoice:generated', 'invoice:paid', 'invoice:cancelled'];
    const handler = () => void qc.invalidateQueries({ queryKey: invoicesKeys.all });
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
