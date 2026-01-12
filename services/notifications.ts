import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    doc,
    updateDoc,
    writeBatch,
    arrayUnion,
    Timestamp
} from 'firebase/firestore';
import { getMessaging, getToken } from 'firebase/messaging';
import { db, app } from './firebase';
import { Notification } from '../types';

/**
 * Fetches notifications for a specific user from the 'notifications' collection,
 * ordered by creation date.
 * @param userId The ID of the user whose notifications are to be fetched.
 * @returns A promise that resolves to an array of notification objects.
 */
export const getUserNotifications = async (userId: string): Promise<Notification[]> => {
    try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(notificationsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));

        const querySnapshot = await getDocs(q);

        const notifications = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Ensure the timestamp is converted to a JS Date object
                createdAt: (data.createdAt as Timestamp).toDate(),
            } as Notification;
        });

        return notifications;
    } catch (error) {
        console.error("Error fetching user notifications:", error);
        throw new Error("Failed to fetch notifications.");
    }
};

/**
 * Marks a specific notification as read.
 * @param notificationId The ID of the notification to update.
 * @returns A promise that resolves when the update is complete.
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
    try {
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    } catch (error) {
        console.error("Error marking notification as read:", error);
        throw new Error("Failed to update notification status.");
    }
};

/**
 * Requests push notification permission, gets the FCM token, and saves it to the database.
 * NOTE: The web SDK requires a VAPID key for browsers, which may not be configured.
 * This function attempts to get the token and save it.
 * @param userId The user's ID.
 * @param userType The user's type ('worker' or 'venue').
 */
export const registerForPushNotifications = async (userId: string, userType: 'worker' | 'venue'): Promise<void> => {
    try {
        const messaging = getMessaging(app);
        // NOTE: You need to add your VAPID key from the Firebase console here
        const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_PUBLIC_KEY' });

        if (token) {
            console.log('FCM Token:', token);
            // Save the token to both the user's and their profile document
            const batch = writeBatch(db);
            const userRef = doc(db, "users", userId);
            const profileRef = doc(db, userType === 'venue' ? 'VenueProfiles' : 'WorkerProfiles', userId);

            const tokenPayload = { fcmTokens: arrayUnion(token) };

            batch.update(userRef, tokenPayload);
            batch.update(profileRef, tokenPayload);
            
            await batch.commit();
            console.log('FCM token saved successfully.');
        } else {
            console.log('No registration token available. Request permission to generate one.');
        }
    } catch (error) {
        console.error('An error occurred while retrieving or saving the FCM token:', error);
    }
};
