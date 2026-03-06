/** React Query hooks for fights. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import * as fightsDb from '../db/fights';
import { createFightNotifBroadcast, updateFightNotifBroadcast } from '../notifications/sendPushNotif';
import { supabase } from '../supabaseClient';

/** All fights. */
export function useFights() {
  return useQuery({
    queryKey: ['fights'],
    queryFn: fightsDb.getAllFights,
  });
}

/** Fights for one robot; disabled when robotId falsy. */
export function useFightsByRobot(robotId: number) {
  return useQuery({
    queryKey: ['fights', 'robot', robotId],
    queryFn: () => fightsDb.getFightsByRobotId(robotId),
    enabled: !!robotId,
  });
}

/** Single fight by id; disabled when fightId falsy. */
export function useFight(fightId: number) {
  return useQuery({
    queryKey: ['fights', fightId],
    queryFn: () => fightsDb.getFightById(fightId),
    enabled: !!fightId,
  });
}

/** Create/upsert fight (sends notif); invalidates ['fights']. */
export function useCreateFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fightsDb.createFight,
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
    },
  });
}

/** Update fight (args: { fightId, fight, isWinUpdate? }); invalidates ['fights']. */
export function useUpdateFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fightId, fight }: { fightId: number; fight: Partial<fightsDb.Fight>; isWinUpdate?: boolean }) =>
      fightsDb.updateFight(fightId, fight),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
    },
  });
}

/** Delete fight by id; invalidates ['fights']. */
export function useDeleteFight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: fightsDb.deleteFight,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fights'] });
    },
  });
}
