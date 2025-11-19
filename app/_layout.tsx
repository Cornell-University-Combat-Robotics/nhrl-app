import { Stack } from 'expo-router';

/** Controls layout of all files in this level of the project (aka. root as app) */
export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
