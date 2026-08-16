// Re-export exact singleton instances from /src/firebase.ts
export {
  app,
  db,
  auth,
  firebaseConfig,
  isFirebaseConfigured,
  currentProjectId,
  currentDatabaseId,
} from '../firebase';
