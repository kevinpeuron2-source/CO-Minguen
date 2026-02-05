import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration Placeholder - Replace with your console values
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "minguen-orientation.firebaseapp.com",
  projectId: "minguen-orientation",
  storageBucket: "minguen-orientation.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);