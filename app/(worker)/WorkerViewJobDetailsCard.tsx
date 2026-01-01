
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView, Image, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Job } from '../../types';
import { Colors } from '../../constants/colors';
import { Briefcase, MapPin, DollarSign, Type, FileText } from 'lucide-react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';

const DetailRow = ({ icon, label, value, onPress }) => (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={styles.detailRow}>
        <View style={styles.detailLabelContainer}>
            {icon}
            <Text style={styles.detailLabel}>{label}</Text>
        </View>
        <Text style={[styles.detailValue, onPress && styles.link]}>{value}</Text>
    </TouchableOpacity>
);

const Section = ({ title, children, icon }) => (
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

const WorkerViewJobDetailsCard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  let job: Job | null = null;

  try {
    if (params.job) {
      job = JSON.parse(params.job as string);
    }
  } catch (e) {
    console.error("Failed to parse params", e);
  }

  if (!job) {
    Alert.alert("Error", "Job data not found.", [{ text: "OK", onPress: () => router.back() }]);
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
            <Text>Job data could not be loaded.</Text>
            </View>
        </WorkerScreenTemplate>
    );
  }

  const locationString = job.venue?.location ? `${job.venue.location.street}, ${job.venue.location.city}` : 'Not specified';

  const openInMaps = () => {
    if (!job.venue?.location) return;

    const { street, city, latitude, longitude } = job.venue.location;
    const address = `${street}, ${city}`;
    
    let url = '';
    if (Platform.OS === 'ios') {
      url = latitude && longitude 
        ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${encodeURIComponent(address)}`
        : `http://maps.apple.com/?q=${encodeURIComponent(address)}`;
    } else { 
      url = latitude && longitude
        ? `geo:${latitude},${longitude}?q=${encodeURIComponent(address)}`
        : `geo:0,0?q=${encodeURIComponent(address)}`;
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

  const handleApply = () => {
    Alert.alert(
        "Apply for Job", 
        "Are you sure you want to apply for this job?",
        [
            { text: "Cancel", style: "cancel" },
            { text: "Yes, Apply", onPress: () => {
                console.log(`Applied for job ${job.id}`);
                router.back();
            } }
        ]
    );
  };

  return (
    <WorkerScreenTemplate>
      <Stack.Screen options={{ title: "Job Details", headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <View>
                <Text style={styles.roleTitle}>{job.role}</Text>
                <Text style={styles.venueName}>{job.venue.name}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => router.push({ pathname: '/(worker)/WorkerViewVenueProfile', params: { venue: JSON.stringify(job.venue) } })} 
                style={styles.venueProfileContainer}
            >
                <Image source={{ uri: job.venue.profilePictureUrl || 'https://via.placeholder.com/80' }} style={styles.venueImage} />
                <Text style={styles.viewProfileText}>View Profile</Text>
            </TouchableOpacity>
        </View>

        <View style={styles.card}>
            <DetailRow 
                icon={<Type size={20} color={Colors.primary}/>} 
                label="Job Type" 
                value={job.type} 
            />
            <DetailRow 
                icon={<MapPin size={20} color={Colors.primary}/>} 
                label="Location" 
                value={locationString} 
                onPress={openInMaps}
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label={job.payType === 'salary' ? "Salary" : "Hourly Rate"} 
                value={job.payType === 'salary' ? `$${job.salary} per year` : `$${job.salary} per hour`} 
            />
        </View>
        
        {job.description && (
            <Section title="Job Description" icon={<FileText size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{job.description}</Text>
            </Section>
        )}

        {job.roleCategories && job.roleCategories.length > 0 && (
            <Section title="Role Categories" icon={<Briefcase size={20} color={Colors.primary}/>}>
                {job.roleCategories.map((cat, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.sectionText}>{cat}</Text>
                    </View>
                ))}
            </Section>
        )}

      </ScrollView>
      <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.backButton]} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.footerButton, styles.applyButton]} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
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
    backButton: {
        backgroundColor: Colors.lightGray,
    },
    backButtonText: {
        color: Colors.textSecondary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    applyButton: {
        backgroundColor: Colors.primary,
    },
    applyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default WorkerViewJobDetailsCard;
