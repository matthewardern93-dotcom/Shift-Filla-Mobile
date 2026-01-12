import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';

const LegalScreen = () => {
    const router = useRouter();

    const navigateToVenue = () => {
        router.push('/(venue)');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Legal' }} />
            <Text style={styles.text}>Legal Screen</Text>

            <TouchableOpacity style={styles.button} onPress={navigateToVenue}>
                <Text style={styles.buttonText}>Go to Venue Dashboard</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
    text: {
        fontSize: 20,
        color: Colors.text,
        marginBottom: 20,
    },
    button: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 10,
        marginBottom: 15,
        width: '80%',
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default LegalScreen;
