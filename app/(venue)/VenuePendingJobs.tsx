
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { JobData } from '../../types';
import JobCard from '../../components/JobCard';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { Colors } from '../../constants/colors';

const mockJobs: JobData[] = [
    {
        id: 'mockJob1',
        venueId: 'venue1',
        venueName: 'The Grand Eatery',
        title: 'Head Chef',
        location: '123 Culinary Ave, Foodie City',
        type: 'Full-Time',
        description: 'Seeking an experienced Head Chef to lead our kitchen team. Must have a passion for innovative cuisine and team management.',
        skills: ['kitchen_management', 'menu_planning', 'fine_dining'],
        payRate: 80000,
        payType: 'salary',
        status: 'open',
        applicants: [],
        createdAt: new Date(),
    },
    {
        id: 'mockJob2',
        venueId: 'venue1',
        venueName: 'The Corner Pub',
        title: 'Expert Mixologist',
        location: '456 Drink St, Bar Town',
        type: 'Part-Time',
        description: 'Creative mixologist wanted for a bustling downtown pub. Experience with craft cocktails is a must.',
        skills: ['bartending', 'mixology', 'customer_service'],
        payRate: 30,
        payType: 'hourly',
        status: 'open',
        applicants: [],
        createdAt: new Date(),
    },
];

const VenuePendingJobsScreen = () => {
  const [jobs, setJobs] = useState<JobData[]>(mockJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const allJobs = await getJobsByVenue(user.uid);
          const openJobs = allJobs.filter(job => job.status === 'open');
          setJobs(openJobs);
        } catch (err) {
          setError("Failed to fetch pending jobs.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []); */

  const renderContent = () => {
    if (isLoading) {
      return <ActivityIndicator size="large" color={Colors.primary} style={styles.centered} />;
    }

    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }

    if (jobs.length === 0) {
      return <Text style={styles.emptyText}>No pending jobs available at the moment.</Text>;
    }

    return (
      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} />}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <VenueScreenTemplate>
      <View style={styles.container}>
        <Text style={styles.title}>Pending Jobs</Text>
        {renderContent()}
      </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    textAlign: 'center',
    color: Colors.error,
    marginTop: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    marginTop: 20,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default VenuePendingJobsScreen;
