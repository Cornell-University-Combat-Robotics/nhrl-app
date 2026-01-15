import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import addRobot from '../addRobot'

function useAddRobot(){
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addRobot,
        //side effects
        onSuccess: () => {
            //invalidate & refetch robot data 
            queryClient.invalidateQueries({queryKey: ['retrieveRobot']});
        },
        onError: (error) => {
            console.log("Error in adding robot", error.message)
        }
    })
}


export default useAddRobot;