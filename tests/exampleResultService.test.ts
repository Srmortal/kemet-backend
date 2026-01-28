import { getTourPackageById } from '../src/services/exampleResultService';

describe('getTourPackageById', () => {
  it('returns success for valid id', async () => {
    const result = await getTourPackageById('123');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ id: '123', name: 'Sample Tour' });
    }
  });
  it('returns validation error for missing id', async () => {
    const result = await getTourPackageById('');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('ValidationError');
    }
  });
  it('returns not found error for unknown id', async () => {
    const result = await getTourPackageById('notfound');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.type).toBe('NotFound');
    }
  });
});
