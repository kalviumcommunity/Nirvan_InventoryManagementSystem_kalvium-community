import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

/**
 * Firebase Client Configuration
 * Keys are loaded from Expo public environment variables (prefixed with EXPO_PUBLIC_).
 * You can set these in apps/mobile/.env
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Check if actual configuration values are present
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'your_api_key_here' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId !== 'your_project_id'
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    console.log('[Firebase] Successfully initialized with project:', firebaseConfig.projectId);
  } catch (error) {
    console.warn('[Firebase] Initialization error, falling back to mock mode:', error);
  }
} else {
  console.log('[Firebase] Running in Demo / Offline Fallback Mode. Provide keys in apps/mobile/.env to connect to live Firebase.');
}

export { app, auth };
