
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Job } from '../../types'; // Fix 1: Correct the type to 'Job'
import { Colors } from '../../constants/colors'; // Fix 2: Correct the import path
import { Eye, Users } from 'lucide-react-native';

interface VenueJobCardProps {
  job: Job;
}

const VenueJobCard: React.FC<VenueJobCardProps> = ({ job }) => {
  const router = useRouter();

  const handlePress = () => {
    // Fix 3: Correct the navigation path to a valid, existing route
    router.push({
      pathname: '/(worker)/WorkerViewJobDetailsCard',
      params: { job: JSON.stringify(job) },
    });
  };

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={[styles.status, job.status === 'active' ? styles.status_active : styles.status_closed]}>
            {job.status}
        </Text>
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.stat}>
          <Eye size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{job.viewCount || 0} Views</Text>
        </View>
        <View style={styles.stat}>
          <Users size={16} color={Colors.textSecondary} />
          <Text style={styles.statText}>{job.applicantCount || 0} Applicants</Text>
        </View>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>View Details & Manage Applicants</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    textTransform: 'capitalize',
    overflow: 'hidden',
  },
  status_active: {
    backgroundColor: '#E0F2F1',
    color: Colors.primary,
  },
  status_closed: {
    backgroundColor: Colors.lightGray,
    color: Colors.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 12,
    marginTop: 4,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
});

export default VenueJobCard;
