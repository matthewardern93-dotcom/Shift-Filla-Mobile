import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert as RNAlert, KeyboardAvoidingView, Platform } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors } from '../../constants/colors';
import { skillsList } from '../../constants/Skills';
import { CustomPicker } from '../../components/CustomPicker';
import { auth, db } from '../../services/firebase';
import firestore from '@react-native-firebase/firestore';
import { VenueProfile, Job } from '../../types';
import { X } from 'lucide-react-native';

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  role: z.string().min(1, 'Role is required'),
  employmentType: z.string().min(1, 'Please select an employment type'),
  description: z.string().min(50, 'Description must be at least 50 characters'),
  requirements: z.string().optional(),
  payRate: z.number().min(1, 'Please enter a valid pay rate'),
});

type JobFormData = z.infer<typeof jobSchema>;

type PostJobScreenProps = {
  isVisible: boolean;
  closeModal: () => void;
  venueProfile: VenueProfile | null;
  draft?: Partial<JobFormData>;
};

const PostJobScreen: React.FC<PostJobScreenProps> = ({ isVisible, closeModal, venueProfile, draft }) => {
    const {
        control,
        handleSubmit,
        formState: { errors, isValid },
        watch,
        reset
    } = useForm<JobFormData>({
        resolver: zodResolver(jobSchema),
        defaultValues: draft || {
            title: '',
            role: '',
            employmentType: '',
            description: '',
            requirements: '',
            payRate: undefined,
        }
    });

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        reset(draft);
    }, [draft, reset]);

    const payRate = watch('payRate');

    const costDetails = useMemo(() => {
        const rate = payRate || 0;
        const weeklyHours = 40; // Standard assumption
        const weeklyCost = rate * weeklyHours;
        const platformFee = weeklyCost * 0.05; // 5% weekly fee
        const totalWeekly = weeklyCost + platformFee;
        return { weeklyCost, platformFee, totalWeekly };
    }, [payRate]);

    if (!isVisible) return null;

    const onSubmit = async (values: JobFormData) => {
        if (!venueProfile) {
            RNAlert.alert("Error", "Venue profile is not available.");
            return;
        }
        setIsSubmitting(true);
        try {
            const newJob: Omit<Job, 'id'> = {
                ...values,
                businessId: venueProfile.id,
                businessName: venueProfile.venueName,
                businessLogoUrl: venueProfile.logoUrl || '',
                status: 'active',
                datePosted: firestore.Timestamp.fromDate(new Date()),
                ...costDetails
            };
            await db.collection("permanent_jobs").add(newJob);
            RNAlert.alert("Success", "Your job has been posted!");
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

    return (
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Post a New Job</Text>
                <TouchableOpacity onPress={handleDeleteDraft} style={styles.closeButton}>
                    <X size={24} color={Colors.primary} />
                </TouchableOpacity>
            </View>
            <ScrollView style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Job Details</Text>
                <Controller name="title" control={control} render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.input} placeholder="Job Title (e.g., Head Chef)" onBlur={onBlur} onChangeText={onChange} value={value} />} />
                {errors.title && <Text style={styles.errorText}>{errors.title.message}</Text>}

                <Controller name="role" control={control} render={({ field: { onChange, value } }) => <CustomPicker placeholder="Select a role" options={skillsList.map(s => ({label: s.label, value: s.id}))} selectedValue={value} onValueChange={onChange} />} />
                {errors.role && <Text style={styles.errorText}>{errors.role.message}</Text>}

                <Controller name="employmentType" control={control} render={({ field: { onChange, value } }) => <CustomPicker placeholder="Select Employment Type" options={[{label: 'Full-time', value: 'Full-time'}, {label: 'Part-time', value: 'Part-time'}]} selectedValue={value} onValueChange={onChange} />} />
                {errors.employmentType && <Text style={styles.errorText}>{errors.employmentType.message}</Text>}

                <Text style={styles.sectionTitle}>Job Description & Requirements</Text>
                <Controller name="description" control={control} render={({ field: { onChange, onBlur, value } }) => <TextInput style={[styles.input, styles.textArea]} placeholder="Describe the role, responsibilities, and what makes your venue a great place to work..." multiline onBlur={onBlur} onChangeText={onChange} value={value} />} />
                {errors.description && <Text style={styles.errorText}>{errors.description.message}</Text>}

                <Controller name="requirements" control={control} render={({ field: { onChange, onBlur, value } }) => <TextInput style={[styles.input, styles.textArea]} placeholder="List any required skills, experience, or qualifications..." multiline onBlur={onBlur} onChangeText={onChange} value={value} />} />

                <Text style={styles.sectionTitle}>Compensation</Text>
                <View style={styles.payRateContainer}>
                    <Text style={styles.currencySymbol}>$</Text>
                    <Controller name="payRate" control={control} render={({ field: { onChange, onBlur, value } }) => <TextInput style={styles.payInput} placeholder="25.00" keyboardType="decimal-pad" onBlur={onBlur} onChangeText={(text) => onChange(parseFloat(text) || 0)} value={value ? String(value) : ''} />} />
                    <Text style={styles.payRateLabel}>/ hour</Text>
                </View>
                {errors.payRate && <Text style={styles.errorText}>{errors.payRate.message}</Text>}

                <View style={styles.costSummary}>
                    <Text style={styles.summaryTitle}>Estimated Weekly Cost</Text>
                    <View style={styles.summaryRow}>
                        <Text>Weekly Cost (40hrs):</Text>
                        <Text>${costDetails.weeklyCost.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text>5% Platform Fee:</Text>
                        <Text>${costDetails.platformFee.toFixed(2)}</Text>
                    </View>
                    <View style={styles.summaryTotal}>
                        <Text style={styles.summaryTotalLabel}>Total Weekly Est.:</Text>
                        <Text style={styles.summaryTotalValue}>${costDetails.totalWeekly.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity style={[styles.submitButton, !isValid && styles.submitButtonDisabled]} onPress={handleSubmit(onSubmit)} disabled={!isValid || isSubmitting}>
                    {isSubmitting ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitButtonText}>Post Job</Text>}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.white,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    closeButton: {
        padding: 5,
    },
    formContainer: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.darkGray,
        marginTop: 20,
        marginBottom: 10,
    },
    input: {
        borderWidth: 1,
        borderColor: Colors.gray,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        marginBottom: 10,
    },
    textArea: {
        height: 120,
        textAlignVertical: 'top',
    },
    errorText: {
        color: Colors.danger,
        marginBottom: 10,
    },
    payRateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Colors.gray,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
    },
    currencySymbol: {
        fontSize: 16,
        marginRight: 5,
    },
    payInput: {
        flex: 1,
        fontSize: 16,
    },
    payRateLabel: {
        fontSize: 16,
    },
    costSummary: {
        marginTop: 20,
        padding: 15,
        backgroundColor: Colors.lightGray,
        borderRadius: 8,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryTotal: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.gray,
        paddingTop: 10,
    },
    summaryTotalLabel: {
        fontWeight: 'bold',
    },
    summaryTotalValue: {
        fontWeight: 'bold',
        color: Colors.primary
    },
    submitButton: {
        backgroundColor: Colors.primary,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 30,
        marginBottom: 50
    },
    submitButtonDisabled: {
        backgroundColor: Colors.gray,
    },
    submitButtonText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default PostJobScreen;
