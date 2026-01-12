import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Colors } from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import WorkerScreenTemplate from '../../components/templates/WorkerScreenTemplate';
import { useChatList } from '../../hooks/useChatList';
import { Conversation } from '../../types';

const ConversationCard = ({ item, onPress }: { item: Conversation, onPress: () => void }) => {
    const lastMessageTimestamp = item.lastMessageTimestamp 
        ? formatDistanceToNow(new Date(item.lastMessageTimestamp), { addSuffix: true }) 
        : '';

    // Find the other participant's details
    const otherParticipant = item.participantDetails.find(p => p.id !== 'current-user-id'); // Replace with actual current user ID

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: otherParticipant?.avatarUrl || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <View style={styles.textContainer}>
                <View style={styles.cardHeader}>
                    <Text style={styles.participantName}>{otherParticipant?.name || 'Unknown'}</Text>
                    <Text style={styles.timestamp}>{lastMessageTimestamp}</Text>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                    {item.lastMessage || 'No messages yet.'}
                </Text>
            </View>
            {/* Add unread indicator logic if needed */}
        </TouchableOpacity>
    );
};

const WorkerMessagesScreen = () => {
    const router = useRouter();
    const { chats, isLoading, error } = useChatList();

    const handlePressConversation = (conversationId: string) => {
        router.push(`/(worker)/chat/${conversationId}`);
    };

    const renderContent = () => {
        if (isLoading) {
            return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
        }

        if (error) {
            return <View style={styles.centered}><Text style={styles.noMessagesText}>{error}</Text></View>;
        }

        if (chats.length === 0) {
            return (
                <View style={styles.centered}>
                    <Text style={styles.noMessagesText}>You have no messages yet.</Text>
                </View>
            );
        }

        return (
            <FlatList
                data={chats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ConversationCard 
                        item={item} 
                        onPress={() => handlePressConversation(item.id)} 
                    />
                )}
                contentContainerStyle={styles.listContainer}
            />
        );
    };

    return (
        <WorkerScreenTemplate>
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Messages' }} />
                {renderContent()}
            </View>
        </WorkerScreenTemplate>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    listContainer: {
        paddingVertical: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginHorizontal: 10,
        marginBottom: 10,
        backgroundColor: Colors.white,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
        backgroundColor: Colors.lightGray,
    },
    textContainer: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    participantName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    lastMessage: {
        fontSize: 14,
        color: Colors.textSecondary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    noMessagesText: {
        fontSize: 16,
        color: Colors.textSecondary,
        textAlign: 'center',
    },
    unreadIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        marginLeft: 10,
        alignSelf: 'center'
    },
});

export default WorkerMessagesScreen;