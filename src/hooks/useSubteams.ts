/** React Query hooks for subteams. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as subteamsDb from '../db/subteams';

/** All subteams. */
export function useSubteams() {
  return useQuery({
    queryKey: ['subteams'],
    queryFn: subteamsDb.getAllSubteams,
  });
}

/** Single subteam by id; disabled when subteamId falsy. */
export function useSubteam(subteamId: number) {
  return useQuery({
    queryKey: ['subteams', subteamId],
    queryFn: () => subteamsDb.getSubteamById(subteamId),
    enabled: !!subteamId,
  });
}

/** Create subteam; invalidates ['subteams']. */
export function useCreateSubteam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subteamsDb.createSubteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subteams'] });
    },
  });
}

/** Update subteam (args: { subteamId, subteam }); invalidates ['subteams']. */
export function useUpdateSubteam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ subteamId, subteam }: { subteamId: number; subteam: Partial<subteamsDb.Subteam> }) =>
      subteamsDb.updateSubteam(subteamId, subteam),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subteams'] });
    },
  });
}

/** Delete subteam by id; invalidates ['subteams']. */
export function useDeleteSubteam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subteamsDb.deleteSubteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subteams'] });
    },
  });
}
