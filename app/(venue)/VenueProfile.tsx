
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Colors } from '../../constants/colors';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Feather, FontAwesome } from '@expo/vector-icons';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import VenueReviewsModal from '../../components/VenueReviewsModal';
import { useAuth } from '../../hooks/useAuth';
import { useVenueStore } from '../../app/store/venueStore';
import { updateUserProfile, uploadImage } from '../../services/users';
import { Review } from '../../types';

const profileSchema = z.object({
  venueName: z.string().min(1, 'Venue name is required'),
  about: z.string().optional(),
  phone: z.string().min(1, 'Contact number is required'),
  address: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const calculateAverageRating = (reviews?: Review[]) => {
    if (!reviews || reviews.length === 0) return 'N/A';
    const total = reviews.reduce((acc, review) => acc + review.rating, 0);
    return (total / reviews.length).toFixed(1);
};

const VenueProfileScreen = () => {
  const { user } = useAuth();
  const { profile, fetchVenueProfile, updateVenueProfile: updateStoreProfile, loading } = useVenueStore();
  const [saving, setSaving] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [isReviewsModalVisible, setReviewsModalVisible] = useState(false);

  const { control, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { venueName: '', about: '', phone: '', address: '' },
  });

  useEffect(() => {
    if (user?.uid) {
      fetchVenueProfile(user.uid);
    }
  }, [user, fetchVenueProfile]);

  useEffect(() => {
    if (profile) {
      reset({
        venueName: profile.venueName || '',
        about: profile.about || '',
        phone: profile.phone || '',
        address: profile.address || '',
      });
      setLogoImage(profile.logoUrl || null);
    }
  }, [profile, reset]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setLogoImage(result.assets[0].uri);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    if (!user || !profile) {
        Alert.alert("Error", "Authentication error. Please log in again.");
        return;
    }
    setSaving(true);
    try {
        let logoUrl = profile.logoUrl;
        if (logoImage && logoImage.startsWith('file:')) {
            logoUrl = await uploadImage(logoImage, `logos/${user.uid}`);
        }

        const updatedProfileData = { 
            ...profile, 
            ...data, 
            logoUrl, 
        };
        
        await updateUserProfile(user.uid, updatedProfileData);
        updateStoreProfile(updatedProfileData);

        Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
        console.error("Error updating profile:", error);
        Alert.alert('Error', 'Failed to update profile.');
    } finally {
        setSaving(false);
    }
  };
  
  const reviewCount = profile?.reviews?.length || 0;
  const averageRating = calculateAverageRating(profile?.reviews);

  if (loading) {
    return (
      <VenueScreenTemplate>
          <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
          </View>
      </VenueScreenTemplate>
    )
  }

  return (
    <VenueScreenTemplate>
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={pickImage} style={styles.logoContainer}>
                <Image source={{ uri: logoImage || undefined }} style={styles.logo} />
                <View style={styles.logoEditHint}><Feather name="edit-2" size={16} color={Colors.white} /></View>
            </TouchableOpacity>

            <View style={styles.statsContainer}>
                <TouchableOpacity onPress={() => setReviewsModalVisible(true)} style={styles.statBox} disabled={reviewCount === 0}>
                    <FontAwesome name="star" size={24} color={Colors.gold} />
                    <Text style={styles.statValue}>{averageRating}</Text>
                    <Text style={styles.statLabel}>{reviewCount} {reviewCount === 1 ? 'Review' : 'Reviews'}</Text>
                </TouchableOpacity>
                <View style={styles.statBox}>
                    <Feather name="calendar" size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{profile?.totalShiftsPosted || 0}</Text>
                    <Text style={styles.statLabel}>Shifts Posted</Text>
                </View>
            </View>
            
            <View style={styles.form}>
                <Text style={styles.label}>Venue Name</Text>
                <Controller control={control} name="venueName" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} />
                )} />
                {errors.venueName && <Text style={styles.errorText}>{errors.venueName.message}</Text>}

                <Text style={styles.label}>About</Text>
                <Controller control={control} name="about" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={[styles.input, styles.textArea]} onBlur={onBlur} onChangeText={onChange} value={value || ''} multiline />
                )} />

                <Text style={styles.label}>Contact Number</Text>
                <Controller control={control} name="phone" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value} keyboardType="phone-pad" />
                )} />
                {errors.phone && <Text style={styles.errorText}>{errors.phone.message}</Text>}
                
                <Text style={styles.label}>Address</Text>
                <Controller control={control} name="address" render={({ field: { onChange, onBlur, value } }) => (
                    <TextInput style={styles.input} onBlur={onBlur} onChangeText={onChange} value={value || ''} />
                )} />

                 <TouchableOpacity onPress={handleSubmit(onSubmit)} style={styles.saveButton} disabled={saving}>
                    {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.saveButtonText}>Save Changes</Text>}
                </TouchableOpacity>
            </View>
        </ScrollView>

        <VenueReviewsModal 
            visible={isReviewsModalVisible} 
            onClose={() => setReviewsModalVisible(false)} 
            reviews={profile?.reviews || []}
        />
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 20, position: 'relative', marginTop: 20 },
  logo: { width: 120, height: 120, borderRadius: 60, backgroundColor: Colors.lightGray, borderWidth: 3, borderColor: Colors.primary },
  logoEditHint: { position: 'absolute', bottom: 5, right: '35%', backgroundColor: Colors.primary, borderRadius: 15, padding: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statBox: { alignItems: 'center', padding: 20, borderRadius: 12, backgroundColor: Colors.white, width: '48%', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  form: { paddingBottom: 40 },
  label: { fontSize: 16, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 10 },
  input: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, paddingHorizontal: 15, paddingVertical: 12, fontSize: 16, color: Colors.text },
  textArea: { height: 120, textAlignVertical: 'top' },
  errorText: { color: Colors.danger, marginTop: 4 },
  saveButton: { backgroundColor: Colors.primary, borderRadius: 8, padding: 15, alignItems: 'center', marginTop: 30 },
  saveButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});

export default VenueProfileScreen;
