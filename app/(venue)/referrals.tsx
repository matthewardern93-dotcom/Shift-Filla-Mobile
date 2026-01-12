
import { View, Text, StyleSheet } from 'react-native';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { useVenueDashboard } from '../../hooks/useVenueDashboard';
import ReferralTracker from '../../components/ReferralTracker';

const Referrals = () => {
  const { venueProfile } = useVenueDashboard();

  return (
    <VenueScreenTemplate>
      <View style={styles.container}>
        <Text style={styles.title}>Referrals</Text>
        {venueProfile?.id && (
          <ReferralTracker referralCode={venueProfile.id} referredVenues={[]} />
        )}
      </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
  },
});

export default Referrals;
