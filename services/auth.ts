import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as firebaseSignOut, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, functions, httpsCallable } from './firebase';
import { UserProfile, WorkerProfile, VenueProfile } from '../types';

const manageUsers = httpsCallable(functions, 'manageUsers');

/**
 * Fetches a user's profile from either the VenueProfiles or WorkerProfiles collection.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    // First, try to get the user from VenueProfiles
    const venueDocRef = doc(db, 'VenueProfiles', uid);
    const venueDocSnap = await getDoc(venueDocRef);
    if (venueDocSnap.exists()) {
        return { uid, userType: 'venue', ...venueDocSnap.data() } as VenueProfile;
    }

    // If not found, try to get the user from WorkerProfiles
    const workerDocRef = doc(db, 'WorkerProfiles', uid);
    const workerDocSnap = await getDoc(workerDocRef);
    if (workerDocSnap.exists()) {
        return { uid, userType: 'worker', ...workerDocSnap.data() } as WorkerProfile;
    }

    console.warn(`User profile not found for UID: ${uid}`);
    return null;
};

/**
 * Signs up a new user, creates their profile, and sets initial claims.
 */
export const signUp = async (profileData: Partial<UserProfile>, password: string): Promise<UserProfile | null> => {
    if (!profileData.email || !profileData.userType) {
        throw new Error('Email and userType are required for signup.');
    }

    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, profileData.email, password);
    const { uid } = userCredential.user;

    // 2. Prepare user profile document
    const userProfileDoc = {
        ...profileData,
        uid,
        approved: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    };

    // 3. Save user profile to the correct collection
    const profileCollection = profileData.userType === 'venue' ? 'VenueProfiles' : 'WorkerProfiles';
    await setDoc(doc(db, profileCollection, uid), userProfileDoc);

    // 4. Set initial user claims via Cloud Function
    try {
        await manageUsers({
            action: 'setInitialClaims',
            uid: uid,
            email: profileData.email,
        });
    } catch (error) {
        // This is a critical step. If it fails, the user might not have the right permissions.
        console.error("Critical: Error setting initial claims via Cloud Function:", error);
        // Depending on the desired behavior, you might want to delete the user here or flag them for manual review.
    }

    // 5. Return the newly created user profile
    return await getUserProfile(uid);
};

/**
 * Signs in a user and fetches their complete profile.
 */
export const signIn = async (email: string, password: string): Promise<UserProfile | null> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userProfile = await getUserProfile(userCredential.user.uid);
    
    if (!userProfile) {
        // This case is unlikely if sign-up is working correctly, but it's good practice to handle it.
        throw new Error("Authentication successful, but user profile not found in database.");
    }
    
    return userProfile;
};

/**
 * Signs the current user out.
 */
export const signOut = (): Promise<void> => {
    return firebaseSignOut(auth);
};

/**
 * Sends a password reset email to the given email address.
 */
export const resetPassword = (email: string): Promise<void> => {
    return sendPasswordResetEmail(auth, email);
};

/**
 * Listens for changes to the user's authentication state.
 * This is a wrapper around the original onAuthStateChanged function.
 */
export const onAuthStateChangedListener = (callback: (user: any | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
