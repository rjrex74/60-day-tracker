import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// ⚠️ REPLACE THIS WITH Your FIREBASE CONFIG ⚠️
const firebaseConfig = {
  apiKey: "AIzaSyAwkmAICn9V9oHNd4W_q7HRCBlPhhxYMHY",
  authDomain: "daily-fit-d-app.firebaseapp.com",
  projectId: "daily-fit-d-app",
  storageBucket: "daily-fit-d-app.firebasestorage.app",
  messagingSenderId: "215059101432",
  appId: "1:215059101432:web:0268eefb5ee46e2bf2ad0d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = '60-day-tracker';
