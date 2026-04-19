import { Stack } from 'expo-router';

export default function TabLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="indiv-robot" />
      <Stack.Screen name="about" />
      <Stack.Screen name="fights" />
    </Stack>
  );
}
