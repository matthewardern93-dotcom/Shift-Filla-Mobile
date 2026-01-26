import { SplashScreen, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-gesture-handler";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import StripeWrapper from "../components/StripeWrapper.native";

import {
  Montserrat_400Regular,
  Montserrat_700Bold,
} from "@expo-google-fonts/montserrat";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
  useFonts,
} from "@expo-google-fonts/playfair-display";
import { PTSans_400Regular, PTSans_700Bold } from "@expo-google-fonts/pt-sans";
import { useAuthStore } from "./store/authStore";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

function InitialLayout() {
  const { isInitialized, initialize } = useAuthStore();
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    PTSans_400Regular,
    PTSans_700Bold,
  });

  useEffect(() => {
    initialize();
  }, []);

  useEffect(() => {
    if ((fontsLoaded || fontError) && isInitialized) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isInitialized]);

  if (!fontsLoaded || fontError || !isInitialized) {
    return null;
  }

  return (
    <StripeWrapper>
      <SafeAreaView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(venue)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(worker)" options={{ headerShown: false }} />
            <Stack.Screen
              name="pending"
              options={{ headerShown: false, presentation: "fullScreenModal" }}
            />
            <Stack.Screen name="modal" options={{ presentation: "modal" }} />
          </Stack>
          <StatusBar style="auto" />
        </GestureHandlerRootView>
      </SafeAreaView>
    </StripeWrapper>
  );
}

export default function RootLayout() {
  return <InitialLayout />;
}
