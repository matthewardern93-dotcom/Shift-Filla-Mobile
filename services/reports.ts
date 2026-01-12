import { functions, httpsCallable } from './firebase';
import { Shift } from '../types';

// Interface for the financial statistics returned by the backend
export interface FinancialStats {
    shiftFees: { wtd: number; mtd: number; ytd: number; };
    jobFees: { wtd: number; mtd: number; ytd: number; };
}

// Interface for the posting analysis statistics
export interface PostingAnalysisStats {
    shiftsPosted: number;
    jobsPosted: number;
    shiftServiceFees: number;
    jobPostingFees: number;
    totalRevenue: number;
}

// Interface for the result of the daily completed shifts report
export interface DailyCompletedShiftsReport {
    shifts: Shift[];
    totalServiceFee: number;
}

// All of these are admin-only functions.
const manageReports = httpsCallable(functions, 'manageReports');

/**
 * [Admin] Fetches all shifts that are active today.
 * @returns A promise that resolves to an array of active shifts.
 */
export const getTodaysActiveJobs = async (): Promise<Shift[]> => {
    try {
        const result = await manageReports({ action: 'getTodaysActiveJobs' });
        // @ts-ignore
        if (result.data.success) {
            // @ts-ignore
            return result.data.shifts as Shift[];
        }
        return [];
    } catch (error) {
        console.error("Error fetching today's active jobs report:", error);
        throw error;
    }
};

/**
 * [Admin] Fetches all shifts completed yesterday and calculates the total service fee.
 * @returns A promise that resolves to an object containing the completed shifts and total service fee.
 */
export const getDailyCompletedShifts = async (): Promise<DailyCompletedShiftsReport> => {
    try {
        const result = await manageReports({ action: 'getDailyCompletedShifts' });
        // @ts-ignore
        if (result.data.success) {
            // @ts-ignore
            return result.data as DailyCompletedShiftsReport;
        }
        return { shifts: [], totalServiceFee: 0 };
    } catch (error) {
        console.error("Error fetching daily completed shifts report:", error);
        throw error;
    }
};

/**
 * [Admin] Fetches financial statistics (Week-to-date, Month-to-date, Year-to-date).
 * @returns A promise that resolves to an object with financial stats.
 */
export const getFinancialStats = async (): Promise<FinancialStats> => {
    try {
        const result = await manageReports({ action: 'getFinancialStats' });
        // @ts-ignore
        if (result.data.success) {
            // @ts-ignore
            return result.data.stats as FinancialStats;
        }
        return { shiftFees: { wtd: 0, mtd: 0, ytd: 0 }, jobFees: { wtd: 0, mtd: 0, ytd: 0 }};
    } catch (error) {
        console.error("Error fetching financial stats:", error);
        throw error;
    }
};

/**
 * [Admin] Fetches a posting analysis for a given date range.
 * @param startDate - The start date for the analysis (ISO string).
 * @param endDate - The end date for the analysis (ISO string).
 * @returns A promise that resolves to an object with posting analysis stats.
 */
export const getPostingAnalysis = async (startDate: string, endDate: string): Promise<PostingAnalysisStats> => {
    try {
        const result = await manageReports({ action: 'getPostingAnalysis', startDate, endDate });
        // @ts-ignore
        if (result.data.success) {
            // @ts-ignore
            return result.data.stats as PostingAnalysisStats;
        }
        return { shiftsPosted: 0, jobsPosted: 0, shiftServiceFees: 0, jobPostingFees: 0, totalRevenue: 0 };
    } catch (error) {
        console.error("Error fetching posting analysis:", error);
        throw error;
    }
};
