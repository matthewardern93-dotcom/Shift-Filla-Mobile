
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors } from '../../constants/colors';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather, FontAwesome } from '@expo/vector-icons';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { skillsList } from '../../constants/Skills';
import WorkerReviewsModal from '../../components/WorkerReviewsModal';
import { locationsList } from '../../constants/Cities';
import { CustomPicker as Picker } from '../../components/Picker';
import * as DocumentPicker from 'expo-document-picker';
import { useWorkerProfile } from '../../hooks/useWorkerProfile'; // Import the hook
import functions from '@react-native-firebase/functions';
import storage from '@react-native-firebase/storage';

// Zod schema for validation
const profileSchema = z.object({
  phone: z.string().min(1, 'Contact number is required'),
  about: z.string().optional(),
});

interface DocumentRowProps {
    docName: string | null;
    docType: string;
    onUpdate: () => void;
    onView: () => void;
}

const DocumentRow = ({ docName, docType, onUpdate, onView }: DocumentRowProps) => (
    <View style={styles.documentRow}>
        <View>
            <Text style={styles.documentTypeLabel}>{docType}</Text>
            <Text style={styles.documentName}>{docName || 'Not Uploaded'}</Text>
        </View>
        <View style={styles.documentActions}>
            {docName && <TouchableOpacity onPress={onView} style={styles.docActionButton}>
                <Feather name="eye" size={20} color={Colors.primary} />
            </TouchableOpacity>}
            <TouchableOpacity onPress={onUpdate} style={styles.docActionButton}>
                <Feather name="upload" size={20} color={Colors.primary} />
            </TouchableOpacity>
        </View>
    </View>
);

interface DocState {
    name: string;
    uri: string;
    type: 'new';
}

