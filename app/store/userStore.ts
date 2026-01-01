
import { create } from 'zustand';
import { onAuthStateChanged, User, signInWithEmailAndPassword, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../../services/firebase';
import { getUserProfile } from '../../services/users';
import { updateFCMToken } from '../../services/users';
import { UserProfile } from '../../types';

// 1. DEFINE THE STORE'S STATE
interface UserState {
  user: User | null;         // The raw Firebase user object
  profile: UserProfile | null; // The user's data from Firestore (Worker or Venue profile)
  isLoggedIn: boolean;       // Is there an active, authenticated user?
  isLoading: boolean;        // For loading indicators during async operations
  error: string | null;      // To hold any error messages
  fcmToken: string | null;   // The Firebase Cloud Messaging token for push notifications
}

// 2. DEFINE THE STORE'S ACTIONS (functions to manipulate the state)
interface UserActions {
  // -- Authentication Actions --
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  subscribeToAuthState: () => () => void; // Returns the unsubscribe function
  
  // -- Profile & Token Actions --
  fetchUserProfile: (uid: string) => Promise<void>;
  setFcmToken: (token: string) => Promise<void>;
  clearState: () => void;
}

// 3. DEFINE THE INITIAL STATE
const initialState: UserState = {
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true, // Start as true to handle initial auth check
  error: null,
  fcmToken: null,
};

// 4. CREATE THE ZUSTAND STORE
export const useUserStore = create<UserState & UserActions>((set, get) => ({
  ...initialState,

  // --- AUTHENTICATION ACTIONS IMPLEMENTATION ---
  
  subscribeToAuthState: () => {
    set({ isLoading: true });
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        set({ user, isLoggedIn: true, error: null });
        await get().fetchUserProfile(user.uid);
        // If we have an FCM token, ensure it's updated in the backend
        if (get().fcmToken) {
            await get().setFcmToken(get().fcmToken!);
        }
      } else {
        get().clearState(); // User is signed out
      }
      set({ isLoading: false });
    });
    return unsubscribe; // Return the unsubscribe function for cleanup
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The `onAuthStateChanged` listener will handle setting user state and fetching the profile.
    } catch (error: any) {
      console.error("Sign-in error:", error);
      set({ error: "Invalid email or password. Please try again.", isLoading: false });
      // Re-throw the error if you need to handle it in the component
      throw new Error("Failed to sign in");
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await firebaseSignOut(auth);
      get().clearState();
    } catch (error: any) {
      console.error("Sign-out error:", error);
      set({ error: error.message });
    } finally {
      set({ isLoading: false });
    }
  },

  // --- PROFILE & TOKEN ACTIONS IMPLEMENTATION ---
  
  fetchUserProfile: async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      if (!profile) {
        throw new Error('User profile not found in Firestore.');
      }
      set({ profile, error: null });
    } catch (error: any) {      
      console.error("Fetch Profile Error:", error);
      set({ error: "Could not load user profile. Please try signing out and back in." });
      // If fetching the profile fails, the user is in a broken state. Sign them out.
      await firebaseSignOut(auth);
      get().clearState();
    }
  },
  
  setFcmToken: async (token) => {
    set({ fcmToken: token });
    // If a user is logged in, immediately update their token in the backend
    const { user, profile } = get();
    if (user && profile) {
        try {
            await updateFCMToken(user.uid, token, profile.userType);
        } catch(e) {
            console.error("Failed to update FCM token in backend", e);
        }
    }
  },
  
  // --- UTILITY ACTIONS ---
  
  clearState: () => set({ ...initialState, isLoading: false }),
}));
