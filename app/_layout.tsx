
import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack, SplashScreen, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import StripeWrapper from '../components/StripeWrapper';

import { useFonts, PlayfairDisplay_400Regular, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Montserrat_400Regular, Montserrat_700Bold } from '@expo-google-fonts/montserrat';
import { PT_Sans_400Regular, PT_Sans_700Bold } from '@expo-google-fonts/pt-sans';
import { useUserStore } from './store/userStore';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const InitialLayout = () => {
  const { isLoggedIn, profile, isLoading } = useUserStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (isLoggedIn && !profile) {
        // This is a temporary state while the profile is loading. 
        // You might want to show a loading spinner here.
        return;
    }

    if (isLoggedIn && profile) {
        const homeRoute = profile.userType === 'venue' ? '/venue' : '/worker';
        router.replace(homeRoute);
    } else if (!isLoggedIn && !inAuthGroup) {
        router.replace('/login');
    }

  }, [isLoggedIn, profile, isLoading, segments, router]);

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(venue)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(worker)" options={{ headerShown: false }} />
      <Stack.Screen name="pending" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
    Montserrat_400Regular,
    Montserrat_700Bold,
    PT_Sans_400Regular,
    PT_Sans_700Bold,
  });

  // Get the subscribe function from our store
  const subscribeToAuthState = useUserStore(state => state.subscribeToAuthState);

  useEffect(() => {
    // Start listening to auth changes when the app loads
    const unsubscribe = subscribeToAuthState();

    // Unsubscribe when the component unmounts
    return () => unsubscribe();
  }, [subscribeToAuthState]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Prevent rendering until the fonts have loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <StripeWrapper>
        <GestureHandlerRootView style={{ flex: 1 }}>
            <InitialLayout />
            <StatusBar style="auto" />
        </GestureHandlerRootView>
    </StripeWrapper>
  );
}
