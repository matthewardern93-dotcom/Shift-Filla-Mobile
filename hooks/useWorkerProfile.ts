import { useState, useEffect } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import { useUserStore } from '../app/store/userStore'; 
import { WorkerProfile } from '../types';

export const useWorkerProfile = () => {
  const [profile, setProfile] = useState<WorkerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const workerId = useUserStore(state => state.user?.uid);

  useEffect(() => {
    if (!workerId) {
      setIsLoading(false);
      // Don't set an error here, as the user might just be logging out.
      return;
    }

    const docRef = db.collection('workerProfiles').doc(workerId);

    const unsubscribe = docRef.onSnapshot(
      (docSnap: FirebaseFirestoreTypes.DocumentSnapshot) => {
        if (docSnap.exists) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as WorkerProfile);
        } else {
          setError("Worker profile not found.");
        }
        setIsLoading(false);
      },
      (e: Error) => {
        console.error("Error fetching worker profile:", e);
        setError("Failed to load worker profile.");
        setIsLoading(false);
      }
    );

    // Cleanup subscription on unmount
    return () => unsubscribe();

  }, [workerId]);

  return { profile, isLoading, error };
};
