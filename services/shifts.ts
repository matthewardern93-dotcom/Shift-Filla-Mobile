
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Shift, ShiftApplication } from '../types';

const manageShifts = httpsCallable(functions, 'manageShifts');

// --- READ OPERATIONS (Direct Firestore Queries) ---

export const getShifts = async (field: string, operator: any, value: any): Promise<Shift[]> => {
    const q = query(collection(db, 'shifts'), where(field, operator, value));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Shift));
};

export const getShift = async (shiftId: string): Promise<Shift | null> => {
    const shiftDocRef = doc(db, 'shifts', shiftId);
    const shiftDoc = await getDoc(shiftDocRef);
    if (shiftDoc.exists()) {
        return { id: shiftDoc.id, ...shiftDoc.data() } as Shift;
    }
    return null;
};

export const getShiftApplicants = async (shiftId: string): Promise<ShiftApplication[]> => {
    const q = query(collection(db, `shifts/${shiftId}/applications`));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShiftApplication));
};


// --- WRITE OPERATIONS (Calling the 'manageShifts' Cloud Function) ---

export const createShifts = (payload: any) => {
    return manageShifts({ action: 'createShifts', ...payload });
};

export const applyToShift = (shiftId: string) => {
    return manageShifts({ action: 'applyToShift', shiftId });
};

export const offerShift = (payload: { shiftId: string; workerId: string; }) => {
    return manageShifts({ action: 'offer', ...payload });
};

export const acceptShift = (shiftId: string) => {
    return manageShifts({ action: 'accept', shiftId });
};

export const declineOffer = (payload: { shiftId: string; reason?: string }) => {
    return manageShifts({ action: 'declineOffer', ...payload });
};

export const cancelShift = (payload: { shiftId: string; reason?: string }) => {
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

export const directOffer = (payload: { workerId: string; shiftDetails: any }) => {
    return manageShifts({ action: 'directOffer', ...payload });
};

export const offerBlock = (payload: { groupId: string; workerId: string; }) => {
    return manageShifts({ action: 'offerBlock', ...payload });
};

export const cancelBlock = (groupId: string) => {
    return manageShifts({ action: 'cancelBlock', groupId });
};
