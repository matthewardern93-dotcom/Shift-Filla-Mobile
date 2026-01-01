
import { Timestamp } from 'firebase/firestore';

// --- Profile Types ---
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
    userType: 'venue';
    venueName: string;
    logoUrl?: string;
    address: string;
    bio?: string;
    about?: string;
    avgRating?: number;
    totalShiftsPosted?: number;
    coordinates?: {
        lat: number;
        lng: number;
    };
    freeShiftsRemaining?: number;
    freeJobsRemaining?: number;
    city?: string;
    email?: string;
    phone?: string;
    posSystem?: string;
    id: string;
    reviews?: Review[];
    stripeAccountId?: string;
    stripeAccountStatus?: 'pending' | 'active' | 'action_required' | 'restricted';
}

export interface WorkerProfile {
    uid: string;
    userType: 'worker';
    firstName: string; 
    lastName: string;
    email: string;
    profilePictureUrl?: string;
    description?: string;
    skills?: string[];
    languages?: string[];
    certifications?: string[];
    avgRating?: number;
    completedShifts?: number;
    phone?: string;
    city?: string;
    id?: string;
    rating?: number;
    avatarUrl?: string;
    name?: string;
    reviews?: Review[];
    resumeUrl?: string;
    stripeAccountStatus?: 'pending' | 'active' | 'action_required' | 'restricted';
}

export type UserProfile = WorkerProfile | VenueProfile;

// --- Data & Feature Types ---
export interface Shift {
  id: string;
  businessId: string;
  venueName: string;
  venueLogoUrl?: string;
  region?: string;
  role: string;
  roleId?: string; // This is now optional as we standardize on using the capitalized `role`
  startTime: Date;
  endTime: Date;
  pay: number;
  location: string;
  description?: string;
  notes?: string;
  requirements?: string[];
  uniform?: string;
  isPriority: boolean;
  status: 'posted' | 'filled' | 'completed' | 'cancelled' | 'offered_to_worker' | 'confirmed' | 'pending_changes' | 'pending_payment' | 'pending_worker_review' | 'active';
  paymentStatus?: 'pending_venue_payment' | 'processing_venue_payment' | 'paid_by_venue' | 'payout_initiated' | 'payout_failed' | 'paid_out_to_worker';
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
  coordinates?: {
      lat: number;
      lng: number;
  };
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
    type: 'Full-Time' | 'Part-Time';
    salary: string;
    description: string;
    datePosted: Date;
    startDate?: Date;
    status?: 'active' | 'filled' | 'closed' | 'deleted';
    roleCategories: string[];
    applicantCount?: number;
    viewCount?: number;
    coordinates?: {
        lat: number;
        lng: number;
    };
}

export interface Applicant {
  id: string;
  name: string;
  avatarUrl: string;
  skills: string[];
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
    status: 'pending' | 'offered' | 'accepted' | 'rejected' | 'hired';
    appliedAt: Date;
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
  type?: 'venue_to_worker' | 'worker_to_venue';
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
    languages?: string[];
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'worker' | 'business' | 'admin';
    status: 'Active' | 'Pending Approval' | 'Suspended';
    avatarUrl?: string;
    skills?: string[];
    rating?: number;
    shiftsCompleted?: number;
    reviews?: Review[];
    // Worker specific
    firstName?: string;
    lastName?: string;
    phone?: string;
    city?: string;
    profilePictureUrl?: string;
    description?: string;
    languages?: string[];
    // Venue specific
    businessName?: string;
    logoUrl?: string;
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
    createdAt: Timestamp;
    resolvedAt?: Timestamp;
    shift: {
        role: string;
        date: Timestamp;
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

export interface Invoice {
  id: string; // The invoice number
  shiftIds: string[];
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

  lineItems: {
    description: string;
    shiftId?: string;
    shiftDate?: Timestamp;
    role?: string;
    hours?: number;
    rate?: number;
    total: number;
  }[];

  subtotal: number; // Worker Payout or base cost
  serviceFee: number;
  totalAmount: number; // Total charged to venue
  isEofy?: boolean;
}

// In-app notification structure
export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'NEW_SHIFT_POSTED' | 'NEW_JOB_POSTED' | 'shift_offer' | 'application_update' | 'review_received' | 'shift_accepted' | 'shift_declined' | 'shift_cancelled_by_worker' | 'shift_cancelled_by_venue' | 'shift_adjustment' | 'shift_adjustment_acceptance' | 'shift_adjustment_declined' | 'POOR_PERFORMANCE' | 'NEW_JOB_APPLICANT' | 'job_offer_declined' | 'shift_confirmed' | 'shift_filled';
  read: boolean;
  createdAt: Date;
  relatedEntityId: string;
  href: string; // The URL to navigate to when clicked
  description?: string;
}

// Type for the full user profile object used in the admin user search
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
  visaExpiry?: Timestamp;
  idDocumentUrl?: string;
  visaDocumentUrl?: string;
  resumeUrl?: string;
  irdNumber?: string;
  dateOfBirth?: Timestamp;
  
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
}
