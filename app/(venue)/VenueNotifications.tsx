
import { useEffect } from 'react';
import { Text, View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { useUserStore } from '../store/userStore';
import { useNotificationStore } from '../store/notificationStore';
import { AppNotification } from '../../types';
import { Colors } from '../../constants/colors';

const VenueNotificationsScreen = () => {
  const { user } = useUserStore();
  const { 
    notifications, 
    isLoading, 
    error, 
    fetchNotifications, 
    markAsRead, 
    clearNotifications 
  } = useNotificationStore();

  useEffect(() => {
    if (user?.uid) {
      fetchNotifications(user.uid);
    }
    return () => {
      clearNotifications();
    };
  }, [user?.uid, fetchNotifications, clearNotifications]);

  const handlePress = (item: AppNotification) => {
    if (!item.read) {
      markAsRead(item.id);
    }
    // You can add navigation logic here if notifications should link somewhere
    console.log("Notification pressed:", item.id);
  };

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity onPress={() => handlePress(item)}>
      <View style={[styles.itemContainer, !item.read && styles.unreadItem]}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemMessage}>{item.message}</Text>
        <Text style={styles.itemDate}>
            {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading && notifications.length === 0) {
      return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />;
    }

    if (error) {
      return <Text style={styles.infoText}>Error: {error}</Text>;
    }

    if (notifications.length === 0) {
      return <Text style={styles.infoText}>You have no notifications.</Text>;
    }

    return (
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <VenueScreenTemplate>
      <View style={styles.container}>
        <Text style={styles.header}>Notifications</Text>
        {renderContent()}
      </View>
    </VenueScreenTemplate>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: Colors.lightGray, // Assuming a light background for the screen
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.primary,
        marginBottom: 20,
    },
    listContainer: {
        paddingBottom: 16,
    },
    itemContainer: {
        backgroundColor: Colors.white,
        padding: 16,
        borderRadius: 8,
        marginBottom: 12,
        borderLeftWidth: 5,
        borderLeftColor: Colors.gray,
    },
    unreadItem: {
        borderLeftColor: Colors.primary, // Highlight color for unread items
        backgroundColor: '#f0f8ff', // Lighter shade for unread background
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
    infoText: {
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        color: Colors.gray,
    }
});

export default VenueNotificationsScreen;
