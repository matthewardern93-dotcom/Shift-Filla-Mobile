
import React, { forwardRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';
import { Colors } from '../constants/colors';
import { PermanentJob } from '../types';
import { Swipeable } from 'react-native-gesture-handler';
import { Check, Briefcase, MapPin, DollarSign } from 'lucide-react-native';

interface CardProps {
  item: PermanentJob;
  onSwipeApply?: (item: PermanentJob) => void;
  onPress?: (item: PermanentJob) => void;
  isApplied?: boolean;
}

interface CardContentProps {
    item: PermanentJob;
    onPress?: (item: PermanentJob) => void;
    isApplied?: boolean;
}

const CardContent: React.FC<CardContentProps> = ({ item, onPress, isApplied }) => {
  const { title, businessName, location, type, salary } = item;

  const handlePress = () => {
      if(onPress) {
          onPress(item)
      }
  }

  return (
    <View style={styles.container}>
        <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
            <View style={styles.cardContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>{title}</Text>
                    {isApplied && (
                        <View style={styles.appliedBadge}>
                            <Check size={16} color={Colors.white} />
                            <Text style={styles.appliedText}>Applied</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.venueName}>{businessName}</Text>

                <View style={styles.detailRow}>
                    <Briefcase size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{type}</Text>
                </View>
                <View style={styles.detailRow}>
                    <MapPin size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{location}</Text>
                </View>
                <View style={styles.detailRow}>
                    <DollarSign size={16} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{salary}</Text>
                </View>
            </View>
        </TouchableOpacity>
    </View>
  )
};

const PTFTJobCard = forwardRef<Swipeable, CardProps>(({ item, onSwipeApply, onPress, isApplied }, ref) => {

  const renderRightActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    
    const handleSwipe = () => {
        if(onSwipeApply) {
            onSwipeApply(item)
        }
    }

    return (
        <TouchableOpacity onPress={handleSwipe} style={styles.applyBox}>
            <Animated.View style={[{ transform: [{ scale }] }]}><Check size={24} color="#fff" /></Animated.View>
            <Animated.Text style={[styles.applyText, { transform: [{ scale }] }]}>Apply</Animated.Text>
        </TouchableOpacity>
    );
  };

  if (onSwipeApply && !isApplied) {
    return (
        <Swipeable 
            ref={ref} 
            renderRightActions={renderRightActions} 
            friction={2} 
            rightThreshold={80}
        >
            <CardContent item={item} onPress={onPress} isApplied={isApplied} />
        </Swipeable>
    );
  }

  return <CardContent item={item} onPress={onPress} isApplied={isApplied} />;
});

PTFTJobCard.displayName = 'PTFTJobCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderColor: 'transparent',
  },
  cardContent: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  venueName: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginLeft: 10,
  },
  applyBox: {
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    borderRadius: 12,
    marginVertical: 8,
  },
  applyText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16,
      marginLeft: 8,
  },
  appliedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.green,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
  },
  appliedText: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 12,
      marginLeft: 4,
  },
});

export default PTFTJobCard;
