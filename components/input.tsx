
import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

const Input = React.forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
  return (
    <TextInput
      style={[styles.input, style]}
      ref={ref}
      placeholderTextColor="#999"
      {...props}
    />
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    width: '100%',
  },
});

export { Input };
export default Input;
