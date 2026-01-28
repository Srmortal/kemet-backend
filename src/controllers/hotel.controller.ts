// import { Request, Response, NextFunction } from 'express';
// import { hotelService } from '@services/hotel.service';
// import { hotelBookingService } from '@services/hotel.booking.service';
// import { parseIntParam } from '@utils/param';
// import type { paths } from '../types/api';
// import { ApiError } from '@utils/ApiError';
// import type { DomainError } from '../types/domain-error.type';

// // // Controller-local type aliases for OpenAPI types
// // type GetHotelsQuery = NonNullable<paths["/hotels"]["get"]>["parameters"] extends { query: infer Q } ? Q : {};
// // type GetHotelsRes = NonNullable<paths["/hotels"]["get"]>["responses"]["200"]["content"]["application/json"];

// // type GetHotelDetailsParams = NonNullable<paths["/hotels/{id}"]["get"]>["parameters"] extends { path: infer P } ? P : {};
// // type GetHotelDetailsRes = NonNullable<paths["/hotels/{id}"]["get"]>["responses"]["200"]["content"]["application/json"];

// // type CreateHotelBookingReq = NonNullable<paths["/hotel-bookings"]["post"]>["requestBody"] extends { content: { "application/json": infer B } } ? B : {};
// // type CreateHotelBookingRes = NonNullable<paths["/hotel-bookings"]["post"]>["responses"]["201"]["content"]["application/json"];

// // type GetBookingConfirmationParams = NonNullable<paths["/hotel-bookings/{id}/confirmation"]["get"]>["parameters"] extends { path: infer P } ? P : {};
// // type GetBookingConfirmationRes = NonNullable<paths["/hotel-bookings/{id}/confirmation"]["get"]>["responses"]["200"]["content"]["application/json"];

// export const getHotels = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
// 	const page = parseIntParam(req.query.page, 1, { min: 1 });
// 	const limit = parseIntParam(req.query.limit, 10, { min: 1, max: 1000 });

// 	const result = await hotelService.getHotels(page, limit);

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

// 	// Map service result to OpenAPI type if needed
// 	const value = result.value as any;
// 	const payload: GetHotelsRes = {
// 		data: value.data,
// 		pagination: value.pagination,
// 	};
// 	res.json(payload);
// };

// export const getHotelDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
// 	const params = req.params as GetHotelDetailsParams;
// 	const hotelId = parseInt(params.id);

// 	const result = await hotelService.getHotelWithRooms(hotelId);

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

// 	const payload: GetHotelDetailsRes = result.value;
// 	res.json(payload);
// };

// export const getHotelRooms = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
// 	const hotelId = parseInt(req.params.id);

// 	const result = await hotelService.getHotelRooms(hotelId);

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

// 	res.json(result.value);
// };

// export const createHotelBooking = async (req: Request, res: Response, next: NextFunction) => {
// 	const body = req.body as CreateHotelBookingReq;

// 	const result = await hotelBookingService.createBooking({
// 		userId: req.user.id,
// 		hotelId: body.hotelId,
// 		roomId: body.roomId,
// 		checkIn: body.checkIn,
// 		checkOut: body.checkOut,
// 		guests: body.guests,
// 		guestName: body.guestName,
// 		guestEmail: body.guestEmail,
// 		guestPhone: body.guestPhone,
// 		specialRequests: body.specialRequests,
// 	});

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

// 	const payload: CreateHotelBookingRes = result.value;
// 	return res.status(201).json(payload);
// };

// export const getHotelBookingConfirmation = async (req: Request, res: Response, next: NextFunction) => {
// 	const params = req.params as GetBookingConfirmationParams;
// 	const result = await hotelBookingService.getBookingConfirmation(params.id);

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

// 	const payload: GetHotelBookingConfirmationRes = result.value;
// 	return res.status(200).json(payload);
// };