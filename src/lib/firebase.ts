import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

// Project credentials configured for jdc-max
export const firebaseConfig = {
  apiKey: firebaseAppletConfig.apiKey || "AIzaSyBOQacrdSd7SEq9EtTlRwdCcmsA61w9gD4",
  authDomain: firebaseAppletConfig.authDomain || "jdc-max.firebaseapp.com",
  projectId: firebaseAppletConfig.projectId || "jdc-max",
  storageBucket: firebaseAppletConfig.storageBucket || "jdc-max.firebasestorage.app",
  messagingSenderId: firebaseAppletConfig.messagingSenderId || "145717990141",
  appId: firebaseAppletConfig.appId || "1:145717990141:web:850cfca97b33a88c9c6494",
  measurementId: firebaseAppletConfig.measurementId || "G-XECJVHV5Q7",
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
  auth = getAuth(app);
  
  // Ensure local browser persistence is active so users stay logged in across sessions & refreshes
  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn('Persistance Firebase Auth locale:', err);
  });

  console.info('🔥 Firebase Firestore initialisé avec succès pour MonJDC | Projet:', firebaseConfig.projectId, '| DB:', databaseId);
} catch (error) {
  console.error('Erreur initialisation Firebase:', error);
  // Fallback
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
export const currentProjectId = firebaseConfig.projectId;
export const currentDatabaseId = databaseId;

export { app, db, auth };
