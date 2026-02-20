import { AuthProvider } from '@/src/contexts/AuthContext';
import { focusManager, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import type { AppStateStatus } from 'react-native';
import { AppState, Platform } from 'react-native';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
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

  // Wire React Native AppState to TanStack Query's focusManager
  // so refetchOnWindowFocus works on mobile (no browser window.focus event)
  useEffect(() => {
    const onAppStateChange = (status: AppStateStatus) => {
      if (Platform.OS !== 'web') {
        focusManager.setFocused(status === 'active');
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

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
