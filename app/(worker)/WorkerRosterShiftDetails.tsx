
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format, differenceInHours } from 'date-fns';
import { Shift } from '../../types';
import { Colors } from '../../constants/colors';
import { Calendar, Clock, DollarSign, MapPin, Shirt, AlertCircle, FileText } from 'lucide-react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import React, { useState, useEffect, ReactNode } from 'react';

interface DetailRowProps {
    icon: ReactNode;
    label: string;
    value: string;
    onPress?: () => void;
}

const DetailRow: React.FC<DetailRowProps> = ({ icon, label, value, onPress }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
            {icon}
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, onPress && styles.link]}>{value}</Text>
    </TouchableOpacity>
);

interface SectionProps {
    title: string;
    children: ReactNode;
    icon: ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, children, icon }) => (
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

const WorkerRosterShiftDetails = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [shift, setShift] = useState<Shift | null>(null);

  useEffect(() => {
    try {
      if (params.shift && typeof params.shift === 'string') {
        const parsedShift = JSON.parse(params.shift);

        // Re-hydrate date fields
        if (parsedShift.startTime) {
            parsedShift.startTime = new Date(parsedShift.startTime);
        }
        if (parsedShift.endTime) {
            parsedShift.endTime = new Date(parsedShift.endTime);
        }

        setShift(parsedShift);
      }
    } catch (e) {
      console.error("Failed to parse params", e);
      Alert.alert("Error", "Shift data not found.", [{ text: "OK", onPress: () => router.back() }]);
    }
  }, [params.shift]);

  if (!shift) {
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
              <Text>Shift data could not be loaded.</Text>
            </View>
        </WorkerScreenTemplate>
    );
  }

  // Correctly destructure properties from the Shift type
  const { id, role, venueName, venueLogoUrl, pay, startTime, endTime, location, coordinates, businessId, description, uniform, requirements } = shift;

  const duration = differenceInHours(endTime, startTime);
  const totalPay = (duration * pay).toFixed(2);

  const openInMaps = () => {
    if (!location) return;
    const encodedLocation = encodeURIComponent(location);
    let url = '';
    if (Platform.OS === 'ios') {
      url = coordinates
        ? `http://maps.apple.com/?ll=${coordinates.lat},${coordinates.lng}&q=${encodedLocation}`
        : `http://maps.apple.com/?q=${encodedLocation}`;
    } else { 
      url = coordinates
        ? `geo:${coordinates.lat},${coordinates.lng}?q=${encodedLocation}`
        : `geo:0,0?q=${encodedLocation}`;
    }
    
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "Could not open map application.");
        }
      })
      .catch(err => console.error("An error occurred", err));
  };

  const handleCancel = () => {
    Alert.alert(
        "Cancel Shift", 
        "Are you sure you want to cancel this shift?",
        [
            { text: "No", style: "cancel" },
            { text: "Yes, Cancel", onPress: () => {
                console.log(`Cancelled shift ${id}`);
                router.back();
            } }
        ]
    );
  };

  return (
    <WorkerScreenTemplate>
      <Stack.Screen options={{ title: "Shift Details", headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>{role}</Text>
                <Text style={styles.venueName}>{venueName}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => router.push({ pathname: '/(worker)/WorkerViewVenueProfile', params: { venueId: businessId } })} 
                style={styles.venueProfileContainer}
            >
                <Image source={{ uri: venueLogoUrl || 'https://via.placeholder.com/80' }} style={styles.venueImage} />
                <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
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
                value={location} 
                onPress={openInMaps}
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label="Pay Rate" 
                value={`$${pay.toFixed(2)} / hour`} 
            />
            <View style={styles.totalPayRow}>
                 <Text style={styles.totalPayLabel}>Estimated Total Pay</Text>
                 <Text style={styles.totalPayValue}>${totalPay}</Text>
            </View>
        </View>
        
        {description && (
            <Section title="Job Description" icon={<FileText size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{description}</Text>
            </Section>
        )}

        {uniform && (
            <Section title="Uniform" icon={<Shirt size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{uniform}</Text>
            </Section>
        )}

        {requirements && requirements.length > 0 && (
            <Section title="Requirements" icon={<AlertCircle size={20} color={Colors.primary}/>}>
                {requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.sectionText}>{req}</Text>
                    </View>
                ))}
            </Section>
        )}

      </ScrollView>
      <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={handleCancel}>
              <Text style={styles.cancelButtonText}>Cancel Shift</Text>
          </TouchableOpacity>
      </View>
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    venueProfileContainer: {
        alignItems: 'center',
    },
    venueImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    viewProfileText: {
        fontSize: 12,
        color: Colors.primary,
        fontWeight: '600',
    },
    roleTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
        flexShrink: 1, 
        marginRight: 10
    },
    venueName: {
        fontSize: 18,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    detailRow: {
        marginBottom: 16,
    },
    detailLabelContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailLabel: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginLeft: 10,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        paddingLeft: 30,
    },
    link: {
        color: Colors.primary,
        textDecorationLine: 'underline',
    },
    totalPayRow: {
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        marginTop: 10,
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
        fontSize: 22,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    section: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
        elevation: 2,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginLeft: 10,
    },
    sectionContent: {},
    sectionText: {
        fontSize: 16,
        color: Colors.textSecondary,
        lineHeight: 24,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bulletPoint: {
        fontSize: 16,
        color: Colors.primary,
        marginRight: 8,
        marginTop: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        paddingBottom: 25, // Extra padding for home bar
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        gap: 10,
    },
    footerButton: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 10,
    },
    cancelButton: {
        backgroundColor: '#FF4747',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkerRosterShiftDetails;
