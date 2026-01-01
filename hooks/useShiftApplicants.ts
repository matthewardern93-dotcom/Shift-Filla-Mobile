import { useState, useEffect } from 'react';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { firestore, functions } from '../../services/firebase'; 
import { httpsCallable } from 'firebase/functions'; 
import { Shift, WorkerProfile } from '../types';

export const useShiftApplicants = (shiftId: string) => {
  const [shift, setShift] = useState<Shift | null>(null);
  const [applicants, setApplicants] = useState<WorkerProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!shiftId) {
      setIsLoading(false);
      setError("No shift ID provided.");
      return;
    }

    const shiftRef = doc(firestore, "Shifts", shiftId);

    const unsubscribe = onSnapshot(shiftRef, async (shiftSnap) => {
      setIsLoading(true);
      if (!shiftSnap.exists()) {
        setError("Shift not found.");
        setIsLoading(false);
        return;
      }

      const shiftData = { id: shiftSnap.id, ...shiftSnap.data() } as Shift;
      setShift(shiftData);

      try {
        if (shiftData.applicants && shiftData.applicants.length > 0) {
          const applicantPromises = shiftData.applicants.map(applicantId => 
            getDoc(doc(firestore, "WorkerProfiles", applicantId))
          );
          const applicantDocs = await Promise.all(applicantPromises);
          const applicantData = applicantDocs
            .map(docSnap => docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as WorkerProfile : null)
            .filter((app): app is WorkerProfile => app !== null);

          setApplicants(applicantData);
        } else {
          setApplicants([]);
        }
      } catch (e: any) {
        console.error("Error fetching applicants:", e);
        setError("Failed to load applicant profiles.");
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
        console.error("Error with shift snapshot:", err);
        setError("Failed to listen for shift updates.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [shiftId]);

  const offerShiftToWorker = async (workerId: string) => {
    const manageShifts = httpsCallable(functions, 'manageShifts');
    await manageShifts({ 
      action: 'offer',
      shiftId: shiftId,
      workerId: workerId 
    });
  };

  return { shift, applicants, isLoading, error, offerShiftToWorker };
};
