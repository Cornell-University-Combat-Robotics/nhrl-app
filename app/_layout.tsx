import { AuthProvider } from '@/src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';

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
  const notifListener = useRef<Notifications.EventSubscription>(null);
  const responseListener = useRef<Notifications.EventSubscription>(null);

  useEffect(() => {
    //root layout ALWAYS mounted (acrossapp's lifetime) -> keep notif listeners here
    //add listener for when notification is received while app is in foreground
    //User action: None required; it fires automatically when the notification arrives.
    notifListener.current = Notifications.addNotificationReceivedListener((notification) => {
      console.log('Notification received (app open):', notification);
    });

    //fires when the user taps the notification (for navigation, deep links, etc.) (even if the app was closed).
    //Purpose: Handle user interaction with a notification.
    //User action: User must tap the notification.
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log('User tapped notification:', response);
    });

    return () => {
      //runs when app closes!
      notifListener.current?.remove?.();
      responseListener.current?.remove?.();
    };
  }, []);

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
