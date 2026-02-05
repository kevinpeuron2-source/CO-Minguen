import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// @ts-ignore: Accès safe aux variables d'environnement Vite sans forcer les types
const env = import.meta.env || {};

// Utilisation des variables d'environnement pour Vercel/Vite
// Si les variables ne sont pas définies, on utilise des valeurs fictives pour éviter le crash au démarrage
// L'application basculera automatiquement en mode "Hors-ligne" via le hook useOrientation.
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || "demo-key",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000",
  appId: env.VITE_FIREBASE_APP_ID || "1:000000000:web:0000000000"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);