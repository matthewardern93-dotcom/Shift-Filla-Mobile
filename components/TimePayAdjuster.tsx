
import { addMinutes, differenceInMinutes, format, subMinutes } from 'date-fns';
import { MinusCircle, PlusCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

const roundToNearest15 = (date: Date): Date => {
    const d = new Date(date);
    const minutes = d.getMinutes();
    const roundedMinutes = Math.round(minutes / 15) * 15;
    
    if (roundedMinutes === 60) {
        d.setHours(d.getHours() + 1);
        d.setMinutes(0);
    } else {
        d.setMinutes(roundedMinutes);
    }
    
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  };

  const TimeAdjuster = ({ label, time, setter }: { label: string, time: Date, setter: (d: Date) => void }) => (
    <View style={styles.timeAdjusterRow}>
      <Text style={styles.timeLabel}>{label}</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setter(subMinutes(time, 15))} style={styles.button}>
          <MinusCircle size={32} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.timeText}>{format(time, 'h:mm a')}</Text>
        <TouchableOpacity onPress={() => setter(addMinutes(time, 15))} style={styles.button}>
          <PlusCircle size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const BreakAdjuster = ({ breakDuration, setBreakDuration }: { breakDuration: number, setBreakDuration: (d: number) => void }) => (
    <View style={styles.timeAdjusterRow}>
      <Text style={styles.timeLabel}>Break</Text>
      <View style={styles.controls}>
        <TouchableOpacity onPress={() => setBreakDuration(Math.max(0, breakDuration - 15))} style={styles.button}>
          <MinusCircle size={32} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.timeText}>{breakDuration} mins</Text>
        <TouchableOpacity onPress={() => setBreakDuration(breakDuration + 15)} style={styles.button}>
          <PlusCircle size={32} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );

interface TimePayAdjusterProps {
  initialStartTime: Date;
  initialFinishTime: Date;
  initialBreakDuration: number; // in minutes
  hourlyRate: number;
  setAdjustedTotalHours: (totalHours: number) => void;
}

const TimePayAdjuster: React.FC<TimePayAdjusterProps> = ({ 
  initialStartTime, 
  initialFinishTime, 
  initialBreakDuration,
  hourlyRate, 
  setAdjustedTotalHours
}) => {
  const [startTime, setStartTime] = useState(roundToNearest15(initialStartTime));
  const [finishTime, setFinishTime] = useState(roundToNearest15(initialFinishTime));
  const [breakDuration, setBreakDuration] = useState(initialBreakDuration);

  const durationInMinutes = differenceInMinutes(finishTime, startTime);
  const totalHours = Math.max(0, (durationInMinutes - breakDuration) / 60);

  useEffect(() => {
    setAdjustedTotalHours(totalHours);
  }, [totalHours, setAdjustedTotalHours]);

  const calculatedPay = totalHours * hourlyRate;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Adjust Shift Time</Text>
      <Text style={styles.description}>
        Times and breaks are in 15-minute increments. Amend if they differ from the schedule.
      </Text>
      
      <View style={styles.adjusterContainer}>
        <TimeAdjuster label="Start Time" time={startTime} setter={setStartTime} />
        <TimeAdjuster label="Finish Time" time={finishTime} setter={setFinishTime} />
        <BreakAdjuster breakDuration={breakDuration} setBreakDuration={setBreakDuration} />
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>New Total Hours</Text>
          <Text style={styles.summaryValue}>{totalHours.toFixed(2)} hrs</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>New Worker Pay</Text>
          <Text style={styles.summaryValue}>${calculatedPay.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  adjusterContainer: {
    marginBottom: 24,
  },
  timeAdjusterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  button: {
    padding: 8,
  },
  timeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    minWidth: 100,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  summaryContainer: {
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});

export default TimePayAdjuster;
