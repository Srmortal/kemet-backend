import { describe, it, expect } from '@jest/globals';
// import { UserService } from '../src/services/user.service';


import { getUserProfileService } from '../src/services/user.service';
import { userRepository } from '../src/repositories/user.repository';
import { Result } from '../src/types/result.types';

jest.mock('../src/repositories/user.repository');

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
  bookingsCount: 2,
  favouritesCount: 1,
  role: 'user',
  admin: false,
  passportNumber: 'A1234567',
  nationality: 'EGY',
  dateOfBirth: '1990-01-01',
  gender: 'M',
  expiryDate: '2030-01-01',
};

describe('getUserProfileService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok result with user if found', async () => {
    (userRepository.getById as jest.Mock).mockResolvedValue(mockUser);
    const result = await getUserProfileService('user-123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toMatchObject({
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      });
    }
  });

  it('returns err result if user not found', async () => {
    (userRepository.getById as jest.Mock).mockResolvedValue(null);
    const result = await getUserProfileService('user-404');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: 'NotFound' });
    }
  });

  it('never throws errors', async () => {
    (userRepository.getById as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
    const result = await getUserProfileService('user-err');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: 'Unknown' });
    }
  });
});
