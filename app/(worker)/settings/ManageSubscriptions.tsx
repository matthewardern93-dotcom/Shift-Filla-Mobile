import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';

const ManageSubscriptionsScreen = () => {
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Manage Subscriptions' }} />
            <Text style={styles.text}>Manage Subscriptions Screen</Text>
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
    },
});

export default ManageSubscriptionsScreen;
