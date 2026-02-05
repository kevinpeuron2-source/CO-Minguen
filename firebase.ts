import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ REMPLACEZ CES VALEURS PAR CELLES DE VOTRE CONSOLE FIREBASE
const firebaseConfig = {
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT_ID.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT_ID.appspot.com",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

let app;
let db = null;

// Initialisation sécurisée : ne plante pas l'appli si les clés ne sont pas là
try {
  if (firebaseConfig.apiKey !== "VOTRE_API_KEY") {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("Firebase connecté ✅");
  } else {
    console.warn("Clés Firebase non configurées. Mode hors-ligne (LocalStorage) activé 💾");
  }
} catch (e) {
  console.error("Erreur d'initialisation Firebase:", e);
}

export { db };