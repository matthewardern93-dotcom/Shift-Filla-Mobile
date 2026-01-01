import { format } from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Shift, WorkerProfile, PermanentJob } from '../types';
import { Users, Briefcase } from 'lucide-react-native';

type UnfilledItem = (Shift | PermanentJob) & { itemType: 'shift' | 'job' };

interface CardProps {
  item: UnfilledItem;
  worker?: WorkerProfile;
}

const ShiftCard: React.FC<CardProps> = ({ item, worker }) => {
  const router = useRouter();
  const { itemType } = item;

  const isUnfilled = ['posted', 'offered_to_worker', 'open'].includes(item.status);

  const handlePress = () => {
    if (itemType === 'shift') {
      if (isUnfilled) {
        router.push({
          pathname: '/(venue)/VenueShiftApplicants',
          params: { shiftId: item.id },
        });
      } else {
        router.push({
          pathname: '/(venue)/VenueShiftDetail',
          params: {
            shift: JSON.stringify(item),
            ...(worker && { worker: JSON.stringify(worker) }),
          },
        });
      }
    } else if (itemType === 'job') {
      router.push({
        pathname: '/(venue)/VenueJobApplicants',
        params: { jobId: item.id },
      });
    }
  };

  const renderContent = () => {
    if (itemType === 'shift') {
      const { role, startTime, endTime, payRate, applicantCount } = item as Shift;
      const startDate = startTime ? new Date(startTime) : new Date();
      const endDate = endTime ? new Date(endTime) : new Date();

      const calculateTotalPay = () => {
        if (payRate && startDate && endDate) {
          const durationInHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
          const validDuration = durationInHours < 0 ? durationInHours + 24 : durationInHours;
          return (validDuration * payRate).toFixed(2);
        }
        return 'N/A';
      };

      const formattedStartTime = format(startDate, 'p');
      const formattedEndTime = format(endDate, 'p');
      const formattedDate = format(startDate, 'MMM d, yyyy');
      const totalPay = calculateTotalPay();

      return (
        <View style={styles.cardContent}>
          <View style={styles.shiftDetails}>
            <Text style={styles.role}>{role}</Text>
            <Text style={styles.date}>{formattedDate}</Text>
            <Text style={styles.time}>{formattedStartTime} - {formattedEndTime}</Text>
            <Text style={styles.pay}>Est. Pay: ${totalPay}</Text>
          </View>
          <View style={styles.rightContent}>
            {worker ? (
              <View style={styles.workerInfo}>
                <Image source={{ uri: worker.profilePicture }} style={styles.avatar} />
                <Text style={styles.workerName} numberOfLines={2}>{`${worker.firstName} ${worker.lastName}`}</Text>
              </View>
            ) : (
              isUnfilled && (
                <View style={styles.applicantInfoContainer}>
                  <Users size={24} color={Colors.primary} />
                  <Text style={styles.applicantCount}>{applicantCount || 0}</Text>
                  <Text style={styles.applicantText}>Applicants</Text>
                </View>
              )
            )}
          </View>
        </View>
      );
    }

    if (itemType === 'job') {
        const { title, type, salary, applicantCount } = item as PermanentJob;
        return (
            <View style={styles.cardContent}>
                <View style={styles.shiftDetails}>
                    <View style={styles.jobTitleContainer}>
                        <Text style={styles.role}>{title}</Text>
                        <View style={[styles.badge, type === 'Full-Time' ? styles.fullTimeBadge : styles.partTimeBadge]}>
                            <Text style={styles.badgeText}>{type}</Text>
                        </View>
                    </View>
                    <Text style={styles.jobSalary}>{salary}</Text>
                    <Text style={styles.date}>Posted: {format(new Date(item.datePosted), 'MMM d, yyyy')}</Text>
                </View>
                <View style={styles.rightContent}>
                    <View style={styles.applicantInfoContainer}>
                        <Briefcase size={24} color={Colors.primary} />
                        <Text style={styles.applicantCount}>{applicantCount || 0}</Text>
                        <Text style={styles.applicantText}>Applicants</Text>
                    </View>
                </View>
            </View>
        )
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      {renderContent()}
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
  shiftDetails: {
    flex: 1,
  },
  role: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginRight: 8,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginVertical: 4,
  },
  time: {
    fontSize: 14,
    color: Colors.textSecondary,
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
    minWidth: 95,
    paddingLeft: 10,
  },
  workerInfo: {
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
    backgroundColor: Colors.lightGray,
  },
  workerName: {
    fontSize: 12,
    textAlign: 'center',
    color: Colors.text,
    maxWidth: 80,
  },
  applicantInfoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F2FF', // A light primary color
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  applicantCount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 2,
  },
  applicantText: {
      fontSize: 12,
      color: Colors.primary,
      fontWeight: '500'
  },
  // Job specific styles
  jobTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap'
  },
  jobSalary: {
      fontSize: 14,
      fontWeight: 'bold',
      color: Colors.primary,
      marginTop: 4,
  },
  badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 12,
      alignSelf: 'flex-start',
  },
  fullTimeBadge: {
      backgroundColor: Colors.green,
  },
  partTimeBadge: {
      backgroundColor: Colors.orange,
  },
  badgeText: {
      color: Colors.white,
      fontSize: 10,
      fontWeight: 'bold',
  },
});

export default ShiftCard;
