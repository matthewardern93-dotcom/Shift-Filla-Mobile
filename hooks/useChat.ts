import { useState, useEffect } from 'react';
import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { db } from '../services/firebase';
import { useUserStore } from '../app/store/userStore';
import { Message, Conversation } from '../types';

// This extends the Conversation type to include properties needed for display
interface Chat extends Conversation {
    name: string;
    profilePictureUrl?: string;
}

export const useChat = (chatId: string) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useUserStore(state => state.user);

  useEffect(() => {
    if (!chatId || !currentUser?.uid) {
      setIsLoading(false);
      return;
    }

    const currentUserId = currentUser.uid;

    const chatDocRef = db.collection('conversations').doc(chatId);
    const unsubscribeChat = chatDocRef.onSnapshot((docSnap) => {
      if (docSnap.exists) {
        const chatData = docSnap.data() as Omit<Conversation, 'id'>;
        const otherParticipant = chatData.participantDetails.find(p => p.id !== currentUserId);
        
        setChat({
            ...chatData,
            id: docSnap.id,
            name: otherParticipant?.name || 'Chat',
            profilePictureUrl: otherParticipant?.avatarUrl || ''
        });

      } else {
        setError("Chat not found.");
      }
    }, (err) => {
      console.error("Error fetching chat details: ", err);
      setError("Failed to load chat details.");
    });

    const messagesColRef = db.collection('conversations').doc(chatId).collection('messages');
    const q = messagesColRef.orderBy('timestamp', 'desc');

    const unsubscribeMessages = q.onSnapshot((querySnapshot) => {
      const msgs: Message[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Omit<Message, 'id' | 'timestamp'> & { timestamp: FirebaseFirestoreTypes.Timestamp };
        return { 
            id: doc.id, 
            ...data,
            timestamp: data.timestamp.toDate(),
        };
      });
      setMessages(msgs);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching messages: ", err);
      setError("Failed to load messages.");
      setIsLoading(false);
    });
    
    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeChat();
      unsubscribeMessages();
    };

  }, [chatId, currentUser?.uid]);

  return { chat, messages, isLoading, error };
};
