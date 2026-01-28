// import type { DomainError } from '../types/domain-error.type';
// import { qrCodeForBooking } from '@utils/qr';
// import logger from '@utils/logger';
// import { ok, err } from '../types/result.types';
// import type { Result } from '../types/result.types';
// import { getHotelById, getRoomsForHotel } from '@utils/mockHotelsGenerator';
// import { FirestoreOrm } from '../infrastructure/firestore/firestoreOrm';
// import { HotelBooking } from '@models/hotelBooking.model';
// // DTOs removed; use plain object shapes

// const hotelBookingOrm = FirestoreOrm.fromModel(HotelBooking);

// /**
//  * Service for hotel bookings.
//  */
// class HotelBookingService {

//   /**
//    * Create a new hotel booking.
//    * @param params - Booking parameters
//    * @returns Result containing the created booking or error
//    */
//   async createBooking(params: {
//     userId: string;
//     hotelId: string;
//     roomId: string;
//     checkIn: string;
//     checkOut: string;
//     guests: number;
//     guestName: string;
//     guestEmail: string;
//     guestPhone: string;
//     specialRequests?: string;
//   }): Promise<Result<{
//     id: string;
//     hotelId: string;
//     roomId: string;
//     checkIn: string;
//     checkOut: string;
//     guestName: string;
//     guestEmail: string;
//     guestPhone: string;
//     guests: number;
//     status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
//     createdAt: string;
//     updatedAt: string;
//     pricePerNight: number;
//     nights: number;
//     subtotal: number;
//     serviceFee: number;
//     discountPercent: number;
//     discountAmount: number;
//     totalPrice: number;
//     qrCode: string;
//     paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
//     paymentMethod: 'card' | 'cash' | 'wallet' | 'bank_transfer';
//     paymentTransactionId?: string;
//     paymentAmount?: number;
//     paymentCurrency: string;
//     paymentDate?: string;
//   }, DomainError>> {
//     try {
//       const {
//         userId,
//         hotelId,
//         roomId,
//         checkIn,
//         checkOut,
//         guests,
//         guestName,
//         guestEmail,
//         guestPhone,
//         specialRequests = '',
//       } = params;

//       // 1. Validate dates
//       const checkInDate = new Date(checkIn);
//       const checkOutDate = new Date(checkOut);
//       if (checkInDate >= checkOutDate) {
//         return err({ type: 'ValidationError', message: 'Check-out date must be after check-in date' });
//       }

//       // 2. Validate hotel and room exist in mock data
//       const extractNumeric = (id: string): number => {
//         const n = parseInt(String(id).replace(/\D/g, ''), 10);
//         return Number.isFinite(n) && n > 0 ? n : 1;
//       };

//       const hotelIdNum = extractNumeric(hotelId);
//       const hotel = getHotelById(hotelIdNum);
//       if (!hotel) {
//         return err({ type: 'NotFound', message: `Hotel with ID ${hotelId} not found` });
//       }

//       const rooms = getRoomsForHotel(hotelIdNum);
//       const roomIdNum = extractNumeric(roomId);
//       const room = rooms.find(r => r.id === roomIdNum);
//       if (!room) {
//         return err({ type: 'NotFound', message: `Room with ID ${roomId} not found for hotel ${hotelId}` });
//       }

//       // 3. Calculate nights
//       const nights = Math.ceil(
//         (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
//       );

//       // 4. Mock pricing (since no real hotel data exists yet)
//       const pricePerNight = 75 + Math.random() * 100; // Random price 75-175
//       const subtotal = pricePerNight * nights;
//       const serviceFee = Math.round(subtotal * 0.05); // 5% service fee
//       const discountPercent = 10;
//       const discountAmount = Math.round(subtotal * (discountPercent / 100));
//       const totalPrice = subtotal + serviceFee - discountAmount;

//       // 5. Create booking document
//       const now = new Date();
//       const newBooking: HotelBooking = {
//         id: '', // Add this line
//         userId,
//         hotelId,
//         roomId,
//         checkIn,
//         checkOut,
//         guests,
//         guestName,
//         guestEmail,
//         guestPhone,
//         specialRequests,
//         pricePerNight: Math.round(pricePerNight),
//         nights,
//         subtotal: Math.round(subtotal),
//         serviceFee,
//         discountPercent,
//         discountAmount,
//         totalPrice: Math.round(totalPrice),
//         paymentCurrency: 'EGP',
//         status: 'confirmed',
//         qrCode: qrCodeForBooking('temp'),
//         createdAt: now,
//         updatedAt: now,
//         paymentStatus: 'pending',
//         paymentMethod: 'card',
//       };

//       // 6. Save to Firestore using ORM
//       const created = await hotelBookingOrm.create(newBooking);

//       // 7. Update QR code with real booking ID
//       await hotelBookingOrm.update(created.id, {
//         qrCode: qrCodeForBooking(created.id),
//       });

