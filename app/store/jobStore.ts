
import { create } from 'zustand';
import { firestore } from '../../services/firebase';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { Job } from '../../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Key for storing the timestamp in AsyncStorage
const LAST_VIEWED_JOBS_KEY = 'last_viewed_jobs_timestamp';

interface JobState {
  jobs: Job[];
  hasNewJobs: boolean;
  isLoading: boolean;
  unsubscribe: () => void;
}

interface JobActions {
  subscribeToJobs: () => Promise<void>;
  markJobsAsViewed: () => Promise<void>;
  cleanup: () => void;
}

const initialState: JobState = {
  jobs: [],
  hasNewJobs: false,
  isLoading: true,
  unsubscribe: () => {},
};

export const useJobStore = create<JobState & JobActions>((set, get) => ({
  ...initialState,

  subscribeToJobs: async () => {
    if (get().unsubscribe !== (() => {})) {
        get().cleanup(); // Cleanup previous listener if any
    }

    set({ isLoading: true });

    // Get the last viewed timestamp from local storage
    const lastViewedString = await AsyncStorage.getItem(LAST_VIEWED_JOBS_KEY);
    const lastViewedTimestamp = lastViewedString ? new Date(JSON.parse(lastViewedString)) : null;

    const q = query(
      collection(firestore, 'jobs'),
      where('status', '==', 'open') // Only get open jobs
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Job[];
      
      let newJobFound = false;
      if (lastViewedTimestamp) {
        newJobFound = jobs.some(job => 
            job.createdAt && (job.createdAt as Timestamp).toDate() > lastViewedTimestamp
        );
      }
      
      set({ jobs, hasNewJobs: newJobFound, isLoading: false });
    }, (error) => {
      console.error("Failed to subscribe to jobs:", error);
      set({ isLoading: false });
    });

    set({ unsubscribe });
  },

  markJobsAsViewed: async () => {
    if (!get().hasNewJobs) return; // No need to update if nothing is new
    
    set({ hasNewJobs: false });
    // Store the current time as the new last viewed timestamp
    await AsyncStorage.setItem(LAST_VIEWED_JOBS_KEY, JSON.stringify(new Date()));
  },

  cleanup: () => {
    const { unsubscribe } = get();
    unsubscribe();
    set(initialState);
  },
}));
