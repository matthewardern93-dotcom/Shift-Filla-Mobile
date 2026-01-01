import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Colors } from '../constants/colors';
import { X } from 'lucide-react-native';

interface StripeOnboardingModalProps {
  isVisible: boolean;
  onClose: () => void;
  userType: 'venue' | 'worker';
}

const StripeOnboardingModal = ({ isVisible, onClose, userType }: StripeOnboardingModalProps) => {
  const title = "Connect your Stripe Account";
  const message = userType === 'venue'
    ? "To post shifts and pay workers, you need to connect a Stripe account. This allows us to securely handle all payments."
    : "To get paid for your shifts, you need to connect a Stripe account. Your earnings will be deposited directly into your bank account via Stripe.";

  const handleConnectStripe = () => {
    // This is a placeholder for the full Stripe Connect onboarding flow.
    // In a real implementation, you would generate a unique link on your server
    // for each user to ensure security and proper account linking.
    const placeholderStripeLink = 'https://stripe.com/connect/oauth/authorize?response_type=code&client_id=ca_1234&scope=read_write';
    
    console.log("Redirecting to placeholder Stripe Connect link...");
    Linking.openURL(placeholderStripeLink).catch(err => console.error("Couldn't load page", err));

    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalText}>{message}</Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectStripe}
          >
            <Text style={styles.connectButtonText}>Connect to Stripe</Text>
          </TouchableOpacity>
           <Text style={styles.infoText}>
            You will be redirected to Stripe to create or connect your account. This is a required step to use the platform.
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 25,
    textAlign: 'center',
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  connectButton: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 30,
    elevation: 2,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
  infoText: {
      fontSize: 12,
      color: Colors.gray,
      textAlign: 'center',
      marginTop: 15,
  }
});

export default StripeOnboardingModal;