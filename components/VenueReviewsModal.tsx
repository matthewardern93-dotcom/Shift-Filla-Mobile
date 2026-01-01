
import React from 'react';
import { View, Text, StyleSheet, Modal, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { format } from 'date-fns';

// --- Mock Data ---
const mockReviews = [
    {
        id: '1',
        rating: 5,
        comment: 'A fantastic place to work. The management is very supportive, and the team is great. Highly recommended!',
        reviewer: 'John Doe',
        date: new Date(2024, 5, 15),
    },
    {
        id: '2',
        rating: 4,
        comment: 'Good experience overall. The shifts are flexible, and the pay is fair. Can get very busy on weekends.',
        reviewer: 'Jane Smith',
        date: new Date(2024, 4, 20),
    },
    {
        id: '3',
        rating: 5,
        comment: 'I love working here! The regulars are friendly and the tips are good.',
        reviewer: 'Alice Johnson',
        date: new Date(2024, 3, 10),
    },
     {
        id: '4',
        rating: 3,
        comment: 'It\'s an okay place to work. Management can be a bit disorganized at times, but my coworkers are great.',
        reviewer: 'Bob Brown',
        date: new Date(2024, 2, 28),
    },
];

const StarRating = ({ rating, size = 16 }: { rating: number, size?: number }) => {
    const totalStars = 5;
    return (
        <View style={styles.starContainer}>
            {[...Array(totalStars)].map((_, index) => (
                <FontAwesome
                    key={index}
                    name={index < rating ? 'star' : 'star-o'}
                    size={size}
                    color={Colors.gold}
                    style={{ marginRight: 2 }}
                />
            ))}
        </View>
    );
};

const ReviewCard = ({ review }: { review: any }) => (
    <View style={styles.reviewCard}>
        <View style={styles.reviewHeader}>
            <StarRating rating={review.rating} />
            <Text style={styles.reviewDate}>{format(review.date, 'MMM d, yyyy')}</Text>
        </View>
        <Text style={styles.reviewComment}>{review.comment}</Text>
        <Text style={styles.reviewerName}>- {review.reviewer}</Text>
    </View>
);

const VenueReviewsModal = ({ visible, onClose }: { visible: boolean, onClose: () => void }) => {
    const sortedReviews = [...mockReviews].sort((a, b) => b.date.getTime() - a.date.getTime());

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Feather name="x" size={24} color={Colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>All Reviews</Text>
                    <FlatList
                        data={sortedReviews}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <ReviewCard review={item} />}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        showsVerticalScrollIndicator={false}
                    />
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
});

export default VenueReviewsModal;
