import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as subteamsDb from '../db/subteams';

export function useSubteams() {
  return useQuery({
    queryKey: ['subteams'],
    queryFn: subteamsDb.getAllSubteams,
  });
}

export function useSubteam(subteamId: number) {
  return useQuery({
    queryKey: ['subteams', subteamId],
    queryFn: () => subteamsDb.getSubteamById(subteamId),
    enabled: !!subteamId,
  });
}

export function useCreateSubteam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subteamsDb.createSubteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subteams'] });
    },
  });
}

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

export function useDeleteSubteam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: subteamsDb.deleteSubteam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subteams'] });
    },
  });
}
