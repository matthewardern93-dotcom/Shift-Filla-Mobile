import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Shift } from '../../types';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import ShiftCard from '../../components/ShiftCard'; 
import { auth, db } from '../../services/firebase';

const VenuePendingShiftsScreen = () => {
    const router = useRouter();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const shiftsRef = db.collection('shifts');
                    const q = shiftsRef.where("businessId", "==", user.uid).where("status", "in", ["posted", "offered_to_worker"]);
                    
                    const querySnapshot = await q.get();
                    const pendingShifts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Shift[];
                    
                    setShifts(pendingShifts);
                } catch (error) {
                    console.error("Failed to fetch shifts: ", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleShiftPress = (shift: Shift) => {
        if (shift.status === 'posted' && (shift.applicationCount ?? 0) > 0) {
            router.push({ pathname: '/(venue)/VenueShiftApplicants', params: { shiftId: shift.id } });
        } else {
            // Maybe show a message that there are no applicants yet or it's already offered
            console.log(`Shift status: ${shift.status}, Applicants: ${shift.applicationCount}`);
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
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleShiftPress(item)}>
                        <ShiftCard {...{shift: item} as any} />
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
