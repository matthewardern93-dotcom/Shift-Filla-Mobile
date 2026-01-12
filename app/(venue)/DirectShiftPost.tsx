
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors } from '../../constants/colors';
import { Briefcase, MapPin, Calendar as CalendarIcon, Clock } from 'lucide-react-native';
import { format, differenceInMinutes, parseISO } from 'date-fns';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { auth, db } from '../../services/firebase';
import functions from '@react-native-firebase/functions';
import firestore from '@react-native-firebase/firestore';
import { CustomPicker } from '../../components/CustomPicker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { Calendar, DateData } from 'react-native-calendars';
import { WorkerProfile, VenueProfile, Shift } from '../../types';
import { Image } from 'expo-image';
import { skillsList } from '../../constants/Skills';

const shiftSchema = z.object({
  role: z.string().min(1, 'Role is required'),
  location: z.string(),
  singleDate: z.date(),
  singleStartTime: z.string(),
  singleEndTime: z.string(),
  singleBreak: z.number().min(0),
  payRate: z.number().min(1, 'Pay rate must be greater than 0'),
});

type ShiftFormData = z.infer<typeof shiftSchema>;

const FormField = ({ label, icon, children, error }: { label: string, icon: React.ReactNode, children: React.ReactNode, error: any }) => (
    <View style={styles.fieldContainer}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.inputContainer, error && styles.inputError]}>
            {icon}
            <View style={styles.inputWrapper}>{children}</View>
        </View>
        {error && <Text style={styles.errorText}>{error.message}</Text>}
    </View>
);

const WorkerInfoCard = ({ name, profilePictureUrl }: { name: string, profilePictureUrl?: string }) => (
    <View style={styles.workerCard}>
        <Image source={{ uri: profilePictureUrl }} style={styles.workerAvatar} />
        <Text style={styles.workerName}>{name}</Text>
    </View>
);

