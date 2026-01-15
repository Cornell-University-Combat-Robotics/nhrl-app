import { useQuery, useMutation, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import retrieveRobot from '../retrieveRobot'

function useRetrieveRobot(){
    return useQuery({
        queryKey: ['retrieveRobot'],
        queryFn: retrieveRobot
        //optional: staleTime -- default alr set in _layout.tsx
    })
}

export default useRetrieveRobot;