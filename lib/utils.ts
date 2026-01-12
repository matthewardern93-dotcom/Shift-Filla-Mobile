import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

/**
 * Converts a serialized date/timestamp value from various formats into a JavaScript Date object.
 * This function safely handles:
 *  - Firestore Timestamp objects (or serialized objects with seconds/nanoseconds)
 *  - JavaScript Date objects
 *  - ISO 8601 date strings
 *  - Numeric timestamps (milliseconds since epoch)
 *
 * @param value The value to convert.
 * @returns A Date object, or null if the input is invalid or null.
 */
export const rehydrateDate = (value: any): Date | null => {
  if (!value) {
    return null;
  }

  // If it's already a Date object, return it.
  if (value instanceof Date) {
    return value;
  }

  // If it's a Firestore Timestamp object (or a serialized one), convert it.
  if (typeof value === 'object' && typeof value.seconds === 'number') {
    // This handles both genuine Timestamps and serialized ones
    return new firestore.Timestamp(value.seconds, value.nanoseconds || 0).toDate();
  }

  // If it's a numeric timestamp (milliseconds since epoch).
  if (typeof value === 'number') {
    return new Date(value);
  }

  // If it's a string, try to parse it.
  if (typeof value === 'string') {
    const date = new Date(value);
    // Check if the parsed date is valid.
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
};

/**
 * Converts a serialized date/timestamp value from various formats into a Firestore Timestamp object.
 *
 * @param value The value to convert.
 * @returns A Firestore Timestamp object, or null if the conversion fails.
 */
export const rehydrateTimestamp = (value: any): FirebaseFirestoreTypes.Timestamp | null => {
  const date = rehydrateDate(value);
  if (date) {
    return firestore.Timestamp.fromDate(date);
  }
  return null;
};
