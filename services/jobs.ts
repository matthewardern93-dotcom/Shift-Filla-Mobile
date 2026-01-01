
import { collection, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { PermanentJob } from '../types';

const manageJobs = httpsCallable(functions, 'manageJobs');

// --- READ OPERATIONS (Direct Firestore Queries & Callable Functions for complex reads) ---

export const getJobs = async (): Promise<PermanentJob[]> => {
    const q = query(collection(db, 'permanent_jobs'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PermanentJob));
};

export const getJob = async (jobId: string): Promise<PermanentJob | null> => {
    const jobDocRef = doc(db, 'permanent_jobs', jobId);
    const jobDoc = await getDoc(jobDocRef);
    if (jobDoc.exists()) {
        return { id: jobDoc.id, ...doc.data() } as PermanentJob;
    }
    return null;
};

export const getApplicantsForJob = async (jobId: string) => {
    const result = await manageJobs({ action: 'getApplicantsForJob', jobId });
    return (result.data as any).applicants;
};


// --- WRITE OPERATIONS (Callable Cloud Functions) ---

export const createJob = (payload: { jobData: any; promoCode?: string }) => {
    return manageJobs({ action: 'createJob', ...payload });
};

export const editJob = (payload: { jobId: string; jobData: any }) => {
    return manageJobs({ action: 'editJob', ...payload });
};

export const deleteJob = (payload: { jobId: string; reason: string }) => {
    return manageJobs({ action: 'deleteJob', ...payload });
};

export const applyToJob = (jobId: string) => {
    return manageJobs({ action: 'applyToJob', jobId });
};

export const offerJob = (payload: { jobId: string; workerId: string; workerName: string }) => {
    return manageJobs({ action: 'offerJob', ...payload });
};

export const acceptJobOffer = (jobId: string) => {
    return manageJobs({ action: 'acceptOffer', jobId });
};

export const declineJobOffer = (jobId: string) => {
    return manageJobs({ action: 'declineOffer', jobId });
};

export const incrementJobViewCount = (jobId: string) => {
    // This is a fire-and-forget call, we don't need to block on its completion
    manageJobs({ action: 'incrementViewCount', jobId });
};
