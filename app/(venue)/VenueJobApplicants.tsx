
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, Animated, Modal, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { Star, Briefcase, Check } from 'lucide-react-native';
import VenueJobDetailsModal from './VenueJobDetailsModal';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { useJobApplicants, ApplicantWithProfile } from '../../hooks/useJobApplicants';
import functions from '@react-native-firebase/functions';
import { Job } from '../../types';

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

const JobSummaryCard = ({ job, onPress }: { job: Job, onPress: () => void}) => {
    if (!job) return null;
    return (
        <TouchableOpacity style={styles.summaryCard} onPress={onPress}>
            <View style={styles.summaryHeader}>
                <Briefcase size={22} color={Colors.primary} />
                <Text style={styles.summaryRole}>{job.title}</Text>
            </View>
            <View style={styles.summaryDetails}>
                 <Text style={styles.summaryText}>{job.type}</Text>
                 <Text style={styles.summaryText}><Text style={{fontWeight: 'bold'}}>{job.salary}</Text></Text>
            </View>
            <View style={styles.viewDetailsPrompt}><Text style={styles.viewDetailsText}>Tap to view job details</Text></View>
        </TouchableOpacity>
    );
};

const VenueJobApplicantsScreen = () => {
    const router = useRouter();
    const { jobId } = useLocalSearchParams();
    const { job, applicants, isLoading, error } = useJobApplicants(jobId as string);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isJobDetailsModalVisible, setJobDetailsModalVisible] = useState(false);
    const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<ApplicantWithProfile | null>(null);
    const rowRefs = useRef<{ [key: string]: Swipeable | null }>({});

    const handleApplicantPress = (applicant: ApplicantWithProfile) => {
        if (isProcessing) return;
        router.push({ pathname: '/(venue)/VenueApplicantProfile', params: { workerId: applicant.profile.id, jobId } });
    };

    const handleSwipeOpen = (applicant: ApplicantWithProfile) => {
        setSelectedApplicant(applicant);
        setIsConfirmModalVisible(true);
    };

    const handleConfirmShortlist = async () => {
        if (!selectedApplicant) return;

        setIsConfirmModalVisible(false);
        setIsProcessing(true);

        try {
            const shortlistFunction = functions().httpsCallable('shortlistApplicant');
            await shortlistFunction({ jobId, applicationId: selectedApplicant.id });
            Alert.alert("Success", `${selectedApplicant.profile.firstName} has been shortlisted.`);
        } catch (err) {
            console.error("Error shortlisting applicant: ", err);
            Alert.alert("Error", "Could not shortlist the applicant. Please try again.");
        } finally {
            setIsProcessing(false);
            if (rowRefs.current[selectedApplicant.id]) {
                rowRefs.current[selectedApplicant.id]?.close();
            }
        }
    };

    const handleCancelShortlist = () => {
        setIsConfirmModalVisible(false);
        if (selectedApplicant) {
            if (rowRefs.current[selectedApplicant.id]) {
                rowRefs.current[selectedApplicant.id]?.close();
            }
        }
    };

    const renderLeftActions = (_: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>, onSwipeableWillOpen: () => void) => {
        const scale = dragX.interpolate({ inputRange: [0, 80], outputRange: [0, 1], extrapolate: 'clamp' });
        return (
            <TouchableOpacity onPress={onSwipeableWillOpen} style={styles.offerBox}>
                <Animated.View style={[{ transform: [{ scale }] }]}><Check size={24} color="#fff" /></Animated.View>
                <Animated.Text style={[styles.offerText, { transform: [{ scale }] }]}>Shortlist</Animated.Text>
            </TouchableOpacity>
        );
    };

    if (isLoading) {
        return <VenueScreenTemplate><View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View></VenueScreenTemplate>;
    }

    if (error) {
        return <VenueScreenTemplate><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></VenueScreenTemplate>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <VenueScreenTemplate>
                <Stack.Screen options={{ title: 'Job Applicants', headerBackTitle: 'Roster' }} />
                <FlatList
                    data={applicants}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <Swipeable 
                            ref={(ref: Swipeable | null) => { if (ref) rowRefs.current[item.id] = ref }}
                            renderLeftActions={(_, dragX) => renderLeftActions(dragX, dragX, () => handleSwipeOpen(item))}
                            onSwipeableWillOpen={() => handleSwipeOpen(item)} friction={2} leftThreshold={80}>
                            <TouchableOpacity style={styles.card} onPress={() => handleApplicantPress(item)} activeOpacity={1}>
                                <Image source={{ uri: item.profile.profilePictureUrl }} style={styles.profilePic} />
                                <View style={styles.cardInfo}>
                                    <Text style={styles.applicantName}>{`${item.profile.firstName} ${item.profile.lastName}`}</Text>
                                    <View style={styles.statsContainer}>
                                        <Star size={16} color={Colors.primary} fill={Colors.primary} />
                                        <Text style={styles.rating}>{item.profile.rating?.toFixed(1) || 'New'}</Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Swipeable>
                    )}
                    ListHeaderComponent={() => (
                        <>
                            <JobSummaryCard job={job as Job} onPress={() => setJobDetailsModalVisible(true)} />
                            <Text style={styles.applicantsHeader}>{applicants.length > 0 ? 'Applicants' : 'No Applicants Yet'}</Text>
                        </>
                    )}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={() => (
                         !isLoading && <View style={styles.centered}><Text>No applicants for this job yet.</Text></View>
                    )}
                />
                {job && <VenueJobDetailsModal isVisible={isJobDetailsModalVisible} onClose={() => setJobDetailsModalVisible(false)} job={job as Job} />}
                <ConfirmationModal 
                    isVisible={isConfirmModalVisible}
                    onClose={handleCancelShortlist}
                    onConfirm={handleConfirmShortlist}
                    title="Confirm Shortlist" 
                    message={`Are you sure you want to shortlist ${selectedApplicant?.profile.firstName}?`}
                    confirmText="Yes, Shortlist"
                    cancelText="Cancel"
                />
                 {isProcessing && <View style={styles.processingOverlay}><ActivityIndicator size="large" color="#fff" /></View>}
            </VenueScreenTemplate>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    errorText: { fontSize: 16, color: Colors.danger },
    listContainer: { padding: 16, paddingBottom: 30 },
    applicantsHeader: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 20, marginBottom: 10, paddingLeft: 5 },
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
    shortlistedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.success, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 15 },
    shortlistedText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
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

export default VenueJobApplicantsScreen;
