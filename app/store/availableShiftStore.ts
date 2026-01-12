import { create } from 'zustand';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Shift } from '../../types';

interface AvailableShiftsState {
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
  unsubscribe: () => void;
  fetchAvailableShifts: (workerId: string) => void;
  cleanup: () => void;
}

const initialState = {
  shifts: [],
  isLoading: true,
  error: null,
  unsubscribe: () => {},
};

const convertShiftTimestamps = (shift: any): Shift => {
    return {
      ...shift,
      startTime: (shift.startTime as FirebaseFirestoreTypes.Timestamp).toDate(),
      endTime: (shift.endTime as FirebaseFirestoreTypes.Timestamp).toDate(),
      datePosted: (shift.datePosted as FirebaseFirestoreTypes.Timestamp).toDate(),
      startDate: shift.startDate ? (shift.startDate as FirebaseFirestoreTypes.Timestamp).toDate() : undefined,
    };
  };
  

export const useAvailableShiftsStore = create<AvailableShiftsState>((set, get) => ({
  ...initialState,

  fetchAvailableShifts: (workerId: string) => {
    set({ isLoading: true, error: null });

    const shiftsRef = firestore().collection('shifts');
    const now = new Date();

    // Base query: posted shifts, or shifts offered to the specific worker
    const q = shiftsRef
      .where('startTime', '>', now)
      .where('status', 'in', ['posted', 'offered_to_worker'])

    const unsubscribe = q.onSnapshot((querySnapshot: FirebaseFirestoreTypes.QuerySnapshot) => {
      const fetchedShifts: Shift[] = [];
      querySnapshot.forEach((doc: FirebaseFirestoreTypes.DocumentSnapshot) => {
        const shift = convertShiftTimestamps(doc.data()) as Shift;
        shift.id = doc.id;

        // Filter logic: include 'posted' shifts and shifts 'offered_to_worker' if they are offered to the current worker.
        if (shift.status === 'posted') {
          fetchedShifts.push(shift);
        } else if (shift.status === 'offered_to_worker') {
          if (shift.offeredTo?.id === workerId) {
            fetchedShifts.push(shift);
          }
        }
      });

      set({ shifts: fetchedShifts, isLoading: false });
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
