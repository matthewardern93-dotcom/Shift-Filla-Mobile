import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "../store/authStore";

export default function WorkerLayout() {
  const { user, profile, isLoading, isInitialized } = useAuthStore();

  if (!isInitialized || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user || !profile || profile.userType !== "worker") {
    return <Redirect href="/(auth)/login" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
