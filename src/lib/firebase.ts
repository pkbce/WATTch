import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDLUC4aMBsSNiOxCCQI9Kxcjx5y_z_4JSo",
  authDomain: "wattch-52370.firebaseapp.com",
  databaseURL: "https://wattch-52370-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "wattch-52370",
  storageBucket: "wattch-52370.firebasestorage.app",
  messagingSenderId: "969151073885",
  appId: "1:969151073885:web:3ec56de0eb453093a0c7b4"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
