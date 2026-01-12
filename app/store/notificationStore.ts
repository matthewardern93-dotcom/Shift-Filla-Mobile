
import { create } from 'zustand';
import {
    getNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
} from '../../services/notifications';
import { AppNotification } from '../../types';

// 1. DEFINE THE STORE'S STATE
interface NotificationState {
  notifications: AppNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

// 2. DEFINE THE STORE'S ACTIONS
interface NotificationActions {
  fetchNotifications: (userId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (userId: string) => Promise<void>;
  clearNotifications: () => void;
}

// 3. DEFINE THE INITIAL STATE
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// 4. CREATE THE ZUSTAND STORE
export const useNotificationStore = create<NotificationState & NotificationActions>((set, get) => ({
    ...initialState,

    // --- ACTIONS IMPLEMENTATION ---

    fetchNotifications: async (userId) => {
        if (!userId) return;
        set({ isLoading: true, error: null });
        try {
            const notifications = await getNotifications(userId, false, 100); // Fetch all (up to 100)
            const unreadCount = notifications.filter(n => !n.read).length;
            set({ notifications, unreadCount, isLoading: false });
        } catch (error: unknown) {
            console.error("Failed to fetch notifications:", error);
            set({ error: "Could not load notifications.", isLoading: false });
        }
    },

    markAsRead: async (notificationId) => {
        // Optimistic UI update
        const originalNotifications = get().notifications;
        const updatedNotifications = originalNotifications.map(n =>
            n.id === notificationId ? { ...n, read: true } : n
        );
        const unreadCount = updatedNotifications.filter(n => !n.read).length;
        set({ notifications: updatedNotifications, unreadCount });

        // Perform the backend operation
        try {
            await markNotificationAsRead(notificationId);
        } catch (error) {
            console.error("Failed to mark notification as read:", error);
            // Revert on failure
            set({ notifications: originalNotifications, unreadCount: get().unreadCount + 1 }); 
        }
    },

    markAllAsRead: async (userId) => {
        if (!userId) return;
        
        const originalNotifications = get().notifications;
        // Optimistic UI update
        const updatedNotifications = originalNotifications.map(n => ({ ...n, read: true }));
        set({ notifications: updatedNotifications, unreadCount: 0 });

        try {
            await markAllNotificationsAsRead(userId);
        } catch (error) {
            console.error("Failed to mark all notifications as read:", error);
            // Revert on failure
            set({ notifications: originalNotifications, unreadCount: originalNotifications.filter(n => !n.read).length });
        }
    },

    clearNotifications: () => {
        set({ ...initialState });
    },
}));
