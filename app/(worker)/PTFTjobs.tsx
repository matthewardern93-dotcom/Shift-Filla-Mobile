import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { Colors } from '../../constants/colors';
import { Shift } from '../../types';
import WorkerShiftCard from '../../components/WorkerShiftCard';
import { skillsList } from '../../constants/Skills';
import { useRouter } from 'expo-router';

const mockShifts: Shift[] = [
    {
        id: '1',
        role: 'Bartender',
        startTime: new Date('2025-12-30T12:00:00'),
        endTime: new Date('2025-12-30T18:00:00'),
        payRate: 50,
        venue: { 
            name: 'The Tipsy Cow', 
            location: { 
                street: '123 Oak Avenue', 
                city: 'Brookside',
                latitude: -36.8485, 
                longitude: 174.7633 
            } 
        },
        status: 'open',
        description: 'Join our vibrant team for a busy afternoon shift. You will be responsible for crafting classic cocktails, serving a wide range of beverages, and maintaining a clean and welcoming bar area. Speed and a positive attitude are key.',
        uniform: 'All black: black button-down shirt, black trousers, and comfortable black shoes.',
        requirements: ['Minimum 2 years of bartending experience', 'Proficiency in classic cocktail recipes', 'Excellent customer service skills'],
    },
    {
        id: '2',
        role: 'Server',
        startTime: new Date('2025-12-30T14:00:00'),
        endTime: new Date('2025-12-30T22:00:00'),
        payRate: 25,
        venue: { 
            name: 'The Salty Squid', 
            location: { 
                street: '456 Ocean Drive', 
                city: 'Seaport',
                latitude: -41.2865, 
                longitude: 174.7762 
            } 
        },
        status: 'open',
        description: 'We need an experienced server for our dinner service. Responsibilities include taking orders, serving food and beverages, and ensuring a great dining experience for our guests.',
        uniform: 'White shirt, black pants, and a black tie (provided).',
        requirements: ['1+ year of serving experience in a fast-paced restaurant'],
        type: 'Full-time / Part-time only'
    },
    {
        id: '3',
        role: 'Bartender',
        startTime: new Date('2025-12-31T18:00:00'),
        endTime: new Date('2026-01-01T02:00:00'),
        payRate: 75,
        venue: { 
            name: 'The Rowdy Rooster', 
            location: { 
                street: '789 Party Plaza', 
                city: 'Downtown',
                latitude: -45.0312, 
                longitude: 168.6626 
            } 
        },
        status: 'open',
        description: 'New Year\'s Eve bash! High-energy, high-volume bartending. We are looking for a skilled mixologist who can handle pressure and sling drinks with a smile. Premium pay for a premium night!',
        uniform: 'Smart casual. No logos or sportswear.',
        requirements: ['Extensive experience with high-volume bartending', 'Ability to work late hours', 'Positive and energetic personality'],
    },
    {
        id: '11',
        role: 'Server',
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 8 * 60 * 60 * 1000),
        payRate: 30,
        venue: { 
            name: 'The Grand Hotel', 
            location: { 
                street: '1 Grand Lane', 
                city: 'Uptown',
                latitude: -43.5321, 
                longitude: 172.6362 
            } 
        },
        status: 'pending',
        description: 'Serve guests at a corporate luncheon. Professionalism and discretion are paramount.',
        uniform: 'Black suit, white shirt.',
        requirements: ['Experience in corporate or event service'],
    },
];

const SORT_OPTIONS = {
    CLOSEST: 'Closest to furthest',
    FURTHEST: 'Furthest to closest',
    HIGH_PAY: 'Most pay to less pay',
    LOW_PAY: 'Less pay to more pay',
};

const PTFTJobs = () => {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<string | null>(null);

    const availableShifts = mockShifts.filter(s => (s.status === 'open' || s.status === 'pending') && s.type === 'Full-time / Part-time only')
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

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
        // Filtering logic would be applied here based on the state
    };

    const handleShiftPress = (shift: Shift) => {
        router.push({
            pathname: '/(worker)/WorkerViewShiftDetailsCard',
            params: { shift: JSON.stringify(shift) }
        });
    };

    const handleSwipeApply = (shift: Shift) => {
        Alert.alert(
            "Apply for Shift",
            `Are you sure you want to apply for the ${shift.role} position at ${shift.venue.name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Yes, Apply", onPress: () => console.log('Applied') }
            ]
        );
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
                {availableShifts.map(shift => (
                    <WorkerShiftCard 
                        key={shift.id} 
                        item={shift}
                        onPress={() => handleShiftPress(shift)}
                        onSwipeApply={() => handleSwipeApply(shift)}
                    />
                ))}
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