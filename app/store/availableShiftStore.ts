
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

interface AvailableShiftState {
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
  unsubscribe: () => void;
}

interface AvailableShiftActions {
  subscribeToAvailableShifts: (workerId: string) => void;
  cleanup: () => void;
}

const initialState: AvailableShiftState = {
  shifts: [],
  isLoading: true,
  error: null,
  unsubscribe: () => {},
};

export const useAvailableShiftStore = create<AvailableShiftState & AvailableShiftActions>((set, get) => ({
  ...initialState,

  subscribeToAvailableShifts: (workerId) => {
    if (!workerId) {
      set({ isLoading: false, error: "No worker ID provided." });
      return;
    }

    set({ isLoading: true });

    // This query fetches shifts that are either 'open' to everyone
    // or 'offered' specifically to the current worker.
    const shiftsQuery = query(
      collection(firestore, 'shifts'),
      where('status', 'in', ['open', 'offered', 'pending'])
    );

    const unsubscribe = onSnapshot(shiftsQuery, (snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startTime: (data.startTime as Timestamp)?.toDate(),
          endTime: (data.endTime as Timestamp)?.toDate(),
        } as Shift;
      });

      // Filter out offered shifts not meant for this worker
      const relevantShifts = fetchedShifts.filter(shift => {
        if (shift.status === 'offered') {
          return shift.offeredToId === workerId;
        }
        return true;
      });
      
      set({ shifts: relevantShifts, isLoading: false, error: null });

    }, (error) => {
      console.error("Failed to fetch available shifts:", error);
      set({ isLoading: false, error: "Failed to load available shifts." });
    });

    set({ unsubscribe });
  },

  cleanup: () => {
    const { unsubscribe } = get();
    unsubscribe();
    set(initialState);
  },
}));
