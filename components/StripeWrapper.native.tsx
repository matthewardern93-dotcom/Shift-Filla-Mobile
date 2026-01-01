
import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

const StripeWrapper = ({ children }) => {
  return (
    <StripeProvider
      publishableKey="pk_test_51O1fG6BBP3Bw4Yd2nNqvjY3j8B2u2yS2lJqK9c9D1c9T9x0f3n3v9Y8h2lF7b2f6O3v7e9z3v6d8k0j00f9B5d4C3"
    >
      {children}
    </StripeProvider>
  );
};

export default StripeWrapper;
