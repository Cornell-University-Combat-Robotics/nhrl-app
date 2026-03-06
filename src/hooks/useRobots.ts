/** React Query hooks for robots. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as robotsDb from '../db/robots';

/** All robots. */
export function useRobots() {
  return useQuery({
    queryKey: ['robots'],
    queryFn: robotsDb.getAllRobots,
  });
}

/** Single robot by id; disabled when robotId falsy. */
export function useRobot(robotId: number) {
  return useQuery({
    queryKey: ['robots', robotId],
    queryFn: () => robotsDb.getRobotById(robotId),
    enabled: !!robotId,
  });
}

/** Create robot; invalidates ['robots'] on success. */
export function useCreateRobot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: robotsDb.createRobot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] });
    },
  });
}

/** Update robot (args: { robotId, robot }); invalidates ['robots']. */
export function useUpdateRobot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ robotId, robot }: { robotId: number; robot: Partial<robotsDb.Robot> }) =>
      robotsDb.updateRobot(robotId, robot),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] });
    },
  });
}

/** Delete robot by id; invalidates ['robots']. */
export function useDeleteRobot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: robotsDb.deleteRobot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] });
    },
  });
}
