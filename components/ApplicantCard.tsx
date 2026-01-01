
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Colors } from '../constants/theme';
import { WorkerProfile } from '../types';
import { useRouter } from 'expo-router';

interface ApplicantCardProps {
  applicant: WorkerProfile;
}

const ApplicantCard: React.FC<ApplicantCardProps> = ({ applicant }) => {
  const router = useRouter();
  const { name, avatarUrl, id } = applicant;

  const handleViewProfile = () => {
    router.push({ 
        pathname: '/(venue)/WorkerProfile', 
        params: { workerId: id } 
    });
  };

  return (
    <View style={styles.card}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.applicantInfo}>
        <Text style={styles.name}>{name}</Text>
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
