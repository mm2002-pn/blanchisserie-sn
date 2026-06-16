import { useQuery } from '@tanstack/react-query';
import { getApplicableTariff } from '@/services/tariffs.service';

export function useApplicableTariff(clientId: string | null | undefined) {
    return useQuery({
        queryKey: ['tariff', 'applicable', clientId],
        queryFn: () => getApplicableTariff(clientId as string),
        enabled: !!clientId,
        staleTime: 5 * 60 * 1000,
    });
}
