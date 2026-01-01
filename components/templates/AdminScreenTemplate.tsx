
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

const AdminScreenTemplate = ({ children }) => {
  return <View style={styles.container}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
});

export default AdminScreenTemplate;
