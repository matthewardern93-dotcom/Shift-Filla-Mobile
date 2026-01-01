import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  Dimensions, Switch, ScrollView
} from 'react-native';
import { Shift, PermanentJob } from '../../types';
import ShiftCard from '../../components/ShiftCard';
import PTFTJobCard from '../../components/PTFTJobCard';
import VenueScreenTemplate from '../../components/templates/VenueScreenTemplate';
import { Colors } from '../../constants/colors';
import { Fonts } from '../../constants/fonts';
import { Calendar, DateData } from 'react-native-calendars';
import { format } from 'date-fns';
import { useVenueDashboard } from '../../hooks/useVenueDashboard';
import ReferralTracker from '../../components/ReferralTracker';

const tabs = [
  { key: 'unfilled', label: 'Unfilled', statuses: ['posted', 'open'] },
  { key: 'filled', label: 'Filled', statuses: ['filled', 'confirmed', 'pending_changes'] },
];

type UnfilledItem = (Shift | PermanentJob) & { itemType: 'shift' | 'job' };

const NewVenueHome = () => {
  const { venueProfile, shifts, jobs, referredVenues, isLoading, error } = useVenueDashboard();
  const [activeTab, setActiveTab] = useState(tabs[0].key);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isCalendarView, setIsCalendarView] = useState(false);

  const filteredItems = useMemo(() => {
    const currentTab = tabs.find(t => t.key === activeTab);
    if (!currentTab) return [];

    const filteredShifts = shifts
        .filter(shift => currentTab.statuses.includes(shift.status))
        .map(s => ({ ...s, itemType: 'shift' as const }));

    if (activeTab === 'unfilled') {
        const filteredJobs = jobs
            .filter(job => currentTab.statuses.includes(job.status))
            .map(j => ({ ...j, itemType: 'job' as const }));
        return [...filteredShifts, ...filteredJobs];
    }

    return filteredShifts;
  }, [activeTab, shifts, jobs]);

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const onMonthChange = (month: DateData) => {
    setCurrentMonth(new Date(month.timestamp));
  };

  const markedDates = useMemo(() => {
    const marks: { [key: string]: any } = {};
    shifts.forEach(shift => {
        const date = format(new Date(shift.startTime), 'yyyy-MM-dd');
        if (!marks[date]) {
            marks[date] = { marked: true, dotColor: Colors.primary };
        }
    });
    if (marks[selectedDate]) {
      marks[selectedDate].selected = true;
    } else {
      marks[selectedDate] = { selected: true, selectedColor: Colors.primary, marked: false };
    }
    return marks;
  }, [shifts, selectedDate]);

  const selectedDayShifts = useMemo(() => {
    return shifts.filter(shift => format(new Date(shift.startTime), 'yyyy-MM-dd') === selectedDate);
  }, [shifts, selectedDate]);

  const unfilledItemsCount = useMemo(() => {
    const unfilledShifts = shifts.filter(s => tabs[0].statuses.includes(s.status)).length;
    const openJobs = jobs.filter(j => tabs[0].statuses.includes(j.status)).length;
    return unfilledShifts + openJobs;
  }, [shifts, jobs]);

  const filledShiftsCount = useMemo(() => {
    return shifts.filter(s => tabs[1].statuses.includes(s.status)).length;
  }, [shifts]);
  
  const renderContent = () => {
    if (isLoading && !venueProfile) { // Show main loader only on initial load
      return <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 50 }} />;
    }
    
    if (error) {
        return <View style={styles.placeholder}><Text style={styles.errorText}>{error}</Text></View>;
    }

    if (isCalendarView) {
      return (
        <View>
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
                monthTextColor: Colors.primary,
                textSectionTitleColor: Colors.primary,
                textDayFontFamily: Fonts.body,
                textMonthFontFamily: Fonts.headline,
                textDayHeaderFontFamily: Fonts.sans,
            }}
          />
          {
            selectedDayShifts.length > 0 ? (
                selectedDayShifts.map(item => <ShiftCard key={item.id} item={item} />)
            ) : (
                <View style={styles.placeholder}><Text style={styles.placeholderText}>No shifts scheduled for this day.</Text></View>
            )
          }
        </View>
      );
    }

    if (filteredItems.length === 0) {
        return <View style={styles.placeholder}><Text style={styles.placeholderText}>No items to display in this category.</Text></View>;
    }

    return (
      <View style={styles.listContainer}>
        {filteredItems.map(item => 
            item.itemType === 'shift' 
                ? <ShiftCard key={item.id} item={item as Shift} /> 
                : <PTFTJobCard key={item.id} job={item as PermanentJob} />
        )}
      </View>
    );
  };

  return (
    <VenueScreenTemplate>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
            <Text style={styles.headerText}>Welcome, {venueProfile?.name || ''}</Text>
        </View>

        <View style={styles.subHeader}>
            <Text style={styles.subHeaderText}>Your Postings</Text>
            <View style={styles.calendarToggleContainer}>
                <Text style={styles.calendarToggleText}>Calendar</Text>
                <Switch
                    value={isCalendarView}
                    onValueChange={setIsCalendarView}
                    trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                    thumbColor={Colors.white}
                />
            </View>
        </View>

      <View style={styles.tabContainer}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.activeTabText]}>{`${tab.label} (${tab.key === 'unfilled' ? unfilledItemsCount : filledShiftsCount})`}</Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {renderContent()}
      
      {venueProfile?.referralCode &&
        <ReferralTracker referralCode={venueProfile.referralCode} referredVenues={referredVenues || []} />
      }

      </ScrollView>
    </VenueScreenTemplate>
  );
};

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    scrollContainer: {
        flexGrow: 1,
        backgroundColor: Colors.background
    },
  header: {
    padding: 20,
    backgroundColor: Colors.white,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray
  },
  headerText: {
    fontSize: 24,
    fontFamily: Fonts.headline,
    color: Colors.text
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: Colors.white,
  },
  subHeaderText: {
    fontSize: 18,
    fontFamily: Fonts.sansBold,
    color: Colors.text
  },
  tabContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
  },
  activeTab: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    color: Colors.textSecondary,
    fontFamily: Fonts.sansBold,
    fontSize: 14,
  },
  activeTabText: {
    color: Colors.white,
  },
  listContainer: {
    padding: 10,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 200
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: Fonts.body,
    color: Colors.textSecondary,
    textAlign: 'center'
  },
    errorText: {
        fontSize: 16,
        fontFamily: Fonts.body,
        color: Colors.danger,
        textAlign: 'center'
    },
  calendarToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarToggleText: {
      fontFamily: Fonts.sans,
      marginRight: 10,
      fontSize: 14
  },
});

export default NewVenueHome;
