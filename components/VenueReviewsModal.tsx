
import { format } from 'date-fns';
import { Star, X } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Review } from '../types';

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => {
  const totalStars = 5;
  return (
    <View style={styles.starContainer}>
      {[...Array(totalStars)].map((_, index) => (
        <Star
          key={index}
          size={size}
          color={Colors.gold}
          fill={index < rating ? Colors.gold : 'transparent'}
          style={{ marginRight: 2 }}
        />
      ))}
    </View>
  );
};

const ReviewCard = ({ review }: { review: Review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <StarRating rating={review.rating} />
      <Text style={styles.reviewDate}>{format(new Date(review.date), 'MMM d, yyyy')}</Text>
    </View>
    <Text style={styles.reviewComment}>{review.comment}</Text>
    <Text style={styles.reviewerName}>- {review.reviewer.name}</Text>
  </View>
);

interface VenueReviewsModalProps {
  visible: boolean;
  onClose: () => void;
  reviews: Review[];
}

const VenueReviewsModal: React.FC<VenueReviewsModalProps> = ({ visible, onClose, reviews }) => {
  const sortedReviews = [...reviews].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>All Reviews</Text>
          {sortedReviews.length > 0 ? (
            <FlatList
              data={sortedReviews}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <ReviewCard review={item} />}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.noReviewsContainer}>
              <Text style={styles.noReviewsText}>No reviews available for this venue yet.</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.background,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 10,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'right',
  },
  starContainer: {
    flexDirection: 'row',
  },
  noReviewsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noReviewsText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default VenueReviewsModal;
