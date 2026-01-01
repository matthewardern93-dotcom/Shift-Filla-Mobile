
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { firestore } from '../services/firebase';
import { useUserStore } from '../app/store/userStore';

export interface ChatParticipant {
  id: string;
  name: string;
  profilePictureUrl: string;
}

export interface Chat {
  id: string;
  participants: ChatParticipant[];
  lastMessage: {
    text: string;
    timestamp: Date;
    senderId: string;
  } | null;
  unreadCount: number;
}

export const useChatList = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useUserStore(state => state.profile);
  const currentUserId = currentUser?.id;

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(firestore, 'chats'), 
      where('participantIds', 'array-contains', currentUserId),
      orderBy('lastMessage.timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const chatList: Chat[] = [];
      querySnapshot.forEach(doc => {
        const data = doc.data();
        const otherParticipant = data.participants.find(p => p.id !== currentUserId);
        
        chatList.push({
          id: doc.id,
          participants: data.participants,
          lastMessage: data.lastMessage ? { ...data.lastMessage, timestamp: data.lastMessage.timestamp.toDate() } : null,
          unreadCount: data.unreadCounts?.[currentUserId] || 0,
          // Add other necessary fields from your chat document
          name: otherParticipant?.name || 'Chat',
          profilePictureUrl: otherParticipant?.profilePictureUrl || ''
        });
      });
      setChats(chatList);
      setIsLoading(false);
    }, (err) => {
      console.error("Error fetching chat list: ", err);
      setError("Failed to load chats.");
      setIsLoading(false);
    });

    return () => unsubscribe();

  }, [currentUserId]);

  return { chats, isLoading, error };
};
