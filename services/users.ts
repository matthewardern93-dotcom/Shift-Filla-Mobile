import {
    doc,
    getDoc,
    updateDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db, functions, httpsCallable } from './firebase';
import { UserProfile, WorkerProfile, VenueProfile, FullUserProfile, SubmittedDocument, Dispute } from '../types';

// Create a callable function instance that points to the 'manageUsers' cloud function
const manageUsers = httpsCallable(functions, 'manageUsers');

// --- CLIENT-SIDE READ/WRITE OPERATIONS ---

/**
 * Fetches a user's public profile from either VenueProfiles or WorkerProfiles.
 * This is a client-side function for reading publicly available profile data.
 * @param uid The ID of the user to fetch.
 * @returns A promise that resolves to the user's profile, or null if not found.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    // First, try to fetch from VenueProfiles
    const venueDocRef = doc(db, 'VenueProfiles', uid);
    const venueDocSnap = await getDoc(venueDocRef);
    if (venueDocSnap.exists()) {
        return { uid, userType: 'venue', ...venueDocSnap.data() } as VenueProfile;
    }

    // If not found in venues, try WorkerProfiles
    const workerDocRef = doc(db, 'WorkerProfiles', uid);
    const workerDocSnap = await getDoc(workerDocRef);
    if (workerDocSnap.exists()) {
        return { uid, userType: 'worker', ...workerDocSnap.data() } as WorkerProfile;
    }

    console.warn(`User profile not found for UID: ${uid}`);
    return null;
};

/**
 * Updates a user's profile data in Firestore. This function should be used for 
 * users updating their own profiles.
 * @param uid The ID of the user whose profile is to be updated.
 * @param userType The type of user ('worker' or 'venue').
 * @param data An object containing the profile fields to update.
 * @returns A promise that resolves when the update is complete.
 */
export const updateUserProfile = (uid: string, userType: 'worker' | 'venue', data: Partial<WorkerProfile | VenueProfile>): Promise<void> => {
    if (!uid || !userType) {
        throw new Error('User ID and user type are required to update a profile.');
    }
    const collectionName = userType === 'worker' ? 'WorkerProfiles' : 'VenueProfiles';
    const userDocRef = doc(db, collectionName, uid);
    
    const updatePayload = {
        ...data,
        updatedAt: serverTimestamp(), // Automatically update the timestamp
    };

    return updateDoc(userDocRef, updatePayload);
};


// --- ADMIN-ONLY OPERATIONS (Calling the 'manageUsers' Cloud Function) ---

/**
 * [Admin] Fetches detailed profiles for multiple users.
 */
export const getUsers = async (params: { userType?: 'worker' | 'venue'; field?: string; query?: string; }): Promise<FullUserProfile[]> => {
    const result = await manageUsers({ action: 'getUsers', ...params });
    return result.data as FullUserProfile[];
};

/**
 * [Admin] Approves or rejects a user's application.
 */
export const processUserApproval = (payload: { uid: string; userType: 'worker' | 'venue'; approvalAction: 'approve' | 'reject'; reason?: string; address?: any; }) => {
    return manageUsers({ action: 'processApproval', ...payload });
};

/**
 * [Admin] Approves or rejects a user's submitted document.
 */
export const processDocumentApproval = (payload: { userId: string; docId: string; status: 'approved' | 'rejected'; }) => {
    return manageUsers({ action: 'processDocumentApproval', ...payload });
};

/**
 * [Admin] Fetches disputes based on their status.
 */
export const getDisputes = async (status: 'open' | 'closed' | 'all' = 'open'): Promise<Dispute[]> => {
    const result = await manageUsers({ action: 'getDisputes', status });
    // @ts-ignore
    return result.data.disputes;
};

/**
 * [Admin] Fetches all documents that are pending approval.
 */
export const getPendingDocuments = async (): Promise<SubmittedDocument[]> => {
    const result = await manageUsers({ action: 'getPendingDocuments' });
    // @ts-ignore
    return result.data.documents;
};

/**
 * [Admin] Fetches all users who are pending approval.
 */
export const getPendingUsers = async (): Promise<any[]> => {
    const result = await manageUsers({ action: 'getPendingUsers' });
    // @ts-ignore
    return result.data.users;
};

/**
 * [Admin] Fetches a report of workers with visas that are expiring soon.
 */
export const getExpiringVisas = async (): Promise<any[]> => {
    const result = await manageUsers({ action: 'getExpiringVisas' });
    return result.data as any[];
};
