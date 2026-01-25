import { AuthProvider } from '@/src/contexts/AuthContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync } from '@/src/notifications/registerForPushNotif';

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
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>(undefined);
  const notifListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotificationsAsync().then((token: string | undefined) => {
      setExpoPushToken(token);
      if (token) console.log('Expo push token:', token); // or save elsewhere later
    });

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
      if (notifListener.current) Notifications.removeNotificationSubscription(notifListener.current);
      if (responseListener.current) Notifications.removeNotificationSubscription(responseListener.current);
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
