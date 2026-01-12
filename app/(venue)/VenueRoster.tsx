
import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import ShiftCard from '../../components/ShiftCard';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { Colors } from '../../constants/colors';
import { Calendar, DateData } from 'react-native-calendars';
import { MarkedDates } from 'react-native-calendars/src/types';
import { format } from 'date-fns';
import { useUserStore } from '../../app/store/userStore';
import { useVenueShiftStore } from '../../app/store/venueShiftStore';

const tabs = [
  { key: 'unfilled', label: 'Unfilled', statuses: ['posted', 'offered_to_worker'] },
  { key: 'filled', label: 'Filled', statuses: ['filled', 'confirmed', 'pending_changes'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'pending_payment', 'pending_worker_review'] },
  { key: 'calendar', label: 'Calendar', statuses: [] },
];

const VenueRoster = () => {
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { user } = useUserStore();
  const { shifts: allShifts, isLoading, subscribeToVenueShifts, cleanup } = useVenueShiftStore();

  useEffect(() => {
    if (user?.uid) {
      subscribeToVenueShifts(user.uid);
    }
    return () => cleanup();
  }, [user?.uid, subscribeToVenueShifts, cleanup]);

  const filteredShifts = useMemo(() => {
    const currentTab = tabs.find(t => t.key === activeTab);
    if (!currentTab || activeTab === 'calendar') {
      return allShifts;
    }
    return allShifts.filter(shift => currentTab.statuses.includes(shift.status));
  }, [allShifts, activeTab]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
    setSelectedDate(format(new Date(month.timestamp), 'yyyy-MM-dd'));
  };

  const markedDates = useMemo(() => {
    const marks: MarkedDates = {};
    allShifts.forEach(shift => {
      const date = format(new Date(shift.startTime), 'yyyy-MM-dd');
      if (!marks[date]) {
        marks[date] = { marked: true, dotColor: Colors.primary };
      }
    });
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
      marks[selectedDate].selectedColor = Colors.primary;
    } else {
      marks[selectedDate] = { selected: true, selectedColor: Colors.primary };
    }
    return marks;
  }, [allShifts, selectedDate]);

  const selectedDayShifts = useMemo(() => {
    return allShifts.filter(shift => format(new Date(shift.startTime), 'yyyy-MM-dd') === selectedDate);
  }, [allShifts, selectedDate]);

  const renderContent = () => {
    if (isLoading && activeTab !== 'calendar') {
      return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />;
    }
    
    if (activeTab === 'calendar') {
      return (
        <View style={{flex: 1}}>
          <Calendar
            current={format(currentMonth, 'yyyy-MM-dd')}
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            markedDates={markedDates}
            theme={{
                calendarBackground: Colors.background,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors.primary,
                arrowColor: Colors.primary,
            }}
          />
          {isLoading && <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 20 }} />}
          {!isLoading && (
            <FlatList
                data={selectedDayShifts}
                renderItem={({ item }) => <ShiftCard item={item} />}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={<View style={styles.placeholder}><Text>No shifts on this day.</Text></View>}
            />
          )}
        </View>
      );
    }

    if (filteredShifts.length === 0 && !isLoading) {
        return <View style={styles.placeholder}><Text style={styles.placeholderText}>No shifts found for this category.</Text></View>;
    }

    return (
      <FlatList
        data={filteredShifts}
        renderItem={({ item }) => <ShiftCard item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />
    );
  };

  return (
    <VenueScreenTemplate>
      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.contentContainer}>
        {renderContent()}
      </View>
    </VenueScreenTemplate>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  contentContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    width: windowWidth / 2 - 20,
    paddingVertical: 12,
    alignItems: 'center',
    margin: 5,
    borderRadius: 10,
    backgroundColor: Colors.lightGray,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontWeight: '700',
    fontSize: 16,
  },
  activeTabText: {
    color: Colors.white,
  },
  listContainer: {
    padding: 10,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 50,
  },
  placeholderText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});

export default VenueRoster;
