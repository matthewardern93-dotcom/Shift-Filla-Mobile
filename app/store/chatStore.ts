
import { create } from 'zustand';
import { firestore } from '../../services/firebase'; 
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Conversation } from '../../types';

interface ChatState {
  hasUnreadMessages: boolean;
  isSubscribed: boolean;
  unsubscribe: () => void;
}

interface ChatActions {
  subscribeToConversations: (userId: string) => void;
  clearUnreadState: () => void;
}

const initialState: ChatState = {
  hasUnreadMessages: false,
  isSubscribed: false,
  unsubscribe: () => {},
};

export const useChatStore = create<ChatState & ChatActions>((set, get) => ({
  ...initialState,

  subscribeToConversations: (userId) => {
    // Prevent multiple subscriptions
    if (get().isSubscribed) {
      return;
    }

    const q = query(
      collection(firestore, 'conversations'), 
      where('participants', 'array-contains', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Conversation[];
      
      // Check if any conversation has a lastMessage that is not read by the current user
      const hasUnread = conversations.some(convo => 
        convo.lastMessage && !convo.lastMessage.readBy.includes(userId)
      );

      set({ hasUnreadMessages: hasUnread });

    }, (error) => {
      console.error("Failed to subscribe to conversations:", error);
    });

    set({ isSubscribed: true, unsubscribe });
  },

  clearUnreadState: () => {
    // This can be called on logout
    const { unsubscribe } = get();
    unsubscribe();
    set(initialState);
  },
}));
