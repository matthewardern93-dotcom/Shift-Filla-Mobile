
import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import WorkerShiftCard from '../../components/WorkerShiftCard';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Shift } from '../../types';
import { Calendar, DateData } from 'react-native-calendars';
import { format, isSameDay } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { useShiftStore } from '../store/shiftStore';

// --- Mock data has been removed --- 

const WorkerRosterScreen = () => {
    // 1. Get data from our global stores
    const { user } = useAuthStore();
    const { shifts, isLoading, fetchShiftsForWorker, cleanup } = useShiftStore();

    const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const router = useRouter();

    // 2. Fetch shifts from Firestore when the screen is focused
    useFocusEffect(
        useCallback(() => {
            if (user?.uid) {
                fetchShiftsForWorker(user.uid);
            }
            // Cleanup the listener when the screen loses focus
            return () => cleanup();
        }, [user?.uid, fetchShiftsForWorker, cleanup])
    );

    const handleShiftPress = (shift: Shift) => {
        router.push({
            pathname: '/(worker)/WorkerRosterShiftDetails',
            params: { shift: JSON.stringify(shift) }
        });
    };

    // 3. Use the live data from the store for all shift calculations
    const rosterShifts = shifts.filter(shift => shift.status === 'confirmed' || shift.status === 'completed');

    const getMarkedDates = () => {
        const marked = rosterShifts.reduce((acc: { [key: string]: any }, shift) => {
            const date = format(new Date(shift.startTime), 'yyyy-MM-dd');
            acc[date] = { ...acc[date], marked: true, dotColor: Colors.primary };
            return acc;
        }, {});

        if (selectedDate) {
            marked[selectedDate] = { 
                ...marked[selectedDate], 
                selected: true, 
                selectedColor: Colors.primary,
                disableTouchEvent: true,
                selectedTextColor: Colors.white,
            };
        }
        return marked;
    };

    const shiftsForSelectedDay = rosterShifts.filter(shift => 
        selectedDate && isSameDay(new Date(shift.startTime), new Date(selectedDate))
    );

    // 4. Show a loading indicator while shifts are being fetched
    if (isLoading) {
        return (
            <WorkerScreenTemplate>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            </WorkerScreenTemplate>
        );
    }

    return (
        <WorkerScreenTemplate>
            <View style={styles.container}>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>My Roster</Text>
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity onPress={() => setViewMode('list')} style={[styles.toggleButton, viewMode === 'list' && styles.activeButton]}>
                            <Text style={[styles.toggleButtonText, viewMode === 'list' && styles.activeButtonText]}>List</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setViewMode('calendar')} style={[styles.toggleButton, viewMode === 'calendar' && styles.activeButton]}>
                            <Text style={[styles.toggleButtonText, viewMode === 'calendar' && styles.activeButtonText]}>Calendar</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {viewMode === 'list' ? (
                    <ScrollView>
                        {rosterShifts.length > 0 ? (
                            rosterShifts.map(shift => (
                                <WorkerShiftCard 
                                    key={shift.id} 
                                    item={shift} 
                                    onPress={() => handleShiftPress(shift)}
                                    isConfirmed={shift.status === 'confirmed'}
                                />
                            ))
                        ) : (
                            <Text style={styles.noShiftsText}>You have no shifts in your roster.</Text>
                        )}
                    </ScrollView>
                ) : (
                    <ScrollView>
                        <Calendar
                            markedDates={getMarkedDates()}
                            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
                            theme={{
                                calendarBackground: Colors.background,
                                selectedDayBackgroundColor: Colors.primary,
                                selectedDayTextColor: '#ffffff',
                                todayTextColor: Colors.primary,
                                arrowColor: Colors.primary,
                                monthTextColor: Colors.text,
                                textSectionTitleColor: Colors.textSecondary,
                                dayTextColor: Colors.text,
                            }}
                        />
                        <View style={styles.shiftsForDayContainer}>
                            {selectedDate && shiftsForSelectedDay.length > 0 ? (
                                shiftsForSelectedDay.map(shift => (
                                    <WorkerShiftCard 
                                        key={shift.id} 
                                        item={shift} 
                                        onPress={() => handleShiftPress(shift)}
                                        isConfirmed
                                    />
                                ))
                            ) : selectedDate ? (
                                <Text style={styles.noShiftsText}>No shifts for this day.</Text>
                            ) : null}
                        </View>
                    </ScrollView>
                )}
            </View>
        </WorkerScreenTemplate>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 15,
        backgroundColor: Colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    header: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.text,
        fontFamily: Fonts.headline,
    },
    noShiftsText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: Colors.textSecondary,
        fontFamily: Fonts.sans,
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: Colors.lightGray,
        borderRadius: 8,
    },
    toggleButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    activeButton: {
        backgroundColor: Colors.primary,
    },
    toggleButtonText: {
        color: Colors.textSecondary,
        fontWeight: 'bold',
    },
    activeButtonText: {
        color: '#fff',
    },
    shiftsForDayContainer: {
        paddingTop: 20,
    }
});

export default WorkerRosterScreen;
