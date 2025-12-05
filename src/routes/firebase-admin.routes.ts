import { Router } from 'express';
import { FirebaseAdminController } from '../controllers/firebase-admin.controller';
import { firebaseAuth } from '../middleware/firebaseAuth';
import { adminAuth } from '../middleware/adminAuth';

const router = Router();
const adminController = new FirebaseAdminController();

// Admin routes use Firebase Admin SDK (server-to-server)
// Protected by firebaseAuth + adminAuth middleware
// Only users with admin custom claims can access these endpoints
router.use(firebaseAuth, adminAuth);

// User management
router.post('/custom-token', adminController.createCustomToken);
router.post('/users/create', adminController.createUser);
router.get('/users', adminController.listUsers);
router.get('/users/:uid', adminController.getUserByUid);
router.get('/users/by-email/:email', adminController.getUserByEmail);
router.patch('/users/:uid', adminController.updateUser);
router.delete('/users/:uid', adminController.deleteUser);
router.post('/users/:uid/claims', adminController.setCustomClaims);
router.post('/users/:uid/revoke-tokens', adminController.revokeRefreshTokens);

// Email actions
router.post('/email-verification-link', adminController.generateEmailVerificationLink);
router.post('/password-reset-link', adminController.generatePasswordResetLink);

// Firestore operations
router.get('/firestore/:collection/:docId', adminController.getDocument);
router.put('/firestore/:collection/:docId', adminController.setDocument);
router.post('/firestore/:collection/query', adminController.queryCollection);
router.delete('/firestore/:collection/:docId', adminController.deleteDocument);

export default router;
