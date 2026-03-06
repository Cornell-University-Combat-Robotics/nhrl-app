/** React Query hooks for builders. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as buildersDb from '../db/builders';

/** All builders. */
export function useBuilders() {
  return useQuery({
    queryKey: ['builders'],
    queryFn: buildersDb.getAllBuilders,
  });
}

/** Single builder by id; disabled when builderId falsy. */
export function useBuilder(builderId: number) {
  return useQuery({
    queryKey: ['builders', builderId],
    queryFn: () => buildersDb.getBuilderById(builderId),
    enabled: !!builderId,
  });
}

/** Create builder; invalidates ['builders']. */
export function useCreateBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildersDb.createBuilder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}

/** Update builder (args: { builderId, builder }); invalidates ['builders']. */
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

/** Delete builder by id; invalidates ['builders']. */
export function useDeleteBuilder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: buildersDb.deleteBuilder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}
