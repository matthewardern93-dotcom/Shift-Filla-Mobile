import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function VenueLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="VenueProfile" />
        <Stack.Screen name="PostShift" options={{ presentation: 'modal' }} />
        <Stack.Screen name="DirectShiftPost" options={{ presentation: 'modal' }} />
        <Stack.Screen name="VenueApplicantProfile" />
      </Stack>
    </GestureHandlerRootView>
  );
}
