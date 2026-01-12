
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
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

    const shiftRef = firestore().collection("shifts").doc(shiftId);

    const unsubscribe = shiftRef.onSnapshot(async (shiftSnap) => {
      setIsLoading(true);
      if (!shiftSnap.exists) {
        setError("Shift not found.");
        setIsLoading(false);
        return;
      }

      const shiftData = { id: shiftSnap.id, ...shiftSnap.data() } as Shift;
      setShift(shiftData);

      try {
        if (shiftData.appliedWorkerIds && shiftData.appliedWorkerIds.length > 0) {
          const applicantPromises = shiftData.appliedWorkerIds.map(applicantId => 
            firestore().collection("workerProfiles").doc(applicantId).get()
          );
          const applicantDocs = await Promise.all(applicantPromises);
          const applicantData = applicantDocs
            .map(docSnap => docSnap.exists ? { id: docSnap.id, ...docSnap.data() } as WorkerProfile : null)
            .filter((app): app is WorkerProfile => app !== null);

          setApplicants(applicantData);
        } else {
          setApplicants([]);
        }
      } catch (e: unknown) {
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
    const manageShifts = functions().httpsCallable('manageShifts');
    await manageShifts({ 
      action: 'offer',
      shiftId: shiftId,
      workerId: workerId 
    });
  };

  return { shift, applicants, isLoading, error, offerShiftToWorker };
};
