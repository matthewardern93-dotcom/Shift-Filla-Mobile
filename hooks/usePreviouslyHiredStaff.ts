
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useUserStore } from '../app/store/userStore';
import { WorkerProfile, Shift } from '../types'; // Added Shift type for proper type casting

// This interface extends the WorkerProfile with a venue-specific shift count
export interface PreviouslyHiredStaff extends WorkerProfile {
  shiftsWithYou: number;
}

export const usePreviouslyHiredStaff = () => {
  const [staff, setStaff] = useState<PreviouslyHiredStaff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // The user's profile, if available, is retrieved from the Zustand store.
  const venueId = useUserStore(state => state.profile?.id);

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      return;
    }

    const fetchStaff = async () => {
      setIsLoading(true);
      try {
        // 1. Find all shifts that belong to the current venue and are completed.
        const shiftsQuery = firestore()
          .collection('shifts')
          .where('businessId', '==', venueId)
          .where('status', '==', 'completed');

        const shiftsSnapshot = await shiftsQuery.get();

        // 2. Aggregate the shift counts for each worker.
        const workerShiftCounts = new Map<string, number>();
        shiftsSnapshot.docs.forEach(doc => {
          const shift = doc.data() as Shift;
          // Correctly access the nested worker ID
          const workerId = shift.assignedWorker?.id;
          if (workerId) {
            workerShiftCounts.set(workerId, (workerShiftCounts.get(workerId) || 0) + 1);
          }
        });

        if (workerShiftCounts.size === 0) {
            setStaff([]);
            setIsLoading(false);
            return;
        }

        // 3. Fetch the profiles for each unique worker.
        const workerIds = Array.from(workerShiftCounts.keys());
        const workerPromises = workerIds.map(id => firestore().collection('workerProfiles').doc(id).get());
        const workerDocs = await Promise.all(workerPromises);

        // 4. Combine profile data with the shift count.
        const staffData: PreviouslyHiredStaff[] = workerDocs
          .filter(doc => doc.exists)
          .map(doc => {
            const workerProfile = doc.data() as WorkerProfile;
            const workerId = doc.id;
            return {
              ...workerProfile,
              id: workerId,
              shiftsWithYou: workerShiftCounts.get(workerId) || 0,
            };
          });
        
        // Sort staff by the number of shifts they've completed with the venue.
        staffData.sort((a, b) => b.shiftsWithYou - a.shiftsWithYou);

        setStaff(staffData);

      } catch (e) {
        console.error("Error fetching previously hired staff:", e);
        setError("Failed to load staff. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStaff();
  }, [venueId]);

  return { staff, isLoading, error };
};
