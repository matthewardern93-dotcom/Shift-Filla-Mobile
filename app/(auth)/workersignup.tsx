import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert as RNAlert, TextInput, Platform, Modal, FlatList } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth, db, createUserWithEmailAndPassword, doc, setDoc, serverTimestamp } from '../../services/firebase';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { isValid, format, startOfDay } from 'date-fns';
import { Colors } from '../../constants/colors';
import { WorkerProfile } from '../../types';
import { skillsList } from '../../constants/Skills';
import { locationsList } from '../../constants/Cities';
import { countries } from '../../constants/Countries';
import { languages as languageData } from '../../constants/Languages';
import { Picker } from '@react-native-picker/picker';

// Helper to upload files to Firebase Storage
const uploadImageAsync = async (uri: string, path: string): Promise<string> => {
    const blob: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
            resolve(xhr.response);
        };
        xhr.onerror = function (e) {
            console.log(e);
            reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
    });

    const storage = getStorage();
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, blob);
    blob.close();

    return await getDownloadURL(storageRef);
};


const currentYear = new Date().getFullYear();
const years = Array.from({ length: 100 }, (_, i) => ({ label: (currentYear - i).toString(), value: (currentYear - i).toString() }));
const visaYears = Array.from({ length: 15 }, (_, i) => ({ label: (currentYear + i).toString(), value: (currentYear + i).toString() }));
const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: format(new Date(0, i), 'MMMM') }));

const getDaysInMonth = (year, month) => new Date(year, month, 0).getDate();

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Mobile number is required."),
  location: z.string().nonempty("City is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  skills: z.array(z.string()).nonempty({ message: "You have to select at least one skill." }),
  languages: z.array(z.string()).nonempty({ message: "You have to select at least one language." }),
  about: z.string().min(20, "Please write a brief description about yourself (at least 20 characters)."),
  resumeUri: z.string().nonempty("Resume is required."),
  nationality: z.string().nonempty("Please select your nationality."),
  dateOfBirth: z.date({ required_error: "Date of birth is required." }),
  idDocumentUri: z.string().nonempty("ID document is required."),
  visaDocumentUri: z.string().optional(),
  visaType: z.string().optional(),
  visaExpiry: z.date().optional(),
  irdNumber: z.string().min(1, "IRD number is required."),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms."),
  profilePictureUri: z.string().nonempty("Profile picture is required."),
}).refine(data => {
    if (data.nationality && data.nationality !== 'NZ' && data.nationality !== 'AU') {
        return !!data.visaDocumentUri && !!data.visaType && !!data.visaExpiry;
    }
    return true;
}, {
    message: "Valid visa documentation, type, and expiry date are required for your selected nationality.",
    path: ['visaDocumentUri']
}).refine(data => {
    if (data.visaExpiry) {
        return data.visaExpiry >= startOfDay(new Date());
    }
    return true;
}, {
    message: "Visa expiry date cannot be in the past.",
    path: ["visaExpiry"],
});


type FormData = z.infer<typeof formSchema>;


// Reusable Picker Component
const CustomPicker = ({ label, items, selectedValue, onValueChange, prompt, error }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const selectedLabel = items.find(item => item.value === selectedValue)?.label || prompt;

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                <Text style={[styles.pickerText, !selectedValue && styles.placeholderText]}>{selectedLabel}</Text>
                <Feather name="chevron-down" size={20} color={Colors.gray} />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Modal transparent={true} visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => { onValueChange(item.value); setModalVisible(false); }}>
                                    <Text style={styles.modalItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

// Reusable Multi-Select Picker
const MultiSelectPicker = ({ label, items, selectedItems, onSelectionChange, error }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const toggleItem = (itemValue) => {
        const newSelection = selectedItems.includes(itemValue)
            ? selectedItems.filter(v => v !== itemValue)
            : [...selectedItems, itemValue];
        onSelectionChange(newSelection);
    };

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                <Text style={styles.pickerText} numberOfLines={1}>
                    {selectedItems.length > 0 ? `${selectedItems.length} selected` : `Select ${label.toLowerCase()}...*`}
                </Text>
                <Feather name="chevron-down" size={20} color={Colors.gray} />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Modal transparent={true} visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.multiSelectItem} onPress={() => toggleItem(item.value)}>
                                    <Feather name={selectedItems.includes(item.value) ? "check-square" : "square"} size={24} color={Colors.primary} />
                                    <Text style={styles.multiSelectItemText}>{item.label}</Text>
                                </TouchableOpacity>
                            )}
                        />
                        <TouchableOpacity style={styles.confirmButton} onPress={() => setModalVisible(false)}>
                            <Text style={styles.confirmButtonText}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};


