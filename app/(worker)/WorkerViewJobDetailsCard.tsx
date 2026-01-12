
import { ReactElement, ReactNode, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, Image, Linking, Platform, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Job } from '../../types';
import { Colors } from '../../constants/colors';
import { Briefcase, MapPin, DollarSign, Type, FileText } from 'lucide-react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';

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

const WorkerViewJobDetailsCard = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isApplyConfirmVisible, setApplyConfirmVisible] = useState(false);

  useEffect(() => {
    try {
      if (params.job && typeof params.job === 'string') {
        const parsedJob = JSON.parse(params.job);

        // Directly re-hydrate date fields, matching the working pattern.
        if (parsedJob.createdAt) {
            parsedJob.createdAt = new Date(parsedJob.createdAt.seconds * 1000);
        }
        if (parsedJob.datePosted) {
            parsedJob.datePosted = new Date(parsedJob.datePosted);
        }
        if (parsedJob.startDate) {
            parsedJob.startDate = new Date(parsedJob.startDate);
        }

        setJob(parsedJob);

      } else {
        setError("Job data could not be loaded.");
      }
    } catch (e) {
      console.error("Failed to parse job params", e);
      setError("An error occurred while loading job details.");
    }
  }, [params.job]);

  if (error) {
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backButtonText}>Go Back</Text>
                </TouchableOpacity>
            </View>
        </WorkerScreenTemplate>
    );
  }

  if (!job) {
    return (
        <WorkerScreenTemplate>
            <View style={styles.centered}>
              <Text>Loading job...</Text>
            </View>
        </WorkerScreenTemplate>
    );
  }

  const openInMaps = () => {
    if (!job.coordinates) return;
    const { lat, lng } = job.coordinates;
    const address = job.location;
    const url = Platform.select({
        ios: `http://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(address)}`,
        android: `geo:${lat},${lng}?q=${encodeURIComponent(address)}`
    }) || '';

    Linking.canOpenURL(url).then(supported => {
        if (supported) Linking.openURL(url);
        else Alert.alert("Error", "Could not open map application.");
    }).catch(err => console.error("An error occurred opening map", err));
  };

  const handleApply = () => {
    setApplyConfirmVisible(true);
  };

  const handleConfirmApply = () => {
    setApplyConfirmVisible(false);
    console.log(`Applied for job ${job.id}`);
    Alert.alert("Application Sent", "Your application has been submitted successfully.", [
        { text: "OK", onPress: () => router.back() }
    ]);
  };

  return (
    <WorkerScreenTemplate>
      <Stack.Screen options={{ title: "Job Details" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <View style={{ flex: 1 }}>
                <Text style={styles.roleTitle}>{job.title}</Text>
                <Text style={styles.venueName}>{job.businessName}</Text>
            </View>
            <TouchableOpacity 
                onPress={() => router.push({ pathname: '/(worker)/WorkerViewVenueProfile', params: { venueId: job.businessId } })} 
                style={styles.venueProfileContainer}
            >
                <Image source={{ uri: job.businessLogoUrl || 'https://via.placeholder.com/80' }} style={styles.venueImage} />
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
                value={job.location} 
                onPress={openInMaps}
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label="Salary" 
                value={job.salary}
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

      <Modal transparent={true} visible={isApplyConfirmVisible} animationType="fade" onRequestClose={() => setApplyConfirmVisible(false)}>
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Apply for Job</Text>
                  <Text style={styles.modalText}>Are you sure you want to apply for this job?</Text>
                  <View style={styles.modalActions}>
                      <TouchableOpacity style={[styles.modalButton, styles.modalButtonCancel]} onPress={() => setApplyConfirmVisible(false)}>
                          <Text style={styles.modalButtonCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.modalButton, styles.modalButtonConfirm]} onPress={handleConfirmApply}>
                          <Text style={styles.modalButtonConfirmText}>Yes, Apply</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      </Modal>

      <View style={styles.footer}>
          <TouchableOpacity style={[styles.footerButton, styles.applyButton]} onPress={handleApply}>
              <Text style={styles.applyButtonText}>Apply Now</Text>
          </TouchableOpacity>
      </View>
    </WorkerScreenTemplate>
  );
};

const styles = StyleSheet.create({
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
    errorText: { fontSize: 16, color: Colors.danger, textAlign: 'center', marginBottom: 20 },
    scrollContent: { padding: 16, paddingBottom: 100 },
    headerInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    venueProfileContainer: { alignItems: 'center' },
    venueImage: { width: 80, height: 80, borderRadius: 40, marginBottom: 8, backgroundColor: Colors.lightGray },
    viewProfileText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
    roleTitle: { fontSize: 28, fontWeight: 'bold', color: Colors.text, flexShrink: 1 },
    venueName: { fontSize: 18, color: Colors.textSecondary, marginTop: 4 },
    card: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    detailRow: { marginBottom: 16 },
    detailLabelContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    detailLabel: { fontSize: 14, color: Colors.textSecondary, marginLeft: 10, textTransform: 'uppercase' },
    detailValue: { fontSize: 16, fontWeight: '600', color: Colors.text, paddingLeft: 30 },
    link: { color: Colors.primary, textDecorationLine: 'underline' },
    section: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 5, elevation: 2 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.text, marginLeft: 10 },
    sectionContent: {},    sectionText: { fontSize: 16, color: Colors.textSecondary, lineHeight: 24 },
    requirementItem: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    bulletPoint: { fontSize: 16, color: Colors.primary, marginRight: 8, marginTop: 2 },
    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, paddingBottom: 25, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: Colors.lightGray, gap: 10 },
    footerButton: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 14, borderRadius: 10 },
    backButton: { backgroundColor: Colors.lightGray, padding: 12, borderRadius: 8 },
    backButtonText: { color: Colors.textSecondary, fontSize: 16, fontWeight: 'bold' },
    applyButton: { backgroundColor: Colors.primary },
    applyButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    modalContent: { backgroundColor: 'white', borderRadius: 15, padding: 20, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center', color: Colors.text },
    modalText: { fontSize: 16, color: Colors.textSecondary, textAlign: 'center', marginBottom: 20 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
    modalButton: { flex: 1, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    modalButtonCancel: { backgroundColor: Colors.lightGray },
    modalButtonCancelText: { color: Colors.textSecondary, fontWeight: 'bold' },
    modalButtonConfirm: { backgroundColor: Colors.primary },
    modalButtonConfirmText: { color: Colors.white, fontWeight: 'bold' },
});

export default WorkerViewJobDetailsCard;
