
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { Stack } from 'expo-router';
import { Colors } from '../../../constants/colors';
import WorkerScreenTemplate from '../../../components/templates/WorkerScreenTemplate';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AVAILABILITY_STORAGE_KEY = '@workerAvailability';

const AvailabilityScreen = () => {
  const [markedDates, setMarkedDates] = useState({});

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const savedAvailability = await AsyncStorage.getItem(AVAILABILITY_STORAGE_KEY);
        if (savedAvailability !== null) {
          setMarkedDates(JSON.parse(savedAvailability));
        }
      } catch (error) {
        console.error('Failed to load availability from storage', error);
      }
    };
    loadAvailability();
  }, []);

  const onDayPress = (day: DateData) => {
    const { dateString } = day;
    const currentState = markedDates[dateString];
    let newState = { ...markedDates };

    const greenMarking = { customStyles: { container: { backgroundColor: Colors.success, borderRadius: 8 }, text: { color: 'white' } } };
    const redMarking = { customStyles: { container: { backgroundColor: Colors.danger, borderRadius: 8 }, text: { color: 'white' } } };

    if (!currentState) {
      // Not marked -> Mark as Green (Available)
      newState[dateString] = greenMarking;
    } else if (currentState.customStyles.container.backgroundColor === Colors.success) {
      // Green -> Mark as Red (Not Available)
      newState[dateString] = redMarking;
    } else {
      // Red -> Unmark
      delete newState[dateString];
    }

    setMarkedDates(newState);
  };

  const resetAvailability = () => {
    setMarkedDates({});
    AsyncStorage.removeItem(AVAILABILITY_STORAGE_KEY);
    Alert.alert('Availability Reset', 'Your availability has been cleared.');
  };
  
  const saveAvailability = async () => {
    try {
      await AsyncStorage.setItem(AVAILABILITY_STORAGE_KEY, JSON.stringify(markedDates));
      Alert.alert('Availability Saved', 'Your work preferences have been updated.');
    } catch (error) {
      console.error('Failed to save availability to storage', error);
      Alert.alert('Error', 'Failed to save your availability. Please try again.');
    }
  };

  return (
    <WorkerScreenTemplate>
      <ScrollView>
          <Stack.Screen options={{
              title: 'Availability',
              headerStyle: { backgroundColor: Colors.background },
              headerTitleStyle: { color: Colors.text, fontWeight: 'bold' },
              headerShadowVisible: false,
          }} />

          <View style={styles.headerContainer}>
              <Text style={styles.subtitle}>Tap a day to mark yourself as available (green) or unavailable (red).</Text>
          </View>

          <Calendar
              current={format(new Date(), 'yyyy-MM-dd')}
              onDayPress={onDayPress}
              markedDates={markedDates}
              markingType={'custom'}
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
              style={styles.calendar}
          />
          
          <View style={styles.legendContainer}>
              <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: Colors.success }]} />
                  <Text style={styles.legendText}>Available</Text>
              </View>
              <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { backgroundColor: Colors.danger }]} />
                  <Text style={styles.legendText}>Not Available</Text>
              </View>
              <View style={styles.legendItem}>
                  <View style={[styles.legendIndicator, { borderColor: Colors.lightGray, borderWidth: 1, backgroundColor: Colors.background }]} />
                  <Text style={styles.legendText}>No Preference</Text>
              </View>
          </View>

          <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.resetButton} onPress={resetAvailability}>
                  <Text style={styles.buttonText}>Reset</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveAvailability}>
                  <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
          </View>

      </ScrollView>
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
        alignItems: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    calendar: {
        borderRadius: 12,
        marginHorizontal: 15,
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 20,
        marginTop: 20,
    },
    legendItem: {
        alignItems: 'center',
    },
    legendIndicator: {
        width: 24,
        height: 24,
        borderRadius: 6,
        marginBottom: 8,
    },
    legendText: {
        fontSize: 14,
        color: Colors.text,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    saveButton: {
        flex: 1,
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginLeft: 10,
    },
    saveButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    resetButton: {
        flex: 1,
        backgroundColor: Colors.white,
        borderWidth: 1,
        borderColor: Colors.lightGray,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginRight: 10,
    },
    buttonText: {
        color: Colors.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default AvailabilityScreen;
