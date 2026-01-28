// DomainError union for business logic errors
export type DomainError =
  | { type: 'NotFound'; message: string }
  | { type: 'Conflict'; message: string }
  | { type: 'Unknown'; message: string };
