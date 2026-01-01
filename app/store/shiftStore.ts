
import { create } from 'zustand';
import { firestore } from '../../services/firebase'; 
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
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
  unsubscribe: () => {},
};

export const useShiftStore = create<ShiftState & ShiftActions>((set, get) => ({
  ...initialState,

  fetchShiftsForWorker: (workerId) => {
    if (!workerId) {
      set({ isLoading: false, error: "No worker ID provided." });
      return;
    }

    set({ isLoading: true });

    const shiftsQuery = query(
      collection(firestore, 'shifts'),
      where('assignedWorkerId', '==', workerId)
    );

    const unsubscribe = onSnapshot(shiftsQuery, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
        // Make sure to convert Firestore Timestamps to JS Date objects
        return {
          id: doc.id,
          ...data,
          startTime: (data.startTime as Timestamp)?.toDate(),
          endTime: (data.endTime as Timestamp)?.toDate(),
        } as Shift;
      });
      
      // Sort shifts by start time, upcoming first
      const sortedShifts = fetchedShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
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
