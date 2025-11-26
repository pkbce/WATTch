import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDYdYrJfqNeJUZONpuo9mgHUC_tuzBH1pY",
  authDomain: "studio-3933529383-9c91e.firebaseapp.com",
  databaseURL: "https://studio-3933529383-9c91e-default-rtdb.firebaseio.com",
  projectId: "studio-3933529383-9c91e",
  storageBucket: "studio-3933529383-9c91e.firebasestorage.app",
  messagingSenderId: "200636545700",
  appId: "1:200636545700:web:f88057a7a2ec801f520431"
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
