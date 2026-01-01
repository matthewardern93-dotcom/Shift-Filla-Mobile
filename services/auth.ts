
import {
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut as firebaseSignOut, 
    sendPasswordResetEmail, 
    onAuthStateChanged, 
    User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { auth, db, functions } from './firebase';
import { WorkerProfile, VenueProfile, UserProfile } from '../types';

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
        // Add the userType property for client-side logic
        return { uid, userType: 'venue', ...venueDoc.data() } as VenueProfile;
    }

    const workerDoc = await getDoc(workerDocRef);
    if (workerDoc.exists()) {
        // Add the userType property for client-side logic
        return { uid, userType: 'worker', ...workerDoc.data() } as WorkerProfile;
    }

    console.warn(`User profile not found for UID: ${uid}`);
    return null;
};

/**
 * Registers a new user, creates their profile, and sets initial roles.
 * @param profileData The initial profile data, including email and userType.
 * @param password The user's chosen password.
 * @returns The complete user profile.
 */
export const signUp = async (profileData: Partial<UserProfile>, password: string): Promise<UserProfile | null> => {
    if (!profileData.email || !profileData.userType) {
        throw new Error('Email and userType are required for signup.');
    }

    const manageUsers = httpsCallable(functions, 'manageUsers');

    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, profileData.email, password);
    const { uid } = userCredential.user;

    // 2. Prepare the full profile document for Firestore
    const userProfileDoc = {
        ...profileData,
        uid,
        approved: false, // All new users start as not approved
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // 3. Create the user profile in the correct Firestore collection
    const profileCollection = profileData.userType === 'venue' ? 'VenueProfiles' : 'WorkerProfiles';
    await setDoc(doc(db, profileCollection, uid), userProfileDoc);

    // 4. Set initial claims using the `manageUsers` Cloud Function
    try {
        await manageUsers({
            action: 'setInitialClaims',
            uid: uid,
            email: profileData.email,
        });
    } catch (error) {
        // This is a critical step, but we won't block the user from signing in.
        // Log it for monitoring.
        console.error("Critical: Error setting initial claims via Cloud Function:", error);
    }

    // 5. Return the newly created and fetched profile
    return await getUserProfile(uid);
};

/**
 * Signs in a user with email and password.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user's profile.
 */
export const signIn = async (email, password): Promise<UserProfile | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user.uid);
    if (!userProfile) {
        // This case can happen if the profile document wasn't created properly.
        throw new Error("Authentication successful, but user profile not found in database.");
    }
    return userProfile;
};

/**
 * Signs the current user out.
 */
export const signOut = () => {
    return firebaseSignOut(auth);
};

/**
 * Sends a password reset email to the given email address.
 * @param email The email to send the reset link to.
 */
export const resetPassword = (email: string) => {
    return sendPasswordResetEmail(auth, email);
};

/**
 * Sets up a listener that triggers a callback whenever the user's authentication state changes.
 * @param callback The function to call with the Firebase User object or null.
 * @returns The unsubscribe function.
 */
export const onAuthStateChangedListener = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
