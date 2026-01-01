import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../../constants/colors';
import WorkerViewVenueReviewsModal from '../../../components/WorkerViewVenueReviewsModal';

const mockShift = {
    id: 'mock-shift-123',
    role: 'Bartender',
    venue: { name: 'The Gilded Glass' },
    startTime: new Date().toISOString(),
    endTime: new Date(new Date().getTime() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
    payRate: 25,
};

const LegalScreen = () => {
    const [isModalVisible, setModalVisible] = useState(false);
    const router = useRouter();

    const handleOpenModal = () => setModalVisible(true);
    const handleCloseModal = () => setModalVisible(false);

    const handleSubmitReview = (review) => {
        console.log('Submitted Review:', review);
        Alert.alert('Review Submitted', `Rating: ${review.rating}\nComment: ${review.comment}`);
    };
    
    const navigateToVenue = () => {
        router.push('/(venue)');
    };

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Legal' }} />
            <Text style={styles.text}>Legal Screen</Text>
            
            <TouchableOpacity style={styles.button} onPress={handleOpenModal}>
                <Text style={styles.buttonText}>Test Review Modal</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={navigateToVenue}>
                <Text style={styles.buttonText}>Go to Venue Dashboard</Text>
            </TouchableOpacity>

            <WorkerViewVenueReviewsModal 
                visible={isModalVisible} 
                onClose={handleCloseModal}
                shift={mockShift}
                onSubmit={handleSubmitReview}
            />
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
