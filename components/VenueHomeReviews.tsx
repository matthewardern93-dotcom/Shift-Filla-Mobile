import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Star } from 'lucide-react-native';
import { Colors } from '../constants/colors';

const mockReviews = [
  {
    id: '1',
    workerName: 'John D.',
    rating: 5,
    comment: 'Great place to work! Management is very supportive.',
    date: '2023-10-27',
  },
  {
    id: '2',
    workerName: 'Jane S.',
    rating: 4,
    comment: 'Good team and fun environment. Pay was on time.',
    date: '2023-10-26',
  },
  {
    id: '3',
    workerName: 'Mike R.',
    rating: 5,
    comment: 'One of the best venues I have ever worked at. Highly recommend.',
    date: '2023-10-25',
  },
  {
    id: '4',
    workerName: 'Emily B.',
    rating: 4,
    comment: 'The shift was busy but the staff was very helpful.',
    date: '2023-10-24',
  },
  {
    id: '5',
    workerName: 'Chris L.',
    rating: 5,
    comment: 'Awesome team, great tips, and a very organized system.',
    date: '2023-10-23',
  },
];

const VenueHomeReviews = () => {
  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          color={i < rating ? Colors.primary : Colors.lightGray}
          fill={i < rating ? Colors.primary : 'transparent'}
        />
      );
    }
    return stars;
  };

  const renderItem = ({ item }: { item: typeof mockReviews[0] }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Text style={styles.workerName}>{item.workerName}</Text>
        <View style={styles.ratingContainer}>{renderStars(item.rating)}</View>
      </View>
      <Text style={styles.comment}>{item.comment}</Text>
      <Text style={styles.date}>{item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Worker Reviews</Text>
      <FlatList
        data={mockReviews}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginLeft: 15,
    marginBottom: 10,
  },
  listContainer: {
    paddingLeft: 15,
  },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 10,
    padding: 15,
    width: 280,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  workerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  comment: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 20,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'right',
  },
});

export default VenueHomeReviews;
