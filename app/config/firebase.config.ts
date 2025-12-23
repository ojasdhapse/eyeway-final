import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDrdpDcYYohButrfEyBNDZ7gPICITl3nNg",
    authDomain: "eyeway-6d6e7.firebaseapp.com",
    projectId: "eyeway-6d6e7",
    storageBucket: "eyeway-6d6e7.firebasestorage.app",
    messagingSenderId: "1020797990754",
    appId: "1:1020797990754:web:b025d58829d7b7af211e3b",
    measurementId: "G-FX56EES4CZ"
  };

// Initialize Firebase app - ensure it's only initialized once
let firebaseApp: FirebaseApp;
const existingApps = getApps();
if (existingApps.length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = existingApps[0];
}

// Get Auth instance - explicitly use the initialized app
const auth: Auth = getAuth(firebaseApp);
const db: Firestore = getFirestore(firebaseApp);

export { auth, db, firebaseApp };

