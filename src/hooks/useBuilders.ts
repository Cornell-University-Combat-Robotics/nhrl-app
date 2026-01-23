import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as buildersDb from '../db/builders';

export function useBuilders() {
  return useQuery({
    queryKey: ['builders'],
    queryFn: buildersDb.getAllBuilders,
  });
}

export function useBuilder(builderId: number) {
  return useQuery({
    queryKey: ['builders', builderId],
    queryFn: () => buildersDb.getBuilderById(builderId),
    //0, null, or undefined → query doesn't run (avoids an invalid fetch)
    enabled: !!builderId,
  });
}

export function useCreateBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildersDb.createBuilder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}

export function useUpdateBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ builderId, builder }: { builderId: number; builder: Partial<buildersDb.Builder> }) =>
      buildersDb.updateBuilder(builderId, builder),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}

export function useDeleteBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildersDb.deleteBuilder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}
