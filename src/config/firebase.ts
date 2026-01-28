import admin from 'firebase-admin';
import path from 'path';
import fs from 'fs'; // Import fs
import logger from '@utils/logger';

const FIREBASE_INIT_START = Date.now();

// Load from env
const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY;

// Handle escaped newlines if present
if (privateKey) {
  privateKey = privateKey.replace(/\\n/g, '\n');
}


// Initialize only once
if (!admin.apps.length) {
  if (serviceAccountPath) {
    // Using JSON file path
    const resolvedPath = path.resolve(serviceAccountPath);

    // Security: Only allow reading from trusted paths (e.g., restrict to a specific directory)
    // const allowedDir = path.resolve(process.cwd(), 'config/keys');
    // if (!resolvedPath.startsWith(allowedDir)) {
    //   throw new Error('Service account path is not allowed.');
    // }

    // Use fs.readFileSync and JSON.parse to load JSON dynamically
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    const sa = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const saProjectId: string | undefined = sa.project_id;
    if (saProjectId) {
      if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = saProjectId;
      if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = saProjectId;
      if (!process.env.FIREBASE_CONFIG) process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: saProjectId });
    }
    const resolved = path.resolve(serviceAccountPath);
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) process.env.GOOGLE_APPLICATION_CREDENTIALS = resolved;
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId: saProjectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${saProjectId}.appspot.com`,
    });
  } else if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
      projectId,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  } else {
    admin.initializeApp();
  }
}

// --- Firestore Emulator Auto-Connect for Tests ---
const isTest = process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined;
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || (isTest ? 'localhost:8080' : undefined);
if (emulatorHost) {
  process.env.FIRESTORE_EMULATOR_HOST = emulatorHost;
  logger.info(`✓ Firestore emulator env set at ${emulatorHost}`);
}

const firebaseInitTime = Date.now() - FIREBASE_INIT_START;
globalThis.FIREBASE_INIT_TIME = firebaseInitTime;

if (firebaseInitTime > 1000) {
  logger.warn(`⚠️  Firebase initialization took ${firebaseInitTime}ms (expected <1000ms)`);
} else {
  logger.info(`✓ Firebase initialized in ${firebaseInitTime}ms`);
}

export const firebaseAdmin = admin;

export async function verifyIdToken(idToken: string) {
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    return decoded; // contains uid and other claims
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid Firebase ID token';
    throw new Error(message);
  }
}
