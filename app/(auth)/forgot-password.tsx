import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert as RNAlert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { resetPassword } from '../../services/auth'; 
import { Colors } from '../../constants/colors';

const ForgotPasswordScreen = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const router = useRouter();

  const handleResetPassword = async () => {
    if (!email) {
      RNAlert.alert('Email Required', 'Please enter your email address.');
      return;
    }
    setIsLoading(true);
    try {
      await resetPassword(email);
      setIsSent(true);
    } catch (error) {
      console.error('Password Reset Error:', error);
      let errorMessage = 'An unexpected error occurred.';
      if ((error as { code: string }).code === 'auth/user-not-found') {
          errorMessage = 'No user found with this email address.';
      }
      RNAlert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>
      
        {isSent ? (
            <View style={styles.card}>
                <Feather name="check-circle" size={60} color={Colors.primary} />
                <Text style={styles.title}>Check Your Inbox</Text>
                <Text style={styles.message}>
                    A password reset link has been sent to <Text style={{fontWeight: 'bold'}}>{email}</Text>. Please follow the instructions in the email to reset your password.
                </Text>
                <TouchableOpacity style={styles.button} onPress={() => router.replace('/login')}>
                    <Text style={styles.buttonText}>Return to Login</Text>
                </TouchableOpacity>
            </View>
        ) : (
            <View style={styles.card}>
                <Feather name="mail" size={60} color={Colors.primary} />
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.message}>
                    No problem. Enter your email address below and we&apos;ll send you a link to reset your password.
                </Text>
                
                <TextInput
                    style={styles.input}
                    placeholder="your.email@example.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor={Colors.gray}
                />
                
                <TouchableOpacity style={styles.button} onPress={handleResetPassword} disabled={isLoading}>
                    {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.buttonText}>Send Reset Link</Text>}
                </TouchableOpacity>
            </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.secondary,
        padding: 20,
    },
    card: {
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    },
    backButton: {
        position: 'absolute',
        top: 60,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButtonText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '500',
        color: Colors.primary,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.primary,
        marginTop: 20,
        marginBottom: 16,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: Colors.gray,
        textAlign: 'center',
        marginBottom: 24,
    },
    input: {
        width: '100%',
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
        marginBottom: 20,
        color: Colors.text,
    },
    button: {
        width: '100%',
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default ForgotPasswordScreen;
