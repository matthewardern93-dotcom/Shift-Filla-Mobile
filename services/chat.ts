import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    DocumentData,
    QuerySnapshot,
    Unsubscribe
} from 'firebase/firestore';
import { db, functions, httpsCallable } from './firebase';
import { Conversation, Message } from '../types';

// Create a callable function instance that points to the 'manageChats' cloud function
const manageChats = httpsCallable(functions, 'manageChats');

// --- WRITE OPERATIONS (Calling the 'manageChats' Cloud Function) ---

/**
 * Sends a message within a conversation.
 * @param conversationId The ID of the chat conversation.
 * @param text The message text to send.
 * @returns A promise that resolves when the message is sent successfully.
 */
export const sendMessage = (conversationId: string, text: string) => {
    return manageChats({ action: 'sendMessage', conversationId, text });
};

/**
 * Initiates a new chat between a venue and a worker regarding a specific job.
 * @param payload - The necessary data to initiate the chat.
 * @returns A promise that resolves with the new conversation ID.
 */
export const initiateJobChat = (payload: { workerId: string; jobId: string; jobTitle: string; }) => {
    return manageChats({ action: 'initiateJobChat', ...payload });
};


// --- READ OPERATIONS (Direct Firestore Queries using Web SDK) ---

/**
 * Fetches all conversations for a specific user.
 * @param userId The ID of the user.
 * @returns A promise resolving to an array of Conversation objects.
 */
export const getConversations = async (userId: string): Promise<Conversation[]> => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
};

/**
 * Sets up a real-time listener for messages in a specific conversation.
 * @param conversationId The ID of the conversation to listen to.
 * @param callback A function to be called with the array of messages whenever there's an update.
 * @returns A function to unsubscribe from the listener.
 */
export const onNewMessage = (conversationId: string, callback: (messages: Message[]) => void): Unsubscribe => {
    const messagesCollectionRef = collection(db, `chats/${conversationId}/messages`);
    const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
        const messages = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Make sure timestamp is a JS Date object for consistency in the app
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date(),
            } as Message;
        });
        callback(messages);
    });

    return unsubscribe;
};
