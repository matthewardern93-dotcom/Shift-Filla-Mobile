import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Shift } from '../../types';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import ShiftCard from '../../components/ShiftCard'; 
import { addHours, addDays } from 'date-fns';


const baseTime = new Date();

const mockShifts: Shift[] = [
  {
    id: 'shift-1',
    venueId: 'venue1',
    venueName: 'The Local Pub',
    role: 'Expert Mixologist',
    startTime: addHours(baseTime, 2),
    endTime: addHours(baseTime, 8),
    payRate: 35,
    status: 'posted',
    applicantCount: 3, 
    requiredSkills: ['bartending', 'pos_systems'],
    location: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
  },
  {
    id: 'shift-2',
    venueId: 'venue1',
    venueName: 'The Local Pub',
    role: 'Barback',
    startTime: addHours(addDays(baseTime, 1), 4),
    endTime: addHours(addDays(baseTime, 1), 10),
    payRate: 20,
    status: 'posted',
    applicantCount: 5, 
    requiredSkills: ['waiting_staff', 'customer_service'],
    location: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
  },
    {
    id: 'shift-3',
    venueId: 'venue1',
    venueName: 'The Local Pub',
    role: 'Waiter',
    startTime: addHours(addDays(baseTime, 1), 4),
    endTime: addHours(addDays(baseTime, 1), 10),
    payRate: 20,
    status: 'offered',
    applicantCount: 5, 
    requiredSkills: ['waiting_staff', 'customer_service'],
    location: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' },
  },
];

const VenuePendingShiftsScreen = () => {
    const router = useRouter();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        setTimeout(() => {
            const pendingShifts = mockShifts.filter(s => s.status === 'posted' || s.status === 'offered');
            setShifts(pendingShifts);
            setIsLoading(false);
        }, 500);
    }, []);

    const handleShiftPress = (shift: Shift) => {
        if (shift.status === 'posted' && shift.applicantCount > 0) {
            router.push({ pathname: '/(venue)/VenueShiftApplicants', params: { shiftId: shift.id } });
        } else {
            // Maybe show a message that there are no applicants yet or it's already offered
            console.log(`Shift status: ${shift.status}, Applicants: ${shift.applicantCount}`);
        }
    };

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />;
        }
        if (shifts.length === 0) {
            return (
                <View style={styles.placeholder}>
                    <Text style={styles.placeholderText}>You have no pending shifts.</Text>
                    <Text style={styles.placeholderSubText}>Create a new shift to get started.</Text>
                </View>
            );
        }
        return (
            <FlatList
                data={shifts}
                keyExtractor={(item) => item.id!}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleShiftPress(item)}>
                        <ShiftCard shift={item} />
                    </TouchableOpacity>
                )}
                contentContainerStyle={styles.listContainer}
            />
        );
    };

    return (
        <VenueScreenTemplate>
            <Stack.Screen 
                options={{
                    title: 'Pending Shifts', 
                    headerBackTitle: 'Roster',
                    headerShadowVisible: false
                }}
            />
            {renderContent()}
        </VenueScreenTemplate>
    );
};

const styles = StyleSheet.create({
    listContainer: {
        padding: 10,
    },
    placeholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        marginTop: -50, // Adjust to center vertically in the template
    },
    placeholderText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 8,
    },
    placeholderSubText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
});

export default VenuePendingShiftsScreen;
