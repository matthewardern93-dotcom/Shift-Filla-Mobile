
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';

const PendingScreen = () => {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.icon}>✉️</Text>
        <Text style={styles.title}>Hold tight!</Text>
        <Text style={styles.description}>Thank you for registering with Shift Filla.</Text>
        <View style={styles.content}>
          <Text style={styles.paragraph}>We are now verifying your Account and Skills. This can take up to 24hrs.</Text>
          <Text style={styles.paragraph}>You will receive an email notification once your account has been activated.</Text>
        </View>
        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
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
    width: '100%',
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.dark,
    textAlign: 'center',
    marginBottom: 8,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PendingScreen;
