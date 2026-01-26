import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from './store/authStore';

const Index = () => {
  const { user, profile, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user && profile) {
    if (profile.userType === 'worker') {
      return <Redirect href="/(worker)" />;
    }
    if (profile.userType === 'venue') {
      return <Redirect href="/(venue)" />;
    }
  }

  // If not logged in, or if there's no profile, redirect to login
  return <Redirect href="/(auth)/login" />;
};

export default Index;
