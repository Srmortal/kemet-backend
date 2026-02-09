import { describe, it, expect } from '@jest/globals';
import { UserService } from '../src/services/user.service';
import { userRepository } from '../src/repositories/user.repository';
import { userAuthRepository } from '../src/repositories/userAuth.repository';
import { Result } from '../src/types/result.types';

jest.mock('../src/repositories/user.repository');
jest.mock('../src/repositories/userAuth.repository');

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

describe('UserService', () => {
  const userService = new UserService(userRepository, userAuthRepository);

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns ok result with user if found', async () => {
    (userRepository.getById as jest.Mock).mockResolvedValue(mockUser);
    const result = await userService.getUserProfileService('user-123');
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
    const result = await userService.getUserProfileService('user-404');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: 'NotFound' });
    }
  });

  it('never throws errors', async () => {
    (userRepository.getById as jest.Mock).mockImplementation(() => { throw new Error('fail'); });
    const result = await userService.getUserProfileService('user-err');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatchObject({ type: 'Unknown' });
    }
  });
});
