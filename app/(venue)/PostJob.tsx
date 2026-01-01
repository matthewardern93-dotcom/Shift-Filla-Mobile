
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert as RNAlert, SafeAreaView, Modal, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, MapPin, DollarSign, Type, FileText, Trash2, X } from 'lucide-react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db, doc, getDoc, onAuthStateChanged } from '../../services/firebase';
import { Colors } from '../../constants/colors';
import { skillsList } from '../../constants/Skills';
import { CustomPicker } from '../../components/Picker';
import MultiSelect from '../../components/multi-select';
import { createJob } from '../../services/jobs';
import { VenueProfile } from '../../types';
import JobShiftCostSummary from '../../components/JobShiftCostSummary';

const formSchema = z.object({
  title: z.string().min(3, "Job title must be at least 3 characters long."),
  roleCategories: z.array(z.string()).min(1, "Please select at least one role category."),
  location: z.string().min(2, "Location is required."),
  type: z.enum(['Full-Time', 'Part-Time'], { required_error: "Please select a job type." }),
  salary: z.string().min(1, "Salary information is required."),
  payType: z.enum(['hourly', 'salary'], { required_error: "Please select a pay type." }),
  description: z.string().min(20, "Description must be at least 20 characters."),
});

type JobFormData = z.infer<typeof formSchema>;

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

