import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as fightsDb from '../db/fights';
import { sendPushNotification } from '../notifications/sendPushNotif';
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

  return useMutation({
    mutationFn: fightsDb.createFight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
      //get expo push token linked to user -- TODO abstract this out cuz repeated in AuthContext
      /* TODO
      const { data, error } = await supabase
        .from('profiles')
        .eq('id'')
      sendPushNotification(expoPushToken, 'New Fight', 'A new fight has been created');
      */
    },
  });
}

export function useUpdateFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fightId, fight }: { fightId: number; fight: Partial<fightsDb.Fight> }) =>
      fightsDb.updateFight(fightId, fight),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
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
