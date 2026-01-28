import { ExchangeBooking } from '../models/exchangeBooking.model';
import type { DomainError } from '../types/domain-error.type';
import { Result, ok, err } from '../types/result.types';

// Simulate DB and location lookup for demo
const locations: Record<string, {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number;
  openHours: string;
  features: string[];
}> = {
  'cairo-exchange-center': {
    id: 'cairo-exchange-center',
    name: 'Cairo Exchange Center',
    address: 'Tahrir Square, Downtown Cairo',
    distanceKm: 0.5,
    rating: 4.8,
    openHours: '24/7',
    features: ['No Commission', 'Fast Service', 'Online Booking']
  }
};

export class CurrencyExchangeService {
  async createBooking(dto: {
    name: string;
    phone: string;
    email: string;
    fromCurrency: string;
    toCurrency: string;
    amountSent: number;
    amountReceived: number;
    exchangeRate: number;
    locationId: string;
    appointmentDate: string;
    appointmentTime: string;
  }): Promise<Result<{
    bookingReference: string;
    status: 'confirmed';
    reminderSent: boolean;
    appointmentDate: string;
    appointmentTime: string;
    location: {
      id: string;
      name: string;
      address: string;
      distanceKm: number;
      rating: number;
      openHours: string;
      features: string[];
    };
    exchangeDetails: {
      fromCurrency: string;
      toCurrency: string;
      amountSent: number;
      amountReceived: number;
      exchangeRate: number;
    };
  }, DomainError>> {
    // Simulate location lookup
    const location = locations[dto.locationId] || null;
    if (!location) {
      return err({ type: 'NotFound', message: 'Location not found' });
    }
    // Simulate booking creation
    const bookingReference = `bk_${Date.now()}`;
    const booking: ExchangeBooking = {
      id: bookingReference,
      bookingReference,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      fromCurrency: dto.fromCurrency,
      toCurrency: dto.toCurrency,
      amountSent: dto.amountSent,
      amountReceived: dto.amountReceived,
      exchangeRate: dto.exchangeRate,
      locationId: dto.locationId,
      appointmentDate: dto.appointmentDate,
      appointmentTime: dto.appointmentTime,
      status: 'confirmed',
      reminderSent: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    // Build response
    const response = {
      bookingReference,
      status: 'confirmed' as const,
      reminderSent: true,
      appointmentDate: booking.appointmentDate,
      appointmentTime: booking.appointmentTime,
      location,
      exchangeDetails: {
        fromCurrency: booking.fromCurrency,
        toCurrency: booking.toCurrency,
        amountSent: booking.amountSent,
        amountReceived: booking.amountReceived,
        exchangeRate: booking.exchangeRate
      }
    };
    return ok(response);
  }
}
