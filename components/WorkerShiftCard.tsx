import { differenceInHours, format } from 'date-fns';
import { getDistance } from 'geolib';
import { CheckCircle, Clock, Calendar, DollarSign, MapPin } from 'lucide-react-native';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { useLocation } from '../hooks/useLocation';
import { Shift } from '../types';

interface WorkerShiftCardProps {
  item: Shift;
  onPress: () => void;
  onSwipeApply?: () => void;
  isApplied?: boolean;
  isNew?: boolean;
  isConfirmed?: boolean;
  isOffered?: boolean;
}

// Create a type for objects that have a toDate method, like Firestore Timestamps.
// This ensures type safety without using `any`.
type TimestampLike = { toDate: () => Date };

const toDate = (date: Date | TimestampLike): Date => {
  // Use the `in` operator as a type guard to check for the `toDate` method.
  // This narrows the type to `TimestampLike` in a type-safe way.
  if (date && 'toDate' in date) {
    return date.toDate();
  }
  // If it's not a TimestampLike object, treat it as a Date.
  return new Date(date);
};

const WorkerShiftCard = ({ item, onPress, onSwipeApply, isApplied, isNew, isConfirmed, isOffered }: WorkerShiftCardProps): React.ReactElement => {
  const { location: userLocation } = useLocation();

  const calculateDistance = () => {
    if (userLocation && item.coordinates?.lat && item.coordinates?.lng) {
      const distanceInMeters = getDistance(
        { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
        { latitude: item.coordinates.lat, longitude: item.coordinates.lng }
      );
      const distanceInKm = distanceInMeters / 1000;
      return `${distanceInKm.toFixed(1)} km away`;
    }
    return null;
  };

  const distance = calculateDistance();

  const startTimeDate = toDate(item.startTime);
  const endTimeDate = toDate(item.endTime);

  const startTime = format(startTimeDate, 'h:mm a');
  const endTime = format(endTimeDate, 'h:mm a');
  const date = format(startTimeDate, 'EEE, MMM d');
  const duration = differenceInHours(endTimeDate, startTimeDate);
  const totalPay = (duration * item.pay).toFixed(2);

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const trans = dragX.interpolate({
      inputRange: [-80, 0],
      outputRange: [0, 80],
      extrapolate: 'clamp',
    });

    return (
      <TouchableOpacity onPress={onSwipeApply} style={styles.applyButton}>
        <Animated.View style={[styles.applyButtonContainer, { transform: [{ translateX: trans }] }]}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable renderRightActions={!isApplied && onSwipeApply ? renderRightActions : undefined}>
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <View style={styles.header}>
          <Text style={styles.role}>{item.role}</Text>
          <Text style={styles.payRate}>${item.pay}/hr</Text>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{item.venueName}{item.location ? `, ${item.location}` : ''}</Text>
          </View>
          {distance && <Text style={styles.distance}>({distance})</Text>}
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Calendar size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{date}</Text>
          </View>
          <View style={styles.detailItem}>
            <Clock size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{startTime} - {endTime}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.badgeContainer}>
            {isNew && (
              <View style={[styles.badge, styles.newBadge]}>
                <Text style={styles.badgeText}>New</Text>
              </View>
            )}
            {isOffered && (
              <View style={[styles.badge, styles.offeredBadge]}>
                <Text style={styles.badgeText}>Offered</Text>
              </View>
            )}
            {isConfirmed ? (
              <View style={[styles.badge, styles.confirmedBadge]}>
                <CheckCircle size={12} color={Colors.white} />
                <Text style={styles.badgeText}>Confirmed</Text>
              </View>
            ) : isApplied && (
              <View style={[styles.badge, styles.appliedBadge]}>
                <Text style={styles.badgeText}>Applied</Text>
              </View>
            )}
          </View>
          <View style={styles.detailItem}>
            <DollarSign size={16} color={Colors.primary} />
            <Text style={styles.totalPay}>${totalPay}</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  role: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: Fonts.sans,
  },
  payRate: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.primary,
    fontFamily: Fonts.sans,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginLeft: 6,
    fontFamily: Fonts.sans,
  },
  distance: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: Fonts.sans,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    paddingTop: 8,
    marginTop: 4,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
  },
  newBadge: {
    backgroundColor: Colors.primary,
  },
  appliedBadge: {
    backgroundColor: Colors.success,
  },
  confirmedBadge: {
    backgroundColor: Colors.success,
  },
  offeredBadge: {
    backgroundColor: Colors.warning,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: Fonts.sans,
  },
  totalPay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    fontFamily: Fonts.sans,
    marginLeft: 4,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: 80,
    borderRadius: 8,
    marginBottom: 10,
    paddingLeft: 20,
  },
  applyButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  applyButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
});

export default WorkerShiftCard;
