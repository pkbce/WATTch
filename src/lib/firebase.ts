import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyC01aJFD58_r0RPcoxz7NaMOcoWy5OrHbo",
  authDomain: "wattch-48f16.firebaseapp.com",
  databaseURL: "https://wattch-48f16-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wattch-48f16",
  storageBucket: "wattch-48f16.firebasestorage.app",
  messagingSenderId: "212395242879",
  appId: "1:212395242879:web:64cce8a5f546bb53bcd64a",
  measurementId: "G-Z3RN72S0NV"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
