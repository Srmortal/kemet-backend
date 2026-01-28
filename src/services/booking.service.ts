import { generateTourismPrice } from '@utils/priceGenerator';
import { Booking } from '@models/booking.model';
// DTOs removed; use plain object shapes
import { sendBookingConfirmationEmail } from './email.service';
import logger from '@utils/logger';
import type { Result } from '../types/result.types';
import { ok, err } from '../types/result.types';
import type { DomainError } from '../types/domain-error.type';
import { bookingRepository } from '@repositories/booking.repository';

/**
 * Booking Service
 * 
 * Manages tourism booking operations including creation, retrieval, and confirmation.
 * Integrates with Firebase Firestore for persistence and email service for notifications.
 * All methods return Result<T> for explicit error handling.
 * 
 * Design notes:
 * - Prices are generated deterministically based on place governorate (not random)
 * - Confirmations are sent via email to the user immediately after booking
 * - All bookings are stored in the 'bookings' Firestore collection
 */
// Define the expected parameters for creating a booking
type CreateBookingParams = {
  userId: string;
  placeId: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  guests: number;
  specialRequests?: string;
};

class BookingService {

  /**
   * Create a new booking for a tourism place.
   * 
   * This method:
   * 1. Validates the tourism place exists
   * 2. Generates the booking price based on place location and guests count
   * 3. Creates a booking record in Firestore
   * 4. Sends a confirmation email to the user
   * 
   * @param params - Booking parameters
   * @param params.userId - User ID from Firebase Auth
   * @param params.placeId - ID of the tourism place to book
   * @param params.date - Booking date (YYYY-MM-DD)
   * @param params.time - Booking time (HH:mm)
   * @param params.guests - Number of guests
   * @param params.specialRequests - Optional special requests or notes
   * 
   * @returns Result containing the created booking with Firestore document ID, or error
   * 
   * @example
   * const result = await service.createBooking({
   *   userId: 'user123',
   *   placeId: 'place456',
   *   date: '2024-03-15',
   *   time: '10:00',
   *   guests: 4,
   *   specialRequests: 'Wheelchair accessible'
   * });
   * if (result.ok) {
   *   console.log('Booking ID:', result.value.id);
   * }
   */
  async createBooking(params: CreateBookingParams): Promise<Result<Booking & { id: string }, DomainError>> {
    const { userId, placeId, date, time, guests, specialRequests } = params;

    // 1. جلب بيانات المكان
    const place = await bookingRepository.getPlaceById(placeId);
    if (!place) {
      return err({ type: 'NotFound', message: 'Tourism place not found' });
    }
    const placeData = place;
    
    // 2. منطق توليد السعر (Business Logic)
    let governorateSeed = placeData?.governorate;
    if (!governorateSeed && typeof placeData?.location === 'string') {
      governorateSeed = placeData?.location;
    }
    const safeGov = governorateSeed || 'egypt';
    const safeTitle = placeData?.title || 'unknown';

    // Generate deterministic price based on place location
    const priceObj = generateTourismPrice(safeGov, safeTitle);
    
    // Use place's configured price if available, otherwise use generated price
    const finalUnitPrice = placeData?.price || priceObj.foreigner;
    const totalPrice = finalUnitPrice * guests;

    // 3. Prepare booking object
    const newBooking: Booking = Object.assign(new Booking(), {
      userId,
      placeId,
      placeTitle: safeTitle,
      date,
      time: time || '09:00 AM',
      guests: guests,
      pricePerPerson: finalUnitPrice,
      totalPrice: totalPrice,
      specialRequests: specialRequests || '',
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 4. الحفظ في قاعدة البيانات
    const createdBooking = await bookingRepository.createBooking(newBooking);

    // 5. إرسال إيميل التأكيد بشكل غير متزامن (لا تنتظر النتيجة)
    // This is non-blocking - email will be sent in background
    (async () => {
      try {
        const userRecord = await bookingRepository.getUserById(userId);
        if (userRecord.email) {
          await sendBookingConfirmationEmail({
            email: userRecord.email,
            userName: userRecord.displayName || 'Traveller',
            bookingId: createdBooking.id,
            placeTitle: safeTitle,
            date: date,
            guests: guests,
            totalPrice: totalPrice
          });
        }
      } catch (emailError) {
        logger.warn(`Could not send confirmation email for user ${userId}:`, emailError);
      }
    })().catch(err => logger.error('Unhandled email error:', err));

    return ok(createdBooking);
  }

  /**
   * Get all bookings for a specific user.
   * 
   * @param userId - User ID from Firebase Auth
   * @returns Result containing array of user's bookings, or error
   * 
   * @example
   * const result = await service.getUserBookings('user123');
   * if (result.ok) {
   *   console.log('User has', result.value.length, 'bookings');
   * }
   */
  async getUserBookings(userId: string): Promise<Result<(Booking & { id: string })[], DomainError>> {
    try {
      const allBookings = await bookingRepository.getAllBookings();
      const bookings = allBookings.filter(b => b.userId === userId);
      return ok(bookings);
    } catch (error) {
      return err({ type: 'Unknown', message: `Failed to fetch bookings: ${(error as Error).message}` });
    }
  }
}

export const bookingService = new BookingService();