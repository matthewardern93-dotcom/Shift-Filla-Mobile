import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useAuth } from './useAuth';
import { Conversation, WorkerProfile } from '../types';

type ConversationWithParticipant = Conversation & { participantProfile: Partial<WorkerProfile> };

export const useVenueConversations = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationWithParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    const venueId = user.uid;

    const q = query(collection(firestore, 'conversations'), where('participants', 'array-contains', venueId));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      setIsLoading(true);
      try {
        const convos = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
          const conversation = { id: docSnap.id, ...docSnap.data() } as Conversation;
          const workerId = conversation.participants.find(p => p !== venueId);

          let participantProfile: Partial<WorkerProfile> = {};

          if (workerId) {
              const workerRef = doc(firestore, 'WorkerProfiles', workerId);
              const workerSnap = await getDoc(workerRef);
              if (workerSnap.exists()) {
                  const workerData = workerSnap.data();
                  participantProfile = {
                      firstName: workerData.firstName,
                      lastName: workerData.lastName,
                      profilePictureUrl: workerData.profilePictureUrl
                  };
              }
          }
          
          return { ...conversation, participantProfile };
        }));
        
        setConversations(convos as ConversationWithParticipant[]);
      } catch (e: any) {
        console.error("Error fetching conversations: ", e);
        setError("Failed to load messages.");
      } finally {
        setIsLoading(false);
      }
    }, (err) => {
        console.error('Snapshot listener error:', err);
        setError("Failed to listen for message updates.");
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return { conversations, isLoading, error };
};
