import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as cronDB from '../db/cron';

//note: cron is a boolean! if true == running, false == off season
export function useUpdateCron(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (cur: boolean) => cronDB.updateCron(cur),
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
