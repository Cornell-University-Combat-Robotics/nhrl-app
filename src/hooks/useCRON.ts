/** React Query hooks for cron (scraper schedule). Competition: '* * * * *'; off-season: '0 2 * * *'. */
import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as cronDB from '../db/cron';

/** Mutation to toggle cron schedule; invalidates ['cron'] on success. */
export function useUpdateCron(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cur_schedule: string) => cronDB.updateCron(cur_schedule),
        //side effects
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['cron']})
        },
        onError:(error) => {
            console.log("Error in updating cron", error.message)
        }
    })
}

/** Query for current cron schedule (getCron). */
export function useCron(){
  return useQuery({
        queryKey: ['cron'],
        queryFn: () => cronDB.getCron()
    })
}
