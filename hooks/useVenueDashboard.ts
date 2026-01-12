
import { useState, useEffect } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import { useUserSession } from './useUserSession';
import { Shift, Job, VenueProfile, WorkerProfile } from '../types';

type ShiftWithWorker = Shift & { worker?: Partial<WorkerProfile> };

// Helper to safely convert Firestore Timestamps
const toDate = (timestamp: any): Date | any => {
    if (timestamp && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    return timestamp;
};

const transformVenueProfile = (profileData: VenueProfile): VenueProfile => {
    // Safely transform review dates
    if (profileData.reviews) {
        return {
            ...profileData,
            reviews: profileData.reviews.map(review => ({
                ...review,
                date: toDate(review.date),
            })),
        };
    }
    return profileData;
};

export const useVenueDashboard = () => {
    const { user, profile, isLoading: isSessionLoading } = useUserSession();
    const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
    const [shifts, setShifts] = useState<ShiftWithWorker[]>([]);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isSessionLoading) {
            setIsLoading(true);
            return;
        }

        if (!user || !profile || profile.userType !== 'venue') {
            setIsLoading(false);
            setVenueProfile(null);
            setShifts([]);
            setJobs([]);
            return;
        }

        const venueId = user.uid;
        const unsubscribes: (() => void)[] = [];

        const handleError = (source: string, err: Error) => {
            console.error(`Error fetching ${source}:`, err);
            setError(`Failed to load ${source}.`);
        };

        const venueProfileRef = db.collection('venueProfiles').doc(venueId);
        unsubscribes.push(venueProfileRef.onSnapshot((docSnap: FirebaseFirestoreTypes.DocumentSnapshot) => {
            if (docSnap.exists) {
                const profileData = docSnap.data() as VenueProfile;
                const transformedProfile = transformVenueProfile(profileData);
                setVenueProfile(transformedProfile);
            } else {
                setError("Venue profile not found.");
            }
        }, (err: Error) => handleError('profile', err)));

        const shiftsQuery = db.collection('shifts').where('venueId', '==', venueId);
        unsubscribes.push(
            shiftsQuery.onSnapshot(
                (snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
                    (async () => {
                        try {
                            const shiftsData = await Promise.all(
                                snapshot.docs.map(async (docData: FirebaseFirestoreTypes.DocumentSnapshot) => {
                                    const shiftData = docData.data();
                                    if (!shiftData) return null;

                                    const shift = { id: docData.id, ...shiftData } as Shift;
                                    let workerData: Partial<WorkerProfile> | undefined = undefined;

                                    if (shift.assignedWorker && shift.assignedWorker.id) {
                                        const workerRef = db.collection('workerProfiles').doc(shift.assignedWorker.id);
                                        const workerSnap = await workerRef.get();
                                        if (workerSnap.exists) {
                                            const data = workerSnap.data() as WorkerProfile;
                                            workerData = {
                                                firstName: data.firstName,
                                                lastName: data.lastName,
                                                profilePictureUrl: data.profilePictureUrl,
                                            };
                                        }
                                    }

                                    return {
                                        ...shift,
                                        startTime: toDate(shift.startTime),
                                        endTime: toDate(shift.endTime),
                                        worker: workerData,
                                    };
                                })
                            );
                            setShifts(shiftsData.filter(Boolean) as ShiftWithWorker[]);
                        } catch (err) {
                            if (err instanceof Error) {
                                handleError('shifts', err);
                            } else {
                                handleError('shifts', new Error(`Unknown error processing shifts: ${String(err)}`));
                            }
                        }
                    })();
                },
                (err: Error) => handleError('shifts', err)
            )
        );

        const jobsQuery = db.collection('permanentJobs').where('businessId', '==', venueId);
        unsubscribes.push(jobsQuery.onSnapshot((snapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
            try {
                const jobsData = snapshot.docs.map((docData: FirebaseFirestoreTypes.DocumentSnapshot) => {
                    const jobData = docData.data();
                    // If doc has no data, skip it.
                    if (!jobData) {
                        return null;
                    }
                    return {
                        id: docData.id,
                        ...jobData,
                        datePosted: toDate(jobData.datePosted),
                    } as Job;
                }).filter((job): job is Job => job !== null); // Filter out nulls and assert type

                setJobs(jobsData);
            } catch (err) {
                if (err instanceof Error) {
                    handleError('jobs', err);
                } else {
                    handleError('jobs', new Error(`Unknown error processing jobs: ${String(err)}`));
                }
            }
        }, (err: Error) => handleError('jobs', err)));

        setIsLoading(false);

        return () => unsubscribes.forEach(unsub => unsub());

    }, [user, profile, isSessionLoading]);

    return { venueProfile, shifts, jobs, isLoading, error };
};
