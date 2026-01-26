import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { create } from "zustand";
import { getUserProfile } from "../../services/auth";
import { updateFCMToken } from "../../services/users";
import { UserProfile } from "../../types";

// --- STATE INTERFACE ---
interface AuthState {
  // Auth data
  user: FirebaseAuthTypes.User | null;
  profile: UserProfile | null;

  // Loading states
  isInitialized: boolean;
  isLoading: boolean;
  isAuthenticating: boolean;

  // Error handling
  error: string | null;

  // FCM token
  fcmToken: string | null;

  // Unsubscribe function for cleanup
  unsubscribe: (() => void) | null;
}

// --- ACTIONS INTERFACE ---
interface AuthActions {
  // Initialization
  initialize: () => void;

  // Authentication actions
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (profileData: Partial<UserProfile>, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  // Profile management
  fetchUserProfile: (uid: string) => Promise<void>;

  // FCM token management
  setFcmToken: (token: string) => Promise<void>;

  // Utility actions
  clearState: () => void;
  clearError: () => void;
}

// --- ZUSTAND STORE ---
export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // --- INITIAL STATE ---
  user: null,
  profile: null,
  isInitialized: false,
  isLoading: true,
  isAuthenticating: false,
  error: null,
  fcmToken: null,
  unsubscribe: null,

  // --- INITIALIZATION ---
  initialize: () => {
    // Prevent multiple initializations
    if (get().unsubscribe) {
      return;
    }

    set({ isLoading: true, isInitialized: false });

    // Subscribe to Firebase auth state changes
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // User is signed in
        set({ 
          user: firebaseUser, 
          error: null,
          isAuthenticating: true 
        });

        // Fetch user profile
        try {
          await get().fetchUserProfile(firebaseUser.uid);
          
          // Update FCM token if available
          const fcmToken = get().fcmToken;
          if (fcmToken) {
            await get().setFcmToken(fcmToken);
          }
        } catch (error) {
          console.error("Error fetching profile during initialization:", error);
          // Don't clear user here - let the error be handled by fetchUserProfile
        } finally {
          set({ isAuthenticating: false });
        }
      } else {
        // User is signed out
        get().clearState();
      }

      // Mark as initialized after first auth state check
      set({ isInitialized: true, isLoading: false });
    });

    set({ unsubscribe });
  },

  // --- AUTHENTICATION ACTIONS ---
  signIn: async (email, password) => {
    set({ error: null });

    try {
      // Only authenticate with Firebase
      // onAuthStateChanged listener will handle user state, profile fetch, and FCM token
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error: unknown) {
      console.error("Sign-in error:", error);
      
      let errorMessage = "Invalid email or password. Please try again.";
      if (error instanceof Error) {
        // Handle specific Firebase auth errors
        if (error.message.includes("user-not-found")) {
          errorMessage = "No account found with this email.";
        } else if (error.message.includes("wrong-password")) {
          errorMessage = "Incorrect password. Please try again.";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Invalid email address.";
        } else if (error.message.includes("too-many-requests")) {
          errorMessage = "Too many failed attempts. Please try again later.";
        }
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  signOut: async () => {
    set({ isLoading: true, error: null });

    // Immediately clear state to prevent race conditions
    // This ensures that when navigation happens, the store is already cleared
    // and redirect loops won't occur (e.g., when going from pending to login)
    get().clearState();

    try {
      await auth().signOut();
      // The auth state listener will fire and confirm the signout,
      // but state is already cleared so no redirect loops occur
    } catch (error: unknown) {
      console.error("Sign-out error:", error);
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred during sign-out.";
      set({ error: message });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (profileData, password) => {
    set({ error: null });

    try {
      if (!profileData.email || !profileData.userType) {
        throw new Error("Email and userType are required for signup.");
      }

      // Import signUp from auth service
      // onAuthStateChanged listener will handle user state, profile fetch, and FCM token
      const { signUp } = await import("../../services/auth");
      await signUp(profileData, password);
    } catch (error: unknown) {
      console.error("Sign-up error:", error);
      
      let errorMessage = "Failed to create account. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("email-already-in-use")) {
          errorMessage = "An account with this email already exists.";
        } else if (error.message.includes("weak-password")) {
          errorMessage = "Password is too weak. Please use a stronger password.";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Invalid email address.";
        } else {
          errorMessage = error.message;
        }
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  resetPassword: async (email) => {
    set({ error: null });

    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      
      let errorMessage = "Failed to send password reset email.";
      if (error instanceof Error) {
        if (error.message.includes("user-not-found")) {
          errorMessage = "No account found with this email.";
        } else if (error.message.includes("invalid-email")) {
          errorMessage = "Invalid email address.";
        }
      }

      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  // --- PROFILE MANAGEMENT ---
  fetchUserProfile: async (uid) => {
    try {
      const profile = await getUserProfile(uid);
      
      if (!profile) {
        throw new Error("User profile not found in Firestore.");
      }

      set({ profile: profile as UserProfile, error: null });
    } catch (error: unknown) {
      console.error("Fetch Profile Error:", error);
      
      const errorMessage =
        "Could not load user profile. Please try signing out and back in.";
      
      set({ 
        error: errorMessage,
        profile: null 
      });

      // Sign out if profile fetch fails
      try {
        await auth().signOut();
      } catch (signOutError) {
        console.error("Error signing out after profile fetch failure:", signOutError);
      }
      
      throw new Error(errorMessage);
    }
  },

  // --- FCM TOKEN MANAGEMENT ---
  setFcmToken: async (token) => {
    set({ fcmToken: token });

    const { user, profile } = get();
    if (user && profile) {
      try {
        await updateFCMToken(user.uid, token, profile.userType);
      } catch (error) {
        console.error("Failed to update FCM token in backend:", error);
        // Don't throw - FCM token update failure shouldn't break the app
      }
    }
  },

  // --- UTILITY ACTIONS ---
  clearState: () => {
    set({
      user: null,
      profile: null,
      error: null,
      isLoading: false,
      isAuthenticating: false,
      fcmToken: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));

