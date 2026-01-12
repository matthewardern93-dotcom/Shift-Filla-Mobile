
import React, { useState } from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';
import { Feather } from '@expo/vector-icons';
import { format } from 'date-fns';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import ShiftCostSummary from '../../components/ShiftCostSummary';
import { Shift } from '../../types';

interface DetailRowProps {
    label: string;
    value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}:</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

interface VenueShiftDetailsModalProps {
    isVisible: boolean;
    onClose: () => void;
    shift: Shift | null;
}

const VenueShiftDetailsModal: React.FC<VenueShiftDetailsModalProps> = ({ isVisible, onClose, shift }) => {
    const [isCancelling, setIsCancelling] = useState(false);

    if (!shift) return null;

    const startTime = shift.startTime instanceof firestore.Timestamp ? shift.startTime.toDate() : new Date(shift.startTime as any);
    const endTime = shift.endTime instanceof firestore.Timestamp ? shift.endTime.toDate() : new Date(shift.endTime as any);
    const breakMinutes = shift.breakDuration || 0;

    const durationInMinutes = Math.max(0, (endTime.getTime() - startTime.getTime()) / (1000 * 60));
    const totalHours = Math.max(0, (durationInMinutes - breakMinutes) / 60);
    const basePay = totalHours * shift.pay;
    const serviceFee = basePay * 0.12;
    const totalCost = basePay + serviceFee;

    const costDetails = {
        date: startTime,
        startTime,
        finishTime: endTime,
        breakDuration: breakMinutes,
        totalHours,
        basePay,
        serviceFee,
        totalCost,
    };

    const handleCancelShift = async () => {
        setIsCancelling(true);
        try {
            const manageShifts = functions().httpsCallable('manageShifts');
            await manageShifts({ 
                action: 'cancel', 
                shiftId: shift.id 
            });
            Alert.alert("Shift Cancelled", "The shift has been successfully cancelled.");
            onClose(); 
        } catch (error: any) {
            console.error("Error cancelling shift:", error);
            Alert.alert("Cancellation Failed", error.message || "An unexpected error occurred.");
        } finally {
            setIsCancelling(false);
        }
    };

    const confirmCancel = () => {
        Alert.alert(
            "Cancel Shift",
            "Are you sure you want to cancel this shift? This action cannot be undone.",
            [
                { text: "Don't Cancel", style: 'cancel' },
                { text: 'Yes, Cancel', style: 'destructive', onPress: handleCancelShift }
            ]
        )
    }

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>{shift.role} Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Feather name="x" size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                         <DetailRow label="Date" value={format(startTime, 'eeee, dd MMMM yyyy')} />
                        <DetailRow label="Time" value={`${format(startTime, 'HH:mm')} - ${format(endTime, 'HH:mm')}`} />
                        <DetailRow label="Pay Rate" value={`$${shift.pay.toFixed(2)} / hour`} />
                        
                        {shift.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Job Description</Text>
                                <Text style={styles.sectionContent}>{shift.description}</Text>
                            </View>
                        )}

                        {shift.uniform && (
                             <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Uniform</Text>
                                <Text style={styles.sectionContent}>{shift.uniform}</Text>
                            </View>
                        )}

                        {shift.requirements && shift.requirements.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Requirements</Text>
                                {shift.requirements.map((req, index) => (
                                    <Text key={index} style={styles.requirementItem}>• {req}</Text>
                                ))}
                            </View>
                        )}

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Shift Cost Summary</Text>
                            <ShiftCostSummary details={costDetails} />
                        </View>

                        <View style={styles.footer}>
                            <TouchableOpacity style={styles.cancelButton} onPress={confirmCancel} disabled={isCancelling}>
                                {isCancelling ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <Feather name="x-circle" size={18} color="#fff" style={{marginRight: 8}}/>
                                        <Text style={styles.cancelButtonText}>Cancel Shift</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
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
        borderRadius: 12,
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
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    closeButton: {},
    scrollContainer: { paddingBottom: 20 },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    detailLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    detailValue: {
        fontSize: 16,
        color: Colors.gray,
        flex: 1,
        textAlign: 'right',
    },
    section: {
        marginTop: 15,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        paddingTop: 15,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 10,
    },
    sectionContent: {
        fontSize: 16,
        color: Colors.text,
        lineHeight: 22,
    },
    requirementItem: {
        fontSize: 16,
        color: Colors.text,
        marginBottom: 5,
    },
    footer: {
        marginTop: 25,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        paddingTop: 20,
    },
    cancelButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.danger,
        paddingVertical: 14,
        borderRadius: 10,
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default VenueShiftDetailsModal;
