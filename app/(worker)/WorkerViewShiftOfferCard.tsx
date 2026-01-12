
import { useState, useEffect, ReactNode, ReactElement } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { format, differenceInHours } from 'date-fns';
import { Shift } from '../../types';
import { Colors } from '../../constants/colors';
import { Calendar, Clock, DollarSign, MapPin, Shirt, AlertCircle, FileText } from 'lucide-react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { getDistance } from 'geolib';
import { useLocation } from '../../hooks/useLocation';

// Step 1: Fix Component Prop Types
interface DetailRowProps {
    icon: ReactElement;
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
    icon: ReactElement;
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

const WorkerViewShiftOfferCard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { location: userLocation } = useLocation();
  const [distance, setDistance] = useState<string | null>(null);
  
  let shift: Shift | null = null;

  try {
    if (params.shift) {
      shift = JSON.parse(params.shift as string);
    }
  } catch (e) {
    console.error("Failed to parse shift params", e);
  }

  // Step 2 & 3: Corrected Data Structures and Logic
  useEffect(() => {
    if (userLocation && shift?.coordinates) {
        const distanceInMeters = getDistance(
            { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
            { latitude: shift.coordinates.lat, longitude: shift.coordinates.lng }
        );
        const distanceInKm = distanceInMeters / 1000;
        setTimeout(() => setDistance(`${distanceInKm.toFixed(1)} km away`), 0);
    }
  }, [userLocation, shift?.coordinates]);

  if (!shift) {
    Alert.alert("Error", "Shift data not found.", [{ text: "OK", onPress: () => router.back() }]);
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
              <Text>Shift data could not be loaded.</Text>
            </View>
        </WorkerScreenTemplate>
    );
  }

  // Step 3: Fix Data Handling - incoming dates are strings from JSON
  const startTime = new Date(shift.startTime);
  const endTime = new Date(shift.endTime);
  const duration = differenceInHours(endTime, startTime);
  const totalPay = (duration * shift.pay).toFixed(2); // Use correct 'pay' property
  const locationString = shift.location || 'Not specified'; // Use correct 'location' property

  // Step 2 & 3: Corrected Maps Logic
  const openInMaps = () => {
    const { coordinates, location } = shift!;
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
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Could not open map application.");
      })
      .catch(err => console.error("An error occurred opening map", err));
  };

  const handleAccept = () => {
    Alert.alert(
        "Accept Shift Offer", 
        "Are you sure you want to accept this shift offer?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Accept", onPress: () => {
                console.log(`Accepted shift ${shift!.id}`);
                router.back();
            } }
        ]
    );
  };

  const handleDecline = () => {
    Alert.alert(
        "Decline Shift Offer", 
        "Are you sure you want to decline this shift offer?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Decline", onPress: () => {
                console.log(`Declined shift ${shift!.id}`);
                router.back();
            } }
        ]
    );
  };

  return (
    <WorkerScreenTemplate>
      {/* Step 4: Fix React/Expo API Errors */}
      <Stack.Screen options={{ title: "Shift Offer" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <View>
                {/* Step 2: Use correct properties */}
                <Text style={styles.roleTitle}>{shift.role}</Text>
                <Text style={styles.venueName}>{shift.venueName}</Text>
            </View>
            <TouchableOpacity 
                // Step 2: Pass correct venueId param
                onPress={() => router.push({ pathname: '/(worker)/WorkerViewVenueProfile', params: { venueId: shift!.businessId } })} 
                style={styles.venueProfileContainer}>
                {/* Step 2: Use correct logo URL property */}
                <Image source={{ uri: shift.venueLogoUrl || 'https://via.placeholder.com/80' }} style={styles.venueImage} />
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
                value={distance ? `${locationString} (${distance})` : locationString}
                onPress={openInMaps}
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label="Pay Rate" 
                // Step 3: Use correct 'pay' property
                value={`$${shift.pay.toFixed(2)} / hour`} 
            />
            <View style={styles.totalPayRow}>
                 <Text style={styles.totalPayLabel}>Estimated Total Pay</Text>
                 <Text style={styles.totalPayValue}>${totalPay}</Text>
            </View>
        </View>
        
        {shift.description && (
            <Section title="Job Description" icon={<FileText size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{shift.description}</Text>
            </Section>
        )}

        {shift.uniform && (
            <Section title="Uniform" icon={<Shirt size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{shift.uniform}</Text>
            </Section>
        )}

        {shift.requirements && shift.requirements.length > 0 && (
            <Section title="Requirements" icon={<AlertCircle size={20} color={Colors.primary}/>}>
                {shift.requirements.map((req, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.sectionText}>{req}</Text>
                    </View>
                ))}
            </Section>
        )}

      </ScrollView>
      <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.declineButton]} onPress={handleDecline}>
              <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerButton, styles.acceptButton]} onPress={handleAccept}>
              <Text style={styles.acceptButtonText}>Accept</Text>
          </TouchableOpacity>
      </View>
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
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
        backgroundColor: Colors.lightGray,
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
        paddingBottom: 25,
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
    declineButton: {
        backgroundColor: Colors.lightGray,
    },
    declineButtonText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    acceptButton: {
        backgroundColor: Colors.primary,
    },
    acceptButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkerViewShiftOfferCard;
