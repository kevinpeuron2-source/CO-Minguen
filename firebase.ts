import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Configuration Firebase pour Minguen Orientation
const firebaseConfig = {
  apiKey: "AIzaSyAWGzlBntlgoFRxQ5rvD_bV5z4a_UVIpgI",
  authDomain: "course-d-orientation-50a1c.firebaseapp.com",
  projectId: "course-d-orientation-50a1c",
  storageBucket: "course-d-orientation-50a1c.firebasestorage.app",
  messagingSenderId: "510465556577",
  appId: "1:510465556577:web:a8cc752b28eb102aaf6a20"
};

const app = initializeApp(firebaseConfig);
// Initialisation et export de la base de données Firestore
export const db = getFirestore(app);