
import { doc, getDoc, updateDoc, serverTimestamp, arrayUnion, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile, WorkerProfile, VenueProfile } from '../types';


// --- READ OPERATIONS (Direct Firestore Queries) ---

/**
 * Fetches a user's profile from either the VenueProfiles or WorkerProfiles collection.
 * @param uid The user's unique ID.
 * @returns The user profile object or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const venueDocRef = doc(db, 'VenueProfiles', uid);
    const workerDocRef = doc(db, 'WorkerProfiles', uid);

    const venueDoc = await getDoc(venueDocRef);
    if (venueDoc.exists()) {
        return { uid, userType: 'venue', ...venueDoc.data() } as VenueProfile;
    }

    const workerDoc = await getDoc(workerDocRef);
    if (workerDoc.exists()) {
        return { uid, userType: 'worker', ...workerDoc.data() } as WorkerProfile;
    }

    return null;
};


// --- WRITE OPERATIONS (Direct Firestore Updates) ---

/**
 * Updates a user's profile document in Firestore.
 * This should be used for updates initiated by the user themselves.
 * @param uid The UID of the user to update.
 * @param userType The type of user ('worker' or 'venue').
 * @param data The profile data to update.
 */
export const updateUserProfile = (uid: string, userType: 'worker' | 'venue', data: Partial<UserProfile>) => {
    const collectionName = userType === 'venue' ? 'VenueProfiles' : 'WorkerProfiles';
    const userDocRef = doc(db, collectionName, uid);
    
    // Add `updatedAt` to every update for tracking purposes
    const dataWithTimestamp = {
        ...data,
        updatedAt: serverTimestamp(),
    };
    
    return updateDoc(userDocRef, dataWithTimestamp);
};

/**
 * Adds or updates the FCM token for a user to enable push notifications.
 * This token is stored in both the main `users` collection and the user's specific profile.
 * @param uid The user's unique ID.
 * @param token The FCM device token.
 * @param userType The type of user ('worker' or 'venue').
 */
export const updateFCMToken = async (uid: string, token: string, userType: 'worker' | 'venue') => {
    const batch = writeBatch(db);

    // 1. Update the `users` collection document
    const userRef = doc(db, "users", uid);
    batch.update(userRef, {
        fcmTokens: arrayUnion(token)
    });

    // 2. Update the specific profile document (Worker or Venue)
    const profileCollection = userType === 'venue' ? 'VenueProfiles' : 'WorkerProfiles';
    const profileRef = doc(db, profileCollection, uid);
    batch.update(profileRef, {
        fcmTokens: arrayUnion(token)
    });

    return batch.commit();
};

