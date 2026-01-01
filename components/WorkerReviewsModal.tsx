
import { format } from 'date-fns';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';
import StarRating from './StarRating';
import { Feather } from '@expo/vector-icons';

const ReviewCard = ({ review }) => (
    <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
            <Text style={styles.reviewerName}>{review.venue}</Text>
            <Text style={styles.reviewDate}>{format(new Date(review.date), "PPP")}</Text>
        </View>
        <View style={styles.ratingContainer}>
             <StarRating rating={review.rating} />
             <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
        </View>
        <Text style={styles.reviewComment}>"{review.comment}"</Text>
    </View>
);

const WorkerReviewsModal = ({ isVisible, onClose, reviews = [] }) => {
    if (!isVisible) return null;

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Past Reviews</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Feather name="x-circle" size={24} color={Colors.textSecondary} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView>
                        {reviews.length > 0 ? (
                            reviews.map((review, index) => <ReviewCard key={index} review={review} />)
                        ) : (
                            <Text style={styles.noReviewsText}>No reviews yet.</Text>
                        )}
                    </ScrollView>
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
