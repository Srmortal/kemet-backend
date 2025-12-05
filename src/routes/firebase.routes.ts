import { Router } from 'express';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { UserService } from '../services/user.service';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { firebaseAdmin } from '../config/firebase';

// Dedicated Firebase-related routes (authentication + test utilities)
// These routes rely on Firebase ID tokens verified by firebaseAuth middleware.

const router = Router();
const userService = new UserService();
const adminService = new FirebaseAdminService();

// Firebase login: generate a Firebase custom token (no Authorization required)
// Accepts uid or email in the body. Optionally accepts additional claims.
router.post('/login', async (req, res, next) => {
  try {
    const { uid, email, password, displayName, claims } = req.body as {
      uid?: string;
      email?: string;
      password?: string;
      displayName?: string;
      claims?: Record<string, unknown>;
    };

    let targetUid = uid;
    let targetEmail = email;

    // If uid not provided, try to resolve via email
    if (!targetUid && targetEmail) {
      try {
        const user = await adminService.getUserByEmail(targetEmail);
        targetUid = user.uid;
        targetEmail = user.email ?? targetEmail;
      } catch (_e) {
        // If user not found and password provided, create user
        if (password) {
          const created = await adminService.createUser({ email: targetEmail, password, displayName });
          targetUid = created.uid;
          targetEmail = created.email ?? targetEmail;
        } else {
          return res.status(404).json({ success: false, message: 'User not found. Provide uid or email+password to create.' });
        }
      }
    }

    if (!targetUid) {
      return res.status(400).json({ success: false, message: 'Provide uid or email (with password to auto-create).' });
    }

    // Generate Firebase custom token (client must exchange for ID token)
    const customToken = await adminService.createCustomToken(targetUid, claims);

    // Ensure app user mapping exists
    const appUser = await userService.getOrCreateFromFirebase(targetUid, { email: targetEmail, name: displayName });

    return res.status(200).json({
      success: true,
      message: 'Custom token generated',
      data: { customToken, user: appUser },
    });
  } catch (err) {
    return next(err);
  }
});

// Test endpoint to return firebase claims and mapped app user
router.get('/test', firebaseAuth, async (req, res) => {
  const firebaseUser = req.firebaseUser as { uid: string; email?: string; name?: string } | undefined;
  if (!firebaseUser?.uid) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  const appUser = await userService.getOrCreateFromFirebase(firebaseUser.uid, {
    email: firebaseUser.email,
    name: firebaseUser.name,
  });
  return res.json({
    success: true,
    data: {
      firebase: firebaseUser,
      user: appUser,
    },
  });
});

// Debug endpoint to inspect Firebase Admin initialization (development only)
router.get('/debug', async (_req, res) => {
  try {
    const app = firebaseAdmin.app();
    return res.json({
      success: true,
      data: {
        appName: app.name,
        options: (app.options as unknown) ?? null,
        env: {
          GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
          GCLOUD_PROJECT: process.env.GCLOUD_PROJECT,
          GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS,
          FIREBASE_SERVICE_ACCOUNT_PATH: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
        },
      },
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: (e as Error).message });
  }
});

export default router;
