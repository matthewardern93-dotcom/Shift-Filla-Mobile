
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { useUserStore } from '../../store/userStore';
import { useNotificationStore } from '../../store/notificationStore';
import { AppNotification, WorkerProfile } from '../../types';
import StripeOnboardingModal from '../../components/StripeOnboardingModal';
import { Colors } from '../../constants/colors';

const WorkerHome = () => {
  // 1. Get user and profile from the global user store
  const { user, profile, isLoading: isUserLoading } = useUserStore();
  
  // 2. Get notification state and actions from the global notification store
  const { 
    notifications, 
    isLoading: isNotificationsLoading, 
    fetchNotifications,
    markAsRead,
    clearNotifications
  } = useNotificationStore();

  const [isStripeModalVisible, setStripeModalVisible] = useState(false);

  // Effect to fetch notifications and check for Stripe onboarding
  useEffect(() => {
    if (user?.uid) {
      // Fetch notifications using the new store
      fetchNotifications(user.uid);

      // Check Stripe condition from the globally available profile
      const workerProfile = profile as WorkerProfile;
      if (workerProfile?.isApproved && !workerProfile?.stripeAccountId) {
        setStripeModalVisible(true);
      }
    }

    // Cleanup notifications when the component unmounts
    return () => {
      clearNotifications();
    };
  }, [user?.uid, profile]); // Depend on user and profile

  const handlePressNotification = (item: AppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    // Add navigation logic here later if needed
  };

  const renderNotificationItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity onPress={() => handlePressNotification(item)}>
      <View style={[styles.itemContainer, !item.read && styles.unreadItem]}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMessage}>{item.message}</Text>
        <Text style={styles.itemDate}>
          {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  // Main loading state for the screen
  if (isUserLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StripeOnboardingModal 
        isVisible={isStripeModalVisible}
        onClose={() => setStripeModalVisible(false)}
        userType="worker"
      />
      <Text style={styles.title}>Welcome, {profile?.firstName || 'Worker'}!</Text>
      <Text style={styles.sectionHeader}>Your Notifications</Text>

      {isNotificationsLoading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }}/>
      ) : notifications.length === 0 ? (
        <Text style={styles.infoText}>You have no new notifications.</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: Colors.background, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 20, // Add some top margin
    marginBottom: 10,
  },
  sectionHeader: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.darkGray,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
    paddingBottom: 5,
  },
  list: {
    flex: 1,
  },
  infoText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: Colors.gray,
  },
  // --- Notification Item Styles (reused from VenueNotifications) ---
  itemContainer: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 5,
    borderLeftColor: Colors.gray,
  },
  unreadItem: {
    borderLeftColor: Colors.primary, 
    backgroundColor: '#f0f8ff',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  itemMessage: {
    fontSize: 14,
    color: Colors.darkGray,
    marginTop: 4,
  },
  itemDate: {
    fontSize: 12,
    color: Colors.gray,
    marginTop: 8,
    textAlign: 'right',
  },
});

export default WorkerHome;
