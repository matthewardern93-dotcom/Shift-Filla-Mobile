
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import AdminScreenTemplate from '../../components/templates/AdminScreenTemplate';
import StatTile from '../../components/admin/StatTile';

const AdminDashboard = () => {
  return (
    <AdminScreenTemplate>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.grid}>
          <StatTile title="Total Shifts Yesterday" value="120" />
          <StatTile title="Total Revenue Yesterday" value="$5,400" />
          <StatTile title="Total Shifts This Week" value="850" />
          <StatTile title="Total Revenue This Week" value="$38,250" />
          <StatTile title="Total Shifts MTD" value="2,100" />
          <StatTile title="Total Revenue MTD" value="$94,500" />
          <StatTile title="Forecasted Shifts This Week" value="900" />
          <StatTile title="Total Expected Revenue" value="$40,500" />
          <StatTile title="New Users to be Approved" value="15" />
          <StatTile title="Total Disputes" value="3" />
        </View>
      </ScrollView>
    </AdminScreenTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default AdminDashboard;
