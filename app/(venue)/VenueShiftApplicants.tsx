import React, { useState, useRef, forwardRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Star, Briefcase, Check } from 'lucide-react-native';
import VenueShiftDetailsModal from './VenueShiftDetailsModal';
import { format } from 'date-fns';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useShiftApplicants } from '../../hooks/useShiftApplicants';
import { Shift, WorkerProfile } from '../../types';

// Extended types to include properties not in the base types
interface ShiftWithDetails extends Shift {
  hourlyRate: number;
  offers?: { [key: string]: boolean };
}

interface Applicant extends WorkerProfile {
  ratings?: {
    average?: number;
  };
  reliabilityScore?: number;
}

const ConfirmationModal = ({ isVisible, onClose, onConfirm, title, message, confirmText, cancelText }: { isVisible: boolean, onClose: () => void, onConfirm: () => void, title: string, message: string, confirmText: string, cancelText: string }) => {
    if (!isVisible) return null;

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={isVisible}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.confirmModalContent}>
                    <Text style={styles.modalTitle}>{title}</Text>
                    <Text style={styles.modalMessage}>{message}</Text>
                    <View style={styles.modalButtonContainer}>
                        <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>{cancelText}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={onConfirm}>
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const ShiftSummaryCard = ({ shift, onPress }: { shift: ShiftWithDetails | null, onPress: () => void }) => {
    if (!shift) return null;
    return (
        <TouchableOpacity style={styles.summaryCard} onPress={onPress}>
            <View style={styles.summaryHeader}>
                <Briefcase size={22} color={Colors.primary} />
                <Text style={styles.summaryRole}>{shift.role}</Text>
            </View>
            <View style={styles.summaryDetails}>
                 <Text style={styles.summaryText}>{format(new Date(shift.startTime), 'eee, MMM d')}</Text>
                 <Text style={styles.summaryText}>{format(new Date(shift.startTime), 'p')} - {format(new Date(shift.endTime), 'p')}</Text>
                 <Text style={styles.summaryText}><Text style={{fontWeight: 'bold'}}>${shift.hourlyRate.toFixed(2)}</Text> / hour</Text>
            </View>
            <View style={styles.viewDetailsPrompt}><Text style={styles.viewDetailsText}>Tap to view shift details</Text></View>
        </TouchableOpacity>
    );
};

const ApplicantCard = forwardRef(({ applicant, onPress, onSwipeableWillOpen, shift }: { applicant: Applicant, onPress: () => void, onSwipeableWillOpen: () => void, shift: ShiftWithDetails }, ref: React.Ref<Swipeable>) => {
    const isOffered = shift.offers && shift.offers[applicant.id || ''];

    const renderLeftActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
        return (
            <TouchableOpacity onPress={onSwipeableWillOpen} style={styles.offerBox}>
                <Animated.View style={[{ transform: [{ scale }] }]}><Check size={24} color="#fff" /></Animated.View>
                <Animated.Text style={[styles.offerText, { transform: [{ scale }] }]}>Offer</Animated.Text>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable 
            ref={ref} 
            renderLeftActions={renderLeftActions} 
            onSwipeableWillOpen={onSwipeableWillOpen} 
            friction={2} 
            leftThreshold={80}
            enabled={!isOffered} // Disable swipe if already offered
        >
            <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={1}>
                <Image source={{ uri: applicant.profilePictureUrl }} style={styles.profilePic} />
                <View style={styles.cardInfo}>
                    <Text style={styles.applicantName}>{applicant.firstName} {applicant.lastName}</Text>
                    <View style={styles.statsContainer}>
                        <Star size={16} color={Colors.primary} fill={Colors.primary} />
                        <Text style={styles.rating}>{applicant.ratings?.average?.toFixed(1) || 'New'}</Text>
                        <Text style={styles.shiftsCompleted}>({applicant.reliabilityScore || 0} shifts)</Text>
                    </View>
                </View>
                {isOffered && (
                    <View style={[styles.statusBadge, {backgroundColor: Colors.warning}]}>
                         <Text style={styles.statusText}>Offered</Text>
                    </View>
                )}
            </TouchableOpacity>
        </Swipeable>
    );
});

ApplicantCard.displayName = 'ApplicantCard';

