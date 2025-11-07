import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  let serviceAccount = undefined;

  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      // Remove surrounding single or double quotes if present
      const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY.trim().replace(/^['"]|['"]$/g, '');
      serviceAccount = JSON.parse(key);
    } catch (error) {
      console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
    }
  }

  if (serviceAccount) {
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } else {
    console.warn('Firebase service account not configured. Using default credentials.');
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
}

export const db = getFirestore();

// Enable settings for better performance (only once)
let settingsConfigured = false;
if (!settingsConfigured) {
  try {
    db.settings({
      ignoreUndefinedProperties: true,
    });
    settingsConfigured = true;
  } catch (error) {
    // Settings already configured, ignore
  }
}
