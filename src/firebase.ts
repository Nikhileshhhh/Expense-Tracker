// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAdsu4RCnJj83jFekvxnJoeW8NsBl5r4H0",
  authDomain: "finance-manager-app-839a1.firebaseapp.com",
  projectId: "finance-manager-app-839a1",
  storageBucket: "finance-manager-app-839a1.firebasestorage.app",
  messagingSenderId: "491966993352",
  appId: "1:491966993352:web:f47d880762f1fcac6666fd",
  measurementId: "G-6RWF3WKSNN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Disable Firestore offline persistence (force in-memory cache)
initializeFirestore(app, { localCache: memoryLocalCache() });

// Initialize Firebase services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app; 