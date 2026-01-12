
import { functions, httpsCallable } from './firebase';

// This interface defines the shape of a valid promo code response.
interface ValidPromoCode {\n    success: true;\n    description: string;\n    type: 'free_job_posting' | 'free_shift_posting' | string; // Extend with other types as needed\n}

// Callable function instance for 'managePayments'
const managePayments = httpsCallable(functions, 'managePayments');

/**
 * Validates a promo code by calling the backend.
 * @param code The promo code string to validate.
 * @returns A promise that resolves with the promo code details if valid.
 * @throws Throws an HttpsError if the code is not found or already used.
 */
export const validatePromoCode = async (code: string): Promise<ValidPromoCode> => {
    try {
        const result = await managePayments({ action: 'validatePromoCode', code });
        return result.data as ValidPromoCode;
    } catch (error) {
        console.error('Error validating promo code:', error);
        throw error;
    }
};

/**
 * [Admin] Generates a specified number of new promo codes.
 * This is an admin-only function.
 * @param payload - The details for the promo codes to be generated.
 * @returns A promise that resolves with a success message.
 */
export const generatePromoCodes = async (payload: { count: number; type: string; description: string; }): Promise<{ success: boolean; message: string; }> => {
    try {
        const result = await managePayments({ action: 'generatePromoCodes', ...payload });
        return result.data as { success: boolean; message: string; };
    } catch (error) {
        console.error('Error generating promo codes:', error);
        throw error;
    }
};
