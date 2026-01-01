
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../constants/colors';

interface DateTimePickerProps {
  value: Date;
  onChange: (event: any, date?: Date) => void;
  placeholder: string;
}

const CustomDateTimePicker: React.FC<DateTimePickerProps> = ({ value, onChange, placeholder }) => {
  const [show, setShow] = useState(false);

  const showPicker = () => {
    setShow(true);
  };

  const onPickerChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios'); // Keep open on iOS
    if (selectedDate) {
      onChange(event, selectedDate);
    }
  };

  return (
    <View>
      <TouchableOpacity onPress={showPicker} style={styles.input}>
        <Text style={styles.inputText}>{
          value ? value.toLocaleString() : placeholder
        }</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={value || new Date()}
          mode="datetime"
          is24Hour={true}
          display="default"
          onChange={onPickerChange}
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
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 16,
    color: Colors.text,
  },
});

export default CustomDateTimePicker;
