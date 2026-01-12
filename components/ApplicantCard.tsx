
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/colors';
import { WorkerProfile } from '../types';
import { useRouter } from 'expo-router';

interface ApplicantCardProps {
  applicant: WorkerProfile;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant }) => {
  const router = useRouter();
  const { firstName, lastName, profilePictureUrl, uid } = applicant;
  const fullName = `${firstName} ${lastName}`.trim();

  const handleViewProfile = () => {
    router.push({
        pathname: '/(venue)/VenueApplicantProfile', 
        params: { workerId: uid }
    });
  };

  return (
    <View style={styles.card}>
      {profilePictureUrl ? 
        <Image source={{ uri: profilePictureUrl }} style={styles.avatar} /> :
        <View style={[styles.avatar, styles.avatarPlaceholder]} />
      }
      <View style={styles.applicantInfo}>
        <Text style={styles.name}>{fullName}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={handleViewProfile}>
        <Text style={styles.buttonText}>View Profile</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
    backgroundColor: Colors.lightGray, // Placeholder color
  },
  avatarPlaceholder: {
    // Additional styling for placeholder if needed
  },
  applicantInfo: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
});

export default ApplicantCard;
