import { useRouter } from "expo-router";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "../../constants/colors";

const SignUpScreen = () => {
  const router = useRouter();

  const navigateToVenueSignUp = () => {
    router.push("/(auth)/venue-signup");
  };

  const navigateToWorkerSignUp = () => {
    router.push("/(auth)/worker-signup");
  };

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/Briefcase.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to</Text>
      <Text style={styles.title}>Shift Filla</Text>

      <Text style={styles.subtitle}>Create New Account for</Text>

      <TouchableOpacity style={styles.button} onPress={navigateToVenueSignUp}>
        <Text style={styles.buttonText}>VENUE</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={navigateToWorkerSignUp}>
        <Text style={styles.buttonText}>WORKER</Text>
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
    marginBottom: 20, // A bit more margin for better spacing
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    color: Colors.primary,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 20,
    textAlign: "center",
    color: Colors.primary,
    marginTop: 40,
    marginBottom: 20,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 18, // Increased padding for bigger buttons
    alignItems: "center",
    marginBottom: 16,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 18, // Increased font size
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default SignUpScreen;
