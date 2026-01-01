
import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, TextInput, SafeAreaView, Modal, FlatList, TouchableWithoutFeedback, Image } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar as CalendarIcon, Clock, DollarSign, Shirt, MapPin, Briefcase } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { VenueProfile } from '../../types';
import { skillsList } from '../../constants/Skills';
import { payRateOptions } from '../../constants/Pay-Rate';
import { getRoleRequirements } from '../../constants/Shift-Requirements';
import { format, parse, differenceInMinutes, addMinutes, combineDateAndTime } from 'date-fns';
import { CustomPicker } from '../../components/Picker';
import MultiSelect from '../../components/multi-select';
import { Calendar } from 'react-native-calendars';
import ShiftCostSummary from '../../components/ShiftCostSummary';
import { useUserStore } from '../../store/userStore'; // Import user store
import { functions } from '../../services/firebase'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import httpsCallable

const timeRegex = /^([01]?[0-9]|2[0-3]):(00|15|30|45)$/;
const timeRegexError = "Invalid time. Use HH:mm format in 15-minute intervals (e.g., 09:00, 09:15).";

const shiftSchema = z.object({
    role: z.string().min(1, "Role is required"),
    location: z.string().min(1, "Location is required"),
    singleDate: z.date(),
    singleStartTime: z.string().regex(timeRegex, timeRegexError),
    singleEndTime: z.string().regex(timeRegex, timeRegexError),
    singlePay: z.number().min(0, "Pay rate is required"),
    singleBreak: z.number().int().min(0).optional(),
    description: z.string().optional(),
    uniform: z.string().optional(),
    requirements: z.array(z.string()).optional(),
});

const generateTimeSlots = () => {
    const slots = [];
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < 96; i++) {
        slots.push(format(date, 'HH:mm'));
        date = addMinutes(date, 15);
    }
    return slots;
};

const timeSlots = generateTimeSlots();

const FormField = ({ label, icon, children, error, containerStyle }) => (
  <View style={[styles.fieldContainer, containerStyle]}>
    {label && <Text style={styles.label}>{label}</Text>}
    <View style={[styles.inputContainer, error && styles.inputError]}>
      {icon}
      {children}
    </View>
    {error && <Text style={styles.errorText}>{error.message}</Text>}
  </View>
);

const WorkerInfoCard = ({ name, profilePictureUrl }) => (
    <View style={styles.workerCard}>
        <Image source={{ uri: profilePictureUrl || 'https://via.placeholder.com/60' }} style={styles.workerImage} />
        <View>
            <Text style={styles.workerCardText}>Directly offering shift to:</Text>
            <Text style={styles.workerName}>{name || 'Worker Name'}</Text>
        </View>
    </View>
);

const DirectShiftPostScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { workerId, workerName, workerProfileUrl } = params;
  const venueProfile = useUserStore(state => state.profile) as VenueProfile;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({ visible: false, type: null });
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
        singleStartTime: '09:00',
        singleEndTime: '17:00',
        singleBreak: 30,
        singlePay: 25,
        requirements: [],
        location: venueProfile ? `${venueProfile.address}, ${venueProfile.city}`.trim() : '',
    },
  });

  const role = watch('role');
  const watchedValues = watch();

  const calculateShiftDuration = (startTime, endTime, breakMinutes) => {
      if (!startTime || !endTime || !timeRegex.test(startTime) || !timeRegex.test(endTime)) return 0;
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      let diff = (differenceInMinutes(end, start) / 60);
      if (diff < 0) diff += 24;
      const breakHours = (breakMinutes || 0) / 60;
      return Math.max(0, diff - breakHours);
  };

  const costDetails = useMemo(() => {
    const SERVICE_FEE_RATE = 0.12;
    let totalHours = 0;
    let basePay = 0;

    if(watchedValues.singleDate) {
        const hours = calculateShiftDuration(watchedValues.singleStartTime, watchedValues.singleEndTime, watchedValues.singleBreak);
        totalHours = hours;
        basePay = hours * (watchedValues.singlePay || 0);
    }

    const serviceFee = basePay * SERVICE_FEE_RATE;
    const totalCost = basePay + serviceFee;

    return { totalHours, basePay, serviceFee, totalCost };
  }, [watchedValues]);

  const onSingleDayPress = (day) => {
      setValue('singleDate', new Date(day.timestamp + (new Date().getTimezoneOffset() * 60000)));
      setCalendarModalVisible(false);
  }

  const showPicker = (type) => setPickerConfig({ visible: true, type });
  const hidePicker = () => setPickerConfig({ visible: false, type: null });

  const handleTimeSelect = (time) => {
    const { type } = pickerConfig;
    if (!type) return;
    setValue(type, time, { shouldValidate: true });
    hidePicker();
  };
  
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
        const manageShifts = httpsCallable(functions, 'manageShifts');
        
        const startTime = combineDateAndTime(data.singleDate, data.singleStartTime);
        const endTime = combineDateAndTime(data.singleDate, data.singleEndTime);

        const shiftDetails = {
            role: data.role,
            location: data.location,
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
            pay: data.singlePay,
            breakDuration: data.singleBreak,
            description: data.description,
            uniform: data.uniform,
            requirements: data.requirements,
            // Any other optional fields from your form
        };

        await manageShifts({
            action: 'directOffer',
            workerId: workerId,
            shiftDetails: shiftDetails,
        });

      Alert.alert("Shift Offer Sent", `Your shift offer has been sent to ${workerName}.`, [{ text: "OK", onPress: () => router.back() }]);
    } catch (error) {
        console.error("Error sending direct offer:", error);
        Alert.alert("Offer Failed", error.message || "An unexpected error occurred.");
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Direct Shift Offer</Text>
            
            <WorkerInfoCard name={workerName} profilePictureUrl={workerProfileUrl} />

            <Text style={styles.subtitle}>Fill out the details below for the shift offer.</Text>

            <View style={styles.section}>
              <FormField label="Role" icon={<Briefcase size={20} color={Colors.gray} />} error={errors.role}><Controller name="role" control={control} render={({ field: { onChange, value } }) => (<CustomPicker placeholder="Select a role" options={skillsList.map(s => ({ label: s.label, value: s.id }))} selectedValue={value} onValueChange={onChange} />)} /></FormField>
              <FormField label="Location" icon={<MapPin size={20} color={Colors.gray} />} error={errors.location}><TextInput style={styles.textInput} value={getValues('location')} editable={false} /></FormField>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Shift Details</Text>
              <Controller control={control} name='singleDate' render={({ field: { value }}) => (<TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={{width: '100%', marginBottom: 15}}><FormField label="Date" icon={<CalendarIcon size={20} color={Colors.gray} />} error={errors.singleDate}><Text style={[styles.textInput, !value && { color: Colors.gray }]}>{value ? format(value, 'PPP') : 'Select a date'}</Text></FormField></TouchableOpacity>)}/>
              <View style={styles.timePayGrid}>
                <Controller control={control} name='singleStartTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('singleStartTime')} style={styles.gridItem}><FormField label="Start Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleStartTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                <Controller control={control} name='singleEndTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('singleEndTime')} style={styles.gridItem}><FormField label="End Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleEndTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                <Controller control={control} name='singleBreak' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Unpaid Break" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleBreak}><TextInput style={styles.textInput} keyboardType="number-pad" value={String(value)} onChangeText={(val) => onChange(Number(val) || 0)} /><Text style={styles.units}>min</Text></FormField></View>)} />
                <Controller control={control} name='singlePay' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Pay per hour" icon={<DollarSign size={20} color={Colors.gray} />} error={errors.singlePay}><CustomPicker placeholder="Rate" options={payRateOptions} selectedValue={value} onValueChange={onChange} /></FormField></View>)} />
              </View>
            </View>
            
            {(costDetails.totalHours > 0) && <View style={styles.section}><ShiftCostSummary details={costDetails} /></View>}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <FormField label="Job Description" error={errors.description} containerStyle={{marginBottom: 0}}><Controller name="description" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={[styles.textInput, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value} multiline placeholder="e.g., Key responsibilities..." />)} /></FormField>
              <FormField label="Uniform" icon={<Shirt size={20} color={Colors.gray} />} error={errors.uniform}><Controller name="uniform" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.textInput} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="e.g., Black shirt, black pants" />)} /></FormField>
              <FormField label="Requirements" error={errors.requirements} containerStyle={{marginBottom: 0}}><Controller name="requirements" control={control} render={({ field: { onChange, value } }) => (<MultiSelect options={getRoleRequirements(role, venueProfile?.posSystem)} selected={value} onChange={onChange} placeholder="Select requirements..."/>)} /></FormField>
            </View>

            <TouchableOpacity style={styles.publishButton} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Send Direct Offer</Text>}
            </TouchableOpacity>
        </ScrollView>

        <Modal transparent={true} visible={calendarModalVisible} animationType="fade" onRequestClose={() => setCalendarModalVisible(false)}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={() => setCalendarModalVisible(false)}>
                <View style={styles.calendarModalContent}>
                    <Calendar onDayPress={onSingleDayPress} minDate={format(new Date(), 'yyyy-MM-dd')} theme={{ todayTextColor: Colors.primary, arrowColor: Colors.primary, selectedDayBackgroundColor: Colors.primary, selectedDayTextColor: '#ffffff' }}/>
                </View>
            </TouchableOpacity>
        </Modal>

        <Modal transparent={true} visible={pickerConfig.visible} animationType="fade" onRequestClose={hidePicker}>
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPressOut={hidePicker}>
                <TouchableWithoutFeedback>
                    <View style={styles.timePickerModalContent}>
                        <FlatList data={timeSlots} keyExtractor={(item) => item} renderItem={({ item }) => (<TouchableOpacity style={styles.timeSlot} onPress={() => handleTimeSelect(item)}><Text style={styles.timeSlotText}>{item}</Text></TouchableOpacity>)} />
                    </View>
                </TouchableWithoutFeedback>
            </TouchableOpacity>
        </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9FB' },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, marginBottom: 4, marginTop: 20 },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  fieldContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'transparent', minHeight: 48 },
  inputError: { borderColor: Colors.danger },
  textInput: { flex: 1, fontSize: 16, color: Colors.text, marginLeft: 10 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  units: { color: Colors.gray, marginRight: 5, fontSize: 14 },
  timePayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%’, marginBottom: 15 },
  publishButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  publishButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  calendarModalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  timePickerModalContent: { backgroundColor: 'white', borderRadius: 12, padding: 15, width: '80%', maxHeight: '60%' },
  timeSlot: { paddingVertical: 15, alignItems: 'center' },
  timeSlotText: { fontSize: 18, color: Colors.primary },
  workerCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: Colors.primary },
  workerImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  workerCardText: { fontSize: 14, color: Colors.textSecondary },
  workerName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
});

export default DirectShiftPostScreen;
