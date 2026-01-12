import { collection, query, where, getDocs, doc, getDoc, WhereFilterOp } from 'firebase/firestore';
import { db, functions, httpsCallable } from './firebase';
import { Shift, Application } from '../types';

// --- Type Definitions for Payloads ---
// This interface matches the payload expected by the `createShiftsV2` function in your backend.
interface CreateShiftsPayload {
    shifts: { pay: number; startTime: string; endTime: string; breakDuration?: number; shiftGroupId?: string; }[];
    role: string;
    roleId?: string;
    location: string;
    description?: string;
    uniform?: string;
    requirements?: string[];
    promoCode?: string;
}

// Create a callable function instance that points to the 'manageShifts' cloud function
const manageShifts = httpsCallable(functions, 'manageShifts');

// --- READ OPERATIONS (Direct Firestore Queries using Web SDK) ---

export const getShifts = async (field: string, operator: WhereFilterOp, value: unknown): Promise<Shift[]> => {
    const shiftsCollectionRef = collection(db, 'shifts');
    const q = query(shiftsCollectionRef, where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
};

export const getShift = async (shiftId: string): Promise<Shift | null> => {
    const shiftDocRef = doc(db, 'shifts', shiftId);
    const docSnap = await getDoc(shiftDocRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Shift;
    }
    return null;
};

export const getShiftApplications = async (shiftId: string): Promise<Application[]> => {
    const applicationsCollectionRef = collection(db, `shifts/${shiftId}/applications`);
    const querySnapshot = await getDocs(applicationsCollectionRef);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Application));
};


// --- WRITE OPERATIONS (Calling the 'manageShifts' Cloud Function) ---

export const createShifts = (payload: CreateShiftsPayload) => {
    return manageShifts({ action: 'createShifts', ...payload });
};

export const applyToShift = (shiftId: string) => {
    return manageShifts({ action: 'applyToShift', shiftId });
};

export const offerShift = (payload: { shiftId: string; workerId: string; }) => {
    // The backend action is 'offer'
    return manageShifts({ action: 'offer', ...payload });
};

export const acceptShift = (shiftId: string) => {
    // The backend action is 'accept'
    return manageShifts({ action: 'accept', shiftId });
};

export const declineOffer = (payload: { shiftId: string; reason?: string }) => {
    return manageShifts({ action: 'declineOffer', ...payload });
};

export const cancelShift = (payload: { shiftId: string; reason?: string }) => {
    // The backend action is 'cancel'
    return manageShifts({ action: 'cancel', ...payload });
};

export const requestShiftChanges = (payload: { shiftId: string; startTime: string; endTime: string; breakDuration: number }) => {
    return manageShifts({ action: 'requestChanges', ...payload });
};

export const acceptShiftChanges = (shiftId: string) => {
    return manageShifts({ action: 'acceptChanges', shiftId });
};

export const declineShiftChanges = (shiftId: string) => {
    return manageShifts({ action: 'declineChanges', shiftId });
};

export const directOffer = (payload: { workerId: string; shiftDetails: Partial<Shift> }) => {
    return manageShifts({ action: 'directOffer', ...payload });
};

export const offerBlock = (payload: { groupId: string; workerId: string; }) => {
    return manageShifts({ action: 'offerBlock', ...payload });
};

export const cancelBlock = (groupId: string) => {
    return manageShifts({ action: 'cancelBlock', groupId });
};
