
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { usePermanentJobs } from '../../hooks/useJobs';
import { Colors } from '../../constants/colors';
import VenueJobCard from '../../components/venue/VenueJobCard';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { useAuth } from '../../hooks/useAuth';

const VenuePendingJobsScreen = () => {
  const { user } = useAuth();
  const { jobs, loading, error } = usePermanentJobs({ venueId: user?.uid, status: 'active' });

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />;
    }

    if (error) {
      // Safely display the error, whether it's an object or a string.
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error);
      return <Text style={styles.infoText}>Error loading jobs: {errorMessage}</Text>;
    }

    if (jobs.length === 0) {
      return <Text style={styles.infoText}>You have no active job postings.</Text>;
    }

    return (
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <VenueJobCard job={item} />}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <VenueScreenTemplate>
      <Stack.Screen options={{ title: 'Active Jobs' }} />
      <View style={styles.container}>
        <Text style={styles.header}>Your Active Job Postings</Text>
        {renderContent()}
      </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  listContent: {
    paddingBottom: 16,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default VenuePendingJobsScreen;
