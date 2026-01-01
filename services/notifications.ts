
import { collection, query, where, getDocs, orderBy, limit, doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AppNotification } from '../types'; // Assuming Notification type exists in types.ts

// --- READ OPERATIONS ---

/**
 * Fetches notifications for a specific user.
 * @param userId The ID of the user to fetch notifications for.
 * @param unreadOnly If true, only fetches unread notifications. Defaults to false.
 * @param count The maximum number of notifications to fetch.
 * @returns An array of AppNotification objects.
 */
export const getNotifications = async (userId: string, unreadOnly: boolean = false, count: number = 50): Promise<AppNotification[]> => {
    let q = query(
        collection(db, 'notifications'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(count)
    );

    if (unreadOnly) {
        q = query(q, where('read', '==', false));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
};


// --- WRITE OPERATIONS ---

/**
 * Marks a specific notification as read.
 * @param notificationId The ID of the notification to update.
 * @returns A promise that resolves when the update is complete.
 */
export const markNotificationAsRead = (notificationId: string): Promise<void> => {
    const notificationRef = doc(db, 'notifications', notificationId);
    return updateDoc(notificationRef, { read: true });
};

/**
 * Marks all of a user's unread notifications as read.
 * @param userId The ID of the user whose notifications should be marked as read.
 * @returns A promise that resolves when the batch update is complete.
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<void> => {
    const q = query(collection(db, 'notifications'), where('userId', '==', userId), where('read', '==', false));
    const querySnapshot = await getDocs(q);
    
    const promises = querySnapshot.docs.map(document => 
        updateDoc(document.ref, { read: true })
    );

    await Promise.all(promises);
};
