
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { JobData } from '../types';

interface JobCardProps {
  job: JobData;
}

const JobCard: React.FC<JobCardProps> = ({ job }) => {
  const router = useRouter();
  const { title, payRate, payType, status, id } = job;

  const handlePress = () => {
    router.push({ 
      pathname: '/(venue)/VenueJobApplicants', 
      params: { jobId: id } 
    });
  };

  const isOpen = status === 'open';

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.cardContent}>
        <View style={styles.jobDetails}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.pay}>${payRate} / {payType}</Text>
        </View>

        <View style={styles.rightContent}>
          {isOpen && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>OPEN</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 16,
    marginVertical: 8,
    elevation: 2,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  jobDetails: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  pay: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 8,
    fontWeight: 'bold',
  },
  rightContent: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  statusBadge: {
    backgroundColor: Colors.lightGray,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  statusText: {
    color: Colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default JobCard;
