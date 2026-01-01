
import React from 'react';
import { ScrollView } from 'react-native';
import WorkerScreenTemplate from '../../../components/templates/WorkerScreenTemplate';
import ReferralTracker from '../../../components/ReferralTracker';
import { Colors } from '../../../constants/colors';

// Dummy data for now
const dummyReferredVenues = [
  { id: '1', name: 'The Local Pub', shiftsPosted: 5 },
  { id: '2', name: 'City Bistro', shiftsPosted: 10 },
  { id: '3', name: 'Night Owl Club', shiftsPosted: 2 },
];

const ReferAndWinScreen = () => {
  return (
    <WorkerScreenTemplate>
      <ScrollView>
        <ReferralTracker referralCode="WORKER123" referredVenues={dummyReferredVenues} />
      </ScrollView>
    </WorkerScreenTemplate>
  );
};

export default ReferAndWinScreen;
