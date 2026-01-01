import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, TextInput, Modal, FlatList } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signUpVenue } from '../../services/users';
import * as ImagePicker from 'expo-image-picker';
import { locationsList } from '../../constants/Cities';
import { Colors } from '../../constants/colors';

// Zod schema based on the web app for validation
const formSchema = z.object({
  businessName: z.string().min(2, "Business name is required."),
  contactName: z.string().min(2, "Contact name is required."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(1, "Phone number is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  address: z.string().min(5, "Business address is required."),
  city: z.string().nonempty("Please select your city."),
  about: z.string(),
  logoUri: z.string().nonempty("Logo is required."),
  verificationDocumentUri: z.string().nonempty('At least one verification document is required.'),
  agreeToTerms: z.boolean().refine(val => val === true, "You must agree to the terms."),
  companyNumber: z.string(),
  posSystem: z.string(),
});

type FormData = z.infer<typeof formSchema>;

const posSystems = ["Square", "Lightspeed", "Toast", "Clover", "Other"].map(s => ({label: s, value: s}));

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
            <Modal
                transparent={true}
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={styles.modalContent}>
                        <FlatList
                            data={items}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.modalItem} onPress={() => {
                                    onValueChange(item.value);
                                    setModalVisible(false);
                                }}>
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

export default function VenueSignUpScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [docName, setDocName] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors, isValid }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    mode: 'onBlur'
  });

  const agreeToTerms = watch('agreeToTerms');

  const pickImage = async (field: keyof FormData) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
      const uri = result.assets[0].uri;
      const fileName = uri.split('/').pop() || 'document';
      setValue(field, uri, { shouldValidate: true });
      if (field === 'logoUri') {
        setLogoPreview(uri);
      } else if (field === 'verificationDocumentUri') {
        setDocName(fileName);
      }
    }
  };

  const onSubmit = async (values: FormData) => {
    setIsLoading(true);
    try {
        await signUpVenue(values);
        router.push('/pending');
        Alert.alert('Signup Successful!', 'Your application has been submitted for review.');
    } catch (error: any) {
      console.error('Signup error:', error);
      let errorMessage = error.message || 'An unexpected error occurred.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email is already in use. Please sign in or use a different email.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use at least 8 characters.';
            break;
        }
      }
      Alert.alert('Signup Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Create Venue Account</Text>
        <Text style={styles.description}>Register your business to start posting shifts.</Text>

        <Controller
            name="logoUri"
            control={control}
            render={({ field }) => (
                <View style={styles.logoSection}>
                    <TouchableOpacity onPress={() => pickImage('logoUri')}>
                        <View style={styles.avatar}>
                            {logoPreview ? (
                                <Image source={{ uri: logoPreview }} style={styles.logoPreview} />
                            ) : (
                                <Feather name="image" size={40} color={Colors.gray} />
                            )}
                        </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => pickImage('logoUri')} style={styles.uploadButton}>
                        <Feather name="upload" size={18} color={Colors.white} />
                        <Text style={styles.uploadButtonText}>Upload Logo</Text>
                    </TouchableOpacity>
                </View>
            )}
        />
        {errors.logoUri && <Text style={styles.errorText}>{errors.logoUri.message}</Text>}

        <Text style={styles.sectionHeader}>Business Details</Text>
        <Controller name="businessName" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Business Name" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} placeholderTextColor={Colors.text} />} />
        {errors.businessName && <Text style={styles.errorText}>{errors.businessName.message}</Text>}
        
        <Controller name="companyNumber" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Company Number (NZBN)" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} placeholderTextColor={Colors.text} />} />
        
        <Controller name="address" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Business Address" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} placeholderTextColor={Colors.text} />} />
        {errors.address && <Text style={styles.errorText}>{errors.address.message}</Text>}

         <Controller
            name="city"
            control={control}
            render={({ field: { onChange, value } }) => (
                <CustomPicker
                    label="City"
                    items={locationsList}
                    selectedValue={value}
                    onValueChange={(val) => onChange(val)}
                    prompt="Select your city"
                    error={errors.city?.message}
                />
            )}
        />

        <Text style={styles.sectionHeader}>Contact & Login</Text>
        <Controller name="contactName" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Contact Person Name" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} placeholderTextColor={Colors.text} />} />
        {errors.contactName && <Text style={styles.errorText}>{errors.contactName.message}</Text>}

        <Controller name="phone" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Contact Phone" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} keyboardType="phone-pad" placeholderTextColor={Colors.text} />} />
        {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}

        <Controller name="email" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Email" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.text} />} />
        {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}

        <Controller name="password" control={control} render={({ field }) => <TextInput style={styles.input} placeholder="Password (min. 8 characters)" onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} secureTextEntry placeholderTextColor={Colors.text} />} />
        {errors.password && <Text style={styles.errorText}>{errors.password.message}</Text>}

        <Text style={styles.sectionHeader}>About Your Venue</Text>
        <Controller name="about" control={control} render={({ field }) => <TextInput style={[styles.input, styles.textArea]} placeholder="Tell workers about your venue..." multiline onBlur={field.onBlur} onChangeText={field.onChange} value={field.value} placeholderTextColor={Colors.text} />} />

        <Controller
            name="posSystem"
            control={control}
            render={({ field: { onChange, value } }) => (
                <CustomPicker
                    label="Point-of-Sale System"
                    items={posSystems}
                    selectedValue={value}
                    onValueChange={(val) => onChange(val)}
                    prompt="Select a POS system..."
                    error={errors.posSystem?.message}
                />
            )}
        />

        <Text style={styles.sectionHeader}>Verification</Text>
        <Controller
            name="verificationDocumentUri"
            control={control}
            render={({ field }) => (
                <TouchableOpacity style={styles.fileUpload} onPress={() => pickImage('verificationDocumentUri')}>
                    <Feather name="upload-cloud" size={24} color={Colors.gray} />
                    <Text style={styles.fileUploadText}>{docName || 'Upload Verification Document'}</Text>
                </TouchableOpacity>
            )}
        />
        {errors.verificationDocumentUri && <Text style={styles.errorText}>{errors.verificationDocumentUri.message}</Text>}
        
        <Text style={styles.sectionHeader}>Agreements</Text>
        <View style={styles.checkboxContainer}>
            <TouchableOpacity onPress={() => setValue('agreeToTerms', !agreeToTerms, { shouldValidate: true })} style={[styles.checkbox, agreeToTerms && styles.checkboxChecked]}>
                {agreeToTerms && <Feather name="check" size={18} color={Colors.white} />}
            </TouchableOpacity>
            <Text style={styles.checkboxLabel}>I agree to the Terms of Service.</Text>
        </View>
        {errors.agreeToTerms && <Text style={styles.errorText}>{errors.agreeToTerms.message}</Text>}

        <TouchableOpacity style={[styles.submitButton, (!isValid || isLoading) && styles.submitButtonDisabled]} onPress={handleSubmit(onSubmit)} disabled={!isValid || isLoading}>
            {isLoading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.submitButtonText}>Submit Application</Text>}
        </TouchableOpacity>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.secondary,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: Colors.primary,
  },
  description: {
    fontSize: 16,
    color: Colors.gray,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 8,
    color: Colors.primary,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    color: Colors.text,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
      fontSize: 16,
      color: Colors.text,
  },
  placeholderText: {
      color: Colors.text,
  },
  textArea: {
      height: 100,
      textAlignVertical: 'top',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
      height: 100,
      width: 100,
      borderRadius: 50,
      backgroundColor: Colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
      overflow: 'hidden',
  },
  logoPreview: {
      height: 100,
      width: 100,
  },
  uploadButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.primary,
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
  },
  uploadButtonText: {
      color: Colors.white,
      marginLeft: 8,
      fontWeight: '500',
  },
  fileUpload: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },
  fileUploadText: {
    marginLeft: 10,
    color: Colors.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.primary,
  },
  checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
  },
  checkbox: {
      width: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: Colors.lightGray,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: Colors.lightGray,
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  checkboxLabel: {
      marginLeft: 12,
      fontSize: 16,
      color: Colors.gray,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#A0AEC0',
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginBottom: 10,
marginTop: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
    modalItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    modalItemText: {
        fontSize: 18,
        textAlign: 'center',
        color: Colors.primary,
    },
    inputWrapper: {
        marginBottom: 16,
    },
});
