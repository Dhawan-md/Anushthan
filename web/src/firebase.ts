import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBtvuGfkkFBPjJtYv20kYfqvX3e8mElJWw",
  authDomain: "anushthan-test-28ab7.firebaseapp.com",
  projectId: "anushthan-test-28ab7",
  storageBucket: "anushthan-test-28ab7.firebasestorage.app",
  messagingSenderId: "465717851273",
  appId: "1:465717851273:web:7ed0be2d117016d2f70258"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
