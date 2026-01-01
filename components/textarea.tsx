
import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

const Textarea = React.forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
  return (
    <TextInput
      style={[styles.textarea, style]}
      ref={ref}
      multiline
      placeholderTextColor="#999"
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

const styles = StyleSheet.create({
  textarea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    width: '100%',
    minHeight: 100,
    textAlignVertical: 'top',
  },
});

export { Textarea };
export default Textarea;
