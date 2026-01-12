
import { useState, useEffect } from 'react';
import firestore from '@react-native-firebase/firestore';
import { useUserStore } from '../app/store/userStore';
import { Conversation } from '../types';

// Extends Conversation to include view-specific properties for the chat list
export interface ChatListItem extends Conversation {
  name: string; // The name of the other participant
  profilePictureUrl?: string; // The avatar of the other participant
  unreadCount: number; // Number of unread messages for the current user
}

export const useChatList = () => {
  const [chats, setChats] = useState<ChatListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentUser = useUserStore(state => state.user);
  const currentUserId = currentUser?.uid;

  useEffect(() => {
    if (!currentUserId) {
      setIsLoading(false);
      return;
    }

    const q = firestore()
      .collection('conversations')
      .where('participants', 'array-contains', currentUserId)
      .orderBy('lastMessageTimestamp', 'desc');

    const unsubscribe = q.onSnapshot((querySnapshot) => {
      const chatList: ChatListItem[] = querySnapshot.docs.map(doc => {
        const data = doc.data() as Conversation;
        const otherParticipant = data.participantDetails.find(p => p.id !== currentUserId);
        
        // Determine unread status
        const unreadCount = (data.readBy && !data.readBy.includes(currentUserId)) ? 1 : 0;

        return {
          ...data,
          id: doc.id,
          name: otherParticipant?.name || 'Chat',
          profilePictureUrl: otherParticipant?.avatarUrl || '',
          unreadCount: unreadCount,
        };
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
