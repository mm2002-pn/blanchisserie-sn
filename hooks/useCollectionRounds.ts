import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    getRound,
    listMyRounds,
    startRound,
    unloadRound,
    type ListRoundsParams,
    type UnloadInput,
} from '@/services/collectionRounds.service';

export const roundsKeys = {
    all: ['collection-rounds'] as const,
    list: (params: ListRoundsParams = {}) =>
        [...roundsKeys.all, 'list', params] as const,
    detail: (id: string) => [...roundsKeys.all, 'detail', id] as const,
};

/** Mes tournées (driver scoped automatiquement par l'API). */
export function useMyRounds(params: ListRoundsParams = {}) {
    return useQuery({
        queryKey: roundsKeys.list(params),
        queryFn: () => listMyRounds(params),
        staleTime: 15_000,
    });
}

export function useRound(id: string | null) {
    return useQuery({
        queryKey: roundsKeys.detail(id ?? ''),
        queryFn: () => getRound(id as string),
        enabled: !!id,
    });
}

export function useStartRound() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => startRound(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: roundsKeys.all });
        },
    });
}

export function useUnloadRound() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: string; data: UnloadInput }) =>
            unloadRound(vars.id, vars.data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: roundsKeys.all });
            qc.invalidateQueries({ queryKey: ['orders'] });
        },
    });
}