const ShiftCostSummary = ({ details }: { details: { totalHours: number, cost: number, platformFee: number, total: number } }) => (
    <View style={styles.costSummaryContainer}>
        <Text style={styles.summaryTitle}>Shift Cost</Text>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Hours:</Text>
            <Text style={styles.summaryValue}>{details.totalHours.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Cost:</Text>
            <Text style={styles.summaryValue}>${details.cost.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Platform Fee:</Text>
            <Text style={styles.summaryValue}>${details.platformFee.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryTotal}>
            <Text style={styles.summaryTotalLabel}>Total:</Text>
            <Text style={styles.summaryTotalValue}>${details.total.toFixed(2)}</Text>
        </View>
    </View>
);

const DirectShiftPostScreen = () => {
  const router = useRouter();
  const { workerId } = useLocalSearchParams();
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | 'datetime'>('time');
  const [currentPicker, setCurrentPicker] = useState<keyof ShiftFormData | null>(null);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm<ShiftFormData>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
        role: '',
        location: '',
        singleDate: new Date(),
        singleStartTime: '09:00',
        singleEndTime: '17:00',
        singleBreak: 0,
        payRate: 25,
    },
  });

  useEffect(() => {
    const venueId = auth.currentUser?.uid;
    
    async function fetchInitialData() {
        if (venueId) {
            const venueRef = db.collection("venues").doc(venueId);
            const venueSnap = await venueRef.get();
            if (venueSnap.exists) {
                const venueData = venueSnap.data() as VenueProfile;
                setValue('location', venueData.address as string);
            }
        }
        if (typeof workerId === 'string') {
            const workerRef = db.collection("workers").doc(workerId);
            const workerSnap = await workerRef.get();
            if (workerSnap.exists) {
                setWorker(workerSnap.data() as WorkerProfile);
            }
        }
        setIsLoading(false);
    }

    fetchInitialData();
}, [workerId, setValue]);

  const watchFields = watch(['singleDate', 'singleStartTime', 'singleEndTime', 'singleBreak', 'payRate']);

  const costDetails = useMemo(() => {
    const [date, startTime, endTime, breakMinutes, payRate] = watchFields;
    const start = parseISO(`${format(date, 'yyyy-MM-dd')}T${startTime}`);
    const end = parseISO(`${format(date, 'yyyy-MM-dd')}T${endTime}`);
    const totalMinutes = differenceInMinutes(end, start) - breakMinutes;
    const totalHours = totalMinutes > 0 ? totalMinutes / 60 : 0;
    const cost = totalHours * payRate;
    const platformFee = cost * 0.10; // 10% platform fee
    const total = cost + platformFee;
    return { totalHours, cost, platformFee, total };
  }, [watchFields]);

  const showPicker = (picker: keyof ShiftFormData) => {
    setCurrentPicker(picker);
    setPickerMode(picker.includes('Date') ? 'date' : 'time');
    setPickerVisible(true);
  };

  const handleConfirm = (selectedDate: Date) => {
    setPickerVisible(false);
    if (currentPicker && selectedDate) {
      if (pickerMode === 'date') {
        setValue(currentPicker as any, selectedDate);
      }
       else {
        setValue(currentPicker as any, format(selectedDate, 'HH:mm'));
      }
    }
  };

  const onDayPress = (day: DateData) => {
    setValue('singleDate', new Date(day.timestamp));
    setCalendarModalVisible(false);
  };

  const onSubmit = async (data: ShiftFormData) => {
    const venueId = auth.currentUser?.uid;
    if (!venueId || typeof workerId !== 'string') {
      Alert.alert('Error', 'Authentication or worker information is missing.');
      return;
    }
    setIsSubmitting(true);
    try {
        const manageShifts = functions().httpsCallable('manageShifts');
        const shiftDetails: Partial<Shift> = {
            role: data.role,
            location: data.location,
            startTime: firestore.Timestamp.fromDate(new Date(`${format(data.singleDate, 'yyyy-MM-dd')}T${data.singleStartTime}`)),
            endTime: firestore.Timestamp.fromDate(new Date(`${format(data.singleDate, 'yyyy-MM-dd')}T${data.singleEndTime}`)),
            pay: data.payRate,
            breakDuration: data.singleBreak,
            status: 'offered_to_worker',
            businessId: venueId,
            workerId: workerId,
        };

        await manageShifts({ action: 'directOffer', workerId, shiftDetails });
        Alert.alert('Success', 'Shift offer has been sent directly to the worker.');
        router.push('/(venue)');
    } catch (error) {
        console.error("Error creating direct shift:", error);
        Alert.alert('Error', 'There was an issue sending the shift offer. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }
  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Direct Shift Offer</Text>
            {worker && <WorkerInfoCard name={worker.firstName} profilePictureUrl={worker.profilePictureUrl} />}
            <Text style={styles.subtitle}>Fill out the details below for the shift offer.</Text>
            <View style={styles.section}>
              <FormField label="Role" icon={<Briefcase size={20} color={Colors.gray} />} error={errors.role}><Controller name="role" control={control} render={({ field: { onChange, value } }) => (<CustomPicker placeholder="Select a role" options={skillsList.map(s => ({ label: s.label, value: s.id }))} selectedValue={value} onValueChange={onChange} />)} /></FormField>
              <FormField label="Location" icon={<MapPin size={20} color={Colors.gray} />} error={errors.location}><TextInput style={styles.textInput} value={getValues('location')} editable={false} /></FormField>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shift Details</Text>
              <Controller control={control} name='singleDate' render={({ field: { value }}) => (<TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={styles.fullWidth}><FormField label="Date" icon={<CalendarIcon size={20} color={Colors.gray} />} error={errors.singleDate}><Text style={[styles.textInput, !value && styles.placeholderText]}>{value ? format(value, 'PPP') : 'Select a date'}</Text></FormField></TouchableOpacity>)}/>
              <View style={styles.timePayGrid}>
                <Controller control={control} name='singleStartTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('singleStartTime' as any)} style={styles.gridItem}><FormField label="Start Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleStartTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                <Controller control={control} name='singleEndTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('singleEndTime' as any)} style={styles.gridItem}><FormField label="End Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleEndTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                <Controller control={control} name='singleBreak' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Unpaid Break" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleBreak}><TextInput style={styles.textInput} keyboardType="number-pad" value={String(value)} onChangeText={(val) => onChange(Number(val) || 0)} /><Text style={styles.units}>min</Text></FormField></View>)} />
                <Controller control={control} name='payRate' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Pay Rate" icon={<Text style={styles.currencySymbol}>$</Text>} error={errors.payRate}><TextInput style={styles.textInput} keyboardType="decimal-pad" value={String(value)} onChangeText={(val) => onChange(Number(val) || 0)} /><Text style={styles.units}>/hr</Text></FormField></View>)} />
              </View>
            </View>
            {(costDetails.totalHours > 0) && <View style={styles.section}><ShiftCostSummary details={costDetails} /></View>}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitButtonText}>Send Direct Offer</Text>}
            </TouchableOpacity>
        </ScrollView>
        <DateTimePickerModal isVisible={isPickerVisible} mode={pickerMode} onConfirm={handleConfirm} onCancel={() => setPickerVisible(false)} />
        {calendarModalVisible && <View style={styles.modalBackdrop}><View style={styles.calendarContainer}><Calendar onDayPress={onDayPress} minDate={format(new Date(), 'yyyy-MM-dd')} /></View></View>}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.lightGray },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContainer: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, marginBottom: 10 },
  subtitle: { fontSize: 16, color: Colors.darkGray, marginBottom: 20 },
  section: { backgroundColor: Colors.white, borderRadius: 10, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  fieldContainer: { marginBottom: 15 },
  label: { fontSize: 14, color: Colors.darkGray, marginBottom: 5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.gray, borderRadius: 8, paddingHorizontal: 10 },
  inputWrapper: { flex: 1 },
  inputError: { borderColor: Colors.danger },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  textInput: { height: 40, fontSize: 16, color: Colors.text, flex: 1 },
  placeholderText: { color: Colors.gray },
  timePayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 15 },
  units: { position: 'absolute', right: 10, top: 10, color: Colors.gray },
  currencySymbol: { fontSize: 18, color: Colors.gray, marginRight: 5 },
  fullWidth: { width: '100%' },
  submitButton: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  modalBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  calendarContainer: { backgroundColor: 'white', borderRadius: 10, padding: 10, width: '90%' },
  workerCard: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: Colors.secondary, borderRadius: 8, marginBottom: 10 },
  workerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  workerName: { fontSize: 18, fontWeight: 'bold', color: Colors.primary },
  costSummaryContainer: { padding: 15, backgroundColor: Colors.lightGray, borderRadius: 8 },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  summaryLabel: { color: Colors.darkGray },
  summaryValue: { fontWeight: 'bold' },
  summaryTotal: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderColor: Colors.gray },
  summaryTotalLabel: { fontWeight: 'bold', fontSize: 16 },
  summaryTotalValue: { fontWeight: 'bold', fontSize: 18, color: Colors.primary },
});

export default DirectShiftPostScreen;
