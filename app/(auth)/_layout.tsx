import { useAuth } from '@/src/contexts/AuthContext';
import { Redirect, Stack } from 'expo-router';

/**
 * Auth layout (login/signup). Stack navigator with dark header.
 * Redirects to (tabs) if user already has an active session.
 */
export default function AuthLayout() {
  const { loading, session } = useAuth();

  if (!loading && session) {
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
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="signup" options={{ title: 'Sign Up' }} />
    </Stack>
  );
}
