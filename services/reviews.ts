import { doc, getDoc, setDoc, updateDoc, FieldValue, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Review } from '../types';

/**
 * Fetches the review document for a specific shift.
 * A review document can contain a review from the venue to the worker, and/or vice-versa.
 * @param shiftId The ID of the shift.
 * @returns A promise that resolves to the review object, or null if it doesn't exist.
 */
export const getReviewForShift = async (shiftId: string): Promise<Review | null> => {
    const reviewDocRef = doc(db, 'reviews', shiftId);
    const reviewSnap = await getDoc(reviewDocRef);
    if (reviewSnap.exists()) {
        return reviewSnap.data() as Review;
    }
    return null;
};

/**
 * Allows a worker to submit their review for a completed shift.
 * This function creates or merges a review document in the 'reviews' collection.
 * @param payload The data required to submit a worker's review.
 * @returns A promise that resolves when the operation is complete.
 */
export const submitWorkerReview = async (payload: { 
    shiftId: string; 
    venueId: string; 
    workerId: string; 
    rating: number; 
    comment: string; 
}): Promise<void> => {
    const { shiftId, venueId, workerId, rating, comment } = payload;
    const reviewDocRef = doc(db, 'reviews', shiftId);
    
    const reviewData = {
        shiftId,
        venueId,
        workerId,
        workerToVenueReview: {
            rating,
            comment,
            createdAt: serverTimestamp()
        }
    };

    // Use set with merge: true to create the doc or update it if it already exists
    // (e.g., if the venue has already left a review).
    await setDoc(reviewDocRef, reviewData, { merge: true });

    // Additionally, we need to update the shift status to 'completed'.
    const shiftDocRef = doc(db, 'shifts', shiftId);
    await updateDoc(shiftDocRef, { status: 'completed' });
};

/**
 * NOTE: Submitting a VENUE's review for a worker is handled by the `generateInvoice` 
 * function in `services/payments.ts`. When a venue finalizes a shift's hours,
 * their review is submitted as part of that single backend operation. 
 * This keeps the frontend logic simple and ensures the operations happen together.
 */
