import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Alert as RNAlert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../../constants/colors";
import { useAuthStore } from "../store/authStore";

const LoginScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const router = useRouter();
  const { user, profile, signIn, error } = useAuthStore((state) => ({
    user: state.user,
    profile: state.profile,
    signIn: state.signIn,
    error: state.error,
  }));

  useEffect(() => {
    if (error) {
      RNAlert.alert("Login Failed", error);
    }
  }, [error]);

  useEffect(() => {
    if (user && profile) {
      const profileWithApproval = profile as any;
      if (profileWithApproval.approved === false) {
        router.replace("/(auth)/pending");
        return;
      }

      if (profileWithApproval.userType === "worker") {
        router.replace("/(worker)");
      } else if (profileWithApproval.userType === "venue") {
        router.replace("/(venue)");
      }
    }
  }, [user, profile, router]);

  const handleLogin = async () => {
    if (!email || !password) {
      RNAlert.alert(
        "Missing Information",
        "Please enter both email and password.",
      );
      return;
    }
    setIsSigningIn(true);
    try {
      await signIn(email, password);
      // Navigation will be handled automatically by app/index.tsx based on auth state
    } catch (error: any) {
      // Error is already handled by the store and will be shown via useEffect
      console.error("Login error:", error);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/Briefcase.png")}
        style={styles.logo}
      />
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

      <TouchableOpacity
        style={styles.button}
        onPress={handleLogin}
        disabled={isSigningIn}
      >
        {isSigningIn ? (
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
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.secondary,
  },
  logo: {
    width: 160,
    height: 160,
    alignSelf: "center",
    marginBottom: 8,
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
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
    textAlign: "right",
    color: Colors.primary,
    marginBottom: 24,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default LoginScreen;
