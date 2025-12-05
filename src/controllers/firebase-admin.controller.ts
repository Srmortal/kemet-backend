import { Request, Response, NextFunction } from 'express';
import { FirebaseAdminService } from '../services/firebase-admin.service';
import { asyncHandler } from '../utils/asyncHandler';

const firebaseAdminService = new FirebaseAdminService();

/**
 * Controller for Firebase Admin operations
 * These endpoints demonstrate server-side Firebase capabilities
 */
export class FirebaseAdminController {
  /**
   * Create user
   * POST /api/firebase-admin/users/create
   */
  createUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, password, displayName, emailVerified } = req.body as {
      email: string;
      password?: string;
      displayName?: string;
      emailVerified?: boolean;
    };

    const user = await firebaseAdminService.createUser({ email, password, displayName, emailVerified });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user },
    });
  });
  /**
   * Create custom token for a user
   * POST /api/firebase-admin/custom-token
   */
  createCustomToken = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid, claims } = req.body;
    const token = await firebaseAdminService.createCustomToken(uid, claims);
    
    res.status(200).json({
      success: true,
      message: 'Custom token created',
      data: { customToken: token },
    });
  });

  /**
   * Get user by UID
   * GET /api/firebase-admin/users/:uid
   */
  getUserByUid = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid } = req.params;
    const user = await firebaseAdminService.getUserByUid(uid);
    
    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * Get user by email
   * GET /api/firebase-admin/users/by-email/:email
   */
  getUserByEmail = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email } = req.params;
    const user = await firebaseAdminService.getUserByEmail(email);
    
    res.status(200).json({
      success: true,
      data: { user },
    });
  });

  /**
   * List users
   * GET /api/firebase-admin/users
   */
  listUsers = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const maxResults = req.query.limit ? parseInt(req.query.limit as string) : 100;
    const pageToken = req.query.pageToken as string | undefined;
    
    const result = await firebaseAdminService.listUsers(maxResults, pageToken);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Update user
   * PATCH /api/firebase-admin/users/:uid
   */
  updateUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid } = req.params;
    const properties = req.body;
    
    const user = await firebaseAdminService.updateUser(uid, properties);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user },
    });
  });

  /**
   * Delete user
   * DELETE /api/firebase-admin/users/:uid
   */
  deleteUser = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid } = req.params;
    const result = await firebaseAdminService.deleteUser(uid);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Set custom claims
   * POST /api/firebase-admin/users/:uid/claims
   */
  setCustomClaims = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid } = req.params;
    const { claims } = req.body;
    
    const result = await firebaseAdminService.setCustomClaims(uid, claims);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Revoke refresh tokens
   * POST /api/firebase-admin/users/:uid/revoke-tokens
   */
  revokeRefreshTokens = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { uid } = req.params;
    const result = await firebaseAdminService.revokeRefreshTokens(uid);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  });

  /**
   * Generate email verification link
   * POST /api/firebase-admin/email-verification-link
   */
  generateEmailVerificationLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, actionCodeSettings } = req.body;
    const result = await firebaseAdminService.generateEmailVerificationLink(email, actionCodeSettings);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Generate password reset link
   * POST /api/firebase-admin/password-reset-link
   */
  generatePasswordResetLink = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { email, actionCodeSettings } = req.body;
    const result = await firebaseAdminService.generatePasswordResetLink(email, actionCodeSettings);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  // Firestore endpoints
  /**
   * Get Firestore document
   * GET /api/firebase-admin/firestore/:collection/:docId
   */
  getDocument = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { collection, docId } = req.params;
    const doc = await firebaseAdminService.getDocument(collection, docId);
    
    res.status(200).json({
      success: true,
      data: doc,
    });
  });

  /**
   * Set Firestore document
   * PUT /api/firebase-admin/firestore/:collection/:docId
   */
  setDocument = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { collection, docId } = req.params;
    const data = req.body;
    
    const result = await firebaseAdminService.setDocument(collection, docId, data);
    
    res.status(200).json({
      success: true,
      data: result,
    });
  });

  /**
   * Query Firestore collection
   * POST /api/firebase-admin/firestore/:collection/query
   */
  queryCollection = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { collection } = req.params;
    const { filters } = req.body;
    
    const docs = await firebaseAdminService.queryCollection(collection, filters);
    
    res.status(200).json({
      success: true,
      data: { docs },
    });
  });

  /**
   * Delete Firestore document
   * DELETE /api/firebase-admin/firestore/:collection/:docId
   */
  deleteDocument = asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const { collection, docId } = req.params;
    const result = await firebaseAdminService.deleteDocument(collection, docId);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  });
}
