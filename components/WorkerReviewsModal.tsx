import { format } from 'date-fns';
import { XCircle } from 'lucide-react-native';
import React from 'react';
import { FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import { Review } from '../types';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: Review;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => (
  <View style={styles.reviewCard}>
    <View style={styles.reviewHeader}>
      <Text style={styles.reviewerName}>{review.reviewer.name}</Text>
      <Text style={styles.reviewDate}>{format(new Date(review.date), 'PPP')}</Text>
    </View>
    <View style={styles.ratingContainer}>
      <StarRating rating={review.rating} />
      <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
    </View>
    <Text style={styles.reviewComment}>&quot;{review.comment}&quot;</Text>
  </View>
);

interface WorkerReviewsModalProps {
  isVisible: boolean;
  onClose: () => void;
  reviews: Review[];
}

const WorkerReviewsModal: React.FC<WorkerReviewsModalProps> = ({ isVisible, onClose, reviews = [] }) => {
  if (!isVisible) return null;

  return (
    <Modal animationType="slide" transparent={true} visible={isVisible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Past Reviews</Text>
            <TouchableOpacity onPress={onClose}>
              <XCircle size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ReviewCard review={item} />}
            ListEmptyComponent={<Text style={styles.noReviewsText}>No reviews yet.</Text>}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: Colors.white,
    borderRadius: 15,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reviewCard: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  reviewerName: {
    fontWeight: 'bold',
    fontSize: 16,
    color: Colors.text,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  noReviewsText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default WorkerReviewsModal;
