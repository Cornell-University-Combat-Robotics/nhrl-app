import { Stack } from 'expo-router';

/*
  2 different types of routing used in this app:

  1) Pager (react-native-pager-view) — app/(tabs)/index.tsx
     - Horizontal swipe between the top-level sections (Home, Robots, …).
     - Pure UI state: the current page is a `useState` number, not a URL.
     - No history stack, no deep linking, no back button behavior.
     - Good for sibling views that the user should "glance between" quickly.

  2) Expo Router Stack — this file (app/(tabs)/_layout.tsx)
     - Declares routed screens (index, indiv-robot, fights, about, …).
     - Each screen has its own URL, history entry, and navigation params.
     - Used for drill-downs like tapping a RobotCard -> /indiv-robot?robot_id=…
     - Supports back navigation, deep links, and passing params via the URL.

  How they fit together:
     - The Stack's `index` screen renders the PagerView (main swipe shell).
     - Detail/secondary screens (e.g. indiv-robot) live as separate Stack
       screens so we can navigate to them with router.push and read params
       via useLocalSearchParams.
     - Rule of thumb: use the pager for parallel "top-level" views, and
       use the Stack for anything that needs a URL, params, or back stack.
*/

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
