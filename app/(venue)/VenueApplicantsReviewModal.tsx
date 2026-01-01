import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, FlatList, SafeAreaView } from 'react-native';
import { Colors } from '../../constants/colors';
import { X, Star } from 'lucide-react-native';
import { format } from 'date-fns';

const StarRating = ({ rating }) => (
    <View style={styles.starContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
            <Star 
                key={star} 
                size={16} 
                fill={star <= rating ? Colors.primary : 'none'} 
                color={star <= rating ? Colors.primary : Colors.lightGray} 
            />
        ))}
    </View>
);

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

// The modal now accepts the reviews directly as a prop.
const VenueApplicantsReviewModal = ({ isVisible, onClose, reviews = [] }) => {

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>All Reviews</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={28} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>
                    {reviews.length > 0 ? (
                        <FlatList
                            data={reviews}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => <ReviewCard review={item} />}
                            contentContainerStyle={styles.listContainer}
                        />
                    ) : (
                        <View style={styles.centeredMessage}>
                            <Text style={styles.noReviewsText}>This worker has no reviews yet.</Text>
                        </View>
                    )}
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        width: '100%',
        height: '90%',
        backgroundColor: '#F9F9FB',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        paddingBottom: 15,
        marginBottom: 15,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    closeButton: {},
    listContainer: { paddingBottom: 20 },
    reviewCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 15,
        marginBottom: 12,
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    reviewDate: {
        fontSize: 13,
        color: Colors.textSecondary,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    starContainer: {
        flexDirection: 'row',
    },
    ratingText: {
        marginLeft: 8,
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.text
    },
    reviewComment: {
        fontSize: 15,
        color: Colors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 22,
    },
    centeredMessage: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 50,
    },
    noReviewsText: {
        textAlign: 'center',
        fontSize: 16,
        color: Colors.textSecondary,
    }
});

export default VenueApplicantsReviewModal;
