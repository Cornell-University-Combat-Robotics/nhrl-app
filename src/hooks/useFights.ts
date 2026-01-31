import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as fightsDb from '../db/fights';
import { createFightNotifBroadcast, updateFightNotifBroadcast } from '../notifications/sendPushNotif';
import { supabase } from '../supabaseClient';

export function useFights() {
  return useQuery({
    queryKey: ['fights'],
    queryFn: fightsDb.getAllFights,
  });
}

export function useFightsByRobot(robotId: number) {
  return useQuery({
    queryKey: ['fights', 'robot', robotId],
    queryFn: () => fightsDb.getFightsByRobotId(robotId),
    enabled: !!robotId,
  });
}

export function useFight(fightId: number) {
  return useQuery({
    queryKey: ['fights', fightId],
    queryFn: () => fightsDb.getFightById(fightId),
    enabled: !!fightId,
  });
}

export function useCreateFight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: fightsDb.createFight,
    onSuccess: async (createdFight) => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
      if(!user){
        console.warn('Creating fight. No user found');
        return;
      }
      createFightNotifBroadcast(createdFight, supabase);
    },
  });
}

export function useUpdateFight() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ fightId, fight }: { fightId: number; fight: Partial<fightsDb.Fight>; isWinUpdate?: boolean }) =>
      fightsDb.updateFight(fightId, fight),
    onSuccess: async (updatedFight, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
      if(!user){
        console.warn('Updating fight. No user found');
        return;
      }
      updateFightNotifBroadcast(updatedFight, supabase, { isWinUpdate: variables.isWinUpdate });
    },
  });
}

export function useDeleteFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fightsDb.deleteFight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
    },
  });
}
