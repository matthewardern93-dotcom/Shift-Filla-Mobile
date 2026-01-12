import { create } from 'zustand';
import firestore from '@react-native-firebase/firestore';
import { VenueProfile } from '../../types';

interface VenueState {
  profile: VenueProfile | null;
  loading: boolean;
  error: string | null;
  fetchVenueProfile: (venueId: string) => Promise<void>;
  updateVenueProfile: (profile: Partial<VenueProfile>) => Promise<void>;
}

export const useVenueStore = create<VenueState>((set, get) => ({
  profile: null,
  loading: true,
  error: null,
  fetchVenueProfile: async (venueId: string) => {
    set({ loading: true, error: null });
    try {
      const docRef = firestore().collection('venues').doc(venueId);
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        set({ profile: { id: docSnap.id, ...docSnap.data() } as VenueProfile, loading: false });
      } else {
        set({ error: 'No such venue profile!', loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch venue profile', loading: false });
    }
  },
  updateVenueProfile: async (profileUpdate: Partial<VenueProfile>) => {
    const { profile } = get();
    if (profile) {
      set({ loading: true });
      try {
        const venueRef = firestore().collection('venues').doc(profile.id);
        await venueRef.update(profileUpdate);
        set(state => ({ profile: { ...state.profile, ...profileUpdate } as VenueProfile, loading: false }));
      } catch (error) {
        set({ error: 'Failed to update venue profile', loading: false });
      }
    }
  },
}));
