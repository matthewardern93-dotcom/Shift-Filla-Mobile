
// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  FieldValue,
  getDoc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getStorage } from 'firebase/storage';


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
const messaging = null;

export {
  addDoc, app,
  auth,
  // Export Firestore/Functions features for use in services
  collection, db, doc, FieldValue, firebaseConfig, functions, getDoc, getDocs, httpsCallable, messaging, query, serverTimestamp, setDoc, storage, Timestamp, updateDoc, where
};

