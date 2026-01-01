
import { Star } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

interface StarRatingProps {
  rating: number;
  size?: number;
  onRatingChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, size = 20, onRatingChange }) => {
  const handlePress = (index: number) => {
    if (onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <View style={styles.container}>
      {[...Array(5)].map((_, i) => {
        const isSelected = i < rating;
        return (
          <TouchableOpacity key={i} onPress={() => handlePress(i)} disabled={!onRatingChange}>
            <Star 
              size={size} 
              color={Colors.primary} 
              fill={isSelected ? Colors.primary : 'transparent'} 
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default StarRating;
