import { useLocalSearchParams, useRouter } from "expo-router";
import { Mail, Upload } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../store/authStore";

const PendingScreen = () => {
  const router = useRouter();
  const { fromSignup } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [hasShownAlert, setHasShownAlert] = useState(false);

  // Detect if we're still in the upload/signup process
  // If user is logged in, we're still uploading; if not, signup is complete
  const isUploading = user !== null;

  useEffect(() => {
    // Show success alert once signup is complete (user is signed out)
    if (!isUploading && fromSignup === "true" && !hasShownAlert) {
      setHasShownAlert(true);
      setTimeout(() => {
        Alert.alert(
          "Signup Successful!",
          "Your application has been submitted for review.",
        );
      }, 500);
    }
  }, [isUploading, fromSignup, hasShownAlert]);

  // Show loading state while uploading documents
  if (isUploading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
          <Upload size={48} color={Colors.primary} style={styles.icon} />
          <Text style={styles.title}>Uploading Documents...</Text>
          <Text style={styles.description}>
            Please wait while we upload your documents and create your account.
          </Text>
          <Text style={styles.paragraph}>
            This may take a few moments. Please don't close the app.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Mail size={48} color={Colors.primary} style={styles.icon} />
        <Text style={styles.title}>Hold tight!</Text>
        <Text style={styles.description}>
          Thank you for registering with Shift Filla.
        </Text>
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            We are now verifying your Account and Skills. This can take up to
            24hrs.
          </Text>
          <Text style={styles.paragraph}>
            You will receive an email notification once your account has been
            activated.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace("/(auth)/login")}
        >
          <Text style={styles.buttonText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.secondary,
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 8,
  },
  description: {
    fontSize: 18,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 16,
  },
  content: {
    marginBottom: 24,
  },
  paragraph: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: "center",
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
    fontWeight: "bold",
  },
  loader: {
    marginBottom: 16,
  },
});

export default PendingScreen;
