
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check } from 'lucide-react-native';

interface CheckboxProps {
  checked: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({ checked }) => {
  return (
    <View style={[styles.container, checked && styles.checkedContainer]}>
      {checked && <Check size={16} color="#fff" />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6A5AED',
    backgroundColor: 'transparent',
  },
  checkedContainer: {
    backgroundColor: '#6A5AED',
    borderColor: '#6A5AED',
  },
});

export { Checkbox };
export default Checkbox;
