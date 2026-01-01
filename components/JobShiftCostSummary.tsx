import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/colors';

interface JobShiftCostSummaryProps {
  details: {
    listingFee?: number;
    serviceFee?: number;
    totalCost?: number;
  } | null;
}

const JobShiftCostSummary: React.FC<JobShiftCostSummaryProps> = ({ details }) => {
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  if (!details) {
    return null;
  }

  const { listingFee, serviceFee, totalCost } = details;

  const handleApplyPromoCode = () => {
    if (promoCode.toUpperCase() === 'FREEJOB' && totalCost) {
      setDiscount(totalCost);
    } else {
      setDiscount(0);
    }
  };

  const finalTotal = totalCost ? totalCost - discount : 0;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Post Cost Summary</Text>

      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Listing Fee</Text>
        <Text style={styles.summaryValue}>${listingFee?.toFixed(2) ?? '50.00'}</Text>
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

export default JobShiftCostSummary;
