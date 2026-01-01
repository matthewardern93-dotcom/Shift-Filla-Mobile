import React from 'react';
import { View, Text } from 'react-native';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';

const Shifts = () => {
  return (
    <WorkerScreenTemplate>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>My Shifts</Text>
      </View>
    </WorkerScreenTemplate>
  );
};

export default Shifts;