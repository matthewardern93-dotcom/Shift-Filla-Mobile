
import { collection, query, where, getDocs, doc, orderBy, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from './firebase';
import { Conversation, Message } from '../types';

const manageChats = httpsCallable(functions, 'manageChats');

// --- READ OPERATIONS (Direct Firestore Queries) ---

/**
 * Fetches all conversations for a given user ID.
 * @param userId The ID of the user.
 * @returns An array of Conversation objects.
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
    const q = query(collection(db, 'conversations'), where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
};

/**
 * Creates a real-time listener for messages in a specific conversation.
 * @param conversationId The ID of the conversation to listen to.
 * @param callback The function to call with the array of messages whenever it updates.
 * @returns The unsubscribe function for the listener.
 */
export const onMessagesUpdate = (conversationId: string, callback: (messages: Message[]) => void) => {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        callback(messages);
    });

    return unsubscribe;
};


// --- WRITE OPERATIONS (Callable Cloud Functions) ---

/**
 * Sends a message in a conversation.
 * @param payload The data required for the 'sendMessage' action.
 * @returns The result from the cloud function.
 */
export const sendMessage = (payload: { conversationId: string; text: string; }) => {
    return manageChats({ action: 'sendMessage', ...payload });
};

/**
 * Initiates a new chat related to a job application.
 * @param payload The data required for the 'initiateJobChat' action.
 * @returns The result from the cloud function.
 */
export const initiateJobChat = (payload: { workerId: string; jobId: string; jobTitle: string; }) => {
    return manageChats({ action: 'initiateJobChat', ...payload });
};
