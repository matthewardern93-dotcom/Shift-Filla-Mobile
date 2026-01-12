
import { useState, useEffect } from 'react';
import { ScrollView, ActivityIndicator, Text, View } from 'react-native';
import WorkerScreenTemplate from '../../../components/templates/WorkerScreenTemplate';
import ReferralTracker from '../../../components/ReferralTracker';
import { useAuth } from '../../../context/AuthContext';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Colors } from '../../../constants/colors';

interface ReferredVenue {
  id: string;
  name: string;
  shiftsPosted: number;
}

const ReferAndWinScreen = () => {
  const { user } = useAuth(); 
  const [referredVenues, setReferredVenues] = useState<ReferredVenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferredVenues = async () => {
      if (user?.uid) { 
        try {
          const venuesRef = firestore().collection('VenueProfiles');
          const q = venuesRef.where('referredByCode', '==', user.uid);
          
          const querySnapshot = await q.get();
          const venues = querySnapshot.docs.map((doc: FirebaseFirestoreTypes.DocumentSnapshot) => {
            const data = doc.data() as FirebaseFirestoreTypes.DocumentData;
            return {
              id: doc.id,
              name: data.venueName || 'Unnamed Venue',
              shiftsPosted: data.stats?.shiftsCompleted || 0,
            };
          });
          setReferredVenues(venues);
        } catch (error) {
          console.error("Failed to fetch referred venues:", error);
        }
      }
      setLoading(false);
    };

    fetchReferredVenues();
  }, [user]); 

  return (
    <WorkerScreenTemplate>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={{ marginTop: 10 }}>Loading your referrals...</Text>
          </View>
        ) : (
          <ReferralTracker 
            referralCode={user?.uid || 'No code found'} 
            referredVenues={referredVenues}
          />
        )}
      </ScrollView>
    </WorkerScreenTemplate>
  );
};

export default ReferAndWinScreen;
