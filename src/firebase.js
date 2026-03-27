import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA9CQ5GFaUAKdhbActVya3oQw5QeZIxcL8",
  authDomain: "that-s-cap-party-game.firebaseapp.com",
  projectId: "that-s-cap-party-game",
  storageBucket: "that-s-cap-party-game.firebasestorage.app",
  messagingSenderId: "503087351957",
  appId: "1:503087351957:web:e1e9e46223b580344ab39c",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
