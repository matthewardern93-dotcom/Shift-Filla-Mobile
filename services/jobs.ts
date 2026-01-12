import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db, functions, httpsCallable } from './firebase';
import { Job, Application, PermanentJob, Applicant } from '../types';

// Create a callable function instance that points to the 'manageJobs' cloud function
const manageJobs = httpsCallable(functions, 'manageJobs');

// --- READ OPERATIONS (Direct Firestore Queries using Web SDK) ---

/**
 * Fetches permanent jobs from Firestore with optional filters.
 * This function now uses the modular Web SDK syntax.
 * @param filters - An object containing optional venueId and status filters.
 * @returns A promise that resolves to an array of PermanentJob objects.
 */
export const getPermanentJobs = async (filters: { venueId?: string; status?: string; }): Promise<PermanentJob[]> => {
    try {
        const jobsCollectionRef = collection(db, 'permanent_jobs');
        const queryConstraints = [];

        if (filters.venueId) {
            queryConstraints.push(where('venueId', '==', filters.venueId));
        }
        if (filters.status) {
            queryConstraints.push(where('status', '==', filters.status));
        }

        const q = query(jobsCollectionRef, ...queryConstraints);
        const querySnapshot = await getDocs(q);

        const jobs = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as PermanentJob));

        return jobs;
    } catch (error) {
        console.error("Error fetching permanent jobs: ", error);
        throw new Error('Failed to fetch permanent jobs.');
    }
};

/**
 * Fetches a single permanent job by its ID using the Web SDK.
 * @param jobId - The ID of the job.
 * @returns A promise that resolves to the permanent job data, or null if not found.
 */
export const getJob = async (jobId: string): Promise<Job | null> => {
  const jobDocRef = doc(db, 'permanent_jobs', jobId);
  const docSnap = await getDoc(jobDocRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Job;
  }
  return null;
};


// --- WRITE & COMPLEX READ OPERATIONS (Calling the 'manageJobs' Cloud Function) ---

/**
 * Fetches all applicants for a given job by calling the backend.
 * The backend function also calculates and returns the worker's average rating.
 */
export const getJobApplicants = async (jobId: string): Promise<Applicant[]> => {
    try {
        const result = await manageJobs({ action: 'getApplicantsForJob', jobId });
        // @ts-ignore
        if (result.data.success) {
             // @ts-ignore
            return result.data.applicants as Applicant[];
        }
        return [];
    } catch (error) {
        console.error('Error fetching job applicants:', error);
        throw error;
    }
};

/**
 * Sends a job application from a worker.
 */
export const applyToJob = (jobId: string) => {
    return manageJobs({ action: 'applyToJob', jobId });
};

/**
 * A venue offers a job to a specific worker.
 */
export const offerJob = (payload: { jobId: string; workerId: string; workerName: string; }) => {
    return manageJobs({ action: 'offerJob', ...payload });
};

/**
 * A worker accepts a job offer.
 */
export const acceptJobOffer = (jobId: string) => {
    return manageJobs({ action: 'acceptOffer', jobId });
};

/**
 * A worker declines a job offer.
 */
export const declineJobOffer = (jobId: string) => {
    return manageJobs({ action: 'declineOffer', jobId });
};

/**
 * A venue deletes a job posting.
 */
export const deleteJob = (payload: { jobId: string; reason: string; }) => {
    return manageJobs({ action: 'deleteJob', ...payload });
};

/**
 * A venue creates a new job posting.
 */
export const createJob = (payload: { jobData: any; promoCode?: string; }) => {
    return manageJobs({ action: 'createJob', ...payload });
};

/**
 * A venue edits an existing job posting.
 */
export const editJob = (payload: { jobId: string; jobData: any; }) => {
    return manageJobs({ action: 'editJob', ...payload });
};

/**
 * Increments the view count for a job.
 */
export const incrementViewCount = (jobId: string) => {
    return manageJobs({ action: 'incrementViewCount', jobId });
};
