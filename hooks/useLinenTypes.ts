import { useQuery } from '@tanstack/react-query';
import { listLinenTypes, type ApiLinenType } from '@/services/linenTypes.service';

export const linenTypesKeys = {
  all: ['linenTypes'] as const,
};

export function useLinenTypes() {
  return useQuery<ApiLinenType[]>({
    queryKey: linenTypesKeys.all,
    queryFn: listLinenTypes,
    staleTime: 5 * 60_000,
  });
}
