import { useQuery } from '@tanstack/react-query';
import { getClient } from '@/services/clients.service';

export function useClient(id: string | null | undefined) {
    return useQuery({
        queryKey: ['client', id],
        queryFn: () => getClient(id as string),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}