const VenueShiftApplicantsScreen = () => {
    const router = useRouter();
    const { shiftId } = useLocalSearchParams();
    const { shift: baseShift, applicants: baseApplicants, isLoading, error, offerShiftToWorker } = useShiftApplicants(shiftId as string);
    const shift = baseShift as ShiftWithDetails | null;
    const applicants = baseApplicants as Applicant[];
    
    const [isProcessing, setIsProcessing] = useState(false);
    const [isShiftDetailsModalVisible, setShiftDetailsModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
    const rowRefs = useRef<{ [key: string]: Swipeable | null }>({});

    const handleApplicantPress = (applicantId: string | undefined) => {
        if (isProcessing || !applicantId) return;
        router.push({ pathname: '/(venue)/VenueApplicantProfile', params: { workerId: applicantId, shiftId } });
    };

    const handleSwipeOpen = (applicant: Applicant) => {
        setSelectedApplicant(applicant);
        setIsConfirmModalVisible(true);
    };

    const handleConfirmOffer = async () => {
        if (!selectedApplicant || !selectedApplicant.id) return;

        setIsConfirmModalVisible(false);
        setIsProcessing(true);

        try {
            await offerShiftToWorker(selectedApplicant.id);
            Alert.alert("Offer Sent", `Shift offer has been sent to ${selectedApplicant.firstName}.`); 
        } catch (e: unknown) {
            console.error("Error offering shift:", e);
            const message = e instanceof Error ? e.message : "Failed to send shift offer. Please try again.";
            Alert.alert("Offer Error", message);
        } finally {
            setIsProcessing(false);
            rowRefs.current[selectedApplicant.id]?.close();
        }
    };

    const handleCancelOffer = () => {
        setIsConfirmModalVisible(false);
        if (selectedApplicant && selectedApplicant.id) {
            rowRefs.current[selectedApplicant.id]?.close();
        }
    };

    if (isLoading && !shift) { // Only show full screen loader on initial load
        return <VenueScreenTemplate><View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View></VenueScreenTemplate>;
    }

    if (error) {
        return <VenueScreenTemplate><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></VenueScreenTemplate>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <VenueScreenTemplate>
                <Stack.Screen options={{ title: 'Shift Applicants', headerBackTitle: 'Roster' }} />
                <FlatList
                    data={applicants}
                    keyExtractor={(item) => item.id || ''}
                    renderItem={({ item }) => (
                        shift ? (
                            <ApplicantCard 
                                ref={ref => { if(ref && item.id) rowRefs.current[item.id] = ref }}
                                applicant={item} 
                                shift={shift}
                                onPress={() => handleApplicantPress(item.id)} 
                                onSwipeableWillOpen={() => handleSwipeOpen(item)}
                            />
                        ) : null
                    )}
                    ListHeaderComponent={() => (
                        <>
                            <ShiftSummaryCard shift={shift} onPress={() => setShiftDetailsModalVisible(true)} />
                             <View style={styles.headerRow}>
                                <Text style={styles.applicantsHeader}>{applicants.length > 0 ? 'Applicants' : 'No Applicants Yet'}</Text>
                                {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
                            </View>
                        </>
                    )}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={() => (
                         !isLoading && <View style={styles.centered}><Text>No one has applied to this shift yet.</Text></View>
                    )}
                />
                {shift && <VenueShiftDetailsModal isVisible={isShiftDetailsModalVisible} onClose={() => setShiftDetailsModalVisible(false)} shift={shift} />}
                <ConfirmationModal 
                    isVisible={isConfirmModalVisible}
                    onClose={handleCancelOffer}
                    onConfirm={handleConfirmOffer}
                    title="Confirm Offer" 
                    message={`Are you sure you want to offer this shift to ${selectedApplicant?.firstName} ${selectedApplicant?.lastName}?`}
                    confirmText="Yes, Offer Shift"
                    cancelText="Cancel"
                />
                 {isProcessing && <View style={styles.processingOverlay}><ActivityIndicator size="large" color="#fff" /></View>}
            </VenueScreenTemplate>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    errorText: { color: Colors.danger, fontSize: 16, textAlign: 'center' },
    listContainer: { padding: 16, paddingBottom: 30 },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, marginBottom: 10, paddingLeft: 5 },
    applicantsHeader: { fontSize: 18, fontWeight: 'bold', color: Colors.text, },
    summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: Colors.lightGray },
    summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    summaryRole: { fontSize: 20, fontWeight: 'bold', color: Colors.primary, marginLeft: 8 },
    summaryDetails: { marginBottom: 12 },
    summaryText: { fontSize: 16, color: Colors.text, marginBottom: 4 },
    viewDetailsPrompt: { borderTopWidth: 1, borderTopColor: Colors.lightGray, paddingTop: 10, alignItems: 'center' },
    viewDetailsText: { fontSize: 14, color: Colors.primary, fontWeight: '500' },
    card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 15, marginBottom: 12, borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 12 },
    profilePic: { width: 60, height: 60, borderRadius: 30, marginRight: 15, backgroundColor: Colors.lightGray },
    cardInfo: { flex: 1 },
    applicantName: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginBottom: 4 },
    statsContainer: { flexDirection: 'row', alignItems: 'center' },
    rating: { fontSize: 16, fontWeight: '500', color: Colors.text, marginLeft: 5, marginRight: 8 },
    shiftsCompleted: { fontSize: 14, color: Colors.textSecondary },
    offerBox: { backgroundColor: Colors.success, justifyContent: 'center', alignItems: 'center', width: 100, marginBottom: 12, borderRadius: 12, flexDirection: 'row' },
    offerText: { color: '#fff', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 15, marginLeft: 10, },
    statusText: { color: Colors.white, fontWeight: 'bold', fontSize: 12 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    confirmModalContent: { backgroundColor: '#fff', borderRadius: 15, padding: 25, width: '100%', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.text, marginBottom: 15, textAlign: 'center' },
    modalMessage: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 25, lineHeight: 22 },
    modalButtonContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
    modalButton: { flex: 1, paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
    cancelButton: { backgroundColor: Colors.lightGray, marginRight: 10 },
    cancelButtonText: { color: Colors.textSecondary, fontWeight: 'bold', fontSize: 16 },
    confirmButton: { backgroundColor: Colors.primary },
    confirmButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
    processingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
});

export default VenueShiftApplicantsScreen;
