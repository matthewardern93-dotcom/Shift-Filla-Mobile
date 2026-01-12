import { format, differenceInHours } from 'date-fns';
import { X, Star, Building, Calendar, Clock } from 'lucide-react-native';
import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { Colors } from '../constants/colors';
import { Shift } from '../types';

interface WorkerPostShiftReviewModalProps {
  shift: Shift;
  visible: boolean;
  onClose: () => void;
  onSubmit: (rating: number) => void;
}

const WorkerPostShiftReviewModal: React.FC<WorkerPostShiftReviewModalProps> = ({ shift, visible, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);

  if (!shift) return null;

  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const duration = differenceInHours(endTime, startTime);
  const totalPay = (duration * (shift.pay || 0)).toFixed(2);

  const handleStarPress = (index: number) => {
    setRating(index + 1);
  };

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Rating required", "Please select a rating before submitting.");
      return;
    }
    onSubmit(rating);
  };

  const openInvoiceLink = () => {
    Linking.openURL('https://shiftfilla.com').catch(err => console.error("Couldn't load page", err));
  };

  return (
    <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Shift Completed!</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={28} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.shiftDetailsContainer}>
            <Text style={styles.shiftRole}>{shift.role}</Text>
            <View style={styles.detailItem}>
              <Building size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{shift.venueName}</Text>
            </View>
            <View style={styles.detailItem}>
              <Calendar size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{format(startTime, 'eeee, MMM dd, yyyy')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Clock size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>{`${format(startTime, 'p')} - ${format(endTime, 'p')} (${duration} hours)`}</Text>
            </View>
          </View>

          <View style={styles.paymentContainer}>
            <Text style={styles.paymentTitle}>Total Earnings</Text>
            <Text style={styles.paymentAmount}>${totalPay}</Text>
            <TouchableOpacity onPress={openInvoiceLink}>
              <Text style={styles.invoiceText}>Invoice can be found at shiftfilla.com</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.reviewContainer}>
            <Text style={styles.reviewTitle}>How was your shift at {shift.venueName}?</Text>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, index) => (
                <TouchableOpacity key={index} onPress={() => handleStarPress(index)}>
                  <Star size={40} color={index < rating ? Colors.primary : Colors.lightGray} fill={index < rating ? Colors.primary : 'transparent'} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Submit Review</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.7)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { width: '90%', backgroundColor: '#fff', borderRadius: 20, padding: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.primary },
  closeButton: {},
  shiftDetailsContainer: { marginBottom: 25 },
  shiftRole: { fontSize: 22, fontWeight: '600', color: Colors.text, marginBottom: 10 },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  detailText: { fontSize: 16, color: Colors.textSecondary, marginLeft: 10 },
  paymentContainer: { alignItems: 'center', marginBottom: 25, paddingVertical: 20, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.lightGray },
  paymentTitle: { fontSize: 18, color: Colors.textSecondary, marginBottom: 5 },
  paymentAmount: { fontSize: 36, fontWeight: 'bold', color: Colors.primary, marginBottom: 10 },
  invoiceText: { fontSize: 14, color: Colors.primary, textDecorationLine: 'underline' },
  reviewContainer: { alignItems: 'center', marginBottom: 30 },
  reviewTitle: { fontSize: 18, fontWeight: '500', color: Colors.text, marginBottom: 20, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', justifyContent: 'space-around', width: '80%' },
  submitButton: { backgroundColor: Colors.primary, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  submitButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default WorkerPostShiftReviewModal;
