// import { Request, Response, NextFunction } from 'express';
// import { FirebaseAdminService } from '@services/firebase-admin.service';
// import { asyncHandler } from '@utils/asyncHandler';
// import { parseIntParam } from '@utils/param';
// import type { components } from '../types/api';
// import { ActionCodeSettings } from 'firebase-admin/auth';

// const firebaseAdminService = new FirebaseAdminService();

// // Controller-local type aliases for OpenAPI types
// type CreateUserReq = components["schemas"]["CreateUserRequest"];
// type CreateUserRes = components["schemas"]["CreateUserResponse"];
// type CreateCustomTokenReq = { uid: string; claims?: Record<string, unknown> };
// type CreateCustomTokenRes = { token: string };
// type UserRes = components["schemas"]["User"];
// type ListUsersRes = components["schemas"]["User"][];
// type UpdateUserReq = { email: string };
// type UpdateUserRes = { uid: string };
// type SetClaimsReq = { claims: Record<string, unknown> };
// type SetClaimsRes = { success: boolean };
// type RevokeTokensRes = { success: boolean };
// type ActionCodeSettingsS = components["schemas"]["ActionCodeSettings"];
// type GenerateLinkReq = { email: string; actionCodeSettings?: Partial<ActionCodeSettingsS> };
// type GenerateLinkRes = { link: string };
// type FirestoreDocRes = components["schemas"]["FirestoreDocument"];
// type FirestoreSetReq = components["schemas"]["FirestoreSetRequest"];
// type FirestoreSetRes = components["schemas"]["FirestoreSetResponse"];
// type FirestoreQueryReq = components["schemas"]["FirestoreQueryRequest"];
// type FirestoreQueryRes = components["schemas"]["FirestoreQueryResult"][];

// export class FirebaseAdminController {
//   createUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const body = req.body as CreateUserReq;
//     const result = await firebaseAdminService.createUser(body);

//     if (!result.ok) return next(result.error);

//     const user = result.value;
//     const payload: CreateUserRes = {
//       uid: user.uid,
//       email: user.email,
//       displayName: user.displayName,
//       emailVerified: user.emailVerified,
//     };
//     res.status(201).json(payload);
//   });

//   createCustomToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const body = req.body as CreateCustomTokenReq;
//     const result = await firebaseAdminService.createCustomToken(body.uid, body.claims);

//     if (!result.ok) return next(result.error);

//     const payload: CreateCustomTokenRes = { token: result.value };
//     res.status(200).json(payload);
//   });

//   getUserByUid = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const uid = String(req.params.uid);
//     const result = await firebaseAdminService.getUserByUid(uid);

//     if (!result.ok) return next(result.error);

//     const user = result.value;
//     const payload: UserRes = {
//       uid: user.uid,
//       email: user.email ?? '',
//       displayName: user.displayName ?? '',
//       emailVerified: user.emailVerified ?? false,
//       // add other User fields as needed
//     };
//     res.status(200).json(payload);
//   });

//   getUserByEmail = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const email = String(req.params.email);
//     const result = await firebaseAdminService.getUserByEmail(email);

//     if (!result.ok) return next(result.error);

//     const user = result.value;
//     const payload: UserRes = {
//       uid: user.uid,
//       email: user.email ?? '',
//       displayName: user.displayName ?? '',
//       emailVerified: user.emailVerified ?? false,
//       // add other User fields as needed
//     };
//     res.status(200).json(payload);
//   });

//   listUsers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const limit = parseIntParam(req.query.limit, 100, { min: 1, max: 1000 });
//     const pageToken = req.query.pageToken as string | undefined;
//     const result = await firebaseAdminService.listUsers(limit, pageToken);

//     if (!result.ok) return next(result.error);

//     // Ensure result.value is an array of UserRes
//     const payload: ListUsersRes = Array.isArray(result.value)
//       ? result.value.map((user: UserRes) => ({
//           uid: user.uid,
//           email: user.email ?? '',
//           displayName: user.displayName ?? '',
//           emailVerified: user.emailVerified ?? false,
//         }))
//       : [];
//     res.status(200).json(payload);
//   });

