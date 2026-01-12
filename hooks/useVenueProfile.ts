import { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { VenueProfile } from '../types';

export const useVenueProfile = (venueId: string) => {
  const [profile, setProfile] = useState<VenueProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!venueId) {
      setIsLoading(false);
      setError("No Venue ID provided.");
      return;
    }

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const docRef = db.collection('venueProfiles').doc(venueId);
        const docSnap = await docRef.get();

        if (docSnap.exists) {
          setProfile({ id: docSnap.id, ...docSnap.data() } as VenueProfile);
        } else {
          setError("Venue not found.");
        }
      } catch (e) {
        console.error("Error fetching venue profile:", e);
        setError("Failed to load venue profile.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [venueId]);

  return { profile, isLoading, error };
};
