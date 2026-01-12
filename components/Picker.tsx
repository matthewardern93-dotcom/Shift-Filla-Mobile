import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, ScrollView, TouchableWithoutFeedback } from 'react-native';
import { ChevronDown, Check } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface PickerOption {
    label: string;
    value: string | number;
}

interface CustomPickerProps {
    options: PickerOption[];
    selectedValue: string | number | null;
    onValueChange: (value: string | number) => void;
    placeholder?: string;
    hasIcon?: boolean;
}

export const CustomPicker: React.FC<CustomPickerProps> = ({ options, selectedValue, onValueChange, placeholder, hasIcon }) => {
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelect = (value: string | number) => {
        onValueChange(value);
        setModalVisible(false);
    };

    const selectedLabel = options.find(option => option.value === selectedValue)?.label || placeholder;

    return (
        <View style={{flex: 1}}>
            <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                <Text style={[styles.buttonText, { color: selectedValue ? Colors.text : Colors.gray }]}>
                    {selectedLabel}
                </Text>
                {!hasIcon && <ChevronDown size={20} color={Colors.gray} />}
            </TouchableOpacity>
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <TouchableOpacity
                    style={styles.modalContainer}
                    activeOpacity={1}
                    onPressOut={() => setModalVisible(false)}
                >
                    <TouchableWithoutFeedback>
                        <View style={styles.modalContent}>
                            <ScrollView>
                                {options.map((option, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.option}
                                        onPress={() => handleSelect(option.value)}
                                    >
                                        <Text style={styles.optionText}>{option.label}</Text>
                                        {selectedValue === option.value && <Check color={Colors.primary} size={24} />}
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '100%',
        flex: 1,
    },
    buttonText: {
        fontSize: 16,
        flex: 1,
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 20,
        width: '80%',
        maxHeight: '60%',
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    optionText: {
        fontSize: 18,
        color: Colors.text,
    },
});
