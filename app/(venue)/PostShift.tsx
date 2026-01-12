
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../services/firebase';
import MultiSelect from '../../components/multi-select';
import CustomDateTimePicker from '../../components/DateTimePicker';
import { skillsList } from '../../constants/Skills';
import { getRoleRequirements } from '../../constants/Shift-Requirements';
import { Venue, Shift } from '../../types';
import { Checkbox } from '../../components/checkbox';
import { Button } from 'tamagui';

const PostShiftScreen = () => {
    const { user } = useAuth();
    const [venue, setVenue] = useState<Venue | null>(null);

    const [position, setPosition] = useState<string>('');
    const [pay, setPay] = useState<string>('');
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date());
    const [startTime, setStartTime] = useState<Date>(new Date());
    const [endTime, setEndTime] = useState<Date>(new Date());
    const [breakDuration, setBreakDuration] = useState<string>('0');
    const [isPaidBreak, setIsPaidBreak] = useState<boolean>(false);
    const [skills, setSkills] = useState<string[]>([]);
    const [shiftRequirements, setShiftRequirements] = useState<string[]>([]);
    const [additionalDetails, setAdditionalDetails] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [uniform, setUniform] = useState<string>('');

    useEffect(() => {
        const fetchVenueProfile = async () => {
            if (user) {
                const querySnapshot = await db.collection('venues').where('uid', '==', user.uid).get();
                if (!querySnapshot.empty) {
                    const venueDoc = querySnapshot.docs[0];
                    setVenue({ id: venueDoc.id, ...venueDoc.data() } as Venue);
                }
            }
        };

        fetchVenueProfile();
    }, [user]);

    const getDates = (start: Date, end: Date): Date[] => {
        const dates = [];
        let currentDate = new Date(start);
        currentDate.setHours(0, 0, 0, 0); 
        const finalEndDate = new Date(end);
        finalEndDate.setHours(0, 0, 0, 0);

        while (currentDate <= finalEndDate) {
            dates.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
    };

    const onSubmit = async () => {
        if (!venue) {
            Alert.alert('Error', 'Venue profile not found.');
            return;
        }

        if (!position || !pay) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }
        setIsSubmitting(true);

        const dates = getDates(startDate, endDate);
        const shiftPromises = [];

        const baseShift: Omit<Shift, 'id' | 'startTime' | 'endTime'> = {
            businessId: venue.id,
            venueName: venue.name,
            venueLogoUrl: venue.logoUrl,
            role: position,
            pay: parseFloat(pay),
            breakDuration: parseInt(breakDuration, 10),
            isPriority: false,
            location: venue.location,
            requirements: shiftRequirements,
            notes: additionalDetails,
            uniform: uniform || undefined,
            status: 'posted',
            paymentStatus: 'pending_venue_payment',
        };

        for (const date of dates) {
            const shiftStartTime = new Date(date);
            shiftStartTime.setHours(startTime.getHours(), startTime.getMinutes());

            const shiftEndTime = new Date(date);
            shiftEndTime.setHours(endTime.getHours(), endTime.getMinutes());

            const newShift: Omit<Shift, 'id'> = {
                ...baseShift,
                startTime: shiftStartTime,
                endTime: shiftEndTime,
            };

            shiftPromises.push(db.collection('shifts').add(newShift));
        }

        try {
            await Promise.all(shiftPromises);
            Alert.alert('Success', 'Shifts posted successfully!');
            router.push('/(venue)');
        } catch (error) {
            console.error('Error posting shifts:', error);
            Alert.alert('Error', 'There was an error posting the shifts.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.header}>Post a New Shift</Text>

            <TextInput
                placeholder="Position (e.g., Bartender, Waiter)"
                value={position}
                onChangeText={setPosition}
                style={styles.input}
            />

            <TextInput
                placeholder="Pay per hour"
                value={pay}
                onChangeText={setPay}
                keyboardType="numeric"
                style={styles.input}
            />
            
            <View style={{ zIndex: 3000, marginBottom: 15 }}>
                <MultiSelect
                    options={skillsList.map(skill => ({ label: skill.label, value: skill.id }))}
                    selected={skills}
                    onChange={(selected) => setSkills(selected)}
                    placeholder="Select required skills"
                />
            </View>
            
            <View style={{ zIndex: 2000, marginBottom: 15 }}>
                <MultiSelect
                    options={getRoleRequirements(position.toLowerCase())}
                    selected={shiftRequirements}
                    onChange={(selected) => setShiftRequirements(selected)}
                    placeholder="Select shift requirements"
                />
            </View>

            <Text style={styles.label}>Start Date</Text>
            <CustomDateTimePicker
                value={startDate}
                onChange={setStartDate}
                placeholder="Select Start Date"
            />

            <Text style={styles.label}>End Date</Text>
            <CustomDateTimePicker
                value={endDate}
                onChange={setEndDate}
                placeholder="Select End Date"
            />

            <Text style={styles.label}>Start Time</Text>
            <CustomDateTimePicker
                value={startTime}
                onChange={setStartTime}
                placeholder="Select Start Time"
            />

            <Text style={styles.label}>End Time</Text>
            <CustomDateTimePicker
                value={endTime}
                onChange={setEndTime}
                placeholder="Select End Time"
            />


            <TextInput
                placeholder="Break duration (minutes)"
                value={breakDuration}
                onChangeText={setBreakDuration}
                keyboardType="numeric"
                style={styles.input}
            />

            <TouchableOpacity onPress={() => setIsPaidBreak(!isPaidBreak)} style={styles.checkboxContainer}>
                <Checkbox checked={isPaidBreak} />
                <Text style={styles.checkboxLabel}>Paid Break</Text>
            </TouchableOpacity>
            
            <TextInput
                placeholder="Uniform (optional, overrides venue default)"
                value={uniform}
                onChangeText={setUniform}
                style={styles.input}
            />

            <TextInput
                placeholder="Additional Details"
                value={additionalDetails}
                onChangeText={setAdditionalDetails}
                multiline
                numberOfLines={4}
                style={[styles.input, styles.textArea]}
            />


            <Button onPress={onSubmit} disabled={isSubmitting} style={styles.button}>
                {isSubmitting ? 'Posting...' : 'Post Shifts'}
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
    },
    input: {
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top'
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    checkboxLabel: {
        marginLeft: 8,
        fontSize: 16,
    },
    button: {
        marginTop: 10,
    },
});

export default PostShiftScreen;
