import { create } from 'zustand';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { auth } from '../../services/firebase';
import { getUserProfile, updateFCMToken } from '../../services/users';
import { UserProfile } from '../../types';

// 1. DEFINE THE STORE'S STATE
interface UserState {
  user: FirebaseAuthTypes.User | null; // Use the native User type
  profile: UserProfile | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  error: string | null;
  fcmToken: string | null;
}

// 2. DEFINE THE STORE'S ACTIONS
interface UserActions {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  subscribeToAuthState: () => () => void;
  fetchUserProfile: (uid: string) => Promise<void>;
  setFcmToken: (token: string) => Promise<void>;
  clearState: () => void;
}

// 3. CREATE THE ZUSTAND STORE
export const useUserStore = create<UserState & UserActions>((set, get) => ({
  // --- INITIAL STATE ---
  user: null,
  profile: null,
  isLoggedIn: false,
  isLoading: true,
  error: null,
  fcmToken: null,

  // --- AUTHENTICATION ACTIONS ---
  subscribeToAuthState: () => {
    set({ isLoading: true });
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        set({ user, isLoggedIn: true, error: null });
        await get().fetchUserProfile(user.uid);
        const fcmToken = get().fcmToken;
        if (fcmToken) {
          await get().setFcmToken(fcmToken);
        }
      } else {
        get().clearState();
      }
      set({ isLoading: false });
    });
    return unsubscribe;
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      await auth.signInWithEmailAndPassword(email, password);
      set({ isLoading: false });
    } catch (error: unknown) {
      console.error("Sign-in error:", error);
      set({ error: "Invalid email or password. Please try again.", isLoading: false });
      throw new Error("Failed to sign in");
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    try {
      await auth.signOut();
      get().clearState();
    } catch (error: unknown) {
      console.error("Sign-out error:", error);
      const message = error instanceof Error ? error.message : "An unknown error occurred during sign-out.";
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  // --- PROFILE & TOKEN ACTIONS ---
  fetchUserProfile: async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      if (!profile) {
        throw new Error('User profile not found in Firestore.');
      }
      set({ profile: profile as UserProfile, error: null });
    } catch (error: unknown) {
      console.error("Fetch Profile Error:", error);
      set({ error: "Could not load user profile. Please try signing out and back in." });
      await auth.signOut();
      get().clearState();
    }
  },

  setFcmToken: async (token) => {
    set({ fcmToken: token });
    const { user, profile } = get();
    if (user && profile) {
      try {
        await updateFCMToken(user.uid, token, profile.userType);
      } catch (e) {
        console.error("Failed to update FCM token in backend", e);
      }
    }
  },

  // --- UTILITY ACTIONS ---
  clearState: () => set({
    user: null,
    profile: null,
    isLoggedIn: false,
    error: null,
    isLoading: false,
    fcmToken: null,
  }),
}));
