import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';

// Configuration officielle directe et statique (garantie sans variable undefined sur Vercel/Vite)
export const firebaseConfig = {
  apiKey: "AIzaSyBOQacrdSd7SEq9EtTlRwdCcmsA61w9gD4",
  authDomain: "jdc-max.firebaseapp.com",
  projectId: "jdc-max",
  storageBucket: "jdc-max.firebasestorage.app",
  messagingSenderId: "145717990141",
  appId: "1:145717990141:web:850cfca97b33a88c9c6494",
  measurementId: "G-XECJVHV5Q7",
};

// Initialisation unique en Singleton
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

db = getFirestore(app);
auth = getAuth(app);

// Activer la persistance locale du navigateur
try {
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Persistance Firebase locale:', err);
  });
} catch (e) {
  console.warn('Configuration persistance:', e);
}

export const isFirebaseConfigured = true;
export const currentProjectId = firebaseConfig.projectId;
export const currentDatabaseId = '(default)';

export { app, db, auth };
