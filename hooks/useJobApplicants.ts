import { useState, useEffect } from 'react';
import { doc, getDoc, collection, onSnapshot } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { PermanentJob, WorkerProfile, JobApplication } from '../types';

type ApplicantWithProfile = JobApplication & { profile: WorkerProfile };

export const useJobApplicants = (jobId: string) => {
  const [job, setJob] = useState<PermanentJob | null>(null);
  const [applicants, setApplicants] = useState<ApplicantWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setIsLoading(false);
      setError("Job ID is missing.");
      return;
    }

    setIsLoading(true);
    const unsubscribes: (() => void)[] = [];

    // 1. Fetch the job details
    const jobRef = doc(firestore, 'PermanentJobs', jobId);
    const unsubscribeJob = onSnapshot(jobRef, (docSnap) => {
      if (docSnap.exists()) {
        setJob({ id: docSnap.id, ...docSnap.data() } as PermanentJob);
      } else {
        setError('Job not found.');
      }
    }, err => {
        console.error("Error fetching job: ", err);
        setError('Failed to load job details.');
    });
    unsubscribes.push(unsubscribeJob);

    // 2. Fetch applicants (applications) for the job
    const applicantsRef = collection(firestore, 'PermanentJobs', jobId, 'applications');
    const unsubscribeApplicants = onSnapshot(applicantsRef, async (snapshot) => {
        try {
            const applicantsData = await Promise.all(snapshot.docs.map(async (appDoc) => {
                const application = { id: appDoc.id, ...appDoc.data() } as JobApplication;
                const workerRef = doc(firestore, 'WorkerProfiles', application.workerId);
                const workerSnap = await getDoc(workerRef);

                if (workerSnap.exists()) {
                    return { 
                        ...application, 
                        profile: { id: workerSnap.id, ...workerSnap.data() } as WorkerProfile 
                    };
                }
                return null; // Worker profile not found
            }));

            setApplicants(applicantsData.filter(Boolean) as ApplicantWithProfile[]);
        } catch (err) {
            console.error("Error fetching applicants' profiles: ", err);
            setError("Failed to load some applicant details.");
        } finally {
            setIsLoading(false);
        }
    }, err => {
        console.error("Error fetching applications: ", err);
        setError('Failed to load applicants.');
        setIsLoading(false);
    });
    unsubscribes.push(unsubscribeApplicants);

    // Cleanup function
    return () => unsubscribes.forEach(unsub => unsub());

  }, [jobId]);

  return { job, applicants, isLoading, error };
};
