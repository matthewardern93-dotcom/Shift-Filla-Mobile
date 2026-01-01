import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { Colors } from '../constants/colors';
import { Gift, Link, MessageCircle } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { ReferredVenue } from '../types';

interface ReferralTrackerProps {
  referralCode: string;
  referredVenues: ReferredVenue[];
}

const ReferralTracker: React.FC<ReferralTrackerProps> = ({ referralCode, referredVenues }) => {
  const referralLink = `https://studio--shiftflow-femet.us-central1.hosted.app/signup/venue?ref=${referralCode}`;

  const copyToClipboard = () => {
    Clipboard.setStringAsync(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const shareLink = () => {
    Share.share({
      message: `Here\'s my sign up link to Shift Filla, the easiest way to Filla Shift. ${referralLink}`,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Gift color={Colors.primary} size={28} />
        <Text style={styles.title}>Refer a Venue & Win!</Text>
      </View>
      <Text style={styles.subtitle}>
        Refer 3 venues who post at least 10 shifts to go in the draw to win your fees back for a year!
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={copyToClipboard}>
          <Link color={Colors.white} size={16} />
          <Text style={styles.buttonText}>Copy Link</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.shareButton]} onPress={shareLink}>
            <MessageCircle color={Colors.white} size={16} />
          <Text style={styles.buttonText}>Share via Message</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.yourReferralsTitle}>Your Referrals</Text>

      {referredVenues.length === 0 ? (
        <Text style={styles.noReferralsText}>You haven\'t referred any venues yet.</Text>
      ) : (
        <View>
          {referredVenues.map(venue => (
            <View key={venue.id} style={styles.referralItem}>
              <Text style={styles.venueName}>{venue.name}</Text>
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${(venue.shiftsPosted / 10) * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{venue.shiftsPosted}/10 shifts</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#f7f7ff',
        padding: 20,
        borderRadius: 15,
        margin: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
      },
      title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 10,
        color: Colors.primary,
      },
      subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 15,
      },
      buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 20,
      },
      button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 8,
        flex: 1,
        justifyContent: 'center',
        marginHorizontal: 5,
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 8,
        fontSize: 14,
      },
      shareButton: {
        backgroundColor: '#25D366',
      },
      yourReferralsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.text,
        marginBottom: 10,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingTop: 15,
      },
      noReferralsText: {
        textAlign: 'center',
        color: Colors.textSecondary,
        paddingVertical: 20,
      },
      referralItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
      },
      venueName: {
        fontWeight: 'bold',
        fontSize: 16,
        color: Colors.text,
      },
      progressContainer: {
        height: 10,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        marginTop: 8,
        overflow: 'hidden',
      },
      progressBar: {
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 5,
      },
      progressText: {
        marginTop: 4,
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'right',
      },
});

export default ReferralTracker;