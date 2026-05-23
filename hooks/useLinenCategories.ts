import { useQuery } from '@tanstack/react-query';
import { listLinenCategories } from '@/services/linenCategories.service';

export function useLinenCategories() {
    return useQuery({
        queryKey: ['linen-categories'],
        queryFn: listLinenCategories,
        staleTime: 10 * 60 * 1000,
    });
}
