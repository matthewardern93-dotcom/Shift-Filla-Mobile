import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AdminScreenTemplate from '../../components/templates/AdminScreenTemplate';
import StatTile from '../../components/admin/StatTile';
import { getAdminDashboardStats } from '../../services/admin';
import { Colors } from '../../constants/colors';

// Define the type for the statistics object
interface AdminDashboardStats {
  totalShiftsYesterday: number;
  totalRevenueYesterday: number;
  totalShiftsThisWeek: number;
  totalRevenueThisWeek: number;
  totalShiftsMTD: number;
  totalRevenueMTD: number;
  forecastedShiftsThisWeek: number;
  totalExpectedRevenue: number;
  newUsersToBeApproved: number;
  totalDisputes: number;
}

const AdminDashboard: React.FC = () => {
  // Apply the type to the state hook
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // The service function is now expected to return the correct type
        const fetchedStats: AdminDashboardStats = await getAdminDashboardStats();
        setStats(fetchedStats);
      } catch (err) {
        setError((err as Error).message || 'An unexpected error occurred.');
        Alert.alert('Error', 'Could not fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <AdminScreenTemplate>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading Dashboard...</Text>
        </View>
      </AdminScreenTemplate>
    );
  }

  if (error) {
    return (
      <AdminScreenTemplate>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </AdminScreenTemplate>
    );
  }

  return (
    <AdminScreenTemplate>
      <ScrollView contentContainerStyle={styles.container}>
        {stats && (
          <View style={styles.grid}>
            <StatTile title="Total Shifts Yesterday" value={stats.totalShiftsYesterday.toString()} />
            <StatTile title="Total Revenue Yesterday" value={`$${stats.totalRevenueYesterday.toFixed(2)}`} />
            <StatTile title="Total Shifts This Week" value={stats.totalShiftsThisWeek.toString()} />
            <StatTile title="Total Revenue This Week" value={`$${stats.totalRevenueThisWeek.toFixed(2)}`} />
            <StatTile title="Total Shifts MTD" value={stats.totalShiftsMTD.toString()} />
            <StatTile title="Total Revenue MTD" value={`$${stats.totalRevenueMTD.toFixed(2)}`} />
            <StatTile title="Forecasted Shifts This Week" value={stats.forecastedShiftsThisWeek.toString()} />
            <StatTile title="Total Expected Revenue" value={`$${stats.totalExpectedRevenue.toFixed(2)}`} />
            <StatTile title="New Users to be Approved" value={stats.newUsersToBeApproved.toString()} />
            <StatTile title="Total Disputes" value={stats.totalDisputes.toString()} />
          </View>
        )}
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
  },
});

export default AdminDashboard;
