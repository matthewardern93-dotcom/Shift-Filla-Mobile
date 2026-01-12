
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { PermanentJob } from '../types';
import { Colors } from '../constants/colors';
import { Eye, Users } from 'lucide-react-native';

interface VenueJobCardProps {
  job: PermanentJob;
}

// Define a type-safe mapping for status styles to resolve the implicit 'any' error.
// We map all non-active statuses to the 'closed' style to prevent UI changes.
const statusStyleMap: Record<NonNullable<PermanentJob['status']>, object> = {
  active: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    color: Colors.success,
  },
  closed: {
    backgroundColor: Colors.lightGray,
    color: Colors.textSecondary,
  },
  filled: {
    backgroundColor: Colors.lightGray,
    color: Colors.textSecondary,
  },
  deleted: {
    backgroundColor: Colors.lightGray,
    color: Colors.textSecondary,
  },
};

const VenueJobCard: React.FC<VenueJobCardProps> = ({ job }) => {
  const router = useRouter();

  const handlePress = () => {
    // The route type definitions are out of sync.
    // Casting to any is the only way to bypass the incorrect TS error without altering navigation logic.
    router.push({
      pathname: '/(venue)/ptft/[id]/manage' as any,
      params: { id: job.id },
    });
  };

  // Look up the style dynamically and provide a fallback.
  const statusStyle = job.status ? statusStyleMap[job.status] : statusStyleMap.closed;

  return (
    <TouchableOpacity style={styles.card} onPress={handlePress}>
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={[styles.status, statusStyle]}>{job.status}</Text>
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
