
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { ChevronDown, Bell, Mail, User, Home, CalendarDays } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import WorkerSettingsModal from '../WorkerSettingsModal';
import { useChatStore } from '../../app/store/chatStore';
import { useAuthStore } from '../../app/store/authStore';

const WorkerScreenTemplate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const [isSettingsModalVisible, setSettingsModalVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);

  const isChatScreen = pathname.startsWith('/(worker)/chat/');

  // --- Chat Store Integration ---
  const { user } = useAuthStore(); // Get the logged-in user
  const { hasUnreadMessages, subscribeToConversations, clearUnreadState } = useChatStore(); // Get state and actions
  const flashAnim = useRef(new Animated.Value(1));
  const [flashOpacity, setFlashOpacity] = useState(1);

  // Subscribe to conversations when the component mounts
  useEffect(() => {
    if (user?.uid) {
      subscribeToConversations(user.uid);
    }
    // Clean up the subscription on unmount
    return () => {
      clearUnreadState();
    };
  }, [user?.uid, subscribeToConversations, clearUnreadState]);

  // --- Flashing Animation ---
  useEffect(() => {
    const currentFlashAnim = flashAnim.current;

    // Guard clause: If no unread messages, reset opacity and do nothing further.
    if (!hasUnreadMessages) {
      currentFlashAnim.setValue(1);
      setFlashOpacity(1);
      return;
    }

    // This code only runs if `hasUnreadMessages` is true.
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(currentFlashAnim, {
          toValue: 0.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(currentFlashAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    
    const listenerId = currentFlashAnim.addListener(({ value }) => setFlashOpacity(value));

    // Return a cleanup function to stop the animation and remove the specific listener.
    return () => {
      animation.stop();
      currentFlashAnim.removeListener(listenerId);
    };
  }, [hasUnreadMessages]);

  return (
    <View style={styles.container}>
      <WorkerSettingsModal 
        visible={isSettingsModalVisible} 
        onClose={() => setSettingsModalVisible(false)} 
      />

      <Modal
        transparent={true}
        animationType="fade"
        visible={isNotificationsVisible}
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setNotificationsVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.notificationsContainer}>
              <Text style={styles.notificationText}>No new notifications.</Text>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.header}>
        <View style={styles.navIconContainer}>
            <TouchableOpacity onPress={() => setSettingsModalVisible(true)}>
              <ChevronDown color={Colors.secondary} size={32} />
            </TouchableOpacity>
        </View>
        <View style={styles.navIconContainer} />
        <View style={styles.navIconContainer}>
            <TouchableOpacity onPress={() => setNotificationsVisible(true)}>
              <Bell color={Colors.secondary} size={32} />
            </TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>{children}</View>
      {!isChatScreen && (
        <View style={styles.footer}>
          <View style={styles.navIconContainer}>
              <TouchableOpacity onPress={() => router.push('/(worker)/WorkerProfile')}>
                <User color={Colors.secondary} size={32} />
              </TouchableOpacity>
          </View>
          <View style={styles.navIconContainer}>
              <TouchableOpacity onPress={() => router.push('/(worker)/')}>
                <Home color={Colors.secondary} size={32} />
              </TouchableOpacity>
          </View>
          <View style={styles.navIconContainer}>
              <TouchableOpacity onPress={() => router.push('/(worker)/WorkerRosterScreen')}>
                <CalendarDays color={Colors.secondary} size={32} />
              </TouchableOpacity>
          </View>
          <View style={styles.navIconContainer}>
              <TouchableOpacity onPress={() => router.push('/(worker)/WorkerMessages')}>
                <Animated.View style={{ opacity: flashOpacity }}>
                  <Mail color={Colors.secondary} size={32} />
                </Animated.View>
              </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 10,
    paddingBottom: 30,
  },
  navIconContainer: {
    flex: 1,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  notificationsContainer: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationText: {
    fontSize: 16,
    color: Colors.textSecondary  },
  rosterButton: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
});

export default WorkerScreenTemplate;
