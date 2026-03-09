// DomainError union for business logic errors
export type DomainError =
  | { type: "NotFound"; message: string }
  | { type: "ValidationError"; message: string; details?: string }
  | { type: "Conflict"; message: string }
  | { type: "Unknown"; message: string };
