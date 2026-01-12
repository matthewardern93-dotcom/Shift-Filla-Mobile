
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  setDoc,
  Timestamp,
  FieldValue
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getMessaging } from 'firebase/messaging';


const firebaseConfig = {
  apiKey: "AIzaSyAerETfb1gU8Wj-k2Pl7l5mljAaWXCEdl0",
  authDomain: "shiftflow-femet.firebaseapp.com",
  projectId: "shiftflow-femet",
  storageBucket: "shiftflow-femet.appspot.com",
  messagingSenderId: "1067395211015",
  appId: "1:1067395211015:web:94f360482b0694d7e0efa2"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const functions = getFunctions(app);
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export {
  app,
  auth,
  db,
  storage,
  functions,
  messaging,
  firebaseConfig,
  // Export Firestore/Functions features for use in services
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  addDoc,
  setDoc,
  Timestamp,
  FieldValue,
  httpsCallable
};