const PostJobScreen = () => {
    const router = useRouter();
    const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(true); // Start with the modal visible
    const [costDetails, setCostDetails] = useState({ listingFee: 50, serviceFee: 0, totalCost: 50 });

    const { control, handleSubmit, setValue, getValues, formState: { errors } } = useForm<JobFormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            roleCategories: [],
            location: "",
            salary: "",
            description: "",
        },
    });

    // MOCK DATA
    useEffect(() => {
        const mockProfile: VenueProfile = { id: "mock-venue-id", venueName: "The Mock Tavern", address: "123 Test Street", city: "Deville", phone: "555-555-5555", logoUrl: "", posSystem: "Toast" };
        setVenueProfile(mockProfile);
        setValue('location', `${mockProfile.address}, ${mockProfile.city}`.trim());
        setIsLoading(false);
    }, [setValue]);

    const onFormSubmit = async (values: JobFormData) => {
        if (!venueProfile) {
            RNAlert.alert("Error", "Venue profile is not loaded.");
            return;
        }

        setIsSubmitting(true);
        try {
            console.log("--- MOCK JOB SUBMISSION ---");
            console.log("DATA:", JSON.stringify({
                ...values,
                venueId: venueProfile.id,
                venueName: venueProfile.venueName,
                status: 'open',
                applicants: [],
                ...costDetails
            }, null, 2));
            RNAlert.alert("Success", "Job data logged to console!");
            closeModal();
        } catch (error) {
            console.error("Error posting job:", error);
            RNAlert.alert("Error", "There was an issue posting the job. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleDeleteDraft = () => {
        RNAlert.alert("Delete Draft", "Are you sure you want to discard this draft?", [
            { text: "Cancel", style: "cancel" },
            { text: "Delete", style: "destructive", onPress: () => closeModal() }
        ]);
    }

    const closeModal = () => {
        setIsModalVisible(false);
        router.back();
    };
    
    if (isLoading) {
        return (
            <Modal
                animationType="slide"
                transparent={false}
                visible={isModalVisible}
            >
                <SafeAreaView style={styles.centered}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </SafeAreaView>
            </Modal>
        );
    }
    
    const roleCategoryOptions = skillsList.map(skill => ({ value: skill.id, label: skill.label }));
    const jobTypeOptions = [{ label: 'Full-Time', value: 'Full-Time' }, { label: 'Part-Time', value: 'Part-Time' }];
    const payTypeOptions = [{ label: 'Per Hour', value: 'hourly' }, { label: 'Per Year', value: 'salary' }];

    return (
        <Modal
            animationType="slide"
            transparent={false}
            visible={isModalVisible}
            onRequestClose={closeModal}
        >
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Post a New Job</Text>
                        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                            <X size={24} color={Colors.text} />
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.subtitle}>Define the role and requirements for your next permanent hire.</Text>

                    <View style={styles.section}>
                        <FormField label="Job Title" icon={<Briefcase size={20} color={Colors.gray} />} error={errors.title}>
                            <Controller name="title" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.textInput} placeholder="e.g., Lead Barista" onBlur={onBlur} onChangeText={onChange} value={value} />)} />
                        </FormField>
                        <FormField label="Role Categories" icon={<Briefcase size={20} color={Colors.gray} />} error={errors.roleCategories} containerStyle={{ marginBottom: 0 }}>
                            <Controller name="roleCategories" control={control} render={({ field: { onChange, value } }) => (<MultiSelect options={roleCategoryOptions} selected={value || []} onChange={onChange} placeholder="Select applicable roles..." />)} />
                        </FormField>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Job Details</Text>
                        <FormField label="Location" icon={<MapPin size={20} color={Colors.gray} />} error={errors.location}>
                            <TextInput style={styles.textInput} value={getValues('location')} editable={false} />
                        </FormField>
                        <View style={styles.timePayGrid}>
                            <View style={styles.gridItem}>
                                <FormField label="Job Type" icon={<Type size={20} color={Colors.gray} />} error={errors.type}>
                                    <Controller name="type" control={control} render={({ field: { onChange, value } }) => (<CustomPicker options={jobTypeOptions} selectedValue={value} onValueChange={onChange} placeholder="Select Type" />)} />
                                </FormField>
                            </View>
                            <View style={styles.gridItem}>
                               <FormField label="Pay Type" icon={<FileText size={20} color={Colors.gray} />} error={errors.payType}>
                                    <Controller name="payType" control={control} render={({ field: { onChange, value } }) => (<CustomPicker options={payTypeOptions} selectedValue={value} onValueChange={onChange} placeholder="Select Type"/>)} />
                                </FormField>
                            </View>
                        </View>
                         <FormField label="Salary / Rate" icon={<DollarSign size={20} color={Colors.gray} />} error={errors.salary}>
                            <Controller name="salary" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={styles.textInput} placeholder="e.g., 25 or 50000" onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="numeric" />)} />
                        </FormField>
                    </View>

                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Job Description</Text>
                      <FormField error={errors.description} containerStyle={{marginBottom: 0}}>
                          <Controller name="description" control={control} render={({ field: { onChange, onBlur, value } }) => (<TextInput style={[styles.textInput, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value} multiline placeholder="Describe the role, responsibilities, benefits..." />)} />
                      </FormField>
                    </View>
                    <JobShiftCostSummary details={costDetails} />
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleDeleteDraft} style={styles.deleteButton}>
                        <Trash2 size={22} color={Colors.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.publishButton} onPress={handleSubmit(onFormSubmit)} disabled={isSubmitting}>
                        {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.publishButtonText}>Publish Job Posting</Text>}
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9F9FB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9F9FB' },
  scrollContainer: { paddingHorizontal: 15, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 4},
  title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary },
  subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
  closeButton: { padding: 8 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 15 },
  fieldContainer: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text, marginBottom: 8 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: 'transparent', minHeight: 48 },
  inputError: { borderColor: Colors.danger },
  textInput: { flex: 1, fontSize: 16, color: Colors.text, marginLeft: 10 },
  textArea: { height: 120, textAlignVertical: 'top', paddingTop: 12 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: 4, marginLeft: 10 },
  timePayGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridItem: { width: '48%' },
  footer: { flexDirection: 'row', padding: 15, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#F3F4F6', alignItems: 'center' },
  publishButton: { flex: 1, backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center', marginLeft: 10 },
  publishButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  deleteButton: { padding: 12, borderRadius: 12, borderWidth: 1, borderColor: Colors.lightGray },
});

export default PostJobScreen;
