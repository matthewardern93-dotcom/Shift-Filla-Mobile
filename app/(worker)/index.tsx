
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Shift, Job } from '../../types';
import WorkerShiftCard from '../../components/WorkerShiftCard';
import WorkerJobCard from '../../components/WorkerJobCard';
import { skillsList } from '../../constants/Skills';
import { useFocusEffect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { useJobStore } from '../../store/jobStore';
import { useAvailableShiftStore } from '../../store/availableShiftStore';
import { useUserStore } from '../../store/userStore';

const AVAILABILITY_STORAGE_KEY = '@workerAvailability';

// --- All mock data has been removed --- 

const SORT_OPTIONS = {
    CLOSEST: 'Closest to furthest',
    FURTHEST: 'Furthest to closest',
    HIGH_PAY: 'Most pay to less pay',
    LOW_PAY: 'Less pay to more pay',
};

const SHIFT_TYPES = {
    BLOCK: 'Block shifts only',
    FULL_PART: 'Full-time / Part-time only',
};

const WorkerHome = () => {
    const name = "Owen"; // This will be replaced with the user's name from the user store later
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string | null>(null);
    const [selectedShiftTypes, setSelectedShiftTypes] = useState<string[]>([]);
    const [appliedShifts, setAppliedShifts] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState('Shifts');
    const [availability, setAvailability] = useState({});

    // --- Store Integration ---
    const { user } = useUserStore();
    const { jobs, hasNewJobs, isLoading: jobsLoading, subscribeToJobs, markJobsAsViewed, cleanup: cleanupJobs } = useJobStore();
    const { shifts: availableShifts, isLoading: shiftsLoading, subscribeToAvailableShifts, cleanup: cleanupShifts } = useAvailableShiftStore();

    // --- Data Fetching Effect ---
    useEffect(() => {
        subscribeToJobs();
        if (user?.uid) {
            subscribeToAvailableShifts(user.uid);
        }

        // Cleanup listeners on unmount
        return () => {
            cleanupJobs();
            cleanupShifts();
        };
    }, [user?.uid]);

    // --- Other Data Fetching (from async storage) ---
    const fetchAppliedShifts = async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const shiftKeys = keys.filter(key => key.startsWith('applied_shift_'));
            const shifts = await AsyncStorage.multiGet(shiftKeys);
            setAppliedShifts(shifts.map(s => s[1] ? JSON.parse(s[1]).id : ''));
        } catch (e) {
            console.error("Failed to fetch applied shifts from storage", e);
        }
    };

    const fetchAvailability = async () => {
      try {
        const savedAvailability = await AsyncStorage.getItem(AVAILABILITY_STORAGE_KEY);
        if (savedAvailability !== null) {
          setAvailability(JSON.parse(savedAvailability));
        }
      } catch (error) {
        console.error('Failed to load availability from storage', error);
      }
    };

    useFocusEffect(
        useCallback(() => {
            fetchAppliedShifts();
            fetchAvailability();
        }, [])
    );

    // --- Filtering and Sorting Logic ---
    const filteredAndSortedShifts = useMemo(() => {
        return availableShifts
            .filter(s => {
                // Availability filter
                const dateString = format(new Date(s.startTime), 'yyyy-MM-dd');
                if (availability[dateString]?.customStyles?.container?.backgroundColor === Colors.danger) {
                    return false;
                }
                // Role filter
                if (selectedRoles.length > 0 && !selectedRoles.includes(s.role)) {
                    return false;
                }
                return true;
            })
            .sort((a, b) => {
                // Sort offered shifts to the top
                if (a.status === 'offered' && b.status !== 'offered') return -1;
                if (a.status !== 'offered' && b.status === 'offered') return 1;
                
                // Add other sorting logic from `sortBy` state here later

                return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
            });
    }, [availableShifts, availability, selectedRoles, sortBy]);

    // --- Handlers ---
    const toggleRole = (role: string) => setSelectedRoles(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]);
    const toggleShiftType = (type: string) => setSelectedShiftTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]);
    const clearFilters = () => { setSelectedRoles([]); setSortBy(null); setSelectedShiftTypes([]); };
    const applyFilters = () => setModalVisible(false);

    const handleShiftPress = (shift: Shift) => {
        const route = shift.status === 'offered' ? '/(worker)/WorkerViewShiftOfferCard' : '/(worker)/WorkerViewShiftDetailsCard';
        router.push({ pathname: route, params: { shift: JSON.stringify(shift) } });
    };

    const handleJobPress = (job: Job) => {
        router.push({ pathname: '/(worker)/WorkerViewJobDetailsCard', params: { job: JSON.stringify(job) } });
    };

    const handleApply = async (shift: Shift) => {
        try {
            await AsyncStorage.setItem(`applied_shift_${shift.id}`, JSON.stringify(shift));
            fetchAppliedShifts(); // Refresh to show as applied
        } catch (e) {
            Alert.alert("Error", "Failed to apply for the shift.");
        }
    };

    const handleTabPress = (tab: string) => {
        setActiveTab(tab);
        if (tab === 'Jobs') {
            markJobsAsViewed();
        }
    };

    // --- Render Logic ---
    const renderContent = () => {
        if (activeTab === 'Shifts') {
            if (shiftsLoading) return <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />;
            return filteredAndSortedShifts.length > 0 ? (
                filteredAndSortedShifts.map(shift => (
                    <WorkerShiftCard 
                        key={shift.id} 
                        item={shift}
                        onPress={() => handleShiftPress(shift)}
                        onSwipeApply={() => handleApply(shift)}
                        isApplied={appliedShifts.includes(shift.id)}
                        isNew={!appliedShifts.includes(shift.id)}
                        isOffered={shift.status === 'offered'}
                    />
                ))
            ) : <Text style={styles.noDataText}>No available shifts found.</Text>;
        } else { // Jobs tab
            if (jobsLoading) return <ActivityIndicator style={styles.loader} size="large" color={Colors.primary} />;
            return jobs.length > 0 ? (
                jobs.map(job => <WorkerJobCard key={job.id} item={job} onPress={() => handleJobPress(job)} />)
            ) : <Text style={styles.noDataText}>No jobs posted right now.</Text>;
        }
    };

    return (
        <WorkerScreenTemplate>
            <View style={styles.flexView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Welcome {name}</Text>
                    <TouchableOpacity onPress={() => setModalVisible(true)}>
                        <Ionicons name="filter" size={28} color={Colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.tabContainer}>
                    <TouchableOpacity style={[styles.tab, activeTab === 'Shifts' && styles.activeTab]} onPress={() => handleTabPress('Shifts')}>
                        <Text style={[styles.tabText, activeTab === 'Shifts' && styles.activeTabText]}>Shifts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.tab, activeTab === 'Jobs' && styles.activeTab]} onPress={() => handleTabPress('Jobs')}>
                        <View style={styles.tabItemContainer}>
                            <Text style={[styles.tabText, activeTab === 'Jobs' && styles.activeTabText]}>Jobs</Text>
                            {hasNewJobs && <View style={styles.newJobDot} />}
                        </View>
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.container}>{renderContent()}</ScrollView>
            </View>

            {/* Filter Modal remains the same */}
            <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                 {/* ... modal content ... */}
            </Modal>
        </WorkerScreenTemplate>
    );
};

