import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';
import { format } from 'date-fns';

interface ShiftCostSummaryProps {
  details: {
    date?: Date | Date[];
    startTime?: Date;
    finishTime?: Date;
    breakDuration?: number; // in minutes
    totalHours?: number;
    basePay?: number;
    serviceFee?: number;
    totalCost?: number;
  } | null;
}

const ShiftCostSummary: React.FC<ShiftCostSummaryProps> = ({ details }) => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  if (!details) {
    return null;
  }

  const { date, startTime, finishTime, breakDuration, totalHours, basePay, serviceFee, totalCost } = details;

  const handleApplyPromoCode = () => {
    // In a real app, you'd validate the promo code and get the discount amount.
    // For now, let's assume a simple promo code "SAVE10" for a 10% discount on the service fee.
    if (promoCode.toUpperCase() === 'SAVE10' && serviceFee) {
      setDiscount(serviceFee * 0.1);
    } else {
      setDiscount(0);
    }
  };

  const formatDate = (d: Date) => format(d, 'EEE, MMM d, yyyy');
  const formatTime = (t: Date) => format(t, 'h:mm a');

  const finalTotal = totalCost ? totalCost - discount : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shift Cost Summary</Text>
      
      {date && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Date</Text>
          <Text style={styles.summaryValue}>{Array.isArray(date) ? `${formatDate(date[0])} - ${formatDate(date[date.length - 1])}` : formatDate(date)}</Text>
        </View>
      )}
      {startTime && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Start Time</Text>
          <Text style={styles.summaryValue}>{formatTime(startTime)}</Text>
        </View>
      )}
      {finishTime && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Finish Time</Text>
          <Text style={styles.summaryValue}>{formatTime(finishTime)}</Text>
        </View>
      )}
      {breakDuration !== undefined && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Break</Text>
          <Text style={styles.summaryValue}>{breakDuration} mins</Text>
        </View>
      )}

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Total Hours</Text>
        <Text style={styles.summaryValue}>{totalHours?.toFixed(2) ?? '0.00'} hrs</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Worker Pay </Text>
        <Text style={styles.summaryValue}>${basePay?.toFixed(2) ?? '0.00'}</Text>
      </View>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Service Fee (12%)</Text>
        <Text style={styles.summaryValue}>${serviceFee?.toFixed(2) ?? '0.00'}</Text>
      </View>

      <View style={styles.promoContainer}>
        <TextInput
          style={styles.promoInput}
          placeholder="Promo Code"
          value={promoCode}
          onChangeText={setPromoCode}
          autoCapitalize="characters"
        />
        <TouchableOpacity style={styles.applyButton} onPress={handleApplyPromoCode}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>

      {discount > 0 && (
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Promo Discount</Text>
          <Text style={[styles.summaryValue, styles.discountValue]}>-${discount.toFixed(2)}</Text>
        </View>
      )}

      <View style={styles.totalItem}>
        <Text style={styles.totalLabel}>Total Cost</Text>
        <Text style={styles.totalValue}>${finalTotal.toFixed(2)}</Text>
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
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
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
  promoContainer: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 10,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 4,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  applyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 4,
    justifyContent: 'center',
  },
  applyButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  discountValue: {
    color: 'green',
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
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

export default ShiftCostSummary;
