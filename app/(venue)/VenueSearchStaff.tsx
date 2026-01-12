
import React from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../../constants/colors';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { usePreviouslyHiredStaff, PreviouslyHiredStaff } from '../../hooks/usePreviouslyHiredStaff'; // Import the new hook

const renderLeftActions = (worker: PreviouslyHiredStaff, close: () => void, router: any) => {
  return (
    <TouchableOpacity
      style={styles.leftAction}
      onPress={() => {
        router.push({
          pathname: '/(venue)/DirectShiftPost',
          params: { workerId: worker.id, workerName: `${worker.firstName} ${worker.lastName}`, workerProfileUrl: worker.profilePictureUrl },
        });
        close();
      }}
    >
      <Text style={styles.actionText}>Direct Offer</Text>
    </TouchableOpacity>
  );
};

const handleCardPress = (worker: PreviouslyHiredStaff, router: any) => {
  router.push({
      pathname: '/(venue)/VenueApplicantProfile',
      params: { 
          workerId: worker.id,
      },
    });
};

const WorkerCard = ({ worker, router }: { worker: PreviouslyHiredStaff, router: any }) => {
  const swipeableRef = React.useRef<Swipeable>(null);

  const closeSwipeable = () => {
      swipeableRef.current?.close();
  }

  return (
      <Swipeable ref={swipeableRef} renderLeftActions={() => renderLeftActions(worker, closeSwipeable, router)} friction={2}>
          <Pressable onPress={() => handleCardPress(worker, router)}>
              <View style={styles.card}>
                  <Image source={{ uri: worker.profilePictureUrl }} style={styles.profilePic} />
                  <View style={styles.cardContent}>
                      <Text style={styles.workerName}>{worker.firstName} {worker.lastName}</Text>
                      <Text style={styles.workerSkills}>{(worker.skills || []).join(' • ')}</Text>
                      <View style={styles.workerStats}>
                          <Text style={styles.rating}>⭐ {worker.avgRating?.toFixed(1) || 'N/A'}</Text>
                          <Text style={styles.jobs}>(✓ {worker.shiftsWithYou} shifts with you)</Text>
                      </View>
                  </View>
              </View>
          </Pressable>
      </Swipeable>
  );
}

const VenueSearchStaff = () => {
  const router = useRouter();
  const { staff, isLoading, error } = usePreviouslyHiredStaff(); // Use the hook

  const renderContent = () => {
    if (isLoading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
    }

    if (error) {
        return <View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View>;
    }

    if (staff.length === 0) {
        return <View style={styles.centered}><Text style={styles.emptyText}>You have not hired any staff yet. Completed shifts will appear here.</Text></View>;
    }

    return (
        <FlatList
            data={staff}
            keyExtractor={(item) => item.id!}
            renderItem={({ item }) => <WorkerCard worker={item} router={router} />}
            contentContainerStyle={styles.listContainer}
        />
    );
  }

  return (
    <VenueScreenTemplate>
      <View style={styles.container}>
        <Text style={styles.title}>Previously Hired Staff</Text>
        <Text style={styles.subtitle}>Swipe right to offer a shift, or tap to view a worker&apos;s profile.</Text>
        {renderContent()}
      </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 15 },
    title: { fontSize: 28, fontWeight: 'bold', color: Colors.primary, marginBottom: 4, marginTop: 20 },
    subtitle: { fontSize: 16, color: Colors.textSecondary, marginBottom: 20 },
    listContainer: { paddingBottom: 20 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    profilePic: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
    },
    cardContent: { flex: 1 },
    workerName: { fontSize: 18, fontWeight: 'bold', color: Colors.text },
    workerSkills: { fontSize: 14, color: Colors.textSecondary, marginVertical: 4 },
    workerStats: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
    rating: { fontSize: 14, fontWeight: 'bold', color: Colors.primary },
    jobs: { fontSize: 12, color: Colors.textSecondary, marginLeft: 10 },
    leftAction: {
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        borderRadius: 12,
        marginBottom: 15,
        marginRight: 10,
    },
    actionText: { color: '#fff', fontWeight: 'bold', fontSize: 16, padding: 10 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    errorText: { color: Colors.danger, fontSize: 16, textAlign: 'center' },
    emptyText: { color: Colors.textSecondary, fontSize: 16, textAlign: 'center', paddingHorizontal: 20 },
});

export default VenueSearchStaff;
