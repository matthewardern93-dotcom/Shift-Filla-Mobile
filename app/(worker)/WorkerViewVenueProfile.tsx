import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Star, Calendar } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { Image } from 'expo-image';
import WorkerViewVenueReviewsModal from '../../components/WorkerViewVenueReviewsModal';
import { useVenueProfile } from '../../hooks/useVenueProfile'; // Import the hook

const WorkerViewVenueProfile = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { venueId } = params;
  const { profile: venue, isLoading, error } = useVenueProfile(venueId as string);
  const [isReviewsModalVisible, setReviewsModalVisible] = useState(false);

  if (isLoading) {
    return <WorkerScreenTemplate><View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View></WorkerScreenTemplate>;
  }

  if (error || !venue) {
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error || "Venue not found."}</Text>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButtonCentered}>
                    <ArrowLeft color={Colors.primary} size={28} />
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </WorkerScreenTemplate>
    );
  }

  const reviewCount = venue.reviews?.length || 0;

  return (
    <WorkerScreenTemplate>
        <ScrollView style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft color={Colors.primary} size={28} />
            </TouchableOpacity>

            <View style={styles.profileHeader}>
                <Image source={{ uri: venue.logoUrl }} style={styles.profileImage} />
                <Text style={styles.venueName}>{venue.venueName}</Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Star size={24} color={Colors.gold} />
                    <Text style={styles.statValue}>{venue.rating?.toFixed(1) || 'N/A'}</Text>
                    <Text style={styles.statLabel}>Rating</Text>
                </View>
                <View style={styles.statBox}>
                    <Calendar size={24} color={Colors.primary} />
                    <Text style={styles.statValue}>{venue.totalShiftsPosted || 0}</Text>
                    <Text style={styles.statLabel}>Shifts Posted</Text>
                </View>
            </View>

            <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>About {venue.venueName}</Text>
                <Text style={styles.aboutText}>{venue.about || 'No description provided.'}</Text>
            </View>

             <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Location</Text>
                <View style={styles.locationRow}>
                    <MapPin size={20} color={Colors.textSecondary} />
                    <Text style={styles.addressText}>{`${venue.address}, ${venue.city}`}</Text>
                </View>
            </View>

            <TouchableOpacity style={styles.reviewsButton} onPress={() => setReviewsModalVisible(true)}>
                 <Text style={styles.reviewsButtonText}>View Worker Reviews ({reviewCount})</Text>
            </TouchableOpacity>

        </ScrollView>

        <WorkerViewVenueReviewsModal 
            visible={isReviewsModalVisible}
            onClose={() => setReviewsModalVisible(false)}
            reviews={venue.reviews || []}
            venueName={venue.venueName}
        />
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 15, backgroundColor: Colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { fontSize: 18, color: Colors.danger, textAlign: 'center', marginBottom: 20 },
  backButton: { marginTop: 50, marginBottom: 20, width: 50 },
  backButtonCentered: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 10 },
  backButtonText: { color: Colors.primary, fontSize: 18, marginLeft: 10 },
  profileHeader: { alignItems: 'center', marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 15, borderWidth: 3, borderColor: Colors.primary, backgroundColor: Colors.lightGray },
  venueName: { fontSize: 28, fontWeight: 'bold', color: Colors.text, textAlign: 'center' },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statBox: { alignItems: 'center', padding: 20, borderRadius: 12, backgroundColor: Colors.white, width: '48%', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: Colors.text, marginTop: 4 },
  statLabel: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  detailsSection: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 12 },
  aboutText:. { fontSize: 16, color: Colors.text, lineHeight: 24 },
  locationRow: { flexDirection: 'row', alignItems: 'center' },
  addressText: { fontSize: 16, color: Colors.textSecondary, marginLeft: 10, flexShrink: 1 },
  reviewsButton: { backgroundColor: Colors.primary, borderRadius: 8, padding: 15, alignItems: 'center', marginVertical: 20 },
  reviewsButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});

export default WorkerViewVenueProfile;
