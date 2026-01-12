
'use client';

import { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Loader2, Link2, X } from 'lucide-react-native';
import { Colors } from '../constants/colors';

interface StripeConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  userId: string;
  userType: 'worker' | 'venue';
}

export function StripeConnectModal({ isOpen, onClose, userEmail, userId, userType }: StripeConnectModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleStripeConnect = async () => {
    if (!userEmail || !userId) {
      console.error('User information is missing. Cannot connect to Stripe.');
      return;
    }
    setIsLoading(true);

    try {
      // 1. Create a Stripe Connect account for the user if it doesn't exist.
      const connectResponse = await fetch('/api/stripe/connect-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          email: userEmail,
          businessType: userType === 'worker' ? 'individual' : 'company',
        }),
      });

      if (!connectResponse.ok) {
        const errorData = await connectResponse.json();
        throw new Error(errorData.error || 'Failed to create Stripe account.');
      }
      
      // 2. Create a one-time account link for onboarding.
      const accountLinkResponse = await fetch('/api/stripe/account-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userId }),
      });
      
      if (!accountLinkResponse.ok) {
        const errorData = await accountLinkResponse.json();
        throw new Error(errorData.error || 'Failed to create Stripe onboarding link.');
      }

      const { url } = await accountLinkResponse.json();
      // 3. Redirect the user to Stripe.
      // In React Native, we would use Linking to open the URL
      // Linking.openURL(url);
      console.log('Redirecting to Stripe...', url);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Could not connect to Stripe. Please try again.';
      console.error(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onDismiss={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Kia Ora, Welcome to Shift Filla</Text>
          <Text style={styles.modalText}>
            {userType === 'worker'
              ? 'To receive payments for completed shifts, you must connect a Stripe account. This is a secure one-time setup.'
              : 'To post shifts and pay workers, you must connect a Stripe account. This ensures secure and reliable payments.'}
          </Text>
          <Text style={styles.infoText}>
            We are a new platform founded in Queenstown so please keep this in mind as we build up our presence in New Zealand.
          </Text>
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleStripeConnect}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Link2 size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.connectButtonText}>Connect with Stripe</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
      marginBottom: 15,
  }
});

export default StripeConnectModal;
