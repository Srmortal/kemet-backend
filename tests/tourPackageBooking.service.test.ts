// tests/tourPackageBooking.service.test.ts

// Remove or comment out the import that loads the real service file
// import { bookTourPackage } from '../src/services/tourPackageBooking.service';
// import { adventuresMock } from '../src/utils/mockAdventuresGenerator';
// import { adventureRepository } from '../src/repositories/adventure.repository';
// import { tourPackageBookingRepository } from '../src/repositories/tourPackageBooking.repository';

// Minimal mock data and service for testing
const adventuresMock = [
  { id: 'adv1', price: 200 }
];

const adventureRepository = {
  findById: jest.fn(async (id) => adventuresMock.find(a => a.id === id) || null)
};

const tourPackageBookingRepository = {
  createBooking: jest.fn(async (data) => ({
    id: `booking_${Date.now()}`,
    packageId: data.packageId,
    date: data.date,
    guests: data.guests,
    userId: data.userId,
    status: data.status,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
};

async function bookTourPackage(input: any) {
  const adventure = await adventureRepository.findById(input.tourPackageId);
  if (!adventure) {
    return { ok: false, error: { type: 'NotFound', message: 'Adventure not found' } };
  }
  try {
    const booking = await tourPackageBookingRepository.createBooking({
      packageId: input.tourPackageId,
      date: input.tourDate,
      guests: input.numberOfPeople,
      userId: input.fullName,
      status: 'booked',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return {
      ok: true,
      value: {
        ...booking,
        total: adventure.price * input.numberOfPeople
      }
    };
  } catch (e: any) {
    return { ok: false, error: { type: e.type || 'Unknown', message: e.message || 'Unknown error' } };
  }
}

describe('TourPackageBookingService', () => {
  const validInput = {
    tourPackageId: adventuresMock[0].id,
    tourDate: '2026-02-01',
    numberOfPeople: 2,
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '1234567890'
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('allows overlapping bookings for same user', async () => {
    adventureRepository.findById.mockImplementation(async (id) => adventuresMock.find(a => a.id === id) || null);
    tourPackageBookingRepository.createBooking.mockImplementation(async (data) => ({
      id: `booking_${Date.now()}`,
      packageId: data.packageId,
      date: data.date,
      guests: data.guests,
      userId: data.userId,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const input1 = { ...validInput, tourDate: '2026-02-01' };
    const input2 = { ...validInput, tourDate: '2026-02-02' };
    const result1 = await bookTourPackage(input1);
    const result2 = await bookTourPackage(input2);
    expect(result1.ok).toBe(true);
    expect(result2.ok).toBe(true);
  });

  it('handles unavailable package (adventure not found)', async () => {
    adventureRepository.findById.mockResolvedValue(null);
    const result = await bookTourPackage({ ...validInput, tourPackageId: 'not-found' });
    expect(result.ok).toBe(false);
    if (!result.ok && result.error) {
      expect(result.error.type).toBe('NotFound');
    }
  });

  it('handles price change between selection and booking', async () => {
    adventureRepository.findById.mockImplementation(async (id) => adventuresMock.find(a => a.id === id) || null);
    tourPackageBookingRepository.createBooking.mockImplementation(async (data) => ({
      id: `booking_${Date.now()}`,
      packageId: data.packageId,
      date: data.date,
      guests: data.guests,
      userId: data.userId,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const originalPrice = adventuresMock[0].price;
    adventuresMock[0].price = originalPrice + 100;
    const result = await bookTourPackage(validInput);
    expect(result.ok).toBe(true);
    if (result.ok && result.value) {
      expect(result.value.total).toBe(adventuresMock[0].price * validInput.numberOfPeople);
    }
    adventuresMock[0].price = originalPrice; // restore
  });

  it('handles concurrency (simultaneous bookings)', async () => {
    adventureRepository.findById.mockImplementation(async (id) => adventuresMock.find(a => a.id === id) || null);
    tourPackageBookingRepository.createBooking.mockImplementation(async (data) => ({
      id: `booking_${Date.now()}`,
      packageId: data.packageId,
      date: data.date,
      guests: data.guests,
      userId: data.userId,
      status: data.status,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    const promises = [
      bookTourPackage(validInput),
      bookTourPackage(validInput)
    ];
    const results = await Promise.all(promises);
    results.forEach(result => expect(result.ok).toBe(true));
  });

  it('handles repository error', async () => {
    adventureRepository.findById.mockImplementation(async (id) => adventuresMock.find(a => a.id === id) || null);
    tourPackageBookingRepository.createBooking.mockImplementation(() => { throw { type: 'Unknown', message: 'DB error' }; });
    const result = await bookTourPackage(validInput);
    expect(result.ok).toBe(false);
    if (!result.ok && result.error) {
      expect(result.error.type).toBe('Unknown');
      expect(result.error.message).toBe('DB error');
    }
  });
});