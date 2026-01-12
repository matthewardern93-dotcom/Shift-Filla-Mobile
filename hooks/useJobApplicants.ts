
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { Application, PermanentJob, WorkerProfile } from '../types';

// Represents a single application joined with the full profile of the applicant
export type ApplicantWithProfile = Application & { profile: WorkerProfile };

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
    const jobRef = firestore().collection('permanentJobs').doc(jobId);
    const unsubscribeJob = jobRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
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
    const applicantsRef = firestore().collection('permanentJobs').doc(jobId).collection('applications');
    const unsubscribeApplicants = applicantsRef.onSnapshot(async (snapshot) => {
        try {
            const applicantsData = await Promise.all(snapshot.docs.map(async (appDoc) => {
                const application = { id: appDoc.id, ...appDoc.data() } as Application;
                
                const workerRef = firestore().collection('workerProfiles').doc(application.workerId);
                const workerSnap = await workerRef.get();

                if (workerSnap.exists) {
                    return { 
                        ...application, 
                        profile: { id: workerSnap.id, ...workerSnap.data() } as WorkerProfile 
                    };
                }
                return null; 
            }));

            setApplicants(applicantsData.filter(Boolean) as ApplicantWithProfile[]);
        } catch (err) {
            console.error("Error fetching applicants' profiles: ", err);
            if (!error) {
                setError("Failed to load some applicant details.");
            }
        } finally {
            setIsLoading(false);
        }
    }, err => {
        console.error("Error fetching applications: ", err);
        setError('Failed to load applicants.');
        setIsLoading(false);
    });
    unsubscribes.push(unsubscribeApplicants);

    // Cleanup function to detach listeners on component unmount
    return () => unsubscribes.forEach(unsub => unsub());

  }, [jobId]);

  return { job, applicants, isLoading, error };
};
