
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { Pencil } from 'lucide-react-native';
import React, { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/colors';

interface DateTimePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  placeholder: string;
  mode?: 'date' | 'time' | 'datetime';
}

const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, placeholder, mode = 'datetime' }) => {
  const [showPicker, setShowPicker] = useState(false);
  const [currentPicker, setCurrentPicker] = useState<'date' | 'time' | null>(null);

  const handlePress = () => {
    if (mode === 'datetime') {
      setCurrentPicker('date');
    } else {
      setCurrentPicker(mode);
    }
    setShowPicker(true);
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    const currentDate = selectedDate || value;
    if (Platform.OS === 'android') {
        setShowPicker(false);
    }
    
    if (event.type === 'set' && currentDate) {
      if (mode === 'datetime') {
        onChange(currentDate);
        // After selecting a date, automatically show the time picker on iOS
        if (Platform.OS === 'ios') {
            setCurrentPicker('time');
        } else {
            // For android, we need to imperatively show the next picker.
            setTimeout(() => {
                setCurrentPicker('time');
                setShowPicker(true);
            }, 500);
        }
      } else {
        onChange(currentDate);
        setCurrentPicker(null);
      }
    } else if (event.type === 'dismissed') {
        setCurrentPicker(null);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    const currentTime = selectedTime || value;
    if (Platform.OS === 'android') {
        setShowPicker(false);
    }

    if (event.type === 'set' && currentTime && value) {
      // Combine the date from `value` with the time from `currentTime`
      const newDate = new Date(value);
      newDate.setHours(currentTime.getHours());
      newDate.setMinutes(currentTime.getMinutes());
      newDate.setSeconds(0);
      newDate.setMilliseconds(0);
      onChange(newDate);
    }
    if (Platform.OS === 'ios' || event.type === 'dismissed' || event.type === 'set') {
      setCurrentPicker(null);
      setShowPicker(false);
    }
  };

  const getDisplayFormat = () => {
    if (!value) return placeholder;
    switch (mode) {
      case 'date':
        return format(value, 'PPP');
      case 'time':
        return format(value, 'p');
      default:
        return format(value, 'PPP p');
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={handlePress} style={styles.input}>
        <Text style={styles.inputText}>{getDisplayFormat()}</Text>
        {mode === 'date' && <Pencil size={18} color={Colors.primary} />}
      </TouchableOpacity>
      {showPicker && currentPicker === 'date' && (
        <DateTimePicker
          testID="datePicker"
          value={value || new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
          accentColor={Platform.OS === 'ios' ? Colors.primary : undefined}
          textColor={Platform.OS === 'ios' ? Colors.primary : undefined}
        />
      )}
      {showPicker && currentPicker === 'time' && (
        <DateTimePicker
          testID="timePicker"
          value={value || new Date()}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={onTimeChange}
          accentColor={Platform.OS === 'ios' ? Colors.primary : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    justifyContent: 'space-between',
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
  },
});

export default CustomDateTimePicker;
