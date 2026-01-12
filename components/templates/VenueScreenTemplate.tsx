
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, Text, TouchableWithoutFeedback, Linking, Animated } from 'react-native';
import { useRouter, usePathname, Href } from 'expo-router';
import { ChevronDown, Bell, Mail, User, Home, Search, Shield, LogOut, Clock, Plus, CalendarPlus, FileText, X, Users } from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useUserStore } from '../../app/store/userStore';
import { useChatStore } from '../../app/store/chatStore';

const VenueScreenTemplate = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useUserStore();
  const { hasUnreadMessages, subscribeToConversations, clearUnreadState } = useChatStore();
  
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [isNotificationsVisible, setNotificationsVisible] = useState(false);
  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [flashAnim] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (user?.uid) {
      subscribeToConversations(user.uid);
    }
    return () => {
      clearUnreadState();
    };
  }, [user?.uid, subscribeToConversations, clearUnreadState]);

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (hasUnreadMessages) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(flashAnim, { toValue: 0.2, duration: 800, useNativeDriver: true }),
          Animated.timing(flashAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      animation.start();
    } else {
      flashAnim.setValue(1);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [hasUnreadMessages, flashAnim]);

  const handleNavigate = (href: Href) => {
    router.push(href);
    setMenuVisible(false);
  };

  const menuItems = [
    { label: 'Search Staff', icon: Search, action: () => handleNavigate({ pathname: '/(venue)/VenueSearchStaff' }) },
    { label: 'Detailed Shift Managment', icon: Clock, action: () => handleNavigate({ pathname: '/(venue)/VenueRoster' }) },
    // Casting to `any` to bypass the incorrect TS error, as the generated route types are out of sync.
    { label: 'Referrals', icon: Users, action: () => handleNavigate({ pathname: '/(venue)/referrals' as any }) },
    { label: 'Legal', icon: Shield, action: () => Linking.openURL('https://www.website.com/legal') },
    { label: 'Log Out', icon: LogOut, action: () => signOut() },
  ];

  const isChatScreen = pathname.startsWith('/(venue)/chat/');

  return (
    <View style={styles.container}>
      <Modal
        transparent={true}
        animationType="fade"
        visible={isMenuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.menuContainer}>
              {menuItems.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.menuItem}
                  onPress={item.action}
                >
                  <item.icon color={Colors.primary} size={24} />
                  <Text style={styles.menuItemText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Notifications Dropdown */}
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

      {/* Post Job/Shift Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => setPostModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPostModalVisible(false)}>
          <View style={styles.postModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.postModalContainer}>
                  <TouchableOpacity style={styles.modalButton} onPress={() => {setPostModalVisible(false); router.push({ pathname: '/(venue)/PostShift' });}}>
                      <CalendarPlus color={Colors.primary} size={28} />
                      <View style={styles.modalButtonTextContainer}>
                          <Text style={styles.modalButtonTitle}>Post a Shift</Text>
                          <Text style={styles.modalButtonSubtitle}>Create a new single-day opening</Text>
                      </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.modalButton} onPress={() => {setPostModalVisible(false); router.push({ pathname: '/(venue)/PostJob' });}}>
                      <FileText color={Colors.primary} size={28} />
                      <View style={styles.modalButtonTextContainer}>
                          <Text style={styles.modalButtonTitle}>Post a Job</Text>
                          <Text style={styles.modalButtonSubtitle}>Hire for a permanent position</Text>
                      </View>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.closeButton} onPress={() => setPostModalVisible(false)}>
                      <X color={Colors.textSecondary} size={20} />
                  </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.headerIcon}>
          <ChevronDown color={Colors.secondary} size={32} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer} />
        <TouchableOpacity onPress={() => router.push({ pathname: '/(venue)/VenueNotifications' })} style={styles.headerIcon}>
          <Bell color={Colors.secondary} size={32} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>{children}</View>

      {!isChatScreen && (
        <View style={styles.footer}>
          <TouchableOpacity style={styles.navIconContainer} onPress={() => router.push({ pathname: '/(venue)/VenueProfile' })}>
            <User color={Colors.secondary} size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconContainer} onPress={() => router.push({ pathname: '/(venue)/' })}>
            <Home color={Colors.secondary} size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconContainer} onPress={() => setPostModalVisible(true)}>
            <Plus color={Colors.secondary} size={32} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconContainer} onPress={() => router.push({ pathname: '/(venue)/VenueMessages' })}>
            <Animated.View style={{ opacity: flashAnim }}>
              <Mail color={Colors.secondary} size={32} />
            </Animated.View>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 10,
  },
  headerIcon: {
      padding: 10,
  },
  headerTitleContainer: {
      flex: 1,
      alignItems: 'center',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContainer: {
    position: 'absolute',
    top: 90,
    left: 20,
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 10,
    width: 250,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  menuItemText: {
    marginLeft: 15,
    fontSize: 18,
    fontWeight: '500',
    color: Colors.text,
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
    color: Colors.textSecondary,
  },
  postModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  postModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  modalButtonTextContainer: {
      marginLeft: 15,
  },
  modalButtonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalButtonSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeButton: {
      position: 'absolute',
      top: 15,
      right: 15,
      backgroundColor: Colors.lightGray,
      borderRadius: 15,
      padding: 5,
  },
});

export default VenueScreenTemplate;
