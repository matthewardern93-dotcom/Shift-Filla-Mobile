
import { format } from 'date-fns';
import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native';
import { Colors } from '../constants/colors';
import { Shift } from '../types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface PaymentShiftCostSummaryProps {
  details: (Shift & {
    date?: Date | Date[];
    startTime: Date;
    endTime: Date;
    totalHours?: number;
    basePay?: number;
    serviceFee?: number;
    totalCost?: number;
  }) | null;
}

const PaymentShiftCostSummary: React.FC<PaymentShiftCostSummaryProps> = ({ details }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!details) {
    return null;
  }

  const { date, startTime, endTime, breakDuration, totalHours, basePay, serviceFee, totalCost } = details;

  const formatDate = (d: Date) => format(d, 'EEE, MMM d, yyyy');
  const formatTime = (t: Date) => format(t, 'h:mm a');

  const handleDatePress = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift Cost Summary</Text>
      
      {date && (
        <TouchableOpacity onPress={handleDatePress}>
            <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Date</Text>
                <Text style={[styles.summaryValue, styles.linkText]}>{Array.isArray(date) ? `${formatDate(date[0])} - ${formatDate(date[date.length - 1])}` : formatDate(date)}</Text>
            </View>
        </TouchableOpacity>
      )}

      {isExpanded && (
        <View style={styles.collapsibleContent}>
            <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Start Time</Text>
                <Text style={styles.summaryValue}>{formatTime(startTime)}</Text>
            </View>
            <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Finish Time</Text>
                <Text style={styles.summaryValue}>{formatTime(endTime)}</Text>
            </View>
            {breakDuration !== undefined && (
                <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Break</Text>
                <Text style={styles.summaryValue}>{breakDuration} mins</Text>
                </View>
            )}
        </View>
      )}

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Hours</Text>
        <Text style={styles.summaryValue}>{totalHours?.toFixed(2) ?? '0.00'} hrs</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Worker Pay</Text>
        <Text style={styles.summaryValue}>${basePay?.toFixed(2) ?? '0.00'}</Text>
      </View>

      <View style={styles.separator} />

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Service Fee (12%)</Text>
        <Text style={styles.summaryValue}>${serviceFee?.toFixed(2) ?? '0.00'}</Text>
      </View>
      <View style={styles.totalItem}>
        <Text style={styles.totalLabel}>Total Cost</Text>
        <Text style={styles.totalValue}>${totalCost?.toFixed(2) ?? '0.00'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
    textAlign: 'center',
  },
   collapsibleContent: {
    paddingTop: 6, // Add some padding when expanded
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
    marginVertical: 6,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.lightGray,
    marginVertical: 12,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default PaymentShiftCostSummary;
