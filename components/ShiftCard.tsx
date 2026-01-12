import { format, differenceInHours } from 'date-fns';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Shift, WorkerProfile } from '../types';
import { Users } from 'lucide-react-native';

interface ShiftCardProps {
  item: Shift;
  worker?: WorkerProfile;
}

const ShiftCard: React.FC<ShiftCardProps> = ({ item, worker }) => {
  const router = useRouter();
  const { role, startTime, endTime, pay, status, id, appliedWorkerIds } = item;

  const isUnfilled = ['posted', 'offered_to_worker'].includes(status);

  const handlePress = () => {
    if (isUnfilled) {
      router.push({
        pathname: '/(venue)/VenueShiftApplicants',
        params: { shiftId: id },
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
  };

  const startDate = startTime;
  const endDate = endTime;
  const formattedStartTime = format(startDate, 'p');
  const formattedEndTime = format(endDate, 'p');
  const formattedDate = format(startDate, 'MMM d, yyyy');
  const applicantCount = appliedWorkerIds?.length || 0;
  const duration = differenceInHours(endDate, startDate);
  const totalPay = (duration * pay).toFixed(2);

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
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
              {worker.profilePictureUrl && <Image source={{ uri: worker.profilePictureUrl }} style={styles.avatar} />}
              <Text style={styles.workerName} numberOfLines={2}>{`${worker.firstName} ${worker.lastName}`}</Text>
            </View>
          ) : (
            isUnfilled && (
              <View style={styles.applicantInfoContainer}>
                <Users size={24} color={Colors.primary} />
                <Text style={styles.applicantCount}>{applicantCount}</Text>
                <Text style={styles.applicantText}>Applicants</Text>
              </View>
            )
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
    backgroundColor: '#F4F2FF',
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
    fontWeight: '500',
  },
});

export default ShiftCard;
