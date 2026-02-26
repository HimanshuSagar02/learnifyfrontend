import {getAuth, GoogleAuthProvider} from "firebase/auth"
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

const isDev = Boolean(import.meta.env.DEV);

// Firebase configuration for Learnify Platform
// Values from Firebase Console → Project Settings → Your apps
// IMPORTANT: Get the API key from Firebase Console, not from here
// The API key below might be invalid - use environment variable instead
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY || "AIzaSyCVDIYPWKVAyb8ZsNM6VL0l3eUGiX0T4u0",
  authDomain: import.meta.env.VITE_FIREBASE_AUTHDOMAIN || "learnify.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECTID || "learnify",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGEBUCKET || "learnify.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGINGSENDERID || "1046096417550",
  appId: import.meta.env.VITE_FIREBASE_APPID || "1:1046096417550:web:7bd27957c310b89924fd5f",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENTID || "G-PMVK5MGY9W"
};

// Validate API key format
if (firebaseConfig.apiKey && !firebaseConfig.apiKey.startsWith('AIzaSy')) {
  if (isDev) {
    console.warn("Firebase API key format looks incorrect. It should start with 'AIzaSy'.");
  }
}

// Initialize Firebase
let app, auth, provider, analytics;

try {
  // Validate API key before initializing
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "AIzaSyDummyKeyIfNotSet" || !firebaseConfig.apiKey.startsWith('AIzaSy')) {
    if (isDev) {
      console.error("Invalid Firebase API key. Please set VITE_FIREBASE_APIKEY in frontend/.env.");
    }
    throw new Error("Invalid Firebase API key");
  }
  
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
  
  // Add scopes for Google Sign-In
  provider.addScope('email');
  provider.addScope('profile');
  
  // Initialize Analytics (only in browser, not in SSR)
  if (typeof window !== 'undefined') {
    try {
      analytics = getAnalytics(app);
    } catch (analyticsError) {
      if (isDev) {
        console.warn("Firebase Analytics initialization failed:", analyticsError);
      }
      // Analytics is optional, continue without it
    }
  }
} catch (error) {
  if (isDev) {
    console.error("Firebase initialization error:", error);
  }
  
  // Create dummy objects to prevent crashes
  auth = null;
  provider = null;
  analytics = null;
}

export {auth, provider, analytics}
