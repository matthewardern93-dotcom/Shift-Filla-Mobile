
import { create } from 'zustand';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { Shift } from '../../types';

interface VenueShiftState {
  shifts: Shift[];
  isLoading: boolean;
  error: string | null;
  unsubscribe: () => void;
}

interface VenueShiftActions {
  subscribeToVenueShifts: (venueId: string) => void;
  cleanup: () => void;
}

const initialState: VenueShiftState = {
  shifts: [],
  isLoading: true,
  error: null,
  unsubscribe: () => { /* intentionally empty */ },
};

export const useVenueShiftStore = create<VenueShiftState & VenueShiftActions>((set, get) => ({
  ...initialState,

  subscribeToVenueShifts: (venueId) => {
    if (!venueId) {
      set({ isLoading: false, error: "No venue ID provided." });
      return;
    }

    set({ isLoading: true });

    const shiftsQuery = firestore()
      .collection('shifts')
      .where('businessId', '==', venueId); // Filter shifts by the venue's ID

    const unsubscribe = shiftsQuery.onSnapshot((snapshot) => {
      const fetchedShifts = snapshot.docs.map(doc => {
        const data = doc.data();
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
      console.error("Failed to fetch venue shifts:", error);
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
