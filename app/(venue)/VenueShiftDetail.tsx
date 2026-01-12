import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Image } from 'expo-image';
import { format, differenceInHours } from 'date-fns';
import { Shift, WorkerProfile } from '../../types';
import { Colors } from '../../constants/colors';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { Calendar, Clock, DollarSign, MapPin, Star, MessageCircle, X, Edit, Trash2 } from 'lucide-react-native';

interface DetailRowProps {
    icon: React.ReactNode;
    label: string;
    value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
            {icon}
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const timeRegex = /^([01]?[0-9]|2[0-3]):(00|15|30|45)$/;

const VenueShiftDetail = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [newStartTime, setNewStartTime] = useState('');
  const [newEndTime, setNewEndTime] = useState('');

  let initialShift: Shift | null = null;
  let worker: WorkerProfile | null = null;

  try {
    if (params.shift) {
      const parsedShift = JSON.parse(params.shift as string);
      initialShift = {
          ...parsedShift,
          startTime: new Date(parsedShift.startTime),
          endTime: new Date(parsedShift.endTime),
      };
    }
    if (params.worker) {
      worker = JSON.parse(params.worker as string);
    }
  } catch (e) {
    console.error("Failed to parse params", e);
  }

  const [shift, setShift] = useState<Shift | null>(initialShift);

  if (!shift) {
    Alert.alert("Error", "Shift data not found.", [{ text: "OK", onPress: () => router.back() }]);
    return (
      <VenueScreenTemplate>
        <View style={styles.centered}>
          <Text>Shift data could not be loaded.</Text>
        </View>
      </VenueScreenTemplate>
    );
  }

  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const duration = differenceInHours(endTime, startTime);
  const totalPay = (duration * (shift.pay || 0)).toFixed(2);
  const locationString = shift.location || 'Not specified';

