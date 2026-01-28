// import { Request, Response, NextFunction } from 'express';
// import { kemetMartService } from '@services/kemetMart.service';
// import type { paths } from '../types/api';
// import { ApiError } from '@utils/ApiError';
// import type { DomainError } from '../types/domain-error.type';

// // // Controller-local type aliases for OpenAPI types
// // type GetProductsQuery = NonNullable<paths["/kemet-mart/products"]["get"]>["parameters"];
// // type GetProductsRes = NonNullable<paths["/kemet-mart/products"]["get"]>["responses"]["200"]["content"]["application/json"];

// // type GetCartRes = NonNullable<paths["/kemet-mart/cart"]["get"]>["responses"]["200"]["content"]["application/json"];
// // type CheckoutRes = NonNullable<paths["/kemet-mart/checkout"]["post"]>["responses"]["200"]["content"]["application/json"];

// export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
// 	// Use query params directly, since OpenAPI types don't define them
// 	const page = req.query.page ? Number(req.query.page) : 1;
// 	const limit = req.query.limit ? Number(req.query.limit) : 20;

// 	const result = await kemetMartService.getProducts(page, limit);

// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}

// 	// Explicitly map to OpenAPI type
// 	const value = result.value as any;
// 	const payload: GetProductsRes = {
// 		data: value.data?.map((item: any) => ({
// 			productId: item.productId ?? item.id ?? '',
// 			name: item.name ?? '',
// 			price: item.price ?? 0,
// 			// add other fields as required by your OpenAPI Product schema
// 		})),
// 		pagination: {
// 			page: value.pagination?.page ?? page,
// 			limit: value.pagination?.limit ?? limit,
// 			total: value.pagination?.total ?? 0,
// 		},
// 	};
// 	res.json(payload);
// };

// export const getCart = async (req: Request, res: Response, next: NextFunction) => {
// 	const userId = req.user!.id;
// 	const result = await kemetMartService.getCart(userId);
// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}
// 	const payload: GetCartRes = result.value as GetCartRes;
// 	res.status(200).json(payload);
// };

// export const checkout = async (req: Request, res: Response, next: NextFunction) => {
// 	const userId = req.user!.id;
// 	const result = await kemetMartService.checkout(userId);
// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}
// 	const payload: CheckoutRes = result.value as CheckoutRes;
// 	res.status(200).json(payload);
// };

// export const addToCart = async (req: Request, res: Response, next: NextFunction) => {
// 	const userId = req.user!.id;
// 	const result = await kemetMartService.addToCart(userId, req.body.id);
// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}
// 	const payload: GetCartRes = result.value as GetCartRes;
// 	res.status(200).json(payload);
// };

// export const updateItemQuantity = async (req: Request, res: Response, next: NextFunction) => {
// 	const userId = req.user!.id;
// 	const productId = req.params.id;
// 	const { op } = req.body;
// 	const result = op === 'inc'
// 		? await kemetMartService.incrementCartItem(userId, productId)
// 		: await kemetMartService.decrementCartItem(userId, productId);
// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}
// 	const payload: GetCartRes = result.value as GetCartRes;
// 	res.status(200).json(payload);
// };

// export const removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
// 	const userId = req.user!.id;
// 	const productId = req.params.id;
// 	const result = await kemetMartService.removeFromCart(userId, productId);
// 	if (!result.ok) {
// 		const err = result.error as DomainError;
// 		let apiError;
// 		switch (err.type) {
// 			case 'NotFound':
// 				apiError = new ApiError(404, err.message);
// 				break;
// 			case 'Conflict':
// 				apiError = new ApiError(409, err.message);
// 				break;
// 			default:
// 				apiError = new ApiError(500, err.message || 'Internal Server Error');
// 		}
// 		return next(apiError);
// 	}
// 	const payload: GetCartRes = result.value as GetCartRes;
// 	res.status(200).json(payload);
// };