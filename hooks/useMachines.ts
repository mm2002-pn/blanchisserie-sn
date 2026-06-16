import { useQuery } from '@tanstack/react-query';
import { listMachinesUi } from '@/services/machines.service';

export const machinesKeys = {
  all: ['machines'] as const,
  list: () => [...machinesKeys.all, 'list'] as const,
};

export function useMachines() {
  return useQuery({
    queryKey: machinesKeys.list(),
    queryFn: listMachinesUi,
    refetchInterval: 30_000,
  });
}