  const handleCancelShift = () => {
    Alert.alert(
        "Cancel Shift", 
        "Are you sure you want to cancel this shift? This will notify the worker immediately.",
        [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: () => {
                    console.log(`Shift ${shift.id} cancelled.`);
                    // Here you would typically call an API to update the shift status
                    // For demo purposes, we'll just navigate back.
                    router.back();
                }
            }
        ]
    );
  }

  const handleOpenEditModal = () => {
      setNewStartTime(format(startTime, 'HH:mm'));
      setNewEndTime(format(endTime, 'HH:mm'));
      setEditModalVisible(true);
  }

  const handleSaveChanges = () => {
      if (!timeRegex.test(newStartTime) || !timeRegex.test(newEndTime)) {
          Alert.alert("Invalid Time Format", "Please use HH:mm in 15-minute intervals (e.g., 09:00).");
          return;
      }

      const originalStartTime = new Date(shift.startTime);
      const [startHours, startMinutes] = newStartTime.split(':').map(Number);
      const updatedStartTime = new Date(originalStartTime.setHours(startHours, startMinutes));

      const originalEndTime = new Date(shift.endTime);
      const [endHours, endMinutes] = newEndTime.split(':').map(Number);
      const updatedEndTime = new Date(originalEndTime.setHours(endHours, endMinutes));

      Alert.alert(
          "Confirm Changes", 
          "The worker will need to approve these changes. Are you sure?",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Confirm",
                  onPress: () => {
                      console.log("Shift changes submitted for re-approval");
                      // Update shift object and status for demo
                      setShift({ ...shift, startTime: updatedStartTime, endTime: updatedEndTime, status: 'pending_changes' });
                      setEditModalVisible(false);
                  }
              }
          ]
      )
  }

  return (
    <VenueScreenTemplate>
      <Stack.Screen options={{ title: 'Shift Details' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {shift.status === 'pending_changes' && (
            <View style={styles.statusBanner}>
                <Text style={styles.statusBannerText}>Changes pending worker approval</Text>
            </View>
        )}

        {worker && (
          <View style={[styles.card, styles.workerCard]}>
              <View style={styles.workerHeader}>
                  <Image source={{ uri: worker.profilePictureUrl }} style={styles.avatar} />
                  <View style={styles.workerInfo}>
                      <Text style={styles.workerName}>{`${worker.firstName} ${worker.lastName}`}</Text>
                      <View style={styles.ratingContainer}>
                          <Star size={16} color={Colors.primary} fill={Colors.primary}/>
                          <Text style={styles.ratingText}>
                            {worker.rating?.toFixed(1) || 'N/A'} ({worker.completedShifts || 0} shifts)
                          </Text>
                      </View>
                  </View>
              </View>
              {worker.description && <Text style={styles.workerBio}>{worker.description}</Text>}
          </View>
        )}

        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{shift.role}</Text>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={handleOpenEditModal} style={styles.iconButton}>
                        <Edit size={22} color={Colors.primary} />
                    </TouchableOpacity>
                     <TouchableOpacity onPress={handleCancelShift} style={[styles.iconButton, {marginLeft: 10}]}>
                        <Trash2 size={22} color={Colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
            <DetailRow 
                icon={<Calendar size={20} color={Colors.primary}/>} 
                label="Date" 
                value={format(startTime, 'eeee, MMM dd, yyyy')} 
            />
            <DetailRow 
                icon={<Clock size={20} color={Colors.primary}/>} 
                label="Time" 
                value={`${format(startTime, 'p')} - ${format(endTime, 'p')} (${duration} hrs)`} 
            />
            <DetailRow 
                icon={<MapPin size={20} color={Colors.primary}/>} 
                label="Location" 
                value={locationString} 
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label="Pay Rate" 
                value={`$${shift.pay.toFixed(2)} / hour`} 
            />
            <View style={styles.totalPayRow}>
                 <Text style={styles.totalPayLabel}>Estimated Total Pay</Text>
                 <Text style={styles.totalPayValue}>${totalPay}</Text>
            </View>
        </View>

      </ScrollView>
      <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={() => router.back()}>
              <Text style={styles.footerButtonText}>Back to Roster</Text>
          </TouchableOpacity>
          {worker && (
               <TouchableOpacity style={[styles.footerButton, styles.messageButton]}>
                  <MessageCircle size={18} color="#fff" style={{marginRight: 8}}/>
                  <Text style={styles.footerButtonText}>Message {worker.firstName}</Text>
              </TouchableOpacity>
          )}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Shift Time</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}><X size={24} color={Colors.text} /></TouchableOpacity>
            </View>
            <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>New Start Time (HH:mm)</Text>
                <TextInput style={styles.textInput} value={newStartTime} onChangeText={setNewStartTime} placeholder="e.g., 09:00" />
            </View>
             <View style={styles.inputRow}>
                <Text style={styles.inputLabel}>New End Time (HH:mm)</Text>
                <TextInput style={styles.textInput} value={newEndTime} onChangeText={setNewEndTime} placeholder="e.g., 17:00" />
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    workerCard: { backgroundColor: '#F9F9FB' },
    workerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        backgroundColor: Colors.lightGray,
    },
    workerInfo: { flex: 1 },
    workerName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    ratingText: { marginLeft: 6, fontSize: 14, color: Colors.textSecondary },
    workerBio: {
        marginTop: 15,
        fontSize: 14,
        color: Colors.textSecondary,
        fontStyle: 'italic',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    cardTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.primary,
        flex: 1, // Allow title to take space
    },
    actionButtons: {
        flexDirection: 'row',
    },
    iconButton: {
        padding: 5,
    },
    detailRow: {
        marginBottom: 15,
    },
    detailLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 8,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        paddingLeft: 28, // Indent to align with label text
    },
    totalPayRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        marginTop: 15,
        paddingTop: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalPayLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    totalPayValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        gap: 10,
    },
    footerButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: Colors.textSecondary,
        paddingVertical: 14,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messageButton: {
        backgroundColor: Colors.primary,
    },
    footerButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Modal styles
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        width: '90%',
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    inputRow: { marginBottom: 15 },
    inputLabel: { fontSize: 16, color: Colors.textSecondary, marginBottom: 8 },
    textInput: { borderWidth: 1, borderColor: Colors.lightGray, borderRadius: 8, padding: 12, fontSize: 16 },
    saveButton: { backgroundColor: Colors.primary, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    statusBanner: {
        backgroundColor: Colors.orange,
        padding: 15,
        borderRadius: 10,
        marginBottom: 16,
        alignItems: 'center',
    },
    statusBannerText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default VenueShiftDetail;
