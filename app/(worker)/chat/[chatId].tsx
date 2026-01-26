
import { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Message } from '../../../types';
import { Colors } from '../../../constants/colors';
import WorkerScreenTemplate from '../../../components/templates/WorkerScreenTemplate';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { useChat } from '../../../hooks/useChat';
import { useAuthStore } from '../../store/authStore';
import functions from '@react-native-firebase/functions';

const MessageItem = ({ item, currentUserId }: { item: Message, currentUserId: string }) => {
    const swipeableRef = useRef<Swipeable>(null);

    const renderLeftActions = (_progress: Animated.AnimatedInterpolation<number>, _dragX: Animated.AnimatedInterpolation<number>) => {
        let formattedTime = '';
        const { timestamp } = item;

        if (timestamp) {
            // Handle both Firestore Timestamp objects and serialized plain objects
            if (typeof (timestamp as any).toDate === 'function') {
                formattedTime = format((timestamp as any).toDate(), 'p');
            } else if (typeof (timestamp as any).seconds === 'number') {
                formattedTime = format(new Date((timestamp as any).seconds * 1000), 'p');
            }
        }

        return (
            <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                    {formattedTime}
                </Text>
            </View>
        );
    };

    return (
        <Swipeable ref={swipeableRef} renderLeftActions={renderLeftActions} friction={2}>
            <View style={[styles.messageRow, item.senderId === currentUserId ? styles.sentRow : styles.receivedRow]}>
                <View style={[styles.messageBubble, item.senderId === currentUserId ? styles.sentBubble : styles.receivedBubble]}>
                    <Text style={[styles.messageText, item.senderId === currentUserId ? styles.sentText : styles.receivedText]}>{item.text}</Text>
                </View>
            </View>
        </Swipeable>
    );
};

const ChatScreen = () => {
    const { chatId } = useLocalSearchParams();
    const { chat, messages, isLoading, error } = useChat(chatId as string);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const currentUserId = useAuthStore(state => state.user?.uid);

    const handleSend = async () => {
        if (newMessage.trim() === '' || !chatId || isSending) return;

        const textToSend = newMessage;
        setNewMessage('');
        setIsSending(true);

        try {
            const sendMessage = functions().httpsCallable('sendMessage');
            await sendMessage({ chatId, text: textToSend });
        } catch (error) {
            console.error("Error sending message: ", error);
            setNewMessage(textToSend); // Re-populate the input field so the message isn't lost
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading || !currentUserId) {
        return <WorkerScreenTemplate><ActivityIndicator style={styles.centered} size="large" color={Colors.primary} /></WorkerScreenTemplate>;
    }

    if (error) {
        return <WorkerScreenTemplate><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></WorkerScreenTemplate>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <WorkerScreenTemplate>
                <KeyboardAvoidingView 
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={90}
                >
                    <Stack.Screen options={{ title: chat?.name || 'Chat' }} />
                    
                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <MessageItem item={item} currentUserId={currentUserId} />}
                        contentContainerStyle={styles.listContainer}
                        inverted
                    />
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={newMessage}
                            onChangeText={setNewMessage}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.gray}
                        />
                        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isSending}>
                            {isSending ? <ActivityIndicator size="small" color={Colors.white} /> : <Text style={styles.sendButtonText}>Send</Text>}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </WorkerScreenTemplate>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: Colors.danger, fontSize: 16 },
    listContainer: { paddingHorizontal: 10, flexDirection: 'column-reverse' },
    messageRow: { flexDirection: 'row', marginBottom: 10, paddingHorizontal: 10 },
    sentRow: { justifyContent: 'flex-end' },
    receivedRow: { justifyContent: 'flex-start' },
    messageBubble: { borderRadius: 20, padding: 12, maxWidth: '80%' },
    sentBubble: { backgroundColor: Colors.primary },
    receivedBubble: { backgroundColor: Colors.lightGray },
    messageText: { fontSize: 16 },
    sentText: { color: Colors.white },
    receivedText: { color: Colors.darkGray },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        backgroundColor: Colors.white,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: Colors.lightGray,
        borderRadius: 20,
        paddingHorizontal: 15,
        marginRight: 10,
    },
    sendButton: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        borderRadius: 20,
        paddingHorizontal: 20,
        minWidth: 70,
    },
    sendButtonText: { color: Colors.white, fontWeight: 'bold' },
    timestampContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    timestampText: {
        fontSize: 12,
        color: Colors.gray,
    },
});

export default ChatScreen;
