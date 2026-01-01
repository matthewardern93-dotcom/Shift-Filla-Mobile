import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../services/firebase';
import { WorkerProfile } from '../../types';

const useWorkerProfile = (workerId: string) => {
  const [worker, setWorker] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workerId) {
      setIsLoading(false);
      setError("No worker ID provided.");
      return;
    }

    const fetchWorker = async () => {
      setIsLoading(true);
      try {
        const workerRef = doc(firestore, "WorkerProfiles", workerId);
        const workerSnap = await getDoc(workerRef);

        if (!workerSnap.exists()) {
          throw new Error("Worker not found.");
        }

        setWorker({ id: workerSnap.id, ...workerSnap.data() } as WorkerProfile);

      } catch (e: any) {
        console.error("Error fetching worker profile:", e);
        setError(e.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorker();
  }, [workerId]);

  return { worker, isLoading, error };
};


const VenueApplicantProfileScreen = () => {
  const router = useRouter();
  const { workerId } = useLocalSearchParams<{ workerId: string }>();
  const { worker, isLoading, error } = useWorkerProfile(workerId);

  if (isLoading) {
    return (
      <VenueScreenTemplate>
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </VenueScreenTemplate>
    );
  }

  if (error) {
    return (
      <VenueScreenTemplate>
        <View style={styles.centeredContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </VenueScreenTemplate>
    );
  }

  if (!worker) {
    return null; 
  }

  return (
    <VenueScreenTemplate>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft color={Colors.primary} size={28} />
                <Text style={styles.backButtonText}>Back to Applicants</Text>
            </TouchableOpacity>

            <View style={styles.profileHeader}>
                <Image source={{ uri: worker.profilePictureUrl || 'https://via.placeholder.com/100' }} style={styles.profileImage} />
                <Text style={styles.workerName}>{worker.firstName} {worker.lastName}</Text>
                <View style={styles.workerStats}>
                    <Text style={styles.rating}>⭐ {worker.ratings?.average?.toFixed(1) || 'New'}</Text>
                    <Text style={styles.jobs}>({worker.reliabilityScore || 0} shifts completed)</Text>
                </View>
            </View>
            
            <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <Text style={styles.skillsText}>{(worker.skills || []).join(' • ')}</Text>
            </View>

             <View style={styles.detailsSection}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.aboutText}>{worker.bio}</Text>
            </View>

        </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
      fontSize: 16,
      color: Colors.danger,
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    backgroundColor: Colors.background
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 18,
    color: Colors.primary,
    marginLeft: 8,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    borderWidth: 3,
    borderColor: Colors.primary,
    backgroundColor: Colors.lightGray,
  },
  workerName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: Colors.text,
  },
   workerStats: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8 
  },
  rating: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: Colors.primary, 
    marginRight: 10
  },
  jobs: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
        width: 0,
        height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.00,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold', 
    color: Colors.text,
    marginBottom: 10,
  },
  skillsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
    aboutText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
});

export default VenueApplicantProfileScreen;
