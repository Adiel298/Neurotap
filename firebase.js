// firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4krwLdtZ1axVU9ioM7WutZqtUbJEN6Gg",
  authDomain: "neurotap-c9649.firebaseapp.com",
  databaseURL: "https://neurotap-c9649.firebaseio.com", // <-- use your Realtime DB URL here
  projectId: "neurotap-c9649",
  storageBucket: "neurotap-c9649.appspot.com",
  messagingSenderId: "505876683169",
  appId: "1:505876683169:web:3b3923533f5cbe7f6a93e0",
  measurementId: "G-K9ZDJT2HWN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export Realtime Database
export const db = getDatabase(app);
