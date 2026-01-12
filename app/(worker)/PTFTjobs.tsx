import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { Colors } from '../../constants/colors';
import { Job } from '../../types';
import { skillsList } from '../../constants/Skills';
import { useRouter } from 'expo-router';
import { useAllJobs } from '../../hooks/useAllJobs';
import JobCard from '../../components/JobCard'; // Assuming you have a JobCard component

const SORT_OPTIONS = {
    NEWEST: 'Newest to oldest',
    OLDEST: 'Oldest to newest',
    HIGH_PAY: 'Most pay to less pay',
    LOW_PAY: 'Less pay to more pay',
};

const PTFTJobs = () => {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string | null>(null);
    const { jobs, isLoading, error } = useAllJobs();

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
        );
    };

    const clearFilters = () => {
        setSelectedRoles([]);
        setSortBy(null);
    };

    const applyFilters = () => {
        setModalVisible(false);
    };

    const handleJobPress = (job: Job) => {
        router.push({
            pathname: '/(worker)/PTFTJobDetails',
            params: { job: JSON.stringify(job) }
        });
    };

    const renderContent = () => {
        if (isLoading) {
            return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />;
        }

        if (error) {
            return <Text style={styles.errorText}>{error}</Text>;
        }

        return jobs.map(job => (
            <JobCard 
                key={job.id} 
                job={job}
                onPress={() => handleJobPress(job)}
            />
        ));
    };

    return (
        <WorkerScreenTemplate>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>PTFT Jobs</Text>
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                    <Ionicons name="filter" size={28} color={Colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container}>
                {renderContent()}
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Filter</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close-circle" size={28} color={Colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={styles.sectionTitle}>Role</Text>
                            {skillsList.map(skill => (
                                <TouchableOpacity key={skill.id} style={styles.option} onPress={() => toggleRole(skill.label)}>
                                    <Ionicons name={selectedRoles.includes(skill.label) ? 'checkbox' : 'square-outline'} size={24} color={Colors.primary} />
                                    <Text style={styles.optionText}>{skill.label}</Text>
                                </TouchableOpacity>
                            ))}

                            <Text style={styles.sectionTitle}>Sort By</Text>
                            {Object.values(SORT_OPTIONS).map(option => (
                                <TouchableOpacity key={option} style={styles.option} onPress={() => setSortBy(option)}>
                                    <Ionicons name={sortBy === option ? 'radio-button-on' : 'radio-button-off'} size={24} color={Colors.primary} />
                                    <Text style={styles.optionText}>{option}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.clearButton} onPress={clearFilters}>
                                <Text style={styles.clearButtonText}>Clear All</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
                                <Text style={styles.applyButtonText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </WorkerScreenTemplate>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 10,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 50, 
        paddingBottom: 15,
        backgroundColor: Colors.white,
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    errorText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: 'red',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: Colors.white,
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: Colors.lightGray,
        paddingBottom: 15,
        marginBottom: 15,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.text,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: 10,
        marginBottom: 15,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    },
    optionText: {
        fontSize: 16,
        marginLeft: 15,
        color: Colors.textSecondary,
    },
    modalFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        paddingTop: 15,
        marginTop: 15,
    },
    clearButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        backgroundColor: Colors.lightGray,
    },
    clearButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.textSecondary,
    },
    applyButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        backgroundColor: Colors.primary,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.white,
    },
});

export default PTFTJobs;
