import { useAuth } from '@/src/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

/**
 * Admin layout. Stack navigator for dashboard and CRUD screens
 * (robots, builders, fights, subteams).
 * Guards: redirects to (auth)/login if not authenticated, to (tabs) if not admin.
 * Shows spinner while loading.
 */
export default function AdminLayout() {
  const { loading, isAdmin, session } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#25292e' }}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!isAdmin) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#25292e',
        },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Admin Dashboard' }} />
      <Stack.Screen name="robots" options={{ title: 'Robots' }} />
      <Stack.Screen name="builders" options={{ title: 'Builders' }} />
      <Stack.Screen name="fights" options={{ title: 'Fights' }} />
      <Stack.Screen name="subteams" options={{ title: 'Subteams' }} />
      <Stack.Screen name="notification-form" options={{ title: 'Notifications' }} />
      <Stack.Screen name="robot-form" options={{ title: 'Add/Edit Robot' }} />
      <Stack.Screen name="builder-form" options={{ title: 'Add/Edit Builder' }} />
      <Stack.Screen name="fight-form" options={{ title: 'Add/Edit Fight' }} />
      <Stack.Screen name="subteam-form" options={{ title: 'Add/Edit Subteam' }} />
      <Stack.Screen name="livestream-links" options={{ title: 'Add Livestream Links' }} />
    </Stack>
  );
}
