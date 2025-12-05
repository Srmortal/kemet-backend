import admin from 'firebase-admin';
import path from 'path';

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
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const sa = require(path.resolve(serviceAccountPath));
    const saProjectId: string | undefined = sa.project_id;

    // Help Google APIs detect project context
    if (saProjectId) {
      if (!process.env.GOOGLE_CLOUD_PROJECT) process.env.GOOGLE_CLOUD_PROJECT = saProjectId;
      if (!process.env.GCLOUD_PROJECT) process.env.GCLOUD_PROJECT = saProjectId;
      // Provide FIREBASE_CONFIG for SDKs that read it
      if (!process.env.FIREBASE_CONFIG) process.env.FIREBASE_CONFIG = JSON.stringify({ projectId: saProjectId });
    }
    // Point GOOGLE_APPLICATION_CREDENTIALS to the JSON file for downstream libraries
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
    // Fallback to default (will require GOOGLE_APPLICATION_CREDENTIALS env)
    admin.initializeApp();
  }
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
