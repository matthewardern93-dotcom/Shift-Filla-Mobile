
import { create } from 'zustand';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Shift } from '../../types';

interface ShiftState {
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
  unsubscribe: () => void;
}

interface ShiftActions {
  fetchShiftsForWorker: (workerId: string) => void;
  cleanup: () => void;
}

const initialState: ShiftState = {
  shifts: [],
  isLoading: true,
  error: null,
  unsubscribe: () => { /* intentionally empty */ },
};

export const useShiftStore = create<ShiftState & ShiftActions>((set, get) => ({
  ...initialState,

  fetchShiftsForWorker: (workerId) => {
    if (!workerId) {
      set({ isLoading: false, error: "No worker ID provided." });
      return;
    }

    set({ isLoading: true });

    const shiftsQuery = firestore()
      .collection('shifts')
      .where('assignedWorkerId', '==', workerId);

    const unsubscribe = shiftsQuery.onSnapshot((snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Make sure to convert Firestore Timestamps to JS Date objects
        return {
          id: doc.id,
          ...data,
          startTime: (data.startTime as FirebaseFirestoreTypes.Timestamp)?.toDate(),
          endTime: (data.endTime as FirebaseFirestoreTypes.Timestamp)?.toDate(),
        } as Shift;
      });
      
      // Sort shifts by start time, upcoming first
      const sortedShifts = fetchedShifts.sort((a, b) => {
        if (a.startTime && b.startTime) {
            return a.startTime.getTime() - b.startTime.getTime();
        }
        return 0; // Handle cases where startTime might be null
    });
      
      set({ shifts: sortedShifts, isLoading: false, error: null });

    }, (error) => {
      console.error("Failed to fetch shifts:", error);
      set({ isLoading: false, error: "Failed to load shifts." });
    });

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    unsubscribe();
    set(initialState);
  },
}));
