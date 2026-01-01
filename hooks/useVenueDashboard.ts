import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from './useAuth';
import { Shift, PermanentJob, VenueProfile, WorkerProfile, ReferredVenue } from '../types';

type ShiftWithWorker = Shift & { worker?: Partial<WorkerProfile> };

export const useVenueDashboard = () => {
  const { user } = useAuth();
  const [venueProfile, setVenueProfile] = useState<VenueProfile | null>(null);
  const [shifts, setShifts] = useState<ShiftWithWorker[]>([]);
  const [jobs, setJobs] = useState<PermanentJob[]>([]);
  const [referredVenues, setReferredVenues] = useState<ReferredVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const venueId = user.uid;
    const unsubscribes: (() => void)[] = [];

    const handleError = (source: string, err: any) => {
      console.error(`Error fetching ${source}:`, err);
      setError(`Failed to load ${source}.`);
      setIsLoading(false);
    };

    // 1. Fetch Venue Profile
    const venueProfileRef = doc(firestore, 'VenueProfiles', venueId);
    unsubscribes.push(onSnapshot(venueProfileRef, (docSnap) => {
      if (docSnap.exists()) {
        const profileData = docSnap.data() as VenueProfile;
        setVenueProfile(profileData);
        if (profileData.referredVenues) {
            setReferredVenues(profileData.referredVenues);
        }
      } else {
        setError("Venue profile not found.");
      }
    }, (err) => handleError('profile', err)));

    // 2. Fetch Shifts and associated worker data
    const shiftsQuery = query(collection(firestore, 'Shifts'), where('venueId', '==', venueId));
    unsubscribes.push(onSnapshot(shiftsQuery, async (snapshot) => {
      const shiftsData = await Promise.all(snapshot.docs.map(async (docData) => {
        const shift = { id: docData.id, ...docData.data() } as Shift;
        let workerData: Partial<WorkerProfile> | undefined = undefined;

        if (shift.assignedWorkerId) {
          const workerRef = doc(firestore, 'WorkerProfiles', shift.assignedWorkerId);
          const workerSnap = await getDoc(workerRef);
          if(workerSnap.exists()) {
              workerData = { 
                  firstName: workerSnap.data().firstName,
                  lastName: workerSnap.data().lastName,
                  profilePictureUrl: workerSnap.data().profilePictureUrl,
              };
          }
        }
        
        return {
            ...shift,
            startTime: shift.startTime.toDate(),
            endTime: shift.endTime.toDate(),
            worker: workerData
        };
      }));
      setShifts(shiftsData);
    }, (err) => handleError('shifts', err)));

    // 3. Fetch Permanent Jobs
    const jobsQuery = query(collection(firestore, 'PermanentJobs'), where('businessId', '==', venueId));
    unsubscribes.push(onSnapshot(jobsQuery, (snapshot) => {
      const jobsData = snapshot.docs.map(docData => ({
        id: docData.id,
        ...docData.data(),
        datePosted: docData.data().datePosted.toDate(),
      } as PermanentJob));
      setJobs(jobsData);
      setIsLoading(false); // Considered loaded after jobs are fetched
    }, (err) => handleError('jobs', err)));

    // Cleanup
    return () => unsubscribes.forEach(unsub => unsub());

  }, [user]);

  return { venueProfile, shifts, jobs, referredVenues, isLoading, error };
};
