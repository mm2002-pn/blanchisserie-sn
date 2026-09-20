import { useQuery } from '@tanstack/react-query';
import { listClients } from '@/services/clients.service';

/** Liste des clients (hôtels/restos), avec recherche optionnelle. */
export function useClients(search?: string) {
    return useQuery({
        queryKey: ['clients', search ?? ''],
        queryFn: () => listClients(search),
        staleTime: 60 * 1000,
    });
}
