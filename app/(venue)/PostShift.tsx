import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, TextInput, SafeAreaView, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'expo-router';
import { Calendar as CalendarIcon, Clock, DollarSign, Shirt, MapPin, Briefcase } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { VenueProfile } from '../../types';
import { skillsList } from '../../constants/Skills';
import { payRateOptions } from '../../constants/Pay-Rate';
import { getRoleRequirements } from '../../constants/Shift-Requirements';
import { format, parse, differenceInHours, differenceInMinutes, addMinutes } from 'date-fns';
import { CustomPicker } from '../../components/Picker';
import MultiSelect from '../../components/multi-select';
import { Calendar } from 'react-native-calendars';
import ShiftCostSummary from '../../components/ShiftCostSummary';

const IS_VISUAL_TESTING_MODE = true;
const timeRegex = /^([01]?[0-9]|2[0-3]):(00|15|30|45)$/;
const timeRegexError = "Invalid time. Use HH:mm format in 15-minute intervals (e.g., 09:00, 09:15).";

const shiftSchema = z.object({
    role: z.string().min(1, "Role is required"),
    location: z.string().min(1, "Location is required"),
    shiftType: z.enum(['single', 'multi']),
    isSameTimeAndPay: z.boolean(),
    singleDate: z.date().optional(),
    singleStartTime: z.string().regex(timeRegex, timeRegexError).optional(),
    singleEndTime: z.string().regex(timeRegex, timeRegexError).optional(),
    singlePay: z.number().min(0).optional(),
    singleBreak: z.number().int().min(0).optional(),
    multiShifts: z.array(z.object({
        date: z.date(),
        startTime: z.string().regex(timeRegex, timeRegexError),
        endTime: z.string().regex(timeRegex, timeRegexError),
        pay: z.number().min(1, "Pay rate is required"),
        break: z.number().int().min(0).optional(),
    })).optional(),
    description: z.string().optional(),
    uniform: z.string().optional(),
    requirements: z.array(z.string()).optional(),
});

