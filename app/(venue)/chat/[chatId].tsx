import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Message } from '../../../types';
import { Colors } from '../../../constants/colors';
import VenueScreenTemplate from '../../../components/templates/VenueScreenTemplate';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import { format } from 'date-fns';
import { useChat } from '../../../hooks/useChat';
import { useUserStore } from '../../../app/store/userStore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../services/firebase';

const MessageItem = ({ item, currentUserId }: { item: Message, currentUserId: string }) => {
    const swipeableRef = useRef<Swipeable>(null);

    const renderLeftActions = (_progress: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
        return (
            <View style={styles.timestampContainer}>
                <Text style={styles.timestampText}>
                    {format(new Date(item.timestamp), 'p')}
                </Text>
            </View>
        );
    };

    return (
        <Swipeable 
            ref={swipeableRef} 
            renderLeftActions={renderLeftActions}
            friction={2}
        >
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
    const currentUserId = useUserStore(state => state.user?.uid);

    const handleSend = async () => {
        if (newMessage.trim() === '' || !chatId || isSending) return;

        const textToSend = newMessage;
        setNewMessage('');
        setIsSending(true);

        try {
            const sendMessage = httpsCallable(functions, 'sendMessage');
            await sendMessage({ chatId, text: textToSend });
        } catch (error) {
            console.error("Error sending message: ", error);
            setNewMessage(textToSend); // Re-populate if send fails
        } finally {
            setIsSending(false);
        }
    };

    if (isLoading) {
        return <VenueScreenTemplate><ActivityIndicator style={styles.centered} size="large" color={Colors.primary} /></VenueScreenTemplate>;
    }

    if (error) {
        return <VenueScreenTemplate><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></VenueScreenTemplate>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <VenueScreenTemplate>
                <KeyboardAvoidingView 
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={90}
                >
                    <Stack.Screen options={{ title: chat?.name || 'Chat' }} />

                    <FlatList
                        data={messages}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => <MessageItem item={item} currentUserId={currentUserId!} />}
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
            </VenueScreenTemplate>
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
