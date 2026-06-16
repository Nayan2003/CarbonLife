import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { Auth, getAuth } from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

// Firebase config — loaded from environment variables
// Local: .env.local | Production: .env.production (not committed to git)
const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db   = getFirestore(app);
} else {
  try {
    app  = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db   = getFirestore(app);
  } catch {
    app  = {} as FirebaseApp;
    auth = {} as Auth;
    db   = {} as Firestore;
  }
}

export { app, auth, db };

export const initAnalytics = async () => {
  if (typeof window === 'undefined') return null;
  const { getAnalytics, isSupported } = await import('firebase/analytics');
  if (await isSupported()) return getAnalytics(app);
  return null;
};

export default app;
