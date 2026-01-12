
import { useState, ReactNode } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Linking, Platform, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format, differenceInHours } from 'date-fns';
import { Shift } from '../../types';
import { Colors } from '../../constants/colors';
import { Calendar, Clock, DollarSign, MapPin, Shirt, AlertCircle, FileText } from 'lucide-react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import functions from '@react-native-firebase/functions';

// Define prop types for DetailRow
interface DetailRowProps {
  icon: ReactNode;
  label: string;
  value: string;
  onPress?: () => void;
}

const DetailRow = ({ icon, label, value, onPress }: DetailRowProps) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
            {icon}
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, onPress && styles.link]}>{value}</Text>
    </TouchableOpacity>
);

// Define prop types for Section
interface SectionProps {
  title: string;
  children: ReactNode;
  icon: ReactNode;
}

const Section = ({ title, children, icon }: SectionProps) => (
  <View style={styles.section}>
      <View style={styles.sectionHeader}>
          {icon}
          <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
          {children}
      </View>
  </View>
);

const WorkerViewShiftDetailsCard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [shift, setShift] = useState<Shift | null>(null);
  const [isCancelConfirmVisible, setCancelConfirmVisible] = useState(false);

  // Parse shift data from params
  useState(() => {
    try {
      if (params.shift) {
        const parsedShift = JSON.parse(params.shift as string);
        parsedShift.startTime = new Date(parsedShift.startTime);
        parsedShift.endTime = new Date(parsedShift.endTime);
        setShift(parsedShift);
      }
    } catch (e) {
      console.error("Failed to parse shift data", e);
      Alert.alert("Error", "Could not load shift details.", [{ text: "OK", onPress: () => router.back() }]);
    }
  });

  if (!shift) {
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text>Loading shift details...</Text>
            </View>
        </WorkerScreenTemplate>
    );
  }

  const { 
    id: shiftId,
    role,
    venueName,
    venueLogoUrl,
    startTime,
    endTime,
    location,
    pay,
    description,
    uniform,
    requirements,
    businessId,
    status,
    coordinates
  } = shift;

  const duration = differenceInHours(endTime, startTime);
  const totalPay = (duration * pay).toFixed(2);

  const openInMaps = () => {
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    let url = Platform.select({
      ios: coordinates ? `http://maps.apple.com/?ll=${coordinates.lat},${coordinates.lng}&q=${encodedLocation}` : `http://maps.apple.com/?q=${encodedLocation}`,
      android: coordinates ? `geo:${coordinates.lat},${coordinates.lng}?q=${encodedLocation}` : `geo:0,0?q=${encodedLocation}`
    }) || '';

    Linking.canOpenURL(url).then(supported => {
      if (supported) Linking.openURL(url);
      else Alert.alert("Error", "Could not open map application.");
    }).catch(err => console.error("An error occurred opening map", err));
  };

  const handleCancelShift = () => {
    setCancelConfirmVisible(true);
  };

  const handleConfirmCancel = async () => {
    setCancelConfirmVisible(false);
    setLoading(true);
    try {
      const cancelShiftCallable = functions().httpsCallable('cancelShift');
      await cancelShiftCallable({ shiftId });
      // Corrected to use an object for type-safe navigation, satisfying TS2345.
      router.replace({ pathname: '/(worker)' });
    } catch (error) {
      console.error("Error cancelling shift:", error);
      Alert.alert("Error", "Could not cancel the shift. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const canCancel = status === 'confirmed' && startTime.getTime() > new Date().getTime();

  return (
    <WorkerScreenTemplate>
      <Stack.Screen options={{ title: role }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>{role}</Text>
                <Text style={styles.venueName}>{venueName}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => router.push({ pathname: '/(worker)/WorkerViewVenueProfile', params: { venueId: businessId } })} 
                style={styles.venueProfileContainer}>
                <Image source={{ uri: venueLogoUrl || 'https://via.placeholder.com/80' }} style={styles.venueImage} />
                <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
            <DetailRow icon={<Calendar size={20} color={Colors.primary}/>} label="Date" value={format(startTime, 'eeee, MMM dd, yyyy')} />
            <DetailRow icon={<Clock size={20} color={Colors.primary}/>} label="Time" value={`${format(startTime, 'p')} - ${format(endTime, 'p')} (${duration} hrs)`} />
            <DetailRow icon={<MapPin size={20} color={Colors.primary}/>} label="Location" value={location} onPress={openInMaps} />
            <DetailRow icon={<DollarSign size={20} color={Colors.primary}/>} label="Pay Rate" value={`$${pay.toFixed(2)} / hour`} />
            <View style={styles.totalPayRow}>
                 <Text style={styles.totalPayLabel}>Estimated Total Pay</Text>
                 <Text style={styles.totalPayValue}>${totalPay}</Text>
            </View>
        </View>
        
        {description && <Section title="Job Description" icon={<FileText size={20} color={Colors.primary}/>}><Text style={styles.sectionText}>{description}</Text></Section>}
        {uniform && <Section title="Uniform" icon={<Shirt size={20} color={Colors.primary}/>}><Text style={styles.sectionText}>{uniform}</Text></Section>}
        {requirements && requirements.length > 0 && (
            <Section title="Requirements" icon={<AlertCircle size={20} color={Colors.primary}/>}>{
                requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.sectionText}>{req}</Text>
                    </View>
                ))}
            </Section>
        )}
      </ScrollView>

      <Modal transparent={true} visible={isCancelConfirmVisible} animationType="fade" onRequestClose={() => setCancelConfirmVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Shift</Text>
            <Text style={styles.modalText}>Are you sure you want to cancel this shift? This may affect your reliability rating.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setCancelConfirmVisible(false)}><Text style={styles.modalButtonCancelText}>Nevermind</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmCancel}><Text style={styles.modalButtonConfirmText}>Yes, Cancel</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {canCancel && (
        <View style={styles.footer}>
            <TouchableOpacity style={[styles.footerButton, loading && styles.footerButtonDisabled]} onPress={handleCancelShift} disabled={loading}>
                {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={styles.footerButtonText}>Cancel Shift</Text>}
            </TouchableOpacity>
        </View>
      )}
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    venueProfileContainer: { alignItems: 'center' },
    venueImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 8, backgroundColor: Colors.lightGray },
    viewProfileText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    roleTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text, flexShrink: 1, marginRight: 10 },
    venueName: { fontSize: 18, color: Colors.textSecondary, marginTop: 4 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    detailRow: { marginBottom: 16 },
    detailLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    detailLabel: { fontSize: 14, color: Colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
    detailValue: { fontSize: 16, fontWeight: '600', color: Colors.text, paddingLeft: 30 },
    link: { color: Colors.primary, textDecorationLine: 'underline' },
    totalPayRow: { borderTopWidth: 1, borderTopColor: Colors.lightGray, marginTop: 10, paddingTop: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalPayLabel: { fontSize: 16, fontWeight: 'bold', color: Colors.text },
    totalPayValue: { fontSize: 22, fontWeight: 'bold', color: Colors.primary },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginLeft: 10 },
    sectionContent: {},    sectionText: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },
    requirementItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    bulletPoint: { fontSize: 16, color: Colors.primary, marginRight: 8, marginTop: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 25, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.lightGray },
    footerButton: { backgroundColor: Colors.danger, justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
    footerButtonDisabled: { backgroundColor: Colors.lightGray },
    footerButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: Colors.text },
    modalText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    modalButtonCancel: { backgroundColor: Colors.lightGray },
    modalButtonCancelText: { color: Colors.textSecondary, fontWeight: 'bold' },
    modalButtonConfirm: { backgroundColor: Colors.danger },
    modalButtonConfirmText: { color: Colors.white, fontWeight: 'bold' },
});

export default WorkerViewShiftDetailsCard;
