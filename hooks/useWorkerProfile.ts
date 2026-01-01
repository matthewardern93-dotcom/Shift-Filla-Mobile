
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
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

    setIsLoading(true);
    const docRef = doc(firestore, 'WorkerProfiles', workerId);

    const unsubscribe = onSnapshot(docRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as WorkerProfile);
        } else {
          setError("Worker profile not found.");
        }
        setIsLoading(false);
      },
      (e) => {
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