// Date Picker Component
const DatePicker = ({ label, value, onChange, error, years: yearRange = years }) => {
    const [modalVisible, setModalVisible] = useState(false);
    const [day, setDay] = useState(value ? value.getDate().toString() : '1');
    const [month, setMonth] = useState(value ? (value.getMonth() + 1).toString() : '1');
    const [year, setYear] = useState(value ? value.getFullYear().toString() : yearRange[0].value);

    const daysInMonth = getDaysInMonth(parseInt(year), parseInt(month));
    const days = Array.from({ length: daysInMonth }, (_, i) => ({ label: (i + 1).toString(), value: (i + 1).toString() }));

    const handleConfirm = () => {
        const newDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (isValid(newDate)) {
            onChange(newDate);
        }
        setModalVisible(false);
    };
    
    const pickerItemStyle = { color: Platform.OS === 'ios' ? Colors.text : undefined };

    return (
        <View style={styles.inputWrapper}>
            <Text style={styles.label}>{label}</Text>
            <TouchableOpacity style={styles.input} onPress={() => setModalVisible(true)}>
                <Text style={[styles.pickerText, !value && styles.placeholderText]}>
                    {value ? format(value, 'd MMMM, yyyy') : 'Select date*'}
                </Text>
                <Feather name="calendar" size={20} color={Colors.gray} />
            </TouchableOpacity>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Modal transparent={true} visible={modalVisible} animationType="slide" onRequestClose={() => setModalVisible(false)}>
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                        <Text style={styles.modalHeader}>Select Date</Text>
                        <View style={styles.datePickerWheelContainer}>
                            <View style={styles.pickerColumn}><Picker selectedValue={day} onValueChange={setDay} style={styles.pickerWheel} itemStyle={pickerItemStyle}>{days.map(d => <Picker.Item key={d.value} {...d} />)}</Picker></View>
                            <View style={styles.pickerColumn}><Picker selectedValue={month} onValueChange={setMonth} style={styles.pickerWheel} itemStyle={pickerItemStyle}>{months.map(m => <Picker.Item key={m.value} {...m} />)}</Picker></View>
                            <View style={styles.pickerColumn}><Picker selectedValue={year} onValueChange={setYear} style={styles.pickerWheel} itemStyle={pickerItemStyle}>{yearRange.map(y => <Picker.Item key={y.value} {...y} />)}</Picker></View>
                        </View>
                        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}><Text style={styles.confirmButtonText}>Confirm</Text></TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default function WorkerSignUpScreen() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [profilePicPreview, setProfilePicPreview] = useState<string | null>(null);
    const [idDocName, setIdDocName] = useState<string | null>(null);
    const [visaDocName, setVisaDocName] = useState<string | null>(null);
    const [resumeName, setResumeName] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors, isValid: isFormValid }, setValue, watch } = useForm<FormData>({
        resolver: zodResolver(formSchema),
        mode: 'onBlur'
    });
    
    const nationality = watch('nationality');
    const agreeToTerms = watch('agreeToTerms');

    const pickImage = async (field: keyof FormData, type: 'image' | 'doc') => {
        const pickerResult = type === 'image'
            ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 1 })
            : await DocumentPicker.getDocumentAsync({});

        if (pickerResult.canceled === false) {
            const asset = pickerResult.assets?.[0];
            if (asset) {
                const uri = asset.uri;
                const fileName = asset.name;
                setValue(field, uri, { shouldValidate: true });

                if (field === 'profilePictureUri') setProfilePicPreview(uri);
                else if (field === 'idDocumentUri') setIdDocName(fileName);
                else if (field === 'visaDocumentUri') setVisaDocName(fileName);
                else if (field === 'resumeUri') setResumeName(fileName);
            }
        }
    };

    const onSubmit = async (values: FormData) => {
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
            const uid = userCredential.user.uid;
            const workerStoragePath = `WorkerProfiles/${uid}`;

            const uploadPromises = [
                uploadImageAsync(values.profilePictureUri, `${workerStoragePath}/profile_pic.jpg`),
                uploadImageAsync(values.idDocumentUri, `${workerStoragePath}/id_document.pdf`),
                uploadImageAsync(values.resumeUri, `${workerStoragePath}/resume.pdf`),
            ];
            
            if (values.visaDocumentUri) uploadPromises.push(uploadImageAsync(values.visaDocumentUri, `${workerStoragePath}/visa_document.pdf`));
            
            const [profilePictureUrl, idDocumentUrl, resumeUrl, visaDocumentUrl] = await Promise.all(uploadPromises);

            const workerProfileData: Partial<WorkerProfile> = {
                uid,
                userType: 'worker',
                approved: false,
                firstName: values.firstName.trim(),
                lastName: values.lastName.trim(),
                email: values.email.toLowerCase(),
                phone: values.phone,
                city: values.location,
                skills: values.skills,
                languages: values.languages,
                description: values.about,
                profilePictureUrl,
                resumeUrl: resumeUrl,
                idDocumentUrl,
                nationality: values.nationality,
                dateOfBirth: values.dateOfBirth,
                irdNumber: values.irdNumber,
                visaType: values.visaType || null,
                visaExpiry: values.visaExpiry || null,
                visaDocumentUrl: visaDocumentUrl || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                stripeOnboarded: false,
            };

            await setDoc(doc(db, "WorkerProfiles", uid), workerProfileData);
            
            router.replace('/pending');
            RNAlert.alert('Signup Successful!', 'Your application has been submitted for review.');

        } catch (error: any) {
            console.error("Signup Error:", error);
            const errorMessage = error.code === 'auth/email-already-in-use' ? 'This email is already in use.' : error.message;
            RNAlert.alert('Signup Failed', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Feather name="arrow-left" size={24} color={Colors.primary} />
                <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Create Contractor Account</Text>
            <Text style={styles.description}>Please provide your details to get started.</Text>

            <Controller
                name="profilePictureUri"
                control={control}
                render={() => (
                    <View style={styles.logoSection}>
                        <TouchableOpacity onPress={() => pickImage('profilePictureUri', 'image')}>
                            <View style={styles.avatar}>
                                {profilePicPreview ? <Image source={{ uri: profilePicPreview }} style={styles.logoPreview} /> : <Feather name="user" size={40} color={Colors.gray} />}
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => pickImage('profilePictureUri', 'image')} style={styles.uploadButton}>
                            <Feather name="upload" size={18} color={Colors.white} />
                            <Text style={styles.uploadButtonText}>Upload Picture*</Text>
                        </TouchableOpacity>
                    </View>
                )}
            />
            {errors.profilePictureUri && <Text style={styles.errorText}>{errors.profilePictureUri.message}</Text>}

            <Text style={styles.sectionHeader}>Account Details</Text>
            <Controller name="firstName" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="First Name*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />} />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName.message}</Text>}
            
            <Controller name="lastName" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Last Name*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />} />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName.message}</Text>}

            <Controller name="phone" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Mobile Number*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} keyboardType="phone-pad" />} />
            {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

            <Controller name="dateOfBirth" control={control} render={({ field }) => <DatePicker label="Date of Birth*" value={field.value} onChange={field.onChange} error={errors.dateOfBirth?.message} />} />

            <Controller name="email" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Email*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} keyboardType="email-address" autoCapitalize="none" />} />
            {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

            <Controller name="password" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Password (min. 8 characters)*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} secureTextEntry />} />
            {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

            <Text style={styles.sectionHeader}>Your Profile</Text>
            <Controller name="location" control={control} render={({ field }) => <CustomPicker label="City*" items={locationsList} selectedValue={field.value} onValueChange={field.onChange} prompt="Select your city" error={errors.location?.message} />} />
            
            <Controller name="skills" control={control} render={({ field }) => <MultiSelectPicker label="Skills*" items={skillsList} selectedItems={field.value || []} onSelectionChange={field.onChange} error={errors.skills?.message} />} />
            
            <Controller name="languages" control={control} render={({ field }) => <MultiSelectPicker label="Languages Spoken*" items={languageData} selectedItems={field.value || []} onSelectionChange={field.onChange} error={errors.languages?.message} />} />

            <Controller name="about" control={control} render={({ field }) => <TextInput style={[styles.input, styles.textArea]} placeholder="Tell venues a little bit about yourself...*" multiline onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />} />
             {errors.about && <Text style={styles.errorText}>{errors.about.message}</Text>}

            <Controller name="resumeUri" control={control} render={() => (
                <TouchableOpacity style={styles.fileUpload} onPress={() => pickImage('resumeUri', 'doc')}>
                    <Feather name="upload-cloud" size={24} color={Colors.gray} />
                    <Text style={styles.fileUploadText}>{resumeName || 'Upload Resume*'}</Text>
                </TouchableOpacity>
            )} />
            {errors.resumeUri && <Text style={styles.errorText}>{errors.resumeUri.message}</Text>}

            <Text style={styles.sectionHeader}>Verification</Text>
            <Controller name="nationality" control={control} render={({ field }) => <CustomPicker label="Nationality*" items={countries.map(c => ({ label: c.name, value: c.code }))} selectedValue={field.value} onValueChange={field.onChange} prompt="Select your nationality" error={errors.nationality?.message} />} />
            
            <Controller name="idDocumentUri" control={control} render={() => (
                <TouchableOpacity style={styles.fileUpload} onPress={() => pickImage('idDocumentUri', 'doc')}>
                    <Feather name="upload-cloud" size={24} color={Colors.primary} />
                    <Text style={[styles.fileUploadText, { color: Colors.primary }]}>{idDocName || 'Upload ID Document*'}</Text>
                </TouchableOpacity>
            )} />
            {errors.idDocumentUri && <Text style={styles.errorText}>{errors.idDocumentUri.message}</Text>}

            {nationality && nationality !== 'NZ' && nationality !== 'AU' && (
                <>
                    <Controller name="visaDocumentUri" control={control} render={() => (
                         <TouchableOpacity style={styles.fileUpload} onPress={() => pickImage('visaDocumentUri', 'doc')}>
                            <Feather name="upload-cloud" size={24} color={Colors.primary} />
                            <Text style={[styles.fileUploadText, { color: Colors.primary }]}>{visaDocName || 'Upload Right-to-Work Visa*'}</Text>
                         </TouchableOpacity>
                    )} />
                    {errors.visaDocumentUri && <Text style={styles.errorText}>{errors.visaDocumentUri.message}</Text>}
                    
                    <Controller name="visaType" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Visa Type (e.g., Work Visa)*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />} />
                    {errors.visaType && <Text style={styles.errorText}>{errors.visaType.message}</Text>}

                    <Controller name="visaExpiry" control={control} render={({ field }) => <DatePicker label="Visa Expiry Date*" value={field.value} onChange={field.onChange} error={errors.visaExpiry?.message} years={visaYears} />} />
                </>
            )}

            <Text style={styles.sectionHeader}>Payment</Text>
            <Controller name="irdNumber" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="IRD Number*" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} />} />
            {errors.irdNumber && <Text style={styles.errorText}>{errors.irdNumber.message}</Text>}

            <Text style={styles.sectionHeader}>Agreements</Text>
            <View style={styles.checkboxContainer}>
                <TouchableOpacity onPress={() => setValue('agreeToTerms', !agreeToTerms, { shouldValidate: true })} style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                    {agreeToTerms && <Feather name="check" size={18} color={Colors.white} />}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>I agree to the Terms of Service & Stripe Agreement.*</Text>
            </View>
            {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>}

            <TouchableOpacity style={[styles.submitButton, (!isFormValid || isLoading) && styles.submitButtonDisabled]} onPress={handleSubmit(onSubmit)} disabled={!isFormValid || isLoading}>
                {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitButtonText}>Submit Application</Text>}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: Colors.secondary },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backButtonText: { marginLeft: 8, fontSize: 16, fontWeight: '500', color: Colors.primary },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8, color: Colors.primary },
  description: { fontSize: 16, color: Colors.gray, marginBottom: 24 },
  sectionHeader: { fontSize: 20, fontWeight: '600', marginTop: 24, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, paddingBottom: 8, color: Colors.primary },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, marginBottom: 12, color: Colors.text, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerText: { fontSize: 16, color: Colors.text, flex: 1 },
  placeholderText: { color: Colors.gray },
  textArea: { height: 100, textAlignVertical: 'top' },
  logoSection: { alignItems: 'center', marginBottom: 12 },
  avatar: { height: 100, width: 100, borderRadius: 50, backgroundColor: Colors.lightGray, justifyContent: 'center', alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  logoPreview: { height: 100, width: 100 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  uploadButtonText: { color: Colors.white, marginLeft: 8, fontWeight: '500' },
  fileUpload: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 15, marginBottom: 12 },
  fileUploadText: { marginLeft: 10, color: Colors.gray, flex: 1 },
  label: { fontSize: 16, fontWeight: '500', marginBottom: 8, color: Colors.primary },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  checkbox: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.lightGray, borderRadius: 4, borderWidth: 1, borderColor: Colors.lightGray },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkboxLabel: { marginLeft: 12, fontSize: 16, color: Colors.gray, flex: 1 },
  submitButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20, marginBottom: 40 },
  submitButtonDisabled: { backgroundColor: '#A0AEC0' },
  submitButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  errorText: { color: Colors.danger, fontSize: 12, marginBottom: 10, marginTop: -8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: Colors.white, borderRadius: 20, padding: 20, width: '90%', maxHeight: '80%' },
  modalItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  modalItemText: { fontSize: 18, textAlign: 'center', color: Colors.primary },
  multiSelectItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  multiSelectItemText: { fontSize: 18, marginLeft: 15, color: Colors.text },
  confirmButton: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginTop: 20 },
  confirmButtonText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  inputWrapper: { marginBottom: 16 },
  modalHeader: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, color: Colors.text },
  datePickerWheelContainer: { flexDirection: 'row', justifyContent: 'center' },
  pickerColumn: { flex: 1 },
  pickerWheel: { height: 200 },
});
