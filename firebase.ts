import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// @ts-ignore: Accès safe aux variables d'environnement Vite sans forcer les types
const env = import.meta.env || {};

// Configuration Firebase
// Les valeurs par défaut utilisent la clé fournie.
// REMARQUE : Pour une mise en production, assurez-vous que les autres valeurs (projectId, authDomain) 
// correspondent à votre projet Firebase réel.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAWGzlBntlgoFRxQ5rvD_bV5z4a_UVIpgI",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "minguen-orientation.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "minguen-orientation",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "minguen-orientation.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: env.VITE_FIREBASE_APP_ID || "1:000000000:web:0000000000"
};

const app = initializeApp(firebaseConfig);
// Initialisation et export de la base de données Firestore
export const db = getFirestore(app);