//   updateUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const uid = String(req.params.uid);
//     const body = req.body as UpdateUserReq;
//     const result = await firebaseAdminService.updateUser(uid, body);

//     if (!result.ok) return next(result.error);

//     const payload: UpdateUserRes = { uid: result.value.uid };
//     res.status(200).json(payload);
//   });

//   deleteUser = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const uid = String(req.params.uid);
//     const result = await firebaseAdminService.deleteUser(uid);

//     if (!result.ok) return next(result.error);

//     res.status(204).send();
//   });

//   setCustomClaims = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const uid = String(req.params.uid);
//     const body = req.body as SetClaimsReq;
//     const result = await firebaseAdminService.setCustomClaims(uid, body.claims);

//     if (!result.ok) return next(result.error);

//     const payload: SetClaimsRes = { success: true };
//     res.status(200).json(payload);
//   });

//   revokeRefreshTokens = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const uid = String(req.params.uid);
//     const result = await firebaseAdminService.revokeRefreshTokens(uid);

//     if (!result.ok) return next(result.error);

//     const payload: RevokeTokensRes = { success: true };
//     res.status(200).json(payload);
//   });

//   generateEmailVerificationLink = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const body = req.body as GenerateLinkReq;
//     // Only pass actionCodeSettings if it is defined and has a required 'url' property
//     const actionCodeSettings =
//       body.actionCodeSettings && typeof body.actionCodeSettings.url === 'string'
//         ? (body.actionCodeSettings as ActionCodeSettings)
//         : undefined;
//     const result = await firebaseAdminService.generateEmailVerificationLink(body.email, actionCodeSettings);

//     if (!result.ok) return next(result.error);

//     const payload: GenerateLinkRes = { link: result.value.link };
//     res.status(200).json(payload);
//   });

//   generatePasswordResetLink = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const body = req.body as GenerateLinkReq;
//     // Only pass actionCodeSettings if it is defined and has a required 'url' property
//     const actionCodeSettings =
//       body.actionCodeSettings && typeof body.actionCodeSettings.url === 'string'
//         ? (body.actionCodeSettings as ActionCodeSettings)
//         : undefined;
//     const result = await firebaseAdminService.generatePasswordResetLink(body.email, actionCodeSettings);

//     if (!result.ok) return next(result.error);

//     const payload: GenerateLinkRes = { link: result.value.link };
//     res.status(200).json(payload);
//   });

//   getDocument = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const collection = String(req.params.collection);
//     const docId = String(req.params.docId);
//     const result = await firebaseAdminService.getDocument(collection, docId);

//     if (!result.ok) return next(result.error);

//     const payload: FirestoreDocRes = {
//       id: result.value.id,
//       data: result.value.data as Record<string, unknown>,
//     };
//     res.status(200).json(payload);
//   });

//   setDocument = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const collection = String(req.params.collection);
//     const docId = String(req.params.docId);
//     // Cast data.data to Record<string, unknown> to satisfy the service
//     const data = req.body as FirestoreSetReq;
//     const result = await firebaseAdminService.setDocument(
//       collection,
//       docId,
//       data.data as Record<string, unknown>
//     );

//     if (!result.ok) return next(result.error);

//     const payload: FirestoreSetRes = { id: result.value.id };
//     res.status(200).json(payload);
//   });

//   queryCollection = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const collection = String(req.params.collection);
//     const body = req.body as FirestoreQueryReq;
//     // Ensure body.query is an array of filters or undefined
//     const filters = Array.isArray(body.query) ? body.query : undefined;
//     const result = await firebaseAdminService.queryCollection(collection, filters);

//     if (!result.ok) return next(result.error);

//     // Ensure result.value is an array of FirestoreQueryRes
//     const payload: FirestoreQueryRes = Array.isArray(result.value)
//       ? result.value.map((doc: { id: string; data?: Record<string, unknown> }) => ({
//           id: doc.id,
//           data: doc.data ?? {},
//         }))
//       : [];
//     res.status(200).json(payload);
//   });

//   deleteDocument = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//     const collection = String(req.params.collection);
//     const docId = String(req.params.docId);
//     const result = await firebaseAdminService.deleteDocument(collection, docId);

//     if (!result.ok) return next(result.error);

//     res.status(204).send();
//   });
// }
