import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';

const Index = () => {
  const { user, profile, isLoading } = useAuth();

  if (isLoading) {
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
