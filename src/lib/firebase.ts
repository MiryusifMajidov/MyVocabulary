import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBTDEFh60Y0Rbgdgz7L5qvTTfwF6tTU4_w",
  authDomain: "vocabulary-app-7fe34.firebaseapp.com",
  projectId: "vocabulary-app-7fe34",
  storageBucket: "vocabulary-app-7fe34.firebasestorage.app",
  messagingSenderId: "791241143324",
  appId: "1:791241143324:web:da37f567108608702b9bd9",
  measurementId: "G-4TMRJZ28JX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;