import { Stack } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000,  // garbage collection
      retry: 1,
      refetchOnWindowFocus: true, //window refreshes
      refetchOnReconnect: true //network reconnects
    },
    mutations: {
      retry: 1,
    },
  },
});

/** Controls layout of all files in this level of the project (aka. root as app) */
export default function RootLayout() {
  return (
    //wrap in QueryClientProvider for a GLOBAL storage location to store cached data, track loading states, or manage refetches.
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </QueryClientProvider>
  );
}
