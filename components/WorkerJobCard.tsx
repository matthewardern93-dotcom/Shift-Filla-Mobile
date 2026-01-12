
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { Briefcase, MapPin } from 'lucide-react-native';
import { Job } from '../types';

interface WorkerJobCardProps {
    item: Job;
    onPress: () => void;
}

const WorkerJobCard: React.FC<WorkerJobCardProps> = ({ item, onPress }) => {
    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <View style={styles.header}>
                <Text style={styles.role}>{item.title}</Text>
                <Text style={styles.payType}>{item.salary}</Text>
            </View>

            <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                    <Briefcase size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.businessName}</Text>
                </View>
            </View>

            <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                    <MapPin size={14} color={Colors.textSecondary} />
                    <Text style={styles.detailText}>{item.location}</Text>
                </View>
            </View>

        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    role: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.text,
    },
    payType: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 6,
    },
    distance: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
});

export default WorkerJobCard;
