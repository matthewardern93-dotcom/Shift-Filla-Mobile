import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { X } from 'lucide-react-native';
import { format } from 'date-fns';
import { Job } from '../../types';

// Type the props for the DetailRow component
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

// Type the props for the main modal component
interface VenueJobDetailsModalProps {
    isVisible: boolean;
    onClose: () => void;
    job: Job | null;
}

const VenueJobDetailsModal: React.FC<VenueJobDetailsModalProps> = ({ isVisible, onClose, job }) => {
    if (!job) {
        return null;
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
                        <Text style={styles.headerTitle}>{job.title} Details</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={Colors.primary} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.scrollContainer}>
                        {job.datePosted && <DetailRow label="Date Posted" value={format(new Date(job.datePosted), 'eeee, dd MMMM yyyy')} />}
                        <DetailRow label="Job Type" value={job.type} />
                        <DetailRow label="Salary" value={job.salary} />
                        
                        {job.description && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Job Description</Text>
                                <Text style={styles.sectionContent}>{job.description}</Text>
                            </View>
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
});

export default VenueJobDetailsModal;
