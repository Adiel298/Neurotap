// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4krwLdtZ1axVU9ioM7WutZqtUbJEN6Gg",
  authDomain: "neurotap-c9649.firebaseapp.com",
  projectId: "neurotap-c9649",
  storageBucket: "neurotap-c9649.firebasestorage.app",
  messagingSenderId: "505876683169",
  appId: "1:505876683169:web:3b3923533f5cbe7f6a93e0",
  measurementId: "G-K9ZDJT2HWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Auth, Provider, and Firestore
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
