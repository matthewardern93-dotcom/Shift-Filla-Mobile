import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { useAuth } from '../../hooks/useAuth';
import { Colors } from '../../constants/colors';
import { formatDistanceToNow } from 'date-fns';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { useVenueConversations } from '../../hooks/useVenueConversations';

const ConversationCard = ({ item, currentUserId, onPress }) => {
    const { participantProfile } = item;
    const lastMessageTimestamp = item.lastMessageTimestamp ? formatDistanceToNow(new Date(item.lastMessageTimestamp.seconds * 1000), { addSuffix: true }) : '';
    const participantName = participantProfile ? `${participantProfile.firstName} ${participantProfile.lastName}` : 'Unknown User';

    return (
        <TouchableOpacity style={styles.card} onPress={onPress}>
            <Image source={{ uri: participantProfile?.profilePictureUrl || 'https://i.pravatar.cc/150' }} style={styles.avatar} />
            <View style={styles.textContainer}>
                <View style={styles.cardHeader}>
                    <Text style={styles.participantName}>{participantName}</Text>
                    <Text style={styles.timestamp}>{lastMessageTimestamp}</Text>
                </View>
                <Text style={styles.jobTitle}>{item.jobTitle}</Text>
                <Text style={styles.lastMessage} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unreadBy && item.unreadBy.includes(currentUserId) && <View style={styles.unreadIndicator} />}
        </TouchableOpacity>
    );
};

const VenueMessagesScreen = () => {
    const router = useRouter();
    const { user } = useAuth();
    const { conversations, isLoading, error } = useVenueConversations();

    const handlePressConversation = (conversationId: string) => {
        router.push(`/(venue)/chat/${conversationId}`);
    };

    if (isLoading) {
        return <VenueScreenTemplate><ActivityIndicator style={styles.centered} size="large" color={Colors.primary} /></VenueScreenTemplate>;
    }
    
    if (error) {
        return <VenueScreenTemplate><View style={styles.centered}><Text style={styles.errorText}>{error}</Text></View></VenueScreenTemplate>;
    }

    return (
        <VenueScreenTemplate>
            <View style={styles.container}>
                <Stack.Screen options={{ title: 'Messages' }} />
                {conversations.length > 0 ? (
                    <FlatList
                        data={conversations}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <ConversationCard 
                                item={item} 
                                currentUserId={user?.uid}
                                onPress={() => handlePressConversation(item.id)} 
                            />
                        )}
                        contentContainerStyle={styles.listContainer}
                    />
                ) : (
                    <View style={styles.centered}>
                        <Text style={styles.noMessagesText}>You have no messages yet.</Text>
                    </View>
                )}
            </View>
        </VenueScreenTemplate>
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
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
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
        color: Colors.primary,
    },
    timestamp: {
        fontSize: 12,
        color: Colors.gray,
    },
    jobTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.darkGray,
        marginBottom: 4,
    },
    lastMessage: {
        fontSize: 14,
        color: Colors.gray,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    noMessagesText: {
        fontSize: 16,
        color: Colors.gray,
    },
    errorText: {
        fontSize: 16,
        color: Colors.danger,
    },
    unreadIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: Colors.primary,
        marginLeft: 10,
    },
});

export default VenueMessagesScreen;
