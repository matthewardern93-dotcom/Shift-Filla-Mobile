import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { startOfYesterday, endOfYesterday, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';

const SERVICE_FEE_RATE = 0.12;

const calculateShiftStats = (shiftsSnapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
    let totalRevenue = 0;
    const totalCount = shiftsSnapshot.size;

    shiftsSnapshot.forEach((doc: FirebaseFirestoreTypes.QueryDocumentSnapshot) => {
        const shift = doc.data();
        if (shift.totalPayout && typeof shift.totalPayout === 'number') {
            totalRevenue += shift.totalPayout * SERVICE_FEE_RATE;
        }
    });

    return { totalCount, totalRevenue };
};

export const getAdminDashboardStats = async () => {
    try {
        const now = new Date();

        const yesterdayStart = startOfYesterday();
        const yesterdayEnd = endOfYesterday();
        const weekStart = startOfWeek(now, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
        const monthStart = startOfMonth(now);

        const shiftsCollection = db.collection('shifts');

        const shiftsYesterdayQuery = shiftsCollection.where('startTime', '>=', firestore.Timestamp.fromDate(yesterdayStart)).where('startTime', '<=', firestore.Timestamp.fromDate(yesterdayEnd));
        const shiftsThisWeekQuery = shiftsCollection.where('startTime', '>=', firestore.Timestamp.fromDate(weekStart)).where('startTime', '<=', firestore.Timestamp.fromDate(now));
        const shiftsMTDQuery = shiftsCollection.where('startTime', '>=', firestore.Timestamp.fromDate(monthStart)).where('startTime', '<=', firestore.Timestamp.fromDate(now));
        const forecastedShiftsQuery = shiftsCollection.where('startTime', '>', firestore.Timestamp.fromDate(now)).where('startTime', '<=', firestore.Timestamp.fromDate(weekEnd));
        
        const workersForApprovalQuery = db.collection('WorkerProfiles').where('approved', '==', false);
        const venuesForApprovalQuery = db.collection('VenueProfiles').where('approved', '==', false);
        const disputesQuery = db.collection('disputes');

        const [
            shiftsYesterdaySnapshot,
            shiftsThisWeekSnapshot,
            shiftsMTDSnapshot,
            forecastedShiftsSnapshot,
            workersForApprovalSnapshot,
            venuesForApprovalSnapshot,
            disputesSnapshot
        ] = await Promise.all([
            shiftsYesterdayQuery.get(),
            shiftsThisWeekQuery.get(),
            shiftsMTDQuery.get(),
            forecastedShiftsQuery.get(),
            workersForApprovalQuery.get(),
            venuesForApprovalQuery.get(),
            disputesQuery.get()
        ]);

        const { totalCount: totalShiftsYesterday, totalRevenue: totalRevenueYesterday } = calculateShiftStats(shiftsYesterdaySnapshot);
        const { totalCount: totalShiftsThisWeek, totalRevenue: totalRevenueThisWeek } = calculateShiftStats(shiftsThisWeekSnapshot);
        const { totalCount: totalShiftsMTD, totalRevenue: totalRevenueMTD } = calculateShiftStats(shiftsMTDSnapshot);
        
        const avgRevenuePerShift = totalShiftsThisWeek > 0 ? totalRevenueThisWeek / totalShiftsThisWeek : 50; 
        const forecastedShiftsCount = forecastedShiftsSnapshot.size;
        const totalExpectedRevenue = (totalRevenueThisWeek + (forecastedShiftsCount * avgRevenuePerShift));

        const newUsersToBeApproved = workersForApprovalSnapshot.size + venuesForApprovalSnapshot.size;
        const totalDisputes = disputesSnapshot.size;
        
        return {
            totalShiftsYesterday,
            totalRevenueYesterday,
            totalShiftsThisWeek,
            totalRevenueThisWeek,
            totalShiftsMTD,
            totalRevenueMTD,
            forecastedShiftsThisWeek: forecastedShiftsCount,
            totalExpectedRevenue,
            newUsersToBeApproved,
            totalDisputes,
        };

    } catch (error) {
        console.error("Error fetching admin dashboard stats:", error);
        throw new Error("Failed to fetch dashboard data. Please try again later.");
    }
};
