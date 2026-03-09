import type { DomainError } from "./domain-error.type.js";

export type Result<T, E = DomainError | never> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = DomainError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function map<T, U, E>(r: Result<T, E>, fn: (t: T) => U): Result<U, E> {
  return r.ok
    ? { ok: true, value: fn(r.value) }
    : { ok: false, error: r.error };
}

export function mapError<T, E1 = DomainError, E2 = DomainError>(
  r: Result<T, E1>,
  fn: (e: E1) => E2
): Result<T, E2> {
  return r.ok ? r : { ok: false, error: fn(r.error) };
}
