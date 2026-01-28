import { Result } from '../types/result.types';
import { DomainError } from '../types/domain-error.type';

// Example: get a tour package by ID
export async function getTourPackageById(id: string): Promise<Result<{ id: string; name: string }, DomainError>> {
  // Success
  return { ok: true, value: { id, name: 'Sample Tour' } };
}
