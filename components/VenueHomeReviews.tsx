
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../constants/colors';
import { Review } from '../types'; // Assuming Review type is defined in types.ts
import { format } from 'date-fns';

interface VenueHomeReviewsProps {
  reviews?: Review[];
}

const VenueHomeReviews: React.FC<VenueHomeReviewsProps> = ({ reviews }) => {

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        color={i < rating ? Colors.primary : Colors.lightGray}
        fill={i < rating ? Colors.primary : 'transparent'}
      />
    ));
  };

  const renderItem = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.workerName}>{item.reviewer.name || 'Anonymous'}</Text>
        <View style={styles.ratingContainer}>{renderStars(item.rating)}</View>
      </View>
      {item.comment && <Text style={styles.comment}>{item.comment}</Text>}
      <Text style={styles.date}>{item.date ? format(new Date(item.date), 'PP') : ''}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Worker Reviews</Text>
      {reviews && reviews.length > 0 ? (
        <FlatList
          data={reviews}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.noReviewsContainer}>
          <Text style={styles.noReviewsText}>No reviews have been submitted yet.</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 15,
    marginBottom: 10,
  },
  listContainer: {
    paddingLeft: 15,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    width: 280,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
  noReviewsContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 10,
    marginHorizontal: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  noReviewsText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default VenueHomeReviews;