const generateTimeSlots = () => {
    const slots = [];
    let date = new Date();
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i < 96; i++) { // 24 hours * 4 slots/hour
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

const PostShiftScreen = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pickerConfig, setPickerConfig] = useState({ visible: false, type: null, index: null });
  const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
  const [selectedDates, setSelectedDates] = useState({});
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);

  const { control, handleSubmit, watch, setValue, getValues, formState: { errors } } = useForm({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
        shiftType: 'single',
        isSameTimeAndPay: true,
        singleStartTime: '09:00',
        singleEndTime: '17:00',
        singleBreak: 30,
        singlePay: 25,
        multiShifts: [],
        requirements: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({ control, name: "multiShifts" });
  const shiftType = watch('shiftType');
  const role = watch('role');
  const isSameTimeAndPay = watch('isSameTimeAndPay');
  const watchedValues = watch();

  const calculateShiftDuration = (startTime, endTime, breakMinutes) => {
      if (!startTime || !endTime || !timeRegex.test(startTime) || !timeRegex.test(endTime)) return 0;
      const start = parse(startTime, 'HH:mm', new Date());
      const end = parse(endTime, 'HH:mm', new Date());
      let diff = (differenceInMinutes(end, start) / 60);
      if (diff < 0) diff += 24; // Account for overnight shifts
      const breakHours = (breakMinutes || 0) / 60;
      return Math.max(0, diff - breakHours);
  };

  const costDetails = useMemo(() => {
    const SERVICE_FEE_RATE = 0.12;
    let totalHours = 0;
    let basePay = 0;

    if (watchedValues.shiftType === 'single') {
        if(watchedValues.singleDate) {
            const hours = calculateShiftDuration(watchedValues.singleStartTime, watchedValues.singleEndTime, watchedValues.singleBreak);
            totalHours = hours;
            basePay = hours * (watchedValues.singlePay || 0);
        }
    } else {
        watchedValues.multiShifts?.forEach(shift => {
            const hours = calculateShiftDuration(shift.startTime, shift.endTime, shift.break);
            totalHours += hours;
            basePay += hours * shift.pay;
        });
    }

    const serviceFee = basePay * SERVICE_FEE_RATE;
    const totalCost = basePay + serviceFee;

    return { totalHours, basePay, serviceFee, totalCost };
  }, [watchedValues]);


  useEffect(() => {
    if (IS_VISUAL_TESTING_MODE) {
      const mockProfile: VenueProfile = { id: "mock-venue-id", venueName: "The Mock Tavern", address: "123 Test Street", city: "Deville", phone: "555-555-5555", logoUrl: "", posSystem: "Toast" };
      setVenueProfile(mockProfile);
      setValue('location', `${mockProfile.address}, ${mockProfile.city}`.trim());
    }
    setIsLoading(false);
  }, [setValue]);

  const onMultiDayPress = (day) => {
    const dateStr = day.dateString;
    const newSelectedDates = { ...selectedDates };
    const existingShiftIndex = fields.findIndex(field => format(field.date, 'yyyy-MM-dd') === dateStr);
    
    const values = getValues();

    if (existingShiftIndex > -1) {
        delete newSelectedDates[dateStr];
        remove(existingShiftIndex);
    } else {
        newSelectedDates[dateStr] = { selected: true, selectedColor: Colors.primary };
        append({ date: new Date(day.timestamp + (new Date().getTimezoneOffset() * 60000)), startTime: values.singleStartTime, endTime: values.singleEndTime, pay: values.singlePay, break: values.singleBreak });
    }
    setSelectedDates(newSelectedDates);
  };

  const onSingleDayPress = (day) => {
      setValue('singleDate', new Date(day.timestamp + (new Date().getTimezoneOffset() * 60000)));
      setCalendarModalVisible(false);
  }

  const showPicker = (type, index = null) => setPickerConfig({ visible: true, type, index });
  const hidePicker = () => setPickerConfig({ visible: false, type: null, index: null });

  const handleTimeSelect = (time) => {
    const { type, index } = pickerConfig;
    if (!type) return;

    const [field, scope] = type.split('-');

    if (scope === 'single') {
      setValue(`single${field.charAt(0).toUpperCase() + field.slice(1)}`, time, { shouldValidate: true });
    } else if (scope === 'multi' && index !== null) {
      const currentShift = getValues(`multiShifts.${index}`);
      update(index, { ...currentShift, [field]: time });
    }
    hidePicker();
  };
  
  const onSubmit = (data) => {
    setIsSubmitting(true);
    console.log("--- MOCK SHIFT SUBMISSION ---");
    console.log("DATA:", JSON.stringify(data, null, 2));
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert("Shift Logged", "Form data logged to console.", [{ text: "OK", onPress: () => router.back() }]);
    }, 1000);
  };

  const renderMultiShiftFields = () => (
    <View style={styles.multiShiftDetailsContainer}>
        {fields.map((field, index) => (
            <View key={field.id} style={styles.multiShiftItem}>
                <Text style={styles.multiShiftDate}>{format(watch(`multiShifts.${index}.date`), 'EEE, MMM d')}</Text>
                <View style={styles.timePayGrid}>
                    <Controller name={`multiShifts.${index}.startTime`} control={control} render={({ field: { value } }) => (<TouchableOpacity onPress={() => showPicker('startTime-multi', index)} style={styles.gridItem}><FormField label="Start" icon={<Clock size={18} color={Colors.gray}/>}><Text style={styles.textInputSm}>{value}</Text></FormField></TouchableOpacity>)} />
                    <Controller name={`multiShifts.${index}.endTime`} control={control} render={({ field: { value } }) => (<TouchableOpacity onPress={() => showPicker('endTime-multi', index)} style={styles.gridItem}><FormField label="End" icon={<Clock size={18} color={Colors.gray}/>}><Text style={styles.textInputSm}>{value}</Text></FormField></TouchableOpacity>)} />
                    <Controller name={`multiShifts.${index}.pay`} control={control} render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Pay/hr" icon={<DollarSign size={18} color={Colors.gray}/>}><CustomPicker options={payRateOptions} selectedValue={value} onValueChange={onChange} hasIcon/></FormField></View>)} />
                    <Controller name={`multiShifts.${index}.break`} control={control} render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Break" icon={<Clock size={18} color={Colors.gray}/>}><TextInput style={styles.textInputSm} keyboardType="numeric" value={String(value)} onChangeText={(v) => onChange(Number(v) || 0)}/><Text style={styles.units}>min</Text></FormField></View>)} />
                </View>
            </View>
        ))}
    </View>
  );

  if (isLoading) {
    return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.title}>Post a New Shift</Text>
            <Text style={styles.subtitle}>Fill out the details below to find the right person for the job.</Text>

            <View style={styles.section}>
              <FormField label="Role" icon={<Briefcase size={20} color={Colors.gray} />} error={errors.role}><Controller name="role" control={control} render={({ field: { onChange, value } }) => (<CustomPicker placeholder="Select a role" options={skillsList.map(s => ({ label: s.label, value: s.id }))} selectedValue={value} onValueChange={onChange} />)} /></FormField>
              <FormField label="Location" icon={<MapPin size={20} color={Colors.gray} />} error={errors.location}><TextInput style={styles.textInput} value={getValues('location')} editable={false} /></FormField>
            </View>

            <View style={styles.tabContainer}>{['single', 'multi'].map(type => (<TouchableOpacity key={type} style={[styles.tab, shiftType === type && styles.activeTab]} onPress={() => setValue('shiftType', type)}><Text style={[styles.tabText, shiftType === type && styles.activeTabText]}>{type === 'single' ? 'Single Shift' : 'Multiple Shifts'}</Text></TouchableOpacity>))}</View>

            {shiftType === 'single' && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Shift Details</Text>
                  <Controller control={control} name='singleDate' render={({ field: { value }}) => (<TouchableOpacity onPress={() => setCalendarModalVisible(true)} style={{width: '100%', marginBottom: 15}}><FormField label="Date" icon={<CalendarIcon size={20} color={Colors.gray} />} error={errors.singleDate}><Text style={[styles.textInput, !value && { color: Colors.gray }]}>{value ? format(value, 'PPP') : 'Select a date'}</Text></FormField></TouchableOpacity>)}/>
                  <View style={styles.timePayGrid}>
                    <Controller control={control} name='singleStartTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('startTime-single')} style={styles.gridItem}><FormField label="Start Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleStartTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                    <Controller control={control} name='singleEndTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('endTime-single')} style={styles.gridItem}><FormField label="End Time" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleEndTime}><Text style={styles.textInput}>{field.value}</Text></FormField></TouchableOpacity>)} />
                    <Controller control={control} name='singleBreak' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Unpaid Break" icon={<Clock size={20} color={Colors.gray} />} error={errors.singleBreak}><TextInput style={styles.textInput} keyboardType="number-pad" value={String(value)} onChangeText={(val) => onChange(Number(val) || 0)} /><Text style={styles.units}>min</Text></FormField></View>)} />
                    <Controller control={control} name='singlePay' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Pay per hour" icon={<DollarSign size={20} color={Colors.gray} />} error={errors.singlePay}><CustomPicker placeholder="Rate" options={payRateOptions} selectedValue={value} onValueChange={onChange} /></FormField></View>)} />
                  </View>
                </View>
            )}

            {shiftType === 'multi' && (
                <View style={styles.section}>
                    <Calendar onDayPress={onMultiDayPress} markedDates={selectedDates} minDate={format(new Date(), 'yyyy-MM-dd')} theme={{ todayTextColor: Colors.primary, arrowColor: Colors.primary, selectedDayBackgroundColor: Colors.primary, selectedDayTextColor: '#ffffff' }}/>
                     <View style={[styles.switchRow, { marginTop: 15, marginBottom: 10 }]}>
                        <Text style={styles.label}>Use same time, pay & break for all?</Text>
                        <Controller name="isSameTimeAndPay" control={control} render={({ field: { onChange, value } }) => <Switch trackColor={{ false: Colors.lightGray, true: Colors.primary }} thumbColor={Colors.white} onValueChange={onChange} value={value} />} />
                    </View>
                    
                    {isSameTimeAndPay && fields.length > 0 && (
                       <View style={styles.timePayGrid}>
                            <Controller control={control} name='singleStartTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('startTime-single')} style={styles.gridItem}><FormField label="Start" icon={<Clock size={18} color={Colors.gray}/>}><Text style={styles.textInputSm}>{field.value}</Text></FormField></TouchableOpacity>)} />
                            <Controller control={control} name='singleEndTime' render={({ field }) => (<TouchableOpacity onPress={() => showPicker('endTime-single')} style={styles.gridItem}><FormField label="End" icon={<Clock size={18} color={Colors.gray}/>}><Text style={styles.textInputSm}>{field.value}</Text></FormField></TouchableOpacity>)} />
                            <Controller control={control} name='singlePay' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Pay/hr" icon={<DollarSign size={18} color={Colors.gray}/>}><CustomPicker options={payRateOptions} selectedValue={value} onValueChange={onChange} hasIcon/></FormField></View>)} />
                            <Controller control={control} name='singleBreak' render={({ field: { onChange, value } }) => (<View style={styles.gridItem}><FormField label="Break" icon={<Clock size={18} color={Colors.gray}/>}><TextInput style={styles.textInputSm} keyboardType="numeric" value={String(value)} onChangeText={(v) => onChange(Number(v) || 0)}/><Text style={styles.units}>min</Text></FormField></View>)} />
                       </View>
                    )}
                    {!isSameTimeAndPay && fields.length > 0 && renderMultiShiftFields()}
                </View>
            )}
            
            {(costDetails.totalHours > 0) && <View style={styles.section}><ShiftCostSummary details={costDetails} /></View>}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              <FormField label="Job Description" error={errors.description} containerStyle={{marginBottom: 0}}><Controller name="description" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={[styles.textInput, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value} multiline placeholder="e.g., Key responsibilities..." />)} /></FormField>
              <FormField label="Uniform" icon={<Shirt size={20} color={Colors.gray} />} error={errors.uniform}><Controller name="uniform" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.textInput} onBlur={onBlur} onChangeText={onChange} value={value} placeholder="e.g., Black shirt, black pants" />)} /></FormField>
              <FormField label="Requirements" error={errors.requirements} containerStyle={{marginBottom: 0}}><Controller name="requirements" control={control} render={({ field: { onChange, value } }) => (<MultiSelect options={getRoleRequirements(role, venueProfile?.posSystem)} selected={value} onChange={onChange} placeholder="Select requirements..."/>)} /></FormField>
            </View>

            <TouchableOpacity style={styles.publishButton} onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Publish Shift(s)</Text>}
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
  textInputSm: { flex: 1, fontSize: 15, color: Colors.text, marginLeft: 8 },
  textArea: { height: 100, textAlignVertical: 'top', paddingTop: 12 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4 },
  units: { color: Colors.gray, marginRight: 5, fontSize: 14 },
  timePayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%', marginBottom: 15 },
  publishButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 20 },
  publishButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  tabContainer: { flexDirection: 'row', backgroundColor: Colors.lightGray, borderRadius: 8, padding: 4, marginBottom: 20 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  activeTab: { backgroundColor: Colors.primary },
  tabText: { fontWeight: 'bold', color: Colors.textSecondary },
  activeTabText: { color: '#fff' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  multiShiftDetailsContainer: { marginTop: 10, borderTopWidth: 1, borderTopColor: Colors.lightGray },
  multiShiftItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  multiShiftDate: { fontSize: 16, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  calendarModalContent: { backgroundColor: 'white', borderRadius: 12, padding: 20, width: '90%' },
  timePickerModalContent: { backgroundColor: 'white', borderRadius: 12, padding: 15, width: '80%', maxHeight: '60%' },
  timeSlot: { paddingVertical: 15, alignItems: 'center' },
  timeSlotText: { fontSize: 18, color: Colors.primary },
});

export default PostShiftScreen;
