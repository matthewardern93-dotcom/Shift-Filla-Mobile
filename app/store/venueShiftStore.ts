
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
  unsubscribe: () => {},
};

export const useVenueShiftStore = create<VenueShiftState & VenueShiftActions>((set, get) => ({
  ...initialState,

  subscribeToVenueShifts: (venueId) => {
    if (!venueId) {
      set({ isLoading: false, error: "No venue ID provided." });
      return;
    }

    set({ isLoading: true });

    const shiftsQuery = query(
      collection(firestore, 'shifts'),
      where('venue.id', '==', venueId) // Filter shifts by the venue's ID
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
      
      // Sort shifts by start time, upcoming first
      const sortedShifts = fetchedShifts.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      
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
