import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  completeBatch,
  listBatches,
  startBatch,
  type CompleteBatchInput,
  type Stage,
} from '@/services/batches.service';
import { useRealtime } from '@/services/realtime';

export const batchesKeys = {
  all: ['batches'] as const,
  list: (stage?: Stage) => [...batchesKeys.all, 'list', stage ?? null] as const,
};

export function useBatches(stage?: Stage) {
  return useQuery({
    queryKey: batchesKeys.list(stage),
    queryFn: () => listBatches(stage),
    refetchInterval: 30_000,
  });
}

export function useStartBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => startBatch(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: batchesKeys.all }),
  });
}

export function useCompleteBatch() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; data?: CompleteBatchInput }) =>
      completeBatch(vars.id, vars.data),
    onSuccess: () => void qc.invalidateQueries({ queryKey: batchesKeys.all }),
  });
}

export function useBatchesRealtime() {
  const { socket } = useRealtime();
  const qc = useQueryClient();
  useEffect(() => {
    if (!socket) return;
    const events = ['batch:created', 'batch:started', 'batch:completed'];
    const handler = () => void qc.invalidateQueries({ queryKey: batchesKeys.all });
    events.forEach((e) => socket.on(e, handler));
    return () => events.forEach((e) => socket.off(e, handler));
  }, [socket, qc]);
}
