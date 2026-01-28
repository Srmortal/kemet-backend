// import { Router } from 'express';
// import { FirebaseAdminController } from '@controllers/firebase-admin.controller';
// import { requireAdmin } from '@middleware/authorize';
// import { firebaseAuth } from '@middleware/firebaseAuth';

// const router = Router();
// router.use(firebaseAuth);
// router.use(requireAdmin);
// const adminController = new FirebaseAdminController();

// // User management
// router.post('/custom-token', adminController.createCustomToken);
// router.post('/users/create', adminController.createUser);
// router.get('/users', adminController.listUsers);
// router.get('/users/:uid', adminController.getUserByUid);
// router.get('/users/by-email/:email', adminController.getUserByEmail);
// router.patch('/users/:uid', adminController.updateUser);
// router.delete('/users/:uid', adminController.deleteUser);
// router.post('/users/:uid/claims', adminController.setCustomClaims);
// router.post('/users/:uid/revoke-tokens', adminController.revokeRefreshTokens);

// // Email actions
// router.post('/email-verification-link', adminController.generateEmailVerificationLink);
// router.post('/password-reset-link', adminController.generatePasswordResetLink);

// // Firestore operations
// router.get('/firestore/:collection/:docId', adminController.getDocument);
// router.put('/firestore/:collection/:docId', adminController.setDocument);
// router.post('/firestore/:collection/query', adminController.queryCollection);
// router.delete('/firestore/:collection/:docId', adminController.deleteDocument);

// export default router;
