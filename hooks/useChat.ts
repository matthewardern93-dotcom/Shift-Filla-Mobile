
import { useState, useEffect } from 'react';
import { doc, collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useUserStore } from '../app/store/userStore';
import { Message, Chat } from '../types';

export const useChat = (chatId: string) => {
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = useUserStore(state => state.user?.uid);

  useEffect(() => {
    if (!chatId || !currentUserId) {
      setIsLoading(false);
      return;
    }

    // Subscribe to the chat document itself for participant info, etc.
    const chatDocRef = doc(firestore, 'chats', chatId);
    const unsubscribeChat = onSnapshot(chatDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const chatData = docSnap.data();
        const otherParticipant = chatData.participants.find(p => p.id !== currentUserId);
        setChat({
            id: docSnap.id,
            ...chatData,
            name: otherParticipant?.name || 'Chat',
            profilePictureUrl: otherParticipant?.profilePictureUrl || ''
        } as Chat);
      } else {
        setError("Chat not found.");
      }
    }, (err) => {
      console.error("Error fetching chat details: ", err);
      setError("Failed to load chat details.");
    });

    // Subscribe to the messages subcollection
    const messagesColRef = collection(firestore, 'chats', chatId, 'messages');
    const q = query(messagesColRef, orderBy('timestamp', 'desc'));

    const unsubscribeMessages = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        msgs.push({ 
            id: doc.id, 
            ...data, 
            timestamp: data.timestamp.toDate()
        } as Message);
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

  }, [chatId, currentUserId]);

  return { chat, messages, isLoading, error };
};
