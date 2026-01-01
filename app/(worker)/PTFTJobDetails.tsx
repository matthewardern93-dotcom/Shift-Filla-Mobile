
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, SafeAreaView, Linking, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Job } from '../../types';
import { Colors } from '../../constants/colors';
import { Briefcase, MapPin, DollarSign, Type, FileText } from 'lucide-react-native';

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

const PTFTJobDetails = () => {
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
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text>Job data could not be loaded.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const openInMaps = () => {
    const address = job.location;
    const scheme = Platform.OS === 'ios' ? 'maps:0,0?q=' : 'geo:0,0?q=';
    const url = scheme + encodeURIComponent(address);
    Linking.openURL(url);
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
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: job.title, headerBackTitle: 'Back' }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        <View style={styles.headerInfo}>
            <Text style={styles.roleTitle}>{job.title}</Text>
            <Text style={styles.venueName}>{job.venueName}</Text>
        </View>

        <View style={styles.card}>
            <DetailRow 
                icon={<MapPin size={20} color={Colors.primary}/>} 
                label="Location" 
                value={job.location} 
                onPress={openInMaps}
            />
            <DetailRow 
                icon={<Type size={20} color={Colors.primary}/>} 
                label="Job Type" 
                value={job.type} 
            />
            <DetailRow 
                icon={<DollarSign size={20} color={Colors.primary}/>} 
                label="Salary"
                value={`$${job.salary} ${job.payType === 'hourly' ? '/ hour' : '/ year'}`} 
            />
        </View>
        
        {job.description && (
            <Section title="Job Description" icon={<FileText size={20} color={Colors.primary}/>}>
                <Text style={styles.sectionText}>{job.description}</Text>
            </Section>
        )}

        {job.roleCategories && job.roleCategories.length > 0 && (
            <Section title="Role Categories" icon={<Briefcase size={20} color={Colors.primary}/>}>
                {job.roleCategories.map((category, index) => (
                    <View key={index} style={styles.requirementItem}>
                        <Text style={styles.bulletPoint}>•</Text>
                        <Text style={styles.sectionText}>{category}</Text>
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
    </SafeAreaView>
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
        alignItems: 'center',
        marginBottom: 20,
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

export default PTFTJobDetails;
