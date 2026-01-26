// src/lib/types.ts
import type { LucideIcon } from "lucide-react";
// Use React Native Firebase Firestore Timestamp
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
type Timestamp = FirebaseFirestoreTypes.Timestamp;


// --- DATA PAYLOADS FOR FORMS ---
export interface WorkerProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  nationality?: string;
  dateOfBirth?: Date; // Will be converted to Timestamp by Firestore
  skills?: string[];
  languages?: string[];
  description?: string;
  visaType?: string;
  visaExpiry?: Date; // Will be converted to Timestamp by Firestore
  irdNumber?: string;
  profilePictureUrl?: string;
  referredBy?: string | null;
  resumeUrl?: string;
}

export interface VenueProfileData {
  venueName: string;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  about?: string;
  companyNumber?: string; // NZBN
  posSystem?: string;
  logoUrl?: string;
  verificationDocumentUrls?: string[];
  referredBy?: string | null;
  coordinates?: {
    lat: number;
    lng: number;
  };
}


// --- FIRESTORE DOCUMENT TYPES ---
export interface BaseUser {
  uid: string;
  email: string;
}

export interface BaseProfile extends BaseUser {
  userType: 'worker' | 'venue' | 'admin' | 'pending';
  approved: boolean;
}

export interface VenueProfile {
    uid: string;
    venueName: string;
    logoUrl?: string;
    address: string;
    bio?: string;
    about?: string;
    avgRating?: number;
    totalShiftsPosted?: number;
    posSystem?: string;
    freeShiftsRemaining?: number;
    freeJobsRemaining?: number;
    reviews?: Review[];
}

export interface WorkerProfile {
    uid: string;
    firstName: string; 
    lastName: string;
    email: string;
    profilePictureUrl?: string;
    description?: string;
    skills?: string[];
    certifications?: string[];
    avgRating?: number;
    completedShifts?: number;
    phone?: string;
    location?: string;
    city?: string;
    resumeUrl?: string;
    stripeAccountStatus?: 'pending' | 'active' | 'action_required' | 'restricted';
}

// Union type for user profiles
export type UserProfile = WorkerProfile | VenueProfile;


// --- Data & Feature Types ---
export interface Shift {
  id: string;
  businessId: string;
  venueName: string;
  venueLogoUrl?: string;
  region?: string;
  role: string;
  roleId?: string;
  startTime: Date;
  endTime: Date;
  pay: number;
  location: string;
  description?: string;
  requirements?: string[];
  uniform?: string;
  status: 'posted' | 'filled' | 'completed' | 'cancelled' | 'offered_to_worker' | 'confirmed' | 'pending_changes' | 'pending_payment' | 'pending_worker_review' | 'active';
  workerId?: string;
  applicationCount?: number;
  breakDuration?: number;
  appliedWorkerIds?: string[];
  participantIds?: string[];
  offeredTo?: { id: string, name: string, avatarUrl?: string };
  acceptedByWorkerId?: string;
  assignedWorker?: { id: string; name: string; avatarUrl?: string; };
  invoiceId?: string;
  totalPayout?: number;
  shiftGroupId?: string;
  blockId?: string; // For grouping offers
  city?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt?: Date;
  acceptedAt?: Date;
}

export interface ShiftApplication {
    id: string;
    shiftId: string;
    workerId: string;
    workerName: string;
    workerAvatarUrl?: string;
    workerRating?: number; 
    status: 'pending' | 'accepted' | 'rejected' | 'offered';
    appliedAt: Timestamp;
}

export interface PermanentJob {
    id: string;
    title: string;
    businessId: string;
    businessName: string;
    businessLogoUrl: string;
    location: string;
    type: 'Full-Time' | 'Part-Time' | 'Fixed Term';
    salary: string;
    description: string;
    datePosted?: Date;
    roleCategories: string[];
    applicantCount?: number;
    viewCount?: number;
    status?: 'active' | 'filled' | 'deleted' | null;
    createdAt?: Timestamp;
    city?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    startDate?: Date;
}

export interface Applicant {
  id: string;
  name: string;
  avatarUrl: string;
  skills?: string[];
  rating: number;
  applicationDate: Date;
  status: 'pending' | 'offered' | 'hired' | 'rejected';
}

export interface GroupedApplicant {
    profile: WorkerProfile;
    applications: Application[];
}

export interface Application {
    id: string;
    shiftId: string;
    workerId: string;
    status: 'pending' | 'offered' | 'accepted' | 'rejected';
    appliedAt: Date;
}

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface SubReview {
  rating: number;
  comment: string;
  createdAt: Date | Timestamp;
}