const styles = StyleSheet.create({
    flexView: { flex: 1 },
    loader: { marginTop: 50 },
    noDataText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: Colors.textSecondary },
    container: { flex: 1, paddingHorizontal: 10, backgroundColor: Colors.background },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 15, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.lightGray },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: Colors.text, fontFamily: Fonts.headline },
    tabContainer: { flexDirection: 'row', backgroundColor: Colors.white },
    tab: { flex: 1, paddingVertical: 15, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
    activeTab: { borderBottomColor: Colors.primary },
    tabText: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, fontFamily: Fonts.sans },
    activeTabText: { color: Colors.primary },
    tabItemContainer: { flexDirection: 'row', alignItems: 'center' },
    newJobDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary, marginLeft: 8 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: Colors.white, borderRadius: 15, padding: 20, width: '90%', maxHeight: '80%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: Colors.lightGray, paddingBottom: 15, marginBottom: 15 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', color: Colors.text, fontFamily: Fonts.sans },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginTop: 10, marginBottom: 15, fontFamily: Fonts.sans },
    option: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
    optionText: { fontSize: 16, marginLeft: 15, color: Colors.textSecondary, fontFamily: Fonts.sans },
    modalFooter: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.lightGray, paddingTop: 15, marginTop: 15 },
    clearButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, backgroundColor: Colors.lightGray },
    clearButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.textSecondary, fontFamily: Fonts.sans },
    applyButton: { paddingVertical: 12, paddingHorizontal: 25, borderRadius: 8, backgroundColor: Colors.primary },
    applyButtonText: { fontSize: 16, fontWeight: 'bold', color: Colors.white, fontFamily: Fonts.sans },
});

export default WorkerHome;