//       // Map to CreateHotelBookingResponseDto
//       const response = {
//         id: created.id,
//         hotelId: created.hotelId,
//         roomId: created.roomId,
//         checkIn: created.checkIn,
//         checkOut: created.checkOut,
//         guestName: created.guestName,
//         guestEmail: created.guestEmail,
//         guestPhone: created.guestPhone,
//         guests: created.guests,
//         status: created.status as 'pending' | 'confirmed' | 'cancelled' | 'completed',
//         createdAt: (created.createdAt instanceof Date ? created.createdAt.toISOString() : String(created.createdAt)),
//         updatedAt: (created.updatedAt instanceof Date ? created.updatedAt.toISOString() : String(created.updatedAt)),
//         pricePerNight: created.pricePerNight,
//         nights: created.nights,
//         subtotal: created.subtotal,
//         serviceFee: created.serviceFee,
//         discountPercent: created.discountPercent,
//         discountAmount: created.discountAmount,
//         totalPrice: created.totalPrice,
//         qrCode: qrCodeForBooking(created.id),
//         paymentStatus: created.paymentStatus as 'pending' | 'paid' | 'failed' | 'refunded',
//         paymentMethod: created.paymentMethod as 'card' | 'cash' | 'wallet' | 'bank_transfer',
//         paymentTransactionId: created.paymentTransactionId,
//         paymentAmount: created.paymentAmount,
//         paymentCurrency: created.paymentCurrency,
//         paymentDate: created.paymentDate instanceof Date ? created.paymentDate.toISOString() : created.paymentDate,
//       };
//       return ok(response);
//     } catch (error) {
//       logger.error('Error creating hotel booking:', error);
//       return err({ type: 'Unknown', message: 'Failed to create booking' });
//     }
//   }

//   async getBookingConfirmation(bookingId: string): Promise<Result<{
//     hotelName: string;
//     roomType: string;
//     checkIn: string;
//     checkOut: string;
//     guests: number;
//     nights: number;
//     guestName: string;
//     guestEmail: string;
//     guestPhone: string;
//     specialRequests: string;
//     paymentCurrency: string;
//     nightlyRate: number;
//     subtotal: number;
//     serviceFee: number;
//     discountPercent: number;
//     discountAmount: number;
//     totalPaid: number;
//     qrCode: string;
//     cancellationPolicy: string;
//   }, DomainError>> {
//     try {
//       // 1. Fetch hotel booking document
//       const booking = await hotelBookingOrm.getById(bookingId);
//       if (!booking) {
//         return err({ type: 'NotFound', message: 'Hotel booking not found' });
//       }

//       // 2. Resolve hotel/room from mock generator (no Firestore dependency)
//       const extractNumeric = (id: string): number => {
//         const n = parseInt(String(id).replace(/\D/g, ''), 10);
//         return Number.isFinite(n) && n > 0 ? n : 1;
//       };

//       const hotelIdNum = extractNumeric(booking.hotelId);
//       const hotelGen = getHotelById(hotelIdNum);
//       // Compose confirmation response as per GetBookingConfirmationResponseDto
//       const hotelName = hotelGen?.name ?? 'Unknown Hotel';
//       const roomType = getRoomsForHotel(hotelIdNum).find(r => r.id === extractNumeric(booking.roomId))?.name ?? 'Standard Room';
//       const checkIn = booking.checkIn;
//       const checkOut = booking.checkOut;
//       const guests = (booking as HotelBooking).guests ?? 1;
//       const nights = booking.nights ?? 1;
//       const guestName = booking.guestName ?? '';
//       const guestEmail = booking.guestEmail ?? '';
//       const guestPhone = booking.guestPhone ?? '';
//       const specialRequests = (booking as HotelBooking).specialRequests ?? '';
//       const paymentCurrency = booking.paymentCurrency ?? 'EGP';
//       const nightlyRate = booking.pricePerNight ?? 0;
//       const subtotal = booking.subtotal ?? 0;
//       const serviceFee = booking.serviceFee ?? 0;
//       const discountPercent = booking.discountPercent ?? 0;
//       const discountAmount = booking.discountAmount ?? 0;
//       const totalPaid = booking.totalPrice ?? 0;
//       const qrCode = booking.qrCode ?? qrCodeForBooking(bookingId);
//       const cancellationPolicy = 'Free cancellation until 24 hours before check-in';

//       const confirmation = {
//         hotelName,
//         roomType,
//         checkIn,
//         checkOut,
//         guests,
//         nights,
//         guestName,
//         guestEmail,
//         guestPhone,
//         specialRequests,
//         paymentCurrency,
//         nightlyRate,
//         subtotal,
//         serviceFee,
//         discountPercent,
//         discountAmount,
//         totalPaid,
//         qrCode,
//         cancellationPolicy,
//       };
//       return ok(confirmation);

//       // (Legacy/duplicate code removed; only correct DTO-based response is returned above)
//     } catch (error) {
//       logger.error('Error fetching hotel booking confirmation:', error);
//       return err({ type: 'Unknown', message: 'Failed to retrieve booking confirmation' });
//     }
//   }
// }

// export const hotelBookingService = new HotelBookingService();