export interface Review {
  id: string; // Will be the shiftId
  shiftId: string;
  venueId: string;
  workerId: string;
  venueToWorkerReview?: SubReview;
  workerToVenueReview?: SubReview;
  disputeStatus?: 'open' | 'resolved';
  rating: number;
  comment: string;
  date: Date;
  createdAt: Date;
  reviewer: { name: string; };
  shiftRole?: string;
  reviewerRole: 'worker' | 'venue';
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: { id: string; name: string; avatarUrl?: string }[];
  lastMessage: string;
  lastMessageTimestamp: Date;
  lastMessageSenderId: string;
  isLocked?: boolean;
  lockAt?: Date;
  shiftId?: string;
  shiftRole?: string;
  jobId?: string;
  jobTitle?: string;
  readBy?: string[];
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
  read: boolean;
  isSystemMessage?: boolean;
}

export interface Venue {
    id: string;
    name: string;
    logoUrl: string;
    location: string;
    rating: number;
    reviews: Review[];
    description: string;
    posSystem?: string;
    coordinates?: {
        lat: number;
        lon: number;
    };
    reliabilityScore?: number;
    venueName?: string;
}

export interface PastWorker {
    id: string;
    name: string;
    avatarUrl: string;
    skills: string[];
    rating: number;
    shiftsCompleted: number;
    reviews: Review[];
    resumeUrl?: string;
}

export interface User {
    id: string; // This is the UID
    name: string;
    email: string;
    role: 'worker' | 'business' | 'admin' | 'pending';
    approved: boolean;
    createdAt: Date | Timestamp;
    // Optional fields that might be present
    fcmTokens?: string[];
    skills?: string[];
    city?: string;
}

export interface SubmittedDocument {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    documentType: string;
    fileName: string;
    url: string;
    status: 'pending' | 'approved' | 'rejected';
    submittedAt: string; // ISO string
}

export interface Dispute {
    id: string;
    shiftId: string;
    reason: string;
    status: 'open' | 'resolved';
    createdAt: Timestamp | Date;
    resolvedAt?: Timestamp | Date;
    shift: {
        role: string;
        date: Timestamp | Date;
    };
    parties: {
        worker: { id: string; name: string; };
        venue: { id: string; name: string; };
    };
    reviews: {
        fromVenue?: { rating: number; comment: string; };
        fromWorker?: { rating: number; comment: string; };
    };
}

export interface LineItem {
    description?: string;
    shiftId?: string;
    shiftDate?: Date | Timestamp;
    role?: string;
    hours?: number;
    rate?: number;
    total: number;
}

export interface Invoice {
  id: string; // The invoice number, e.g., "10100"
  shiftIds?: string[];
  jobPostingId?: string;
  venueId: string;
  workerId?: string;
  invoiceDate: Timestamp;
  
  venueDetails: {
    name: string;
    nzbn?: string;
    address: string;
  };

  workerDetails?: {
    name: string;
  };

  lineItems: LineItem[];

  subtotal: number; // Worker Payout or Base Fee
  serviceFee: number;
  totalAmount: number; // Total charged to venue
  isEofy?: boolean;
}

// In-app notification structure
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  description: string;
  type: 'shift_offer' | 'shift_accepted' | 'shift_confirmed' | 'NEW_SHIFT_POSTED' | 'NEW_JOB_POSTED' | 'application_update' | 'NEW_JOB_APPLICANT' | 'review_received' | 'shift_declined' | 'shift_cancelled_by_worker' | 'shift_cancelled_by_venue' | 'shift_adjustment_declined' | 'shift_adjustment' | 'shift_adjustment_acceptance' | 'POOR_PERFORMANCE' | 'shift_filled';
  read: boolean;
  createdAt: Date;
  relatedEntityId: string;
  href: string; // The URL to navigate to when clicked
}

export interface ReferredVenue {
  id: string;
  name: string;
  logoUrl?: string;
  shiftsPosted: number;
}

export interface ReferredWorker {
  id: string;
  name: string;
  shiftsCompleted: number;
  approved: boolean;
  avatarUrl?: string;
}

export interface FullUserProfile {
  id: string;
  userType: 'worker' | 'venue' | 'admin';
  status: 'Active' | 'Pending';
  email: string;
  phone?: string;
  approved: boolean;
  
  // Worker fields
  firstName?: string;
  lastName?: string;
  profilePictureUrl?: string;
  skills?: string[];
  description?: string;
  nationality?: string;
  visaExpiry?: Timestamp | Date | string;
  idDocumentUrl?: string;
  visaDocumentUrl?: string;
  resumeUrl?: string;
  irdNumber?: string;
  dateOfBirth?: Timestamp | Date | string;
  
  // Venue fields
  venueName?: string;
  contactName?: string;
  logoUrl?: string;
  address?: string;
  about?: string; 
  companyNumber?: string;
  posSystem?: string;
  
  // Aggregated Stats
  stats?: {
    rating: number;
    shiftsCompleted: number;
    reliability: number;
  };
  
  // Related Data
  reviews?: Review[];
  disputes?: Dispute[];
  documents?: SubmittedDocument[];
}
