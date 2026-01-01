
import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Alert, ScrollView } from 'react-native';
import { Colors } from '../constants/colors';
import { Star, Building, Calendar, Clock } from 'lucide-react-native';
import { format, differenceInHours } from 'date-fns';
import { Shift } from '../types';

const WorkerViewVenueReviewsModal = ({ visible, shift, onSubmit, onClose }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');

    if (!shift) {
        return null; 
    }

    const startTime = new Date(shift.startTime);
    const endTime = new Date(shift.endTime);
    const duration = differenceInHours(endTime, startTime);
    const totalPay = (duration * shift.payRate).toFixed(2);

    const handleStarPress = (index) => {
        setRating(index + 1);
    };

    const handleSubmit = () => {
        if (rating === 0) {
            Alert.alert('Incomplete Review', 'Please select a star rating.');
            return;
        }
        if (comment.trim() === '') {
            Alert.alert('Incomplete Review', 'Please write a comment about your experience.');
            return;
        }
        onSubmit({ rating, comment, shiftId: shift.id });
        setRating(0);
        setComment('');
        if (onClose) {
            onClose();
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <ScrollView 
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{ flexGrow: 1 }}
                    >
                        <View style={styles.header}>
                            <Text style={styles.headerTitle}>Rate Your Shift</Text>
                        </View>

                        <View style={styles.shiftDetailsContainer}>
                            <Text style={styles.shiftRole}>{shift.role}</Text>
                            <View style={styles.detailItem}><Building size={16} color={Colors.textSecondary} /><Text style={styles.detailText}>{shift.venue.name}</Text></View>
                            <View style={styles.detailItem}><Calendar size={16} color={Colors.textSecondary} /><Text style={styles.detailText}>{format(startTime, 'eeee, MMM dd, yyyy')}</Text></View>
                            <View style={styles.detailItem}><Clock size={16} color={Colors.textSecondary} /><Text style={styles.detailText}>{`${format(startTime, 'p')} - ${format(endTime, 'p')} (${duration} hours)`}</Text></View>
                            <View style={styles.totalPayContainer}>
                                <Text style={styles.totalPayLabel}>Total Pay:</Text>
                                <Text style={styles.totalPayValue}>${totalPay}</Text>
                            </View>
                            <Text style={styles.invoiceText}>your invoice can be found at www.shiftfilla.com</Text>
                        </View>

                        <View style={styles.reviewContainer}>
                            <Text style={styles.reviewTitle}>How was your shift at {shift.venue.name}?</Text>
                            <View style={styles.starsContainer}>
                                {[...Array(5)].map((_, index) => (
                                    <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                                        <Star 
                                            size={40} 
                                            color={index < rating ? Colors.primary : Colors.lightGray} 
                                            fill={index < rating ? Colors.primary : 'transparent'} 
                                        />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        <TextInput
                            style={styles.commentInput}
                            placeholder="Share your experience..."
                            placeholderTextColor={Colors.textSecondary}
                            multiline
                            value={comment}
                            onChangeText={setComment}
                        />

                        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                            <Text style={styles.submitButtonText}>Submit Review</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        width: '90%',
        maxHeight: '85%',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        flex: 1,
    },
    header: {
        alignItems: 'center',
        paddingBottom: 10,
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray
    },
    headerTitle: { fontSize: 22, fontWeight: 'bold' },
    shiftDetailsContainer: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.lightGray, marginBottom: 20 },
    shiftRole: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    detailText: { marginLeft: 10, fontSize: 16, color: Colors.textSecondary },
    totalPayContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.extraLightGray },
    totalPayLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    totalPayValue: { marginLeft: 8, fontSize: 18, fontWeight: 'bold', color: Colors.primary },
    invoiceText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        fontSize: 12,
        marginTop: 8,
    },
    reviewContainer: { alignItems: 'center', marginVertical: 20 },
    reviewTitle: { fontSize: 18, fontWeight: '600', marginBottom: 20 },
    starsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
    commentInput: {
        borderWidth: 1,
        borderColor: Colors.lightGray,
        borderRadius: 10,
        padding: 15,
        height: 120,
        textAlignVertical: 'top',
        marginBottom: 20
    },
    submitButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 15, alignItems: 'center' },
    submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default WorkerViewVenueReviewsModal;
