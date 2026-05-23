import { useQuery } from '@tanstack/react-query';
import {
  listServiceCatalog,
  type ApiService,
} from '@/services/serviceCatalog.service';

export const servicesKeys = {
  all: ['services'] as const,
};

export function useServices() {
  return useQuery<ApiService[]>({
    queryKey: servicesKeys.all,
    queryFn: listServiceCatalog,
    staleTime: 5 * 60_000,
  });
}
