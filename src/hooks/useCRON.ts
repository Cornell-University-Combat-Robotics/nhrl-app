import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as cronDB from '../db/cron';

//note: cron is the cron_schedule: controls how often the scrape runs
/*
during competition season: '* * * * *'
off-season: '0 2 * * *' (default: every day at 02:00)
*/
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

export function useCron(){
    return useQuery({
        queryKey: ['cron'],
        queryFn: () => cronDB.getCron()
    })
}
