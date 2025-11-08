import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  try {
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
      console.log('Firebase Admin initialized with service account');
    } else {
      console.warn('Firebase service account not configured. Using default credentials or running in mock mode.');
      initializeApp({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'mock-project',
      });
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
    // Initialize with minimal config to prevent module loading errors
    try {
      initializeApp({
        projectId: 'fallback-project',
      });
    } catch (fallbackError) {
      console.error('Failed to initialize Firebase Admin with fallback config:', fallbackError);
    }
  }
}

let db: ReturnType<typeof getFirestore>;

try {
  db = getFirestore();
} catch (error) {
  console.error('Failed to get Firestore instance:', error);
  // Create a proxy that will throw errors when methods are called
  db = new Proxy({} as ReturnType<typeof getFirestore>, {
    get() {
      throw new Error('Firestore is not properly initialized. Check Firebase configuration.');
    }
  });
}

export { db };

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
