import { useQuery } from '@tanstack/react-query';
import { listTeamMembers } from '@/services/users.service';

export const teamKeys = {
  all: ['team'] as const,
  list: () => [...teamKeys.all, 'list'] as const,
};

export function useTeam() {
  return useQuery({
    queryKey: teamKeys.list(),
    queryFn: listTeamMembers,
  });
}
