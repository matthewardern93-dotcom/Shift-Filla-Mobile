import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert as RNAlert } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '../store/userStore';
import { Colors } from '../../constants/colors';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const { signIn, isLoading, error } = useUserStore();

  useEffect(() => {
    if (error) {
      RNAlert.alert('Login Failed', error);
      useUserStore.setState({ error: null });
    }
  }, [error]);

  const handleLogin = async () => {
    if (!email || !password) {
      RNAlert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }
    try {
      await signIn(email, password);
    } catch {
      console.log('Component caught login failure.');
    }
  };

  const handleSignUp = () => {
    router.push('/(auth)/signup'); 
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/Briefcase (1).png')} style={styles.logo} />
      <Text style={styles.title}>Shift Filla</Text>
      
      <Text style={styles.label}>EMAIL</Text>
      <TextInput
        style={styles.input}
        placeholder="your.email@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholderTextColor={Colors.textSecondary} 
      />
      
      <Text style={styles.label}>PASSWORD</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholderTextColor={Colors.textSecondary} 
      />
      
      <TouchableOpacity onPress={handleForgotPassword}>
        <Text style={styles.forgotText}>FORGOTTEN DETAILS</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign up</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: Colors.secondary,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: 'center',
    marginBottom: 8,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: Colors.primary,
    marginBottom: 40,
  },
  label: {
    fontSize: 14,
    color: Colors.primary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    color: Colors.text,
  },
  forgotText: {
    textAlign: 'right',
    color: Colors.primary,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold'
  },
});

export default LoginScreen;
