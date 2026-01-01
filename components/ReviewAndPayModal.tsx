import { zodResolver } from '@hookform/resolvers/zod';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { Image, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { z } from 'zod';
import { Colors } from '../constants/colors';
import { Shift } from '../../types';
import Button from './Button';
import PaymentShiftCostSummary from './PaymentShiftCostSummary';
import StarRating from './StarRating';
import TimePayAdjuster from './TimePayAdjuster';


// Zod schema for form validation
const formSchema = z.object({
  rating: z.number().min(1, "A rating is required."),
  comment: z.string().optional(),
});

// The shift object passed from the dashboard may have these calculated fields
interface CalculatedShiftDetails {
    totalHours?: number;
    basePay?: number;
    serviceFee?: number;
    totalCost?: number;
}

interface ReviewAndPayModalProps {
  visible: boolean;
  onClose: () => void;
  shiftDetails?: Shift & CalculatedShiftDetails;
}

const ReviewAndPayModal: React.FC<ReviewAndPayModalProps> = ({ visible, onClose, shiftDetails }) => {
  const [isEditingHours, setIsEditingHours] = useState(false);
  const [adjustedStartTime, setAdjustedStartTime] = useState(shiftDetails?.startTime || new Date());
  const [adjustedFinishTime, setAdjustedFinishTime] = useState(shiftDetails?.endTime || new Date());
  const [adjustedBreakDuration, setAdjustedBreakDuration] = useState(shiftDetails?.breakDuration || 0);
  const [adjustedTotalHours, setAdjustedTotalHours] = useState(shiftDetails?.totalHours || 0);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });
  
  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = form;

  useEffect(() => {
    if (shiftDetails) {
        setAdjustedStartTime(shiftDetails.startTime);
        setAdjustedFinishTime(shiftDetails.endTime);
        setAdjustedBreakDuration(shiftDetails.breakDuration || 0);
        setAdjustedTotalHours(shiftDetails.totalHours || 0)
        reset({ rating: 0, comment: '' });
        setIsEditingHours(false);
    }
  }, [shiftDetails, reset]);

  const handleTimeAdjustment = useCallback(({ startTime, finishTime, breakDuration, totalHours }: { startTime: Date; finishTime: Date; breakDuration: number; totalHours: number }) => {
    setAdjustedStartTime(startTime);
    setAdjustedFinishTime(finishTime);
    setAdjustedBreakDuration(breakDuration);
    setAdjustedTotalHours(totalHours);
  }, []);

  const adjustedCostDetails = useMemo(() => {
    if (!shiftDetails) return null;
    
    const basePay = adjustedTotalHours * shiftDetails.pay;
    const serviceFee = basePay * 0.12; 
    const totalCost = basePay + serviceFee;
    
    return {
      ...shiftDetails,
      date: shiftDetails.startTime, 
      startTime: adjustedStartTime,
      endTime: adjustedFinishTime, // Ensure this is passed as endTime
      breakDuration: adjustedBreakDuration,
      totalHours: adjustedTotalHours,
      basePay,
      serviceFee,
      totalCost,
    };
  }, [adjustedStartTime, adjustedFinishTime, adjustedBreakDuration, adjustedTotalHours, shiftDetails]);

  const handleConfirmAndPay = (values: z.infer<typeof formSchema>) => {
    // TODO: Implement Stripe Connect API integration here.
    console.log("Payment processing bypassed for now.");
    onClose();
  };
  
  if (!shiftDetails) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
      presentationStyle="overFullScreen"
      hardwareAccelerated
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <FormProvider {...form}>
            <ScrollView 
              style={styles.container} 
              contentContainerStyle={styles.contentContainer} 
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
              
              <Text style={styles.header}>Review & Pay</Text>
              <Text style={styles.subHeader}>Review the shift details and submit payment to the worker.</Text>

                {shiftDetails.worker && (
                    <View style={styles.workerInfoContainer}>
                        <Image source={{ uri: shiftDetails.worker.profilePictureUrl }} style={styles.workerImage} />
                        <View>
                            <Text style={styles.workerName}>{shiftDetails.worker.firstName} {shiftDetails.worker.lastName}</Text>
                            <Text style={styles.shiftRole}>Completed: {shiftDetails.role}</Text>
                        </View>
                    </View>
                )}

              <View style={styles.card}>
                  <Text style={styles.cardTitle}>Leave a Review</Text>
                   <Controller
                        control={control}
                        name="rating"
                        render={({ field: { onChange, value } }) => (
                           <View style={styles.ratingContainer}>
                             <StarRating rating={value} onRatingChange={onChange} size={40} />
                           </View>
                        )}
                    />
                    {errors.rating && <Text style={styles.errorText}>{errors.rating.message}</Text>}

                  <Controller
                      control={control}
                      name="comment"
                      render={({ field }) => (
                        <TextInput
                            style={styles.input}
                            multiline
                            placeholderTextColor={Colors.gray}
                            placeholder="Share your experience with this worker..."
                            onChangeText={field.onChange}
                            value={field.value}
                        />
                      )}
                  />
              </View>

              {isEditingHours ? (
                  <View style={styles.card}>
                     <TimePayAdjuster 
                        initialStartTime={adjustedStartTime}
                        initialFinishTime={adjustedFinishTime}
                        initialBreakDuration={adjustedBreakDuration}
                        hourlyRate={shiftDetails.pay} 
                        onAdjust={handleTimeAdjustment}
                      />
                  </View>
              ) : (
                  <PaymentShiftCostSummary details={adjustedCostDetails} />
              )}
               <TouchableOpacity onPress={() => setIsEditingHours(!isEditingHours)} style={styles.editHoursButton}>
                  <Text style={styles.editHoursText}>{isEditingHours ? 'Done Editing' : 'Edit Hours'}</Text>
              </TouchableOpacity>

              <View style={styles.buttonRow}>
                <Button title="Confirm & Pay" onPress={handleSubmit(handleConfirmAndPay)} containerStyle={{flex: 1}} loading={isSubmitting} />
              </View>

            </ScrollView>
          </FormProvider>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    input: {
        height: 100,
        borderColor: Colors.lightGray,
        borderWidth: 1,
        borderRadius: 5,
        padding: 10,
        color: Colors.text,
        backgroundColor: Colors.white,
        textAlignVertical: 'top',
      },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    backgroundColor: Colors.background,
    borderRadius: 15,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  container: { flex: 1 },
  contentContainer: { paddingVertical: 20, paddingHorizontal: 10 },
  header: { fontSize: 22, fontWeight: 'bold', color: Colors.primary, marginBottom: 8, textAlign: 'center', marginTop: 10 },
  subHeader: { fontSize: 15, color: Colors.textSecondary, marginBottom: 20, textAlign: 'center' },
  workerInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  workerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  workerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  shiftRole: {
      fontSize: 14,
      color: Colors.textSecondary,
  },
  card: { backgroundColor: 'white', borderRadius: 8, padding: 16, marginBottom: 16, },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  editHoursButton: {
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  editHoursText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 15,
  },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, columnGap: 10 },
  errorText: { color: Colors.danger, fontSize: 12, marginTop: -10, marginBottom: 10, textAlign: 'center'},
});

export default ReviewAndPayModal;
