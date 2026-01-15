import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as robotsDb from '../db/robots';

export function useRobots() {
  return useQuery({
    queryKey: ['robots'],
    queryFn: robotsDb.getAllRobots,
  });
}

export function useRobot(robotId: number) {
  return useQuery({
    queryKey: ['robots', robotId],
    queryFn: () => robotsDb.getRobotById(robotId),
    enabled: !!robotId,
  });
}

export function useCreateRobot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: robotsDb.createRobot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] });
    },
  });
}

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

export function useDeleteRobot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: robotsDb.deleteRobot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['robots'] });
    },
  });
}
