import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDa69BMdPqvwMqvW2YQlMis1NrRmPhINBA",
  authDomain: "kwitter-website10.firebaseapp.com",
  projectId: "kwitter-website10",
  storageBucket: "kwitter-website10.firebasestorage.app",
  messagingSenderId: "178419559592",
  appId: "1:178419559592:web:d924b3904d27e96686669d"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
