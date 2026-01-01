import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Colors } from '../constants/colors';
import { Calendar, CreditCard, Shield, LogOut, Gift } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const WorkerSettingsModal = ({ visible, onClose }) => {
    const router = useRouter();
    const { signOut } = useAuth();

    const handleNavigate = (path) => {
        onClose();
        router.push(path);
    };

    const handleLogout = () => {
        onClose();
        signOut();
    };

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/(worker)/settings/Availability')}>
                                <Calendar size={24} color={Colors.primary} />
                                <Text style={styles.menuItemText}>Availability</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/(worker)/settings/ManageSubscriptions')}>
                                <CreditCard size={24} color={Colors.primary} />
                                <Text style={styles.menuItemText}>Manage Subscriptions</Text>
                            </TouchableOpacity>
                             <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/(worker)/settings/Refer_and_Win')}>
                                <Gift size={24} color={Colors.primary} />
                                <Text style={styles.menuItemText}>Refer & Win</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('/(worker)/settings/Legal')}>
                                <Shield size={24} color={Colors.primary} />
                                <Text style={styles.menuItemText}>Legal</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.menuItem, styles.logoutButton]} onPress={handleLogout}>
                                <LogOut size={24} color={Colors.danger} />
                                <Text style={[styles.menuItemText, styles.logoutButtonText]}>Logout</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    modalContent: {
        position: 'absolute',
        top: 90,
        left: 20,
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 10,
        width: 250,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 15,
    },
    menuItemText: {
        fontSize: 18,
        fontWeight: '500',
        color: Colors.text,
        marginLeft: 15,
    },
    logoutButton: {
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        marginTop: 10,
        paddingTop: 10,
    },
    logoutButtonText: {
        color: Colors.danger,
        fontWeight: 'bold',
    },
});

export default WorkerSettingsModal;