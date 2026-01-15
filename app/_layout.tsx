import { AuthProvider } from '@/src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

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
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(admin)" />
        </Stack>
      </QueryClientProvider>
    </AuthProvider>
  );
}