const WorkerProfileScreen = () => {
  const { profile, isLoading, error } = useWorkerProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isReviewsModalVisible, setReviewsModalVisible] = useState(false);

  // Local state for UI changes before saving
  const [profilePictureUri, setProfilePictureUri] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string | undefined>(undefined);
  const [documents, setDocuments] = useState<Record<string, DocState | string>>({});

  const { control, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { about: '', phone: '' },
  });

  useEffect(() => {
    if (profile) {
      setValue('about', profile.description || '');
      setValue('phone', profile.phone || '');
      setSelectedSkills(profile.skills || []);
      setSelectedCity(profile.city);
      setProfilePictureUri(profile.profilePictureUrl || null);
      setDocuments({});
    }
  }, [profile, setValue]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePictureUri(result.assets[0].uri);
    }
  };

  const handleDocumentUpload = async (docType: string) => {
    try {
        const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf' });
        if (!result.canceled) {
            const docKey = docType.toLowerCase();
            setDocuments(prev => ({ ...prev, [docKey]: { name: result.assets[0].name, uri: result.assets[0].uri, type: 'new' }}));
            Alert.alert('Ready for Upload', `New ${docType} will be uploaded when you save.`);
        }
    } catch (err) {
        console.error("Error picking document: ", err);
        Alert.alert('Upload Failed', 'There was an error selecting the document.');
    }
  };

  const viewDocument = (doc: DocState | string) => {
      const docName = typeof doc === 'string' ? doc : doc.name;
      Alert.alert('View Document', `This would open the document: ${docName}`);
  };

  const toggleSkill = (skillId: string) => {
    setSelectedSkills(prev => prev.includes(skillId) ? prev.filter(s => s !== skillId) : [...prev, skillId]);
  };

  const onSubmit = async (data: {phone: string, about?: string}) => {
    if (!profile || !profile.id) return;
    setIsSaving(true);

    try {
        let profilePictureUrl = profile.profilePictureUrl;
        if (profilePictureUri && profilePictureUri !== profile.profilePictureUrl) {
            const storageRef = storage().ref(`worker-profiles/${profile.id}/profilePicture.jpg`);
            await storageRef.putFile(profilePictureUri);
            profilePictureUrl = await storageRef.getDownloadURL();
        }

        const uploadedDocuments: Record<string, string> = {};
        for (const key in documents) {
            const doc = documents[key];
            if (typeof doc !== 'string' && doc.type === 'new') {
                const docRef = storage().ref(`worker-documents/${profile.id}/${key}-${doc.name}`);
                await docRef.putFile(doc.uri);
                uploadedDocuments[key] = await docRef.getDownloadURL();
            } else if (typeof doc === 'string') {
                uploadedDocuments[key] = doc;
            }
        }

        const updateProfileFunction = functions().httpsCallable('updateWorkerProfile');
        await updateProfileFunction({
            contactNumber: data.phone,
            about: data.about,
            skills: selectedSkills,
            city: selectedCity,
            profilePictureUrl: profilePictureUrl,
            documents: uploadedDocuments,
        });

        Alert.alert('Profile Saved', 'Your profile has been successfully updated.');
    } catch (error) {
        console.error('Error updating profile:', error);
        Alert.alert('Save Failed', 'An error occurred while saving your profile.');
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
      return <WorkerScreenTemplate><View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View></WorkerScreenTemplate>;
  }

  if (error || !profile) {
      return <WorkerScreenTemplate><View style={styles.centered}><Text>{error || "Could not load profile."}</Text></View></WorkerScreenTemplate>;
  }
  
  const documentTypes = [{key: 'resume', label: 'Resume'}, {key: 'id', label: 'ID'}, {key: 'visa', label: 'Visa'}];

  const getDocName = (doc: DocState | string | undefined): string | null => {
    if (!doc) return null;
    if (typeof doc === 'string') {
        try {
            const url = new URL(doc);
            const pathName = url.pathname;
            const decodedPathName = decodeURIComponent(pathName);
            const parts = decodedPathName.split('/');
            const fileNamePart = parts.pop() || '';
            const name = fileNamePart.split('?')[0];
            return name.split('-').slice(1).join('-') || name;
        } catch (e) {
            return 'Invalid URL';
        }
    }
    return doc.name;
  }

  return (
    <WorkerScreenTemplate>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
                <Image source={{ uri: profilePictureUri || undefined }} style={styles.avatar} />
                <View style={styles.avatarEditHint}><Feather name="edit-2" size={16} color={Colors.white} /></View>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
                <TouchableOpacity style={styles.statBox} onPress={() => setReviewsModalVisible(true)}>
                    <FontAwesome name="star" size={24} color={Colors.gold} />
                    <Text style={styles.statValue}>{profile.avgRating?.toFixed(1) || 'N/A'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </TouchableOpacity>
                <View style={styles.statBox}>
                    <Feather name="check-square" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{profile.completedShifts || 0}</Text>
                    <Text style={styles.statLabel}>Shifts Done</Text>
                </View>
            </View>
            
            <View style={styles.form}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput style={[styles.input, styles.readOnlyInput]} value={`${profile.firstName} ${profile.lastName}`} editable={false} />

                <Text style={styles.label}>Email Address</Text>
                 <TextInput style={[styles.input, styles.readOnlyInput]} value={profile.email} editable={false} />

                <Text style={styles.label}>Contact Number</Text>
                <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="phone-pad" />
                )} />
                {errors.phone && <Text style={styles.errorText}>{errors.phone.message as string}</Text>}

                <Text style={styles.label}>About Me</Text>
                <Controller control={control} name="about" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={[styles.input, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value} multiline />
                )} />

                <Text style={styles.label}>My Skills</Text>
                <View style={styles.skillsContainer}>
                    {skillsList.map(skill => (
                        <TouchableOpacity 
                            key={skill.id} 
                            style={[styles.skillChip, selectedSkills.includes(skill.id) ? styles.skillChipSelected : {}]} 
                            onPress={() => toggleSkill(skill.id)}
                        >
                            <Text style={[styles.skillChipText, selectedSkills.includes(skill.id) ? styles.skillChipTextSelected : {}]}>{skill.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.label}>City</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        options={locationsList}
                        selectedValue={selectedCity || null}
                        onValueChange={(itemValue) => setSelectedCity(itemValue as string)}
                    />
                </View>

                <Text style={styles.label}>Documents</Text>
                <View style={styles.documentsSection}>
                    {documentTypes.map((doc) => (
                        <DocumentRow
                            key={doc.key}
                            docType={doc.label}
                            docName={getDocName(documents[doc.key])}
                            onUpdate={() => handleDocumentUpload(doc.label)}
                            onView={() => viewDocument(documents[doc.key])}
                        />
                    ))}
                </View>

                 <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.saveButton} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveButtonText}>Save Profile</Text>}\
                </TouchableOpacity>
            </View>
        </ScrollView>
        <WorkerReviewsModal
            isVisible={isReviewsModalVisible}
            onClose={() => setReviewsModalVisible(false)}
            reviews={[]}
        />
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginBottom: 20, position: 'relative', marginTop: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.lightGray, borderWidth: 3, borderColor: Colors.primary },
  avatarEditHint: { position: 'absolute', bottom: 5, right: '35%', backgroundColor: Colors.primary, borderRadius: 15, padding: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statBox: { alignItems: 'center', padding: 20, borderRadius: 12, backgroundColor: Colors.white, width: '48%', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  form: { paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: Colors.text },
  readOnlyInput: { backgroundColor: Colors.lightGray, color: Colors.textSecondary },
  textArea: { height: 120, textAlignVertical: 'top' },
  errorText: { color: Colors.danger, marginTop: 4 },
  skillsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  skillChip: { backgroundColor: Colors.lightGray, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 15, margin: 4 },
  skillChipSelected: { backgroundColor: Colors.primary },
  skillChipText: { color: Colors.text, fontSize: 14 },
  skillChipTextSelected: { color: Colors.white },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
  pickerContainer: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, justifyContent: 'center' },
  documentsSection: { backgroundColor: '#fff', borderRadius: 12, marginTop: 5, borderWidth: 1, borderColor: Colors.lightGray },
  documentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
  documentTypeLabel: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  documentName: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  documentActions: { flexDirection: 'row', alignItems: 'center' },
  docActionButton: { marginLeft: 15, padding: 5 },
});

export default WorkerProfileScreen;
