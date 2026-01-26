import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";
import functions from "@react-native-firebase/functions";
import storage from "@react-native-firebase/storage";
import {
    Dispute,
    FullUserProfile,
    SubmittedDocument,
    UserProfile,
    VenueProfile,
    WorkerProfile,
} from "../types";

// Create a helper function to get the manageUsers callable function
// This avoids calling functions() at module level
const getManageUsers = () => functions().httpsCallable("manageUsers");

// --- CLIENT-SIDE READ/WRITE OPERATIONS ---

/**
 * Fetches a user's public profile from either VenueProfiles or WorkerProfiles.
 * This is a client-side function for reading publicly available profile data.
 * @param uid The ID of the user to fetch.
 * @returns A promise that resolves to the user's profile, or null if not found.
 */
export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  // First, try to fetch from VenueProfiles
  const venueDocRef = firestore().collection("VenueProfiles").doc(uid);
  const venueDocSnap = await venueDocRef.get();
  if (venueDocSnap.exists) {
    return { uid, ...venueDocSnap.data() } as VenueProfile;
  }

  // If not found in venues, try WorkerProfiles
  const workerDocRef = firestore().collection("WorkerProfiles").doc(uid);
  const workerDocSnap = await workerDocRef.get();
  if (workerDocSnap.exists) {
    return { uid, ...workerDocSnap.data() } as WorkerProfile;
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
export const updateUserProfile = (
  uid: string,
  userType: "worker" | "venue",
  data: Partial<WorkerProfile | VenueProfile>,
): Promise<void> => {
  if (!uid || !userType) {
    throw new Error("User ID and user type are required to update a profile.");
  }
  const collectionName =
    userType === "worker" ? "WorkerProfiles" : "VenueProfiles";
  const userDocRef = firestore().collection(collectionName).doc(uid);

  const updatePayload = {
    ...data,
    updatedAt: firestore.FieldValue.serverTimestamp(), // Automatically update the timestamp
  };

  return userDocRef.update(updatePayload);
};

/**
 * Helper function to upload a file to Firebase Storage and return the download URL
 */
const uploadFile = async (
  localUri: string,
  storagePath: string,
): Promise<string> => {
  const reference = storage().ref(storagePath);
  await reference.putFile(localUri);
  return await reference.getDownloadURL();
};

/**
 * Signs up a new worker with file uploads.
 * @param data Worker signup data including file URIs
 * @returns Promise that resolves when signup is complete
 */
export const signUpWorker = async (data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  location: string;
  skills: string[];
  languages: string[];
  about: string;
  resumeUrl: string; // Local URI
  nationality: string;
  dateOfBirth: Date;
  idDocumentUrl: string; // Local URI
  visaDocumentUrl?: string; // Local URI (optional)
  visaType?: string;
  visaExpiry?: Date;
  irdNumber: string;
  profilePictureUrl: string; // Local URI
}): Promise<UserProfile | null> => {
  try {
    // 1. Create auth user first to get UID
    const userCredential = await auth().createUserWithEmailAndPassword(
      data.email,
      data.password,
    );
    console.log("User created with UID:", userCredential.user.uid);
    const uid = userCredential.user.uid;

    // 2. Create Firestore profile IMMEDIATELY (before uploads) to prevent auth listener sign-out
    // This ensures when onAuthStateChanged triggers, the profile exists
    // Build profile data conditionally to avoid undefined values (Firestore doesn't accept undefined)
    const initialProfileData: any = {
      uid,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      location: data.location,
      city: data.location,
      skills: data.skills,
      languages: data.languages,
      description: data.about,
      about: data.about,
      nationality: data.nationality,
      dateOfBirth: data.dateOfBirth,
      irdNumber: data.irdNumber,
      userType: "worker",
      approved: false,
      // File URLs will be updated after upload (empty strings are placeholders)
      profilePictureUrl: "",
      resumeUrl: "",
      idDocumentUrl: "",
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // Only add optional fields if they have values
    if (data.visaType) {
      initialProfileData.visaType = data.visaType;
    }
    if (data.visaExpiry) {
      initialProfileData.visaExpiry = data.visaExpiry;
    }
    if (data.visaDocumentUrl) {
      initialProfileData.visaDocumentUrl = ""; // Placeholder, will be updated after upload
    }

    await firestore()
      .collection("WorkerProfiles")
      .doc(uid)
      .set(initialProfileData);

    // 3. Upload files to Firebase Storage (user is authenticated and profile exists)
    const filePaths: { [key: string]: string } = {};

    try {
      // Upload profile picture
      filePaths.profilePictureUrl = await uploadFile(
        data.profilePictureUrl,
        `WorkerProfiles/${uid}/profilePicture.jpg`,
      );

      // Upload resume
      const resumeExtension = data.resumeUrl.split(".").pop() || "pdf";
      filePaths.resumeUrl = await uploadFile(
        data.resumeUrl,
        `WorkerProfiles/${uid}/resume.${resumeExtension}`,
      );

      // Upload ID document
      const idDocExtension = data.idDocumentUrl.split(".").pop() || "pdf";
      filePaths.idDocumentUrl = await uploadFile(
        data.idDocumentUrl,
        `WorkerProfiles/${uid}/idDocument.${idDocExtension}`,
      );

      // Upload visa document if provided
      if (data.visaDocumentUrl) {
        const visaDocExtension = data.visaDocumentUrl.split(".").pop() || "pdf";
        filePaths.visaDocumentUrl = await uploadFile(
          data.visaDocumentUrl,
          `WorkerProfiles/${uid}/visaDocument.${visaDocExtension}`,
        );
      }
    } catch (uploadError: any) {
      console.error("Worker file upload error:", uploadError);
      throw uploadError;
    }

    // 4. Update Firestore profile with download URLs
    const updateData: any = {
      profilePictureUrl: filePaths.profilePictureUrl,
      resumeUrl: filePaths.resumeUrl,
      idDocumentUrl: filePaths.idDocumentUrl,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    // Only include visa document URL if it was uploaded
    if (filePaths.visaDocumentUrl) {
      updateData.visaDocumentUrl = filePaths.visaDocumentUrl;
    }

    await firestore().collection("WorkerProfiles").doc(uid).update(updateData);

    // 5. Set initial user claims via Cloud Function
    try {
      const manageUsers = getManageUsers();
      await manageUsers({
        action: "setInitialClaims",
        uid: uid,
        email: data.email,
      });
    } catch (error) {
      console.error(
        "Critical: Error setting initial claims via Cloud Function:",
        error,
      );
      // Note: User is already created, so we continue
    }

    // 6. Return the newly created user profile
    return await getUserProfile(uid);
  } catch (error: any) {
    console.error("Error in signUpWorker:", error);
    throw error;
  }
};

/**
 * Signs up a new venue with file uploads.
 * @param data Venue signup data including file URIs
 * @returns Promise that resolves when signup is complete
 */
export const signUpVenue = async (data: {
  email: string;
  password: string;
  venueName: string;
  contactName: string;
  phone: string;
  address: string;
  city: string;
  about?: string;
  logoUri: string; // Local URI
  verificationDocumentUri: string; // Local URI
  companyNumber?: string;
  posSystem?: string;
}): Promise<UserProfile | null> => {
  try {
    // 1. Create auth user first to get UID
    const userCredential = await auth().createUserWithEmailAndPassword(
      data.email,
      data.password,
    );
    const uid = userCredential.user.uid;

    // 2. Create Firestore profile IMMEDIATELY (before uploads) to prevent auth listener sign-out
    const initialProfileData: any = {
      uid,
      venueName: data.venueName,
      contactName: data.contactName,
      phone: data.phone,
      address: data.address,
      city: data.city,
      about: data.about,
      bio: data.about,
      companyNumber: data.companyNumber,
      posSystem: data.posSystem,
      approved: false,
      // File URLs will be updated after upload
      logoUrl: "",
      verificationDocumentUrl: "",
      createdAt: firestore.FieldValue.serverTimestamp(),
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore()
      .collection("VenueProfiles")
      .doc(uid)
      .set(initialProfileData);

    // 3. Upload files to Firebase Storage (user is authenticated and profile exists)
    const filePaths: { [key: string]: string } = {};

    try {
      // Upload logo
      const logoExtension = data.logoUri.split(".").pop() || "jpg";
      filePaths.logoUrl = await uploadFile(
        data.logoUri,
        `venues/${uid}/logo.${logoExtension}`,
      );

      // Upload verification document
      const verificationDocExtension =
        data.verificationDocumentUri.split(".").pop() || "pdf";
      filePaths.verificationDocumentUrl = await uploadFile(
        data.verificationDocumentUri,
        `venues/${uid}/verificationDocument.${verificationDocExtension}`,
      );
    } catch (uploadError) {
      console.error("Venue file upload error:", uploadError);
      throw uploadError;
    }

    // 4. Update Firestore profile with download URLs
    const updateData = {
      logoUrl: filePaths.logoUrl,
      verificationDocumentUrl: filePaths.verificationDocumentUrl,
      updatedAt: firestore.FieldValue.serverTimestamp(),
    };

    await firestore().collection("VenueProfiles").doc(uid).update(updateData);

    // 5. Set initial user claims via Cloud Function
    try {
      const manageUsers = getManageUsers();
      await manageUsers({
        action: "setInitialClaims",
        uid: uid,
        email: data.email,
      });
    } catch (error) {
      console.error(
        "Critical: Error setting initial claims via Cloud Function:",
        error,
      );
      // Note: User is already created, so we continue
    }

    // 6. Return the newly created user profile
    return await getUserProfile(uid);
  } catch (error) {
    console.error("Error in signUpVenue:", error);
    throw error;
  }
};

/**
 * Updates FCM token for a user
 */
export const updateFCMToken = async (
  uid: string,
  token: string,
  userType: "worker" | "venue",
): Promise<void> => {
  const collectionName =
    userType === "worker" ? "WorkerProfiles" : "VenueProfiles";
  await firestore().collection(collectionName).doc(uid).update({
    fcmToken: token,
    updatedAt: firestore.FieldValue.serverTimestamp(),
  });
};

// --- ADMIN-ONLY OPERATIONS (Calling the 'manageUsers' Cloud Function) ---

/**
 * [Admin] Fetches detailed profiles for multiple users.
 */
export const getUsers = async (params: {
  userType?: "worker" | "venue";
  field?: string;
  query?: string;
}): Promise<FullUserProfile[]> => {
  const manageUsers = getManageUsers();
  const result = await manageUsers({ action: "getUsers", ...params });
  return result.data as FullUserProfile[];
};

/**
 * [Admin] Approves or rejects a user's application.
 */
export const processUserApproval = (payload: {
  uid: string;
  userType: "worker" | "venue";
  approvalAction: "approve" | "reject";
  reason?: string;
  address?: any;
}) => {
  const manageUsers = getManageUsers();
  return manageUsers({ action: "processApproval", ...payload });
};

/**
 * [Admin] Approves or rejects a user's submitted document.
 */
export const processDocumentApproval = (payload: {
  userId: string;
  docId: string;
  status: "approved" | "rejected";
}) => {
  const manageUsers = getManageUsers();
  return manageUsers({ action: "processDocumentApproval", ...payload });
};

/**
 * [Admin] Fetches disputes based on their status.
 */
export const getDisputes = async (
  status: "open" | "closed" | "all" = "open",
): Promise<Dispute[]> => {
  const manageUsers = getManageUsers();
  const result = await manageUsers({ action: "getDisputes", status });
  // @ts-ignore
  return result.data.disputes;
};

/**
 * [Admin] Fetches all documents that are pending approval.
 */
export const getPendingDocuments = async (): Promise<SubmittedDocument[]> => {
  const manageUsers = getManageUsers();
  const result = await manageUsers({ action: "getPendingDocuments" });
  // @ts-ignore
  return result.data.documents;
};

/**
 * [Admin] Fetches all users who are pending approval.
 */
export const getPendingUsers = async (): Promise<any[]> => {
  const manageUsers = getManageUsers();
  const result = await manageUsers({ action: "getPendingUsers" });
  // @ts-ignore
  return result.data.users;
};

/**
 * [Admin] Fetches a report of workers with visas that are expiring soon.
 */
export const getExpiringVisas = async (): Promise<any[]> => {
  const manageUsers = getManageUsers();
  const result = await manageUsers({ action: "getExpiringVisas" });
  return result.data as any[];
};
