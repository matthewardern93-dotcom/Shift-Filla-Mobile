import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAuthStore } from "../store/authStore";

export default function VenueLayout() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user || !profile || profile.userType !== "venue") {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="VenueProfile" />
        <Stack.Screen name="PostShift" options={{ presentation: "modal" }} />
        <Stack.Screen
          name="DirectShiftPost"
          options={{ presentation: "modal" }}
        />
        <Stack.Screen name="VenueApplicantProfile" />
      </Stack>
    </GestureHandlerRootView>
  );
}
