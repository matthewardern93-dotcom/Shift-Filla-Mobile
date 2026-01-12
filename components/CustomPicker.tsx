
import React from 'react';
import { Picker } from '@react-native-picker/picker';
import { StyleSheet } from 'react-native';
import { Colors } from '../constants/colors';

interface PickerOption {
  label: string;
  value: string | number;
}

interface CustomPickerProps {
  selectedValue: string | number | null;
  onValueChange: (itemValue: string | number, itemIndex: number) => void;
  options: PickerOption[];
  placeholder?: string; // Made placeholder optional
}

const CustomPicker: React.FC<CustomPickerProps> = ({ selectedValue, onValueChange, options, placeholder }) => {
  // The underlying Picker's selectedValue prop expects `string | number | undefined`.
  // Our component's prop allows `null`. We convert `null` to `undefined` to bridge the types.
  const internalSelectedValue = selectedValue === null ? undefined : selectedValue;

  return (
    <Picker
      selectedValue={internalSelectedValue}
      onValueChange={onValueChange}
      style={styles.picker}
    >
      {/* The placeholder's value cannot be null. We use an empty string as a convention for an unselected state.
          This also means that selecting the placeholder will set the form value to "".
      */}
      {placeholder && <Picker.Item label={placeholder} value="" color={Colors.gray} />}
      {options.map((option) => (
        <Picker.Item key={option.value} label={option.label} value={option.value} />
      ))}
    </Picker>
  );
};

const styles = StyleSheet.create({
  picker: {
    height: 50,
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
});

export { CustomPicker };
