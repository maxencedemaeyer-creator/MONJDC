import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import firebaseAppletConfig from '../../firebase-applet-config.json';

const config = {
  apiKey: firebaseAppletConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseAppletConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: firebaseAppletConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: firebaseAppletConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: firebaseAppletConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseAppletConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const databaseId = firebaseAppletConfig.firestoreDatabaseId || '(default)';

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

try {
  app = getApps().length === 0 ? initializeApp(config) : getApps()[0];
  db = databaseId && databaseId !== '(default)' ? getFirestore(app, databaseId) : getFirestore(app);
  auth = getAuth(app);
  console.info('🔥 Firebase Firestore initialisé avec succès pour MonJDC | Projet:', config.projectId, '| DB:', databaseId);
} catch (error) {
  console.error('Erreur initialisation Firebase:', error);
  // Fallback
  app = getApps()[0];
  db = getFirestore(app);
  auth = getAuth(app);
}

export const isFirebaseConfigured = Boolean(config.apiKey && config.projectId);
export const currentProjectId = config.projectId;
export const currentDatabaseId = databaseId;

export { app, db, auth };
