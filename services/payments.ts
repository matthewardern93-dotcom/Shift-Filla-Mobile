import { functions, httpsCallable } from './firebase';
import { Invoice } from '../types';

// Create a callable function instance that points to the 'managePayments' cloud function
const managePayments = httpsCallable(functions, 'managePayments');

/**
 * Generates an invoice for a completed shift. This is called by a VENUE.
 * This single action also finalizes the shift times and submits the venue's review for the worker.
 * @param payload The data required to generate the invoice and finalize the shift.
 * @returns A promise that resolves with the newly created invoice.
 */
export const generateInvoice = async (payload: {
    shiftId: string;
    finalStartTime: string; // ISO 8601 string
    finalEndTime: string;   // ISO 8601 string
    finalBreakDuration: number; // in minutes
    rating: number;
    reviewText: string;
}): Promise<{ success: boolean; invoice: Invoice }> => {
    try {
        const result = await managePayments({ action: 'generateInvoice', ...payload });
        return result.data as { success: boolean; invoice: Invoice };
    } catch (error) {
        console.error('Error generating invoice:', error);
        throw error;
    }
};

/**
 * Generates an invoice for posting a new permanent job. This is called by a VENUE.
 * @param payload The data required to generate the job posting invoice.
 * @returns A promise that resolves with the newly created invoice.
 */
export const generateJobPostingInvoice = async (payload: {
    jobId: string;
    jobTitle: string;
}): Promise<{ success: boolean; invoice: Invoice }> => {
    try {
        const result = await managePayments({ action: 'generateJobPostingInvoice', ...payload });
        return result.data as { success: boolean; invoice: Invoice };
    } catch (error) {
        console.error('Error generating job posting invoice:', error);
        throw error;
    }
};

/**
 * NOTE: Payouts to workers are handled by a separate backend process (`processPayout`).
 * This is typically triggered by an admin or an automated system after an invoice is settled,
 * not directly by a client-side action in the mobile app.
 */
