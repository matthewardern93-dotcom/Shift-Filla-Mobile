import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Colors } from '../constants/colors';
import { Fonts } from '../constants/fonts';
import { Clock, MapPin, Calendar, DollarSign, CheckCircle } from 'lucide-react-native';
import { format } from 'date-fns';
import { getDistance } from 'geolib';
import { useLocation } from '../hooks/useLocation';

const WorkerShiftCard = ({ item, onPress, onSwipeApply, isApplied, isNew, isConfirmed, isOffered }) => {
    const { location: userLocation } = useLocation();
    const [distance, setDistance] = useState<string | null>(null);

    useEffect(() => {
        // Ensure we have both user's and venue's locations
        if (userLocation && item.venue.location?.latitude && item.venue.location?.longitude) {
            const distanceInMeters = getDistance(
                { latitude: userLocation.coords.latitude, longitude: userLocation.coords.longitude },
                { latitude: item.venue.location.latitude, longitude: item.venue.location.longitude }
            );
            // Convert to kilometers and format
            const distanceInKm = distanceInMeters / 1000;
            setDistance(`${distanceInKm.toFixed(1)} km away`);
        }
    }, [userLocation, item.venue.location]);

    const startTime = format(new Date(item.startTime), 'h:mm a');
    const endTime = format(new Date(item.endTime), 'h:mm a');
    const date = format(new Date(item.startTime), 'EEE, MMM d');
    const duration = (new Date(item.endTime).getTime() - new Date(item.startTime).getTime()) / (1000 * 60 * 60);
    const totalPay = (duration * item.payRate).toFixed(2);

    const renderRightActions = (progress, dragX) => {
        const trans = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [1, 0],
            extrapolate: 'clamp',
        });

        return (
            <TouchableOpacity onPress={onSwipeApply} style={styles.applyButton}>
                <Animated.View style={[styles.applyButtonContainer, { transform: [{ translateX: trans }] }]}>
                    <Text style={styles.applyButtonText}>Apply</Text>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    return (
        <Swipeable renderRightActions={!isApplied && onSwipeApply ? renderRightActions : undefined}>
            <TouchableOpacity style={styles.card} onPress={onPress}>
                <View style={styles.header}>
                    <Text style={styles.role}>{item.role}</Text>
                    <Text style={styles.payRate}>${item.payRate}/hr</Text>
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <MapPin size={14} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{item.venue.name}{item.venue.location ? `, ${item.venue.location.city}` : ''}</Text>
                    </View>
                    {distance && <Text style={styles.distance}>({distance})</Text>}
                </View>

                <View style={styles.detailRow}>
                    <View style={styles.detailItem}>
                        <Calendar size={14} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{date}</Text>
                    </View>
                    <View style={styles.detailItem}>
                        <Clock size={14} color={Colors.textSecondary} />
                        <Text style={styles.detailText}>{startTime} - {endTime}</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <View style={styles.badgeContainer}>
                        {isOffered && (
                            <View style={[styles.badge, styles.offeredBadge]}>
                                <Text style={styles.badgeText}>Offered</Text>
                            </View>
                        )}
                        {isConfirmed ? (
                            <View style={[styles.badge, styles.confirmedBadge]}>
                                <CheckCircle size={12} color={Colors.white} />
                                <Text style={styles.badgeText}>Confirmed</Text>
                            </View>
                        ) : isApplied ? (
                            <View style={[styles.badge, styles.appliedBadge]}>
                                <Text style={styles.badgeText}>Applied</Text>
                            </View>
                        ) : isNew && (
                            <View style={[styles.badge, styles.newBadge]}>
                                <Text style={styles.badgeText}>New</Text>
                            </View>
                        )}
                    </View>
                    <View style={styles.detailItem}>
                        <DollarSign size={16} color={Colors.primary} />
                        <Text style={styles.totalPay}>${totalPay}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.white,
        borderRadius: 8,
        padding: 12,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
        borderLeftWidth: 4,
        borderLeftColor: Colors.primary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    role: {
        fontSize: 17,
        fontWeight: 'bold',
        color: Colors.text,
        fontFamily: Fonts.sansBold,
    },
    payRate: {
        fontSize: 15,
        fontWeight: 'bold',
        color: Colors.primary,
        fontFamily: Fonts.sansBold,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailText: {
        fontSize: 13,
        color: Colors.textSecondary,
        marginLeft: 6,
        fontFamily: Fonts.sans,
    },
    distance: {
        fontSize: 12,
        color: Colors.textSecondary,
        fontFamily: Fonts.sans,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: Colors.lightGray,
        paddingTop: 8,
        marginTop: 4,
    },
    badgeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        marginRight: 6,
    },
    newBadge: {
        backgroundColor: Colors.primary,
    },
    appliedBadge: {
        backgroundColor: Colors.success,
    },
    confirmedBadge: {
        backgroundColor: Colors.success,
    },
    offeredBadge: {
        backgroundColor: '#f5a623', // Yellow
    },
    badgeText: {
        color: Colors.white,
        fontSize: 11,
        fontWeight: 'bold',
        marginLeft: 4,
        fontFamily: Fonts.sansBold,
    },
    totalPay: {
        fontSize: 16,
        fontWeight: 'bold',
        color: Colors.text,
        fontFamily: Fonts.sansBold,
        marginLeft: 4,
    },
    applyButton: {
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        width: 80,
        borderRadius: 8,
        marginBottom: 10,
    },
    applyButtonContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    applyButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: 14,
        fontFamily: Fonts.sansBold,
    },
});

export default WorkerShiftCard;