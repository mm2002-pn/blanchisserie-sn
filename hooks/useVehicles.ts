import { useQuery } from '@tanstack/react-query';
import { listVehicles, type ApiVehicle } from '@/services/vehicles.service';

export const vehiclesKeys = {
  all: ['vehicles'] as const,
};

export function useVehicles() {
  return useQuery<ApiVehicle[]>({
    queryKey: vehiclesKeys.all,
    queryFn: listVehicles,
    staleTime: 5 * 60_000,
  });
